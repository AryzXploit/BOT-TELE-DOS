import http2 from 'http2';
import { URL } from 'url';
import { REQUESTS_SENT, BYTES_SENT } from '../../utils/counter.js';
import { logger } from '../../utils/logger.js';

/**
 * DEBUG TEST - Method untuk test apakah system work
 */
export class DebugTest {
    constructor(targetUrl, duration, rpc = 1, userAgents = [], referers = [], proxies = null) {
        logger.info('🔧 DEBUG TEST constructor called');
        logger.info(`   Target: ${targetUrl}`);
        logger.info(`   Duration: ${duration}`);
        logger.info(`   RPC: ${rpc}`);
        
        this.url = new URL(targetUrl);
        this.duration = duration;
        this.rpc = Math.max(rpc * 10, 50); // 10x multiplier untuk test
        this.userAgents = userAgents;
        this.referers = referers;
        this.proxies = proxies;
        this.active = true;
        
        logger.info('✅ DEBUG TEST constructor completed');
    }

    async start() {
        logger.info('🚀 DEBUG TEST start() called');
        
        const endTime = Date.now() + (this.duration * 1000);
        let requestCount = 0;
        
        logger.info(`🎯 Starting debug attack for ${this.duration} seconds`);
        logger.info(`🎯 Target: ${this.url.href}`);
        logger.info(`🎯 RPC: ${this.rpc}`);

        while (Date.now() < endTime && this.active) {
            logger.info(`🔄 DEBUG TEST loop ${++requestCount} - sending ${this.rpc} requests`);
            
            const promises = [];
            for (let i = 0; i < this.rpc; i++) {
                promises.push(this.sendDebugRequest(i));
            }
            
            await Promise.allSettled(promises);
            
            // Log progress
            logger.info(`📊 Loop ${requestCount} completed - Total counter: ${REQUESTS_SENT.get()}`);
            
            // Small delay
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        logger.info(`✅ DEBUG TEST completed - Total loops: ${requestCount}`);
    }

    async sendDebugRequest(requestId) {
        return new Promise((resolve) => {
            try {
                logger.debug(`📤 Sending debug request ${requestId}`);
                
                const headers = {
                    ':method': 'GET',
                    ':scheme': this.url.protocol.replace(':', ''),
                    ':authority': this.url.hostname,
                    ':path': this.url.pathname + `?debug=${Date.now()}&req=${requestId}`,
                    'user-agent': 'Mozilla/5.0 (DEBUG TEST) Chrome/120.0.0.0 Safari/537.36'
                };

                const client = http2.connect(`${this.url.protocol}//${this.url.hostname}`);

                client.on('error', (err) => {
                    logger.debug(`❌ Client error: ${err.message}`);
                    client.close();
                    resolve();
                });

                const req = client.request(headers);

                req.on('response', (responseHeaders) => {
                    REQUESTS_SENT.add(1);
                    const status = responseHeaders[':status'];
                    logger.debug(`✅ Request ${requestId} response: ${status}`);
                });

                req.on('data', (chunk) => {
                    BYTES_SENT.add(chunk.length);
                    logger.debug(`📥 Request ${requestId} received ${chunk.length} bytes`);
                });

                req.on('end', () => {
                    logger.debug(`🏁 Request ${requestId} completed`);
                    client.close();
                    resolve();
                });

                req.on('error', (err) => {
                    logger.debug(`❌ Request ${requestId} error: ${err.message}`);
                    client.close();
                    resolve();
                });

                req.setTimeout(10000, () => {
                    logger.debug(`⏰ Request ${requestId} timeout`);
                    req.close();
                    client.close();
                    resolve();
                });

                req.end();

            } catch (error) {
                logger.error(`❌ Exception in request ${requestId}: ${error.message}`);
                resolve();
            }
        });
    }

    stop() {
        logger.info('🛑 DEBUG TEST stop() called');
        this.active = false;
    }
}

/**
 * SIMPLE TEST - Method yang lebih simple lagi
 */
export class SimpleTest {
    constructor(targetUrl, duration, rpc = 1, userAgents = [], referers = [], proxies = null) {
        logger.info('🔧 SIMPLE TEST constructor called');
        
        this.url = new URL(targetUrl);
        this.duration = duration;
        this.rpc = 20; // Fixed 20 requests
        this.active = true;
        
        logger.info('✅ SIMPLE TEST constructor completed');
    }

    async start() {
        logger.info('🚀 SIMPLE TEST start() called');
        
        for (let i = 0; i < 10; i++) {
            if (!this.active) break;
            
            logger.info(`🔄 SIMPLE TEST iteration ${i + 1}/10`);
            
            // Increment counter manually untuk test
            REQUESTS_SENT.add(this.rpc);
            BYTES_SENT.add(1024 * this.rpc);
            
            logger.info(`📊 Counter updated - Requests: ${REQUESTS_SENT.get()}, Bytes: ${BYTES_SENT.get()}`);
            
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        logger.info('✅ SIMPLE TEST completed');
    }

    stop() {
        logger.info('🛑 SIMPLE TEST stop() called');
        this.active = false;
    }
}
