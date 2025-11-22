import https from 'https';
import { logger } from './logger.js';

/**
 * Proxy Rotator - Free proxy rotation system
 */
export class ProxyRotator {
    constructor() {
        this.proxies = [];
        this.currentIndex = 0;
        this.isLoaded = false;
        this.loadProxies();
    }

    async loadProxies() {
        try {
            // Free proxy sources
            const proxyLists = [
                'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt',
                'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt',
                'https://raw.githubusercontent.com/prxchk/proxy-list/main/http.txt',
                'https://raw.githubusercontent.com/ALIILAPRO/Proxy/main/http.txt'
            ];

            logger.info('🔄 Loading free proxies...');
            
            for (const url of proxyLists) {
                try {
                    const proxies = await this.fetchProxyList(url);
                    this.proxies.push(...proxies);
                    logger.info(`✅ Loaded ${proxies.length} proxies from ${url}`);
                } catch (err) {
                    logger.debug(`❌ Failed to load from ${url}: ${err.message}`);
                }
            }

            // Add manual proxy list (reliable ones)
            const manualProxies = [
                '8.210.83.33:80',
                '47.74.152.29:8888',
                '43.134.68.153:3128',
                '103.127.1.130:80',
                '185.32.6.129:8090',
                '103.149.162.194:80',
                '103.148.72.192:80',
                '103.145.45.10:55443',
                '102.165.51.172:8080',
                '101.32.72.98:65001'
            ];
            
            this.proxies.push(...manualProxies);
            
            // Remove duplicates and shuffle
            this.proxies = [...new Set(this.proxies)];
            this.shuffleProxies();
            
            logger.info(`🎯 Total proxies loaded: ${this.proxies.length}`);
            this.isLoaded = true;
            
        } catch (error) {
            logger.error(`❌ Error loading proxies: ${error.message}`);
            this.isLoaded = false;
        }
    }

    async fetchProxyList(url) {
        return new Promise((resolve, reject) => {
            https.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const proxies = data.split('\n')
                            .map(line => line.trim())
                            .filter(line => line && line.includes(':'))
                            .filter(line => {
                                const [ip, port] = line.split(':');
                                return this.isValidIP(ip) && this.isValidPort(port);
                            });
                        resolve(proxies);
                    } catch (err) {
                        reject(err);
                    }
                });
            }).on('error', reject);
        });
    }

    isValidIP(ip) {
        const regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return regex.test(ip);
    }

    isValidPort(port) {
        const p = parseInt(port);
        return p >= 1 && p <= 65535;
    }

    shuffleProxies() {
        for (let i = this.proxies.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.proxies[i], this.proxies[j]] = [this.proxies[j], this.proxies[i]];
        }
    }

    getNextProxy() {
        if (!this.isLoaded || this.proxies.length === 0) {
            return null;
        }

        const proxy = this.proxies[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
        
        // If we've cycled through all proxies, reshuffle
        if (this.currentIndex === 0) {
            this.shuffleProxies();
            logger.debug('🔄 Reshuffled proxy list');
        }

        return proxy;
    }

    getRandomProxy() {
        if (!this.isLoaded || this.proxies.length === 0) {
            return null;
        }
        
        const randomIndex = Math.floor(Math.random() * this.proxies.length);
        return this.proxies[randomIndex];
    }

    getProxyConfig(proxy) {
        if (!proxy) return null;
        
        const [host, port] = proxy.split(':');
        return {
            host,
            port: parseInt(port),
            protocol: 'http:'
        };
    }

    async testProxy(proxy, timeout = 5000) {
        return new Promise((resolve) => {
            const [host, port] = proxy.split(':');
            const startTime = Date.now();
            
            const req = https.request({
                host,
                port: parseInt(port),
                method: 'GET',
                path: '/',
                timeout
            }, (res) => {
                const responseTime = Date.now() - startTime;
                resolve({
                    working: true,
                    responseTime,
                    statusCode: res.statusCode
                });
            });

            req.on('error', () => {
                resolve({ working: false });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({ working: false });
            });

            req.end();
        });
    }

    getStats() {
        return {
            total: this.proxies.length,
            current: this.currentIndex,
            loaded: this.isLoaded
        };
    }
}

// Global proxy rotator instance
export const proxyRotator = new ProxyRotator();
