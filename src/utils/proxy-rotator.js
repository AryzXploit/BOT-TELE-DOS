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
        
        // Load proxies with timeout protection
        this.loadProxiesWithTimeout();
    }
    
    async loadProxiesWithTimeout() {
        try {
            // Set timeout for proxy loading (10 seconds max)
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Proxy loading timeout')), 10000);
            });
            
            await Promise.race([this.loadProxies(), timeoutPromise]);
        } catch (error) {
            logger.warn(`⚠️ Proxy loading issue: ${error.message}`);
            logger.info('🔄 Using fallback proxy mode...');
            
            // Fallback: Load only premium proxies
            this.loadFallbackProxies();
        }
    }
    
    loadFallbackProxies() {
        // Quick load premium proxies only
        const premiumProxies = [
            // Just load your premium proxies for instant startup
            '45.3.48.79:3129', '65.111.13.128:3129', '45.3.53.244:3129',
            '45.3.38.96:3129', '45.3.37.197:3129', '65.111.9.6:3129',
            '216.26.224.133:3129', '65.111.25.59:3129', '193.56.28.24:3129',
            '104.207.40.165:3129' // First 10 for quick startup
        ];
        
        this.proxies = premiumProxies;
        this.isLoaded = true;
        logger.info(`🚀 Fallback mode: ${this.proxies.length} premium proxies loaded instantly`);
    }

    async loadProxies() {
        try {
            logger.info('🔄 Loading proxies (optimized mode)...');
            
            // Skip free proxy loading for faster startup - use premium only
            // Free proxy sources (commented out for performance)
            /*
            const proxyLists = [
                'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt',
                'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt',
                'https://raw.githubusercontent.com/prxchk/proxy-list/main/http.txt',
                'https://raw.githubusercontent.com/ALIILAPRO/Proxy/main/http.txt'
            ];
            
            for (const url of proxyLists) {
                try {
                    const proxies = await this.fetchProxyList(url);
                    this.proxies.push(...proxies.slice(0, 1000)); // Limit to 1000 per source
                    logger.info(`✅ Loaded ${Math.min(proxies.length, 1000)} proxies from ${url}`);
                } catch (err) {
                    logger.debug(`❌ Failed to load from ${url}: ${err.message}`);
                }
            }
            */

            // Add manual proxy list (reliable ones + USER PROXIES)
            const manualProxies = [
                // Original proxies
                '8.210.83.33:80',
                '47.74.152.29:8888',
                '43.134.68.153:3128',
                '103.127.1.130:80',
                '185.32.6.129:8090',
                '103.149.162.194:80',
                '103.148.72.192:80',
                '103.145.45.10:55443',
                '102.165.51.172:8080',
                '101.32.72.98:65001',
                
                // USER'S PREMIUM PROXIES (95 proxies - port 3129)
                '45.3.48.79:3129',
                '65.111.13.128:3129',
                '45.3.53.244:3129',
                '45.3.38.96:3129',
                '45.3.37.197:3129',
                '65.111.9.6:3129',
                '216.26.224.133:3129',
                '65.111.25.59:3129',
                '193.56.28.24:3129',
                '104.207.40.165:3129',
                '209.50.168.155:3129',
                '104.207.43.100:3129',
                '45.3.38.94:3129',
                '45.3.48.186:3129',
                '104.207.42.8:3129',
                '216.26.237.184:3129',
                '104.207.41.251:3129',
                '65.111.24.88:3129',
                '154.213.163.16:3129',
                '209.50.184.62:3129',
                '209.50.188.188:3129',
                '65.111.4.122:3129',
                '45.3.52.81:3129',
                '65.111.2.43:3129',
                '154.213.165.42:3129',
                '104.207.38.11:3129',
                '154.213.165.87:3129',
                '216.26.241.25:3129',
                '154.213.162.253:3129',
                '45.3.36.30:3129',
                '216.26.224.201:3129',
                '45.3.41.143:3129',
                '104.207.57.97:3129',
                '65.111.4.59:3129',
                '65.111.9.229:3129',
                '209.50.164.136:3129',
                '209.50.178.103:3129',
                '104.207.62.212:3129',
                '45.3.41.112:3129',
                '65.111.29.186:3129',
                '216.26.244.51:3129',
                '216.26.250.216:3129',
                '209.50.164.216:3129',
                '216.26.233.39:3129',
                '216.26.239.184:3129',
                '216.26.228.41:3129',
                '104.207.59.238:3129',
                '104.207.37.145:3129',
                '104.207.40.247:3129',
                '104.207.62.158:3129',
                '216.26.232.115:3129',
                '154.213.161.133:3129',
                '209.50.178.50:3129',
                '154.213.160.165:3129',
                '104.207.34.212:3129',
                '216.26.250.234:3129',
                '216.26.225.193:3129',
                '216.26.224.247:3129',
                '104.207.48.177:3129',
                '216.26.231.206:3129',
                '104.207.33.16:3129',
                '216.26.252.231:3129',
                '216.26.250.128:3129',
                '216.26.234.41:3129',
                '209.50.169.9:3129',
                '65.111.7.36:3129',
                '65.111.2.35:3129',
                '45.3.54.17:3129',
                '65.111.10.197:3129',
                '104.207.53.109:3129',
                '193.56.28.74:3129',
                '104.207.32.254:3129',
                '45.3.54.243:3129',
                '216.26.241.165:3129',
                '104.207.54.134:3129',
                '216.26.238.25:3129',
                '65.111.5.152:3129',
                '216.26.235.122:3129',
                '209.50.161.37:3129',
                '209.50.170.162:3129',
                '104.207.50.140:3129',
                '209.50.188.220:3129',
                '104.167.25.9:3129',
                '104.207.59.23:3129',
                '104.207.46.155:3129',
                '104.207.39.78:3129',
                '216.26.250.35:3129',
                '104.207.54.9:3129',
                '216.26.233.224:3129',
                '216.26.229.14:3129',
                '216.26.255.208:3129',
                '216.26.255.204:3129',
                '104.207.53.38:3129',
                '45.3.52.58:3129',
                '104.207.42.251:3129',
                '216.26.224.55:3129',
                '216.26.230.74:3129',
                '104.207.47.173:3129',
                '216.26.232.87:3129',
                '45.3.42.225:3129',
                
                // USER'S PREMIUM PROXIES BATCH 2 (100 more proxies - port 3129)
                '209.50.161.204:3129',
                '45.3.49.2:3129',
                '65.111.22.110:3129',
                '216.26.240.100:3129',
                '45.3.49.203:3129',
                '209.50.170.201:3129',
                '104.207.50.191:3129',
                '45.3.45.248:3129',
                '216.26.242.64:3129',
                '216.26.246.220:3129',
                '65.111.2.138:3129',
                '104.207.58.137:3129',
                '209.50.162.39:3129',
                '216.26.239.63:3129',
                '216.26.253.13:3129',
                '65.111.29.170:3129',
                '154.213.160.211:3129',
                '209.50.185.9:3129',
                '45.3.41.245:3129',
                '209.50.191.158:3129',
                '65.111.11.114:3129',
                '65.111.21.36:3129',
                '104.207.56.42:3129',
                '216.26.225.141:3129',
                '209.50.179.62:3129',
                '45.3.33.54:3129',
                '45.3.42.77:3129',
                '104.207.50.205:3129',
                '65.111.12.110:3129',
                '104.207.35.79:3129',
                '216.26.229.90:3129',
                '154.213.165.132:3129',
                '104.207.60.23:3129',
                '216.26.252.219:3129',
                '209.50.169.114:3129',
                '104.207.37.90:3129',
                '65.111.11.172:3129',
                '209.50.176.7:3129',
                '209.50.191.159:3129',
                '45.3.37.218:3129',
                '154.213.160.229:3129',
                '104.207.40.56:3129',
                '45.3.41.255:3129',
                '45.3.34.206:3129',
                '209.50.180.108:3129',
                '65.111.13.134:3129',
                '45.3.47.250:3129',
                '104.207.58.203:3129',
                '65.111.23.41:3129',
                '216.26.248.167:3129',
                '216.26.244.142:3129',
                '104.207.34.190:3129',
                '45.3.46.209:3129',
                '209.50.175.150:3129',
                '216.26.231.91:3129',
                '209.50.171.44:3129',
                '154.213.162.37:3129',
                '209.50.164.183:3129',
                '45.3.33.202:3129',
                '65.111.0.120:3129',
                '209.50.167.217:3129',
                '45.3.44.165:3129',
                '104.207.36.148:3129',
                '104.207.45.0:3129',
                '104.207.61.66:3129',
                '104.167.25.102:3129',
                '216.26.242.244:3129',
                '216.26.225.78:3129',
                '45.3.50.192:3129',
                '104.207.50.169:3129',
                '104.207.42.67:3129',
                '209.50.161.243:3129',
                '216.26.227.128:3129',
                '216.26.227.233:3129',
                '209.50.168.77:3129',
                '104.207.46.139:3129',
                '216.26.252.230:3129',
                '104.207.33.246:3129',
                '45.3.54.8:3129',
                '209.50.166.146:3129',
                '216.26.236.97:3129',
                '45.3.37.194:3129',
                '154.213.163.53:3129',
                '216.26.228.51:3129',
                '209.50.188.46:3129',
                '209.50.162.3:3129',
                '154.213.162.26:3129',
                '209.50.165.27:3129',
                '209.50.177.218:3129',
                '45.3.33.158:3129',
                '104.207.55.216:3129',
                '65.111.11.99:3129',
                '45.3.39.104:3129',
                '209.50.177.199:3129',
                '209.50.188.180:3129',
                '45.3.62.149:3129',
                '45.3.51.44:3129',
                '65.111.27.107:3129',
                '65.111.9.174:3129',
                '104.207.55.20:3129'
                
            ];
            
            this.proxies.push(...manualProxies);
            
            // Remove duplicates and shuffle
            this.proxies = [...new Set(this.proxies)];
            this.shuffleProxies();
            
            logger.info(`🎯 Premium proxies loaded: ${this.proxies.length} (optimized mode)`);
            logger.info(`💎 Your premium proxies: 195 | Manual proxies: ${this.proxies.length - 195}`);
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
