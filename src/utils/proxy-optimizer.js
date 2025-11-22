import { logger } from './logger.js';
import { proxyRotator } from './proxy-rotator.js';

/**
 * Proxy Optimizer - Maximize proxy performance and bypass detection
 */
export class ProxyOptimizer {
    constructor() {
        this.workingProxies = [];
        this.fastProxies = [];
        this.premiumProxies = [];
        this.currentIndex = 0;
        this.testResults = new Map();
        this.isOptimized = false;
        
        // Performance thresholds
        this.maxResponseTime = 5000; // 5 seconds
        this.minSuccessRate = 0.7; // 70% success rate
        
        this.initialize();
    }
    
    async initialize() {
        logger.info('🚀 Initializing Proxy Optimizer...');
        
        // Wait for proxy rotator to load
        await this.waitForProxyRotator();
        
        // Categorize proxies
        this.categorizeProxies();
        
        // Start optimization
        await this.optimizeProxies();
        
        this.isOptimized = true;
        logger.success(`✅ Proxy optimization complete: ${this.workingProxies.length} working proxies`);
    }
    
    async waitForProxyRotator() {
        let attempts = 0;
        while (!proxyRotator.isLoaded && attempts < 30) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        }
        
        if (!proxyRotator.isLoaded) {
            logger.warning('⚠️ Proxy rotator not loaded, using fallback mode');
        }
    }
    
    categorizeProxies() {
        const allProxies = proxyRotator.proxies || [];
        
        // Separate premium proxies (port 3129) from others
        this.premiumProxies = allProxies.filter(proxy => proxy.includes(':3129'));
        const otherProxies = allProxies.filter(proxy => !proxy.includes(':3129'));
        
        logger.info(`📊 Proxy categorization:`);
        logger.info(`   Premium proxies: ${this.premiumProxies.length}`);
        logger.info(`   Other proxies: ${otherProxies.length}`);
        
        // Start with premium proxies as they're more reliable
        this.workingProxies = [...this.premiumProxies, ...otherProxies.slice(0, 500)];
    }
    
    async optimizeProxies() {
        logger.info('🔧 Optimizing proxy performance...');
        
        // Test proxies in batches for speed
        const batchSize = 50;
        const testPromises = [];
        
        for (let i = 0; i < this.workingProxies.length; i += batchSize) {
            const batch = this.workingProxies.slice(i, i + batchSize);
            testPromises.push(this.testProxyBatch(batch));
        }
        
        const results = await Promise.allSettled(testPromises);
        
        // Filter working proxies based on test results
        this.workingProxies = this.workingProxies.filter(proxy => {
            const result = this.testResults.get(proxy);
            return result && result.working && result.responseTime < this.maxResponseTime;
        });
        
        // Sort by performance (fastest first)
        this.workingProxies.sort((a, b) => {
            const resultA = this.testResults.get(a);
            const resultB = this.testResults.get(b);
            return (resultA?.responseTime || 9999) - (resultB?.responseTime || 9999);
        });
        
        // Identify fast proxies (top 30%)
        const fastCount = Math.floor(this.workingProxies.length * 0.3);
        this.fastProxies = this.workingProxies.slice(0, fastCount);
        
        logger.info(`⚡ Fast proxies identified: ${this.fastProxies.length}`);
    }
    
    async testProxyBatch(proxies) {
        const testPromises = proxies.map(proxy => this.testProxy(proxy));
        await Promise.allSettled(testPromises);
    }
    
    async testProxy(proxy) {
        return new Promise((resolve) => {
            const [host, port] = proxy.split(':');
            const startTime = Date.now();
            
            // Use a lightweight HTTP request for testing
            const http = require('http');
            const req = http.request({
                host,
                port: parseInt(port),
                method: 'GET',
                path: '/',
                timeout: 3000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            }, (res) => {
                const responseTime = Date.now() - startTime;
                this.testResults.set(proxy, {
                    working: true,
                    responseTime,
                    statusCode: res.statusCode
                });
                resolve();
            });
            
            req.on('error', () => {
                this.testResults.set(proxy, { working: false });
                resolve();
            });
            
            req.on('timeout', () => {
                req.destroy();
                this.testResults.set(proxy, { working: false });
                resolve();
            });
            
            req.end();
        });
    }
    
    /**
     * Get next optimized proxy
     */
    getNextProxy() {
        if (!this.isOptimized || this.workingProxies.length === 0) {
            return proxyRotator.getNextProxy();
        }
        
        const proxy = this.workingProxies[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.workingProxies.length;
        return proxy;
    }
    
    /**
     * Get fast proxy for high-priority requests
     */
    getFastProxy() {
        if (!this.isOptimized || this.fastProxies.length === 0) {
            return this.getNextProxy();
        }
        
        return this.fastProxies[Math.floor(Math.random() * this.fastProxies.length)];
    }
    
    /**
     * Get premium proxy
     */
    getPremiumProxy() {
        if (this.premiumProxies.length === 0) {
            return this.getFastProxy();
        }
        
        return this.premiumProxies[Math.floor(Math.random() * this.premiumProxies.length)];
    }
    
    /**
     * Get proxy configuration for HTTP agents
     */
    getProxyConfig(proxy) {
        if (!proxy) return null;
        
        const [host, port] = proxy.split(':');
        return {
            host,
            port: parseInt(port),
            protocol: 'http:'
        };
    }
    
    /**
     * Get statistics
     */
    getStats() {
        return {
            total: this.workingProxies.length,
            fast: this.fastProxies.length,
            premium: this.premiumProxies.length,
            current: this.currentIndex,
            optimized: this.isOptimized
        };
    }
    
    /**
     * Refresh proxy list (re-optimize)
     */
    async refresh() {
        logger.info('🔄 Refreshing proxy optimization...');
        this.isOptimized = false;
        this.testResults.clear();
        await this.initialize();
    }
}

// Global proxy optimizer instance
export const proxyOptimizer = new ProxyOptimizer();
