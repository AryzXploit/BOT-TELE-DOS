import http from 'http';
import https from 'https';
import dns from 'dns';
import { promisify } from 'util';
import { URL } from 'url';
import { logger } from '../utils/logger.js';

const dnsResolve = promisify(dns.resolve);
const dnsResolve4 = promisify(dns.resolve4);

/**
 * Smart Target Scanner
 * Auto-detect server type, WAF, CDN, and vulnerabilities
 */
export class TargetScanner {
    constructor(target) {
        this.target = target;
        this.results = {
            target: target,
            ip: null,
            serverType: 'Unknown',
            cdn: null,
            waf: null,
            cloudflare: false,
            ports: [],
            headers: {},
            responseTime: 0,
            statusCode: 0,
            vulnerabilities: [],
            recommendedMethods: []
        };
    }

    /**
     * Scan target and gather intelligence
     */
    async scan() {
        try {
            logger.info('🔍 Starting target scan...');
            
            // Parse URL
            let url;
            try {
                if (!this.target.includes('://')) {
                    url = new URL(`http://${this.target}`);
                } else {
                    url = new URL(this.target);
                }
            } catch (err) {
                logger.error(`Invalid target URL: ${this.target}`);
                throw new Error('Invalid target format');
            }

            // Resolve IP
            await this.resolveIP(url.hostname);
            
            // HTTP fingerprinting
            await this.httpFingerprint(url);
            
            // Detect CDN/WAF
            this.detectCDN();
            this.detectWAF();
            
            // Analyze vulnerabilities
            this.analyzeVulnerabilities();
            
            // Recommend attack methods
            this.recommendMethods();
            
            logger.success('✅ Target scan complete!');
            return this.results;
        } catch (err) {
            logger.error(`Scan error: ${err.message}`);
            throw err;
        }
    }

    /**
     * Resolve target IP address
     */
    async resolveIP(hostname) {
        try {
            const addresses = await dnsResolve4(hostname);
            this.results.ip = addresses[0];
            logger.info(`📍 IP Address: ${this.results.ip}`);
        } catch (err) {
            logger.debug(`DNS resolution failed: ${err.message}`);
            this.results.ip = hostname; // Might already be an IP
        }
    }

    /**
     * HTTP fingerprinting to detect server type
     */
    async httpFingerprint(url) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const protocol = url.protocol === 'https:' ? https : http;
            
            const options = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: '/',
                method: 'GET',
                timeout: 5000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            };

            const req = protocol.request(options, (res) => {
                this.results.responseTime = Date.now() - startTime;
                this.results.statusCode = res.statusCode;
                this.results.headers = res.headers;

                // Detect server type
                if (res.headers.server) {
                    this.results.serverType = res.headers.server;
                    logger.info(`🖥️  Server: ${this.results.serverType}`);
                }

                // Detect Cloudflare
                if (res.headers['cf-ray'] || res.headers['cf-cache-status']) {
                    this.results.cloudflare = true;
                    this.results.cdn = 'Cloudflare';
                    logger.info('🛡️  Cloudflare detected!');
                }

                // Consume response data
                res.on('data', () => {});
                res.on('end', () => resolve());
            });

            req.on('error', (err) => {
                logger.debug(`HTTP fingerprint error: ${err.message}`);
                resolve();
            });

            req.on('timeout', () => {
                req.destroy();
                resolve();
            });

            req.end();
        });
    }

    /**
     * Detect CDN provider
     */
    detectCDN() {
        const headers = this.results.headers;
        
        // Cloudflare
        if (headers['cf-ray'] || headers['cf-cache-status']) {
            this.results.cdn = 'Cloudflare';
        }
        // Akamai
        else if (headers['x-akamai-transformed'] || headers['akamai-origin-hop']) {
            this.results.cdn = 'Akamai';
        }
        // Fastly
        else if (headers['x-fastly-request-id']) {
            this.results.cdn = 'Fastly';
        }
        // CloudFront
        else if (headers['x-amz-cf-id'] || headers['x-amz-cf-pop']) {
            this.results.cdn = 'CloudFront';
        }
        // Incapsula
        else if (headers['x-iinfo'] || headers['x-cdn']) {
            this.results.cdn = 'Incapsula';
        }

        if (this.results.cdn) {
            logger.info(`🌐 CDN: ${this.results.cdn}`);
        }
    }

    /**
     * Detect WAF (Web Application Firewall)
     */
    detectWAF() {
        const headers = this.results.headers;
        const server = this.results.serverType.toLowerCase();

        // Cloudflare WAF
        if (this.results.cloudflare) {
            this.results.waf = 'Cloudflare';
        }
        // ModSecurity
        else if (server.includes('modsecurity')) {
            this.results.waf = 'ModSecurity';
        }
        // Sucuri
        else if (headers['x-sucuri-id'] || headers['x-sucuri-cache']) {
            this.results.waf = 'Sucuri';
        }
        // Wordfence
        else if (headers['x-wordfence-cache']) {
            this.results.waf = 'Wordfence';
        }
        // AWS WAF
        else if (headers['x-amzn-requestid']) {
            this.results.waf = 'AWS WAF';
        }

        if (this.results.waf) {
            logger.info(`🛡️  WAF: ${this.results.waf}`);
        }
    }

    /**
     * Analyze potential vulnerabilities
     */
    analyzeVulnerabilities() {
        const server = this.results.serverType.toLowerCase();
        const headers = this.results.headers;

        // Slow response time
        if (this.results.responseTime > 3000) {
            this.results.vulnerabilities.push({
                type: 'SLOW_RESPONSE',
                severity: 'MEDIUM',
                description: 'Server has slow response time - vulnerable to slowloris'
            });
        }

        // No rate limiting detected
        if (!this.results.waf && !this.results.cdn) {
            this.results.vulnerabilities.push({
                type: 'NO_PROTECTION',
                severity: 'HIGH',
                description: 'No WAF/CDN detected - vulnerable to floods'
            });
        }

        // Apache server
        if (server.includes('apache')) {
            this.results.vulnerabilities.push({
                type: 'APACHE_RANGE',
                severity: 'MEDIUM',
                description: 'Apache server - vulnerable to range attacks'
            });
        }

        // WordPress detected
        if (headers['x-powered-by']?.includes('PHP') || server.includes('wordpress')) {
            this.results.vulnerabilities.push({
                type: 'WORDPRESS',
                severity: 'MEDIUM',
                description: 'WordPress detected - vulnerable to XMLRPC attacks'
            });
        }

        // HTTP/2 support
        if (headers[':status'] || this.results.statusCode === 200) {
            this.results.vulnerabilities.push({
                type: 'HTTP2_SUPPORT',
                severity: 'LOW',
                description: 'HTTP/2 supported - can use HTTP/2 flood'
            });
        }

        if (this.results.vulnerabilities.length > 0) {
            logger.info(`⚠️  Found ${this.results.vulnerabilities.length} vulnerabilities`);
        }
    }

    /**
     * Recommend best attack methods based on scan results
     */
    recommendMethods() {
        const methods = [];

        // Cloudflare bypass methods
        if (this.results.cloudflare) {
            methods.push({
                method: 'CFB',
                priority: 'HIGH',
                reason: 'Cloudflare detected - use bypass method'
            });
            methods.push({
                method: 'BYPASS',
                priority: 'HIGH',
                reason: 'Advanced Cloudflare bypass'
            });
            methods.push({
                method: 'HTTP2-CF',
                priority: 'MEDIUM',
                reason: 'HTTP/2 Cloudflare bypass'
            });
        }

        // No protection - use powerful floods
        if (!this.results.waf && !this.results.cdn) {
            methods.push({
                method: 'STRESS',
                priority: 'HIGH',
                reason: 'No protection - maximum stress attack'
            });
            methods.push({
                method: 'GET',
                priority: 'HIGH',
                reason: 'Simple GET flood for unprotected target'
            });
            methods.push({
                method: 'POST',
                priority: 'MEDIUM',
                reason: 'POST flood for resource exhaustion'
            });
        }

        // Slow server - use slowloris
        if (this.results.responseTime > 3000) {
            methods.push({
                method: 'SLOW',
                priority: 'HIGH',
                reason: 'Slow server - slowloris attack effective'
            });
        }

        // Apache - use range attack
        if (this.results.serverType.toLowerCase().includes('apache')) {
            methods.push({
                method: 'APACHE',
                priority: 'MEDIUM',
                reason: 'Apache server - range attack effective'
            });
        }

        // WordPress - use XMLRPC
        if (this.results.headers['x-powered-by']?.includes('PHP')) {
            methods.push({
                method: 'XMLRPC',
                priority: 'MEDIUM',
                reason: 'PHP detected - XMLRPC attack possible'
            });
        }

        // HTTP/2 support
        methods.push({
            method: 'HTTP2',
            priority: 'MEDIUM',
            reason: 'HTTP/2 flood for modern servers'
        });

        // Always recommend dynamic attack
        methods.push({
            method: 'DYN',
            priority: 'LOW',
            reason: 'Dynamic attack as fallback'
        });

        // Sort by priority
        const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        methods.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

        this.results.recommendedMethods = methods;

        if (methods.length > 0) {
            logger.info(`💡 Recommended: ${methods[0].method} (${methods[0].reason})`);
        }
    }

    /**
     * Get scan results
     */
    getResults() {
        return this.results;
    }

    /**
     * Get best recommended method
     */
    getBestMethod() {
        if (this.results.recommendedMethods.length > 0) {
            return this.results.recommendedMethods[0].method;
        }
        return 'GET'; // Default fallback
    }

    /**
     * Print scan report
     */
    printReport() {
        console.log('\n╔═══════════════════════════════════════════╗');
        console.log('║       🔍 TARGET SCAN REPORT 🔍          ║');
        console.log('╚═══════════════════════════════════════════╝\n');
        
        console.log(`🎯 Target: ${this.results.target}`);
        console.log(`📍 IP: ${this.results.ip}`);
        console.log(`🖥️  Server: ${this.results.serverType}`);
        console.log(`⏱️  Response Time: ${this.results.responseTime}ms`);
        
        if (this.results.cdn) {
            console.log(`🌐 CDN: ${this.results.cdn}`);
        }
        if (this.results.waf) {
            console.log(`🛡️  WAF: ${this.results.waf}`);
        }
        
        if (this.results.vulnerabilities.length > 0) {
            console.log(`\n⚠️  Vulnerabilities Found: ${this.results.vulnerabilities.length}`);
            this.results.vulnerabilities.forEach((vuln, i) => {
                console.log(`   ${i + 1}. [${vuln.severity}] ${vuln.description}`);
            });
        }
        
        if (this.results.recommendedMethods.length > 0) {
            console.log(`\n💡 Recommended Attack Methods:`);
            this.results.recommendedMethods.slice(0, 5).forEach((rec, i) => {
                console.log(`   ${i + 1}. ${rec.method} [${rec.priority}] - ${rec.reason}`);
            });
        }
        
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
}
