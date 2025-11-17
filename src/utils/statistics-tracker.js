import { EventEmitter } from 'events';
import { logger } from './logger.js';

/**
 * Real-time Statistics Tracker
 * Track detailed attack statistics like DStatBot
 */
export class StatisticsTracker extends EventEmitter {
    constructor() {
        super();
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            blockedRequests: 0,
            bypassedRequests: 0,
            
            // Response codes breakdown
            responseCodes: {},
            
            // HTTP protocol breakdown
            protocols: {},
            
            // CloudFlare specific
            cloudflare: {
                detected: false,
                allowedRequests: 0,
                bypassedRequests: 0,
                blockedRequests: 0,
                triggeredRules: {}
            },
            
            // Detailed breakdown
            allowed: [],
            bypassed: [],
            blocked: [],
            
            // Timing
            startTime: null,
            lastUpdate: null,
            duration: 0
        };
        
        this.updateInterval = null;
    }

    /**
     * Start tracking
     */
    start() {
        this.stats.startTime = Date.now();
        this.stats.lastUpdate = Date.now();
        
        // Emit updates every second
        this.updateInterval = setInterval(() => {
            this.stats.lastUpdate = Date.now();
            this.stats.duration = Math.floor((Date.now() - this.stats.startTime) / 1000);
            this.emit('update', this.getStats());
        }, 1000);
        
        logger.info('📊 Statistics tracking started');
    }

    /**
     * Stop tracking
     */
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        this.stats.duration = Math.floor((Date.now() - this.stats.startTime) / 1000);
        this.emit('stop', this.getStats());
        
        logger.info('📊 Statistics tracking stopped');
    }

    /**
     * Track a request
     */
    trackRequest(response) {
        this.stats.totalRequests++;
        
        const statusCode = response.statusCode || 0;
        const protocol = response.protocol || 'HTTP/1.1';
        const action = response.action || 'Unknown';
        const triggeredRule = response.triggeredRule || null;
        
        // Track response codes
        if (!this.stats.responseCodes[statusCode]) {
            this.stats.responseCodes[statusCode] = 0;
        }
        this.stats.responseCodes[statusCode]++;
        
        // Track protocols
        if (!this.stats.protocols[protocol]) {
            this.stats.protocols[protocol] = 0;
        }
        this.stats.protocols[protocol]++;
        
        // Categorize request
        if (this.isSuccessful(statusCode)) {
            this.stats.successfulRequests++;
            
            // Check if bypassed CloudFlare
            if (triggeredRule && triggeredRule.includes('DDoS')) {
                this.stats.bypassedRequests++;
                this.stats.cloudflare.bypassedRequests++;
                this.stats.cloudflare.detected = true;
                
                this.addToCategory('bypassed', {
                    count: 1,
                    action: action,
                    httpMethod: response.method || 'GET',
                    httpProtocol: protocol,
                    protocol: response.scheme || 'https',
                    response: statusCode,
                    triggeredRules: triggeredRule
                });
                
                // Track triggered rules
                if (!this.stats.cloudflare.triggeredRules[triggeredRule]) {
                    this.stats.cloudflare.triggeredRules[triggeredRule] = 0;
                }
                this.stats.cloudflare.triggeredRules[triggeredRule]++;
            } else {
                this.stats.cloudflare.allowedRequests++;
                
                this.addToCategory('allowed', {
                    count: 1,
                    httpProtocol: protocol,
                    response: statusCode
                });
            }
        } else if (this.isBlocked(statusCode)) {
            this.stats.blockedRequests++;
            this.stats.cloudflare.blockedRequests++;
            this.stats.cloudflare.detected = true;
            
            this.addToCategory('blocked', {
                count: 1,
                action: action,
                httpMethod: response.method || 'GET',
                httpProtocol: protocol,
                protocol: response.scheme || 'https',
                response: statusCode,
                triggeredRules: triggeredRule || 'HTTP DDoS'
            });
            
            // Track triggered rules
            const rule = triggeredRule || 'HTTP DDoS';
            if (!this.stats.cloudflare.triggeredRules[rule]) {
                this.stats.cloudflare.triggeredRules[rule] = 0;
            }
            this.stats.cloudflare.triggeredRules[rule]++;
        }
        
        // Emit real-time update
        this.emit('request', {
            statusCode,
            protocol,
            action,
            triggeredRule
        });
    }

    /**
     * Check if request is successful
     */
    isSuccessful(statusCode) {
        return statusCode >= 200 && statusCode < 300;
    }

    /**
     * Check if request is blocked
     */
    isBlocked(statusCode) {
        return statusCode === 403 || statusCode === 429 || statusCode === 499 || statusCode === 503;
    }

    /**
     * Add to category with aggregation
     */
    addToCategory(category, data) {
        const existing = this.stats[category].find(item => 
            item.response === data.response &&
            item.httpProtocol === data.httpProtocol &&
            item.action === data.action
        );
        
        if (existing) {
            existing.count++;
        } else {
            this.stats[category].push(data);
        }
    }

    /**
     * Get current statistics
     */
    getStats() {
        const total = this.stats.totalRequests;
        
        return {
            totalRequests: total,
            successfulRequests: this.stats.successfulRequests,
            successfulPercentage: total > 0 ? ((this.stats.successfulRequests / total) * 100).toFixed(2) : 0,
            blockedRequests: this.stats.blockedRequests,
            blockedPercentage: total > 0 ? ((this.stats.blockedRequests / total) * 100).toFixed(2) : 0,
            bypassedRequests: this.stats.bypassedRequests,
            bypassedPercentage: total > 0 ? ((this.stats.bypassedRequests / total) * 100).toFixed(2) : 0,
            
            responseCodes: this.stats.responseCodes,
            protocols: this.stats.protocols,
            
            cloudflare: {
                detected: this.stats.cloudflare.detected,
                allowedRequests: this.stats.cloudflare.allowedRequests,
                allowedPercentage: total > 0 ? ((this.stats.cloudflare.allowedRequests / total) * 100).toFixed(2) : 0,
                bypassedRequests: this.stats.cloudflare.bypassedRequests,
                bypassedPercentage: total > 0 ? ((this.stats.cloudflare.bypassedRequests / total) * 100).toFixed(2) : 0,
                blockedRequests: this.stats.cloudflare.blockedRequests,
                blockedPercentage: total > 0 ? ((this.stats.cloudflare.blockedRequests / total) * 100).toFixed(2) : 0,
                triggeredRules: this.stats.cloudflare.triggeredRules
            },
            
            allowed: this.stats.allowed,
            bypassed: this.stats.bypassed,
            blocked: this.stats.blocked,
            
            duration: this.stats.duration,
            startTime: this.stats.startTime,
            lastUpdate: this.stats.lastUpdate
        };
    }

    /**
     * Generate statistics report (DStatBot style)
     */
    generateReport() {
        const stats = this.getStats();
        
        let report = '╔═══════════════════════════════════════════════════════════════╗\n';
        report += '║                  📊 ATTACK STATISTICS 📊                      ║\n';
        report += '╚═══════════════════════════════════════════════════════════════╝\n\n';
        
        report += '➥ Start Statistics\n';
        report += `➥ Statistics Duration : ${stats.duration} seconds\n\n`;
        
        if (stats.cloudflare.detected) {
            report += '🐳 CloudFlare Detected\n\n';
        }
        
        report += '📊 All Requests\n';
        report += `➥ ${stats.totalRequests.toLocaleString()}\n\n`;
        
        report += '✅ Successful Requests\n';
        report += `➥ ${stats.successfulRequests.toLocaleString()} (${stats.successfulPercentage}%)\n\n`;
        
        report += '🚫 Blocked Requests\n';
        report += `➥ ${stats.blockedRequests.toLocaleString()} (${stats.blockedPercentage}%)\n`;
        report += '➖➖➖➖➖➖➖\n\n';
        
        // Allowed Requests Details
        if (stats.allowed.length > 0) {
            report += '🔫 Allowed Requests:\n';
            report += '➖➖➖➖➖➖➖\n';
            
            stats.allowed.forEach(item => {
                report += `➥ HTTP Protocol: ${item.httpProtocol}\n`;
                report += `➥ Response: ${item.response}\n`;
                report += `➥ Count: ${item.count.toLocaleString()}\n`;
                report += '➖➖➖➖➖➖➖\n';
            });
            
            report += `➥ Total Count: ${stats.cloudflare.allowedRequests.toLocaleString()}\n`;
            report += `➥ Percentage: ${stats.cloudflare.allowedPercentage}%\n`;
            report += '➖➖➖➖➖➖➖\n\n';
        }
        
        // Bypassed Requests Details
        if (stats.bypassed.length > 0) {
            report += '🚁 Bypassed Requests:\n';
            report += '➖➖➖➖➖➖➖\n';
            
            stats.bypassed.forEach(item => {
                report += `➥ Count: ${item.count.toLocaleString()}\n`;
                report += `➥ Action: ${item.action}\n`;
                report += `➥ HTTP Method: ${item.httpMethod}\n`;
                report += `➥ HTTP Protocol: ${item.httpProtocol}\n`;
                report += `➥ Protocol: ${item.protocol}\n`;
                report += `➥ Response: ${item.response}\n`;
                report += `➥ Triggered Rules: ${item.triggeredRules}\n`;
                report += '➖➖➖➖➖➖➖\n';
            });
            
            report += `➥ Total Count: ${stats.bypassedRequests.toLocaleString()}\n`;
            report += `➥ Percentage: ${stats.bypassedPercentage}%\n`;
            report += '➖➖➖➖➖➖➖\n\n';
        }
        
        // Blocked Requests Details
        if (stats.blocked.length > 0) {
            report += '🛡 Blocked Requests:\n';
            report += '➖➖➖➖➖➖➖\n';
            
            stats.blocked.forEach(item => {
                report += `➥ Count: ${item.count.toLocaleString()}\n`;
                report += `➥ Action: ${item.action}\n`;
                report += `➥ HTTP Method: ${item.httpMethod}\n`;
                report += `➥ HTTP Protocol: ${item.httpProtocol}\n`;
                report += `➥ Protocol: ${item.protocol}\n`;
                report += `➥ Response: ${item.response}\n`;
                report += `➥ Triggered Rules: ${item.triggeredRules}\n`;
                report += '➖➖➖➖➖➖➖\n';
            });
            
            report += `➥ Total Count: ${stats.blockedRequests.toLocaleString()}\n`;
            report += `➥ Percentage: ${stats.blockedPercentage}%\n`;
            report += '➖➖➖➖➖➖➖\n\n';
        }
        
        report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        report += 'Data Source: Aryzz-Stresser v4.0\n';
        report += 'Developed by: Aryzz-Dev (@AryzXploit)\n';
        
        return report;
    }

    /**
     * Reset statistics
     */
    reset() {
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            blockedRequests: 0,
            bypassedRequests: 0,
            responseCodes: {},
            protocols: {},
            cloudflare: {
                detected: false,
                allowedRequests: 0,
                bypassedRequests: 0,
                blockedRequests: 0,
                triggeredRules: {}
            },
            allowed: [],
            bypassed: [],
            blocked: [],
            startTime: null,
            lastUpdate: null,
            duration: 0
        };
    }
}

// Global statistics tracker instance
export const globalStats = new StatisticsTracker();
