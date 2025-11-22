import { logger } from './logger.js';

/**
 * User Agent Rotator - Massive UA rotation system
 */
export class UserAgentRotator {
    constructor() {
        this.currentIndex = 0;
        this.userAgents = [];
        this.generateUserAgents();
    }

    generateUserAgents() {
        logger.info('🔄 Generating user agent pool...');
        
        // Chrome user agents (most common)
        const chromeVersions = ['120.0.6099.130', '119.0.6045.199', '118.0.5993.117', '121.0.6167.85'];
        const chromeUAs = [];
        
        chromeVersions.forEach(version => {
            // Windows
            chromeUAs.push(`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36`);
            chromeUAs.push(`Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36`);
            // macOS
            chromeUAs.push(`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36`);
            chromeUAs.push(`Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36`);
            // Linux
            chromeUAs.push(`Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36`);
        });

        // Firefox user agents
        const firefoxVersions = ['121.0', '120.0', '119.0', '118.0'];
        const firefoxUAs = [];
        
        firefoxVersions.forEach(version => {
            // Windows
            firefoxUAs.push(`Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:${version}) Gecko/20100101 Firefox/${version}`);
            firefoxUAs.push(`Mozilla/5.0 (Windows NT 11.0; Win64; x64; rv:${version}) Gecko/20100101 Firefox/${version}`);
            // macOS
            firefoxUAs.push(`Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:${version}) Gecko/20100101 Firefox/${version}`);
            // Linux
            firefoxUAs.push(`Mozilla/5.0 (X11; Linux x86_64; rv:${version}) Gecko/20100101 Firefox/${version}`);
        });

        // Safari user agents
        const safariUAs = [
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
            'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
        ];

        // Edge user agents
        const edgeVersions = ['120.0.2210.91', '119.0.2151.97', '118.0.2088.76'];
        const edgeUAs = [];
        
        edgeVersions.forEach(version => {
            edgeUAs.push(`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/${version}`);
            edgeUAs.push(`Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/${version}`);
        });

        // Mobile user agents
        const mobileUAs = [
            // Android Chrome
            'Mozilla/5.0 (Linux; Android 14; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.130 Mobile Safari/537.36',
            'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.130 Mobile Safari/537.36',
            'Mozilla/5.0 (Linux; Android 12; SM-A525F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.6045.199 Mobile Safari/537.36',
            // iPhone
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 16_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        ];

        // Bot/Crawler user agents (for diversity)
        const botUAs = [
            'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
            'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)',
            'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
            'Twitterbot/1.0'
        ];

        // Combine all user agents
        this.userAgents = [
            ...chromeUAs,
            ...firefoxUAs, 
            ...safariUAs,
            ...edgeUAs,
            ...mobileUAs,
            ...botUAs
        ];

        // Shuffle the array
        this.shuffleArray(this.userAgents);
        
        logger.info(`✅ Generated ${this.userAgents.length} user agents for rotation`);
    }

    getNextUserAgent() {
        const ua = this.userAgents[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.userAgents.length;
        
        // Reshuffle when we complete a cycle
        if (this.currentIndex === 0) {
            this.shuffleArray(this.userAgents);
            logger.debug('🔄 Reshuffled user agent pool');
        }
        
        return ua;
    }

    getRandomUserAgent() {
        const randomIndex = Math.floor(Math.random() * this.userAgents.length);
        return this.userAgents[randomIndex];
    }

    getChromeUserAgent() {
        const chromeUAs = this.userAgents.filter(ua => ua.includes('Chrome') && !ua.includes('Edg'));
        return chromeUAs[Math.floor(Math.random() * chromeUAs.length)];
    }

    getFirefoxUserAgent() {
        const firefoxUAs = this.userAgents.filter(ua => ua.includes('Firefox'));
        return firefoxUAs[Math.floor(Math.random() * firefoxUAs.length)];
    }

    getSafariUserAgent() {
        const safariUAs = this.userAgents.filter(ua => ua.includes('Safari') && !ua.includes('Chrome'));
        return safariUAs[Math.floor(Math.random() * safariUAs.length)];
    }

    getMobileUserAgent() {
        const mobileUAs = this.userAgents.filter(ua => ua.includes('Mobile') || ua.includes('iPhone') || ua.includes('Android'));
        return mobileUAs[Math.floor(Math.random() * mobileUAs.length)];
    }

    getBrowserInfo(userAgent) {
        if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
            return { browser: 'Chrome', mobile: userAgent.includes('Mobile') };
        } else if (userAgent.includes('Firefox')) {
            return { browser: 'Firefox', mobile: userAgent.includes('Mobile') };
        } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            return { browser: 'Safari', mobile: userAgent.includes('Mobile') };
        } else if (userAgent.includes('Edg')) {
            return { browser: 'Edge', mobile: userAgent.includes('Mobile') };
        } else {
            return { browser: 'Unknown', mobile: false };
        }
    }

    getCompatibleHeaders(userAgent) {
        const info = this.getBrowserInfo(userAgent);
        const headers = {};

        if (info.browser === 'Chrome') {
            headers['sec-ch-ua'] = '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"';
            headers['sec-ch-ua-mobile'] = info.mobile ? '?1' : '?0';
            headers['sec-ch-ua-platform'] = userAgent.includes('Windows') ? '"Windows"' : 
                                          userAgent.includes('Mac') ? '"macOS"' : '"Linux"';
        } else if (info.browser === 'Firefox') {
            // Firefox doesn't send sec-ch-ua headers
            headers['accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8';
        } else if (info.browser === 'Safari') {
            headers['accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';
        }

        return headers;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    getStats() {
        return {
            total: this.userAgents.length,
            current: this.currentIndex,
            cycles: Math.floor(this.currentIndex / this.userAgents.length)
        };
    }
}

// Global user agent rotator instance
export const globalUserAgentRotator = new UserAgentRotator();
