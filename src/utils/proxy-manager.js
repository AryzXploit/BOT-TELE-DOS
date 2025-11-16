import axios from 'axios';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { logger } from './logger.js';
import chalk from 'chalk';

/**
 * Proxy Manager - Download, check, and manage proxies
 */
export class ProxyManager {
    constructor(config) {
        this.config = config;
        this.proxies = new Set();
        this.proxyArray = [];
        this.currentIndex = 0;
    }

    /**
     * Download proxies from providers in config
     */
    async downloadFromConfig(proxyType = 0) {
        const providers = this.config['proxy-providers'].filter(p => 
            proxyType === 0 || p.type === proxyType
        );

        logger.info(chalk.yellow(`Downloading Proxies from ${chalk.blue(providers.length)} Providers`));

        const downloadPromises = providers.map(provider => 
            this.downloadFromProvider(provider)
        );

        const results = await Promise.allSettled(downloadPromises);
        
        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value) {
                result.value.forEach(proxy => this.proxies.add(proxy));
            }
        });

        return Array.from(this.proxies);
    }

    /**
     * Download from a single provider
     */
    async downloadFromProvider(provider) {
        try {
            logger.debug(chalk.yellow(
                `Proxies from (URL: ${chalk.blue(provider.url)}, ` +
                `Type: ${chalk.blue(provider.type)}, ` +
                `Timeout: ${chalk.blue(provider.timeout)})`
            ));

            const response = await axios.get(provider.url, {
                timeout: provider.timeout * 1000
            });

            const proxies = this.parseProxies(response.data, provider.type);
            return proxies;
        } catch (error) {
            logger.error(`Failed to download from ${provider.url}: ${error.message}`);
            return [];
        }
    }

    /**
     * Parse proxy list from text
     */
    parseProxies(text, type) {
        const proxies = [];
        const lines = text.split('\n');
        const ipPortRegex = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d+)/;

        for (const line of lines) {
            const match = line.match(ipPortRegex);
            if (match) {
                proxies.push({
                    ip: match[1],
                    port: parseInt(match[2]),
                    type: type,
                    protocol: this.getProtocol(type)
                });
            }
        }

        return proxies;
    }

    /**
     * Get protocol name from type
     */
    getProtocol(type) {
        const protocols = {
            1: 'http',
            4: 'socks4',
            5: 'socks5'
        };
        return protocols[type] || 'http';
    }

    /**
     * Check if proxies are working
     */
    async checkProxies(proxies, testUrl = 'http://httpbin.org/ip', timeout = 5000) {
        logger.info(chalk.blue(`${proxies.length} Proxies are getting checked, this may take a while`));

        const checkPromises = proxies.map(proxy => 
            this.checkProxy(proxy, testUrl, timeout)
        );

        const results = await Promise.allSettled(checkPromises);
        
        const workingProxies = results
            .filter(r => r.status === 'fulfilled' && r.value)
            .map(r => r.value);

        logger.success(chalk.green(`${workingProxies.length} working proxies found`));
        
        return workingProxies;
    }

    /**
     * Check single proxy
     */
    async checkProxy(proxy, testUrl, timeout) {
        try {
            const proxyUrl = `${proxy.protocol}://${proxy.ip}:${proxy.port}`;
            
            const response = await axios.get(testUrl, {
                proxy: false,
                httpsAgent: proxy.protocol.includes('socks') 
                    ? new SocksProxyAgent(proxyUrl)
                    : undefined,
                timeout: timeout
            });

            if (response.status === 200) {
                return proxy;
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Load proxies from file
     */
    loadFromFile(filePath) {
        try {
            if (!existsSync(filePath)) {
                return [];
            }

            const content = readFileSync(filePath, 'utf-8');
            const lines = content.split('\n');
            const proxies = [];

            for (const line of lines) {
                const parts = line.trim().split(':');
                if (parts.length >= 2) {
                    proxies.push({
                        ip: parts[0],
                        port: parseInt(parts[1]),
                        type: parts[2] ? parseInt(parts[2]) : 1,
                        protocol: parts[3] || 'http'
                    });
                }
            }

            return proxies;
        } catch (error) {
            logger.error(`Failed to load proxies from file: ${error.message}`);
            return [];
        }
    }

    /**
     * Save proxies to file
     */
    saveToFile(proxies, filePath) {
        try {
            const content = proxies.map(p => 
                `${p.ip}:${p.port}:${p.type}:${p.protocol}`
            ).join('\n');

            writeFileSync(filePath, content);
            logger.success(`Proxies saved to ${filePath}`);
        } catch (error) {
            logger.error(`Failed to save proxies: ${error.message}`);
        }
    }

    /**
     * Get random proxy from list
     */
    static getRandomProxy(proxies) {
        if (!proxies || proxies.length === 0) return null;
        return proxies[Math.floor(Math.random() * proxies.length)];
    }

    /**
     * Initialize proxy rotation
     */
    initRotation(proxies) {
        this.proxyArray = Array.isArray(proxies) ? proxies : Array.from(proxies);
        this.currentIndex = 0;
        this.shuffleProxies();
        logger.success(`✅ Proxy rotation initialized with ${this.proxyArray.length} proxies`);
    }

    /**
     * Get next proxy (rotating)
     */
    getNextProxy() {
        if (!this.proxyArray || this.proxyArray.length === 0) return null;
        
        const proxy = this.proxyArray[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.proxyArray.length;
        
        // Reshuffle when we complete a full rotation
        if (this.currentIndex === 0) {
            this.shuffleProxies();
        }
        
        return proxy;
    }

    /**
     * Get random proxy
     */
    getRandomProxy() {
        if (!this.proxyArray || this.proxyArray.length === 0) return null;
        return this.proxyArray[Math.floor(Math.random() * this.proxyArray.length)];
    }

    /**
     * Shuffle proxy array
     */
    shuffleProxies() {
        for (let i = this.proxyArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.proxyArray[i], this.proxyArray[j]] = [this.proxyArray[j], this.proxyArray[i]];
        }
    }

    /**
     * Get rotation stats
     */
    getRotationStats() {
        return {
            totalProxies: this.proxyArray.length,
            currentIndex: this.currentIndex,
            rotationsCompleted: Math.floor(this.currentIndex / (this.proxyArray.length || 1))
        };
    }

    /**
     * Format proxy for use
     */
    formatProxy(proxy) {
        if (!proxy) return null;
        
        return {
            host: proxy.ip,
            port: parseInt(proxy.port),
            protocol: proxy.protocol,
            type: proxy.type,
            url: `${proxy.protocol}://${proxy.ip}:${proxy.port}`
        };
    }
}
