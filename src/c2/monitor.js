import chalk from 'chalk';
import { logger } from '../utils/logger.js';

/**
 * Real-time Attack Monitor
 * Displays Gbps, PPS, and detailed statistics
 */
export class AttackMonitor {
    constructor() {
        this.attacks = new Map();
        this.globalStats = {
            totalRequests: 0,
            totalBytes: 0,
            totalPackets: 0,
            startTime: Date.now()
        };
        this.updateInterval = null;
    }

    /**
     * Register new attack for monitoring
     */
    registerAttack(attackId, config) {
        this.attacks.set(attackId, {
            id: attackId,
            method: config.method,
            target: config.target,
            threads: config.threads,
            startTime: Date.now(),
            lastUpdate: Date.now(),
            stats: {
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                totalBytes: 0,
                totalPackets: 0
            },
            rates: {
                rps: 0,      // Requests per second
                pps: 0,      // Packets per second
                gbps: 0      // Gigabits per second
            }
        });
    }

    /**
     * Update attack statistics
     */
    updateAttack(attackId, newStats) {
        const attack = this.attacks.get(attackId);
        if (!attack) return;

        const now = Date.now();
        const timeDiff = (now - attack.lastUpdate) / 1000; // seconds

        // Calculate deltas
        const requestsDelta = (newStats.totalRequests || 0) - attack.stats.totalRequests;
        const bytesDelta = (newStats.totalBytes || 0) - attack.stats.totalBytes;
        const packetsDelta = (newStats.totalPackets || 0) - attack.stats.totalPackets;

        // Update stats
        attack.stats = {
            totalRequests: newStats.totalRequests || attack.stats.totalRequests,
            successfulRequests: newStats.successfulRequests || attack.stats.successfulRequests,
            failedRequests: newStats.failedRequests || attack.stats.failedRequests,
            totalBytes: newStats.totalBytes || attack.stats.totalBytes,
            totalPackets: newStats.totalPackets || attack.stats.totalPackets
        };

        // Calculate rates (if timeDiff > 0 to avoid division by zero)
        if (timeDiff > 0) {
            attack.rates.rps = Math.round(requestsDelta / timeDiff);
            attack.rates.pps = Math.round(packetsDelta / timeDiff);
            attack.rates.gbps = ((bytesDelta * 8) / timeDiff / 1000000000).toFixed(2); // Convert to Gbps
        }

        attack.lastUpdate = now;

        // Update global stats
        this.globalStats.totalRequests += requestsDelta;
        this.globalStats.totalBytes += bytesDelta;
        this.globalStats.totalPackets += packetsDelta;
    }

    /**
     * Remove attack from monitoring
     */
    unregisterAttack(attackId) {
        this.attacks.delete(attackId);
    }

    /**
     * Get current statistics
     */
    getStats() {
        const totalRPS = Array.from(this.attacks.values())
            .reduce((sum, a) => sum + a.rates.rps, 0);
        
        const totalPPS = Array.from(this.attacks.values())
            .reduce((sum, a) => sum + a.rates.pps, 0);
        
        const totalGbps = Array.from(this.attacks.values())
            .reduce((sum, a) => sum + parseFloat(a.rates.gbps), 0);

        const uptime = Math.floor((Date.now() - this.globalStats.startTime) / 1000);

        return {
            attacks: Array.from(this.attacks.values()),
            global: {
                ...this.globalStats,
                uptime,
                totalRPS,
                totalPPS,
                totalGbps: totalGbps.toFixed(2)
            }
        };
    }

    /**
     * Start real-time monitoring display
     */
    startMonitoring(intervalMs = 2000) {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        console.clear();
        this.displayHeader();

        this.updateInterval = setInterval(() => {
            this.displayStats();
        }, intervalMs);
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Display header
     */
    displayHeader() {
        console.log(chalk.cyan.bold('\n╔═══════════════════════════════════════════════════════════════════════╗'));
        console.log(chalk.cyan.bold('║           🔥 ARYZZ-STRESSER REAL-TIME MONITOR 🔥                     ║'));
        console.log(chalk.cyan.bold('╚═══════════════════════════════════════════════════════════════════════╝\n'));
    }

    /**
     * Display real-time statistics
     */
    displayStats() {
        const stats = this.getStats();
        
        // Move cursor to top (clear screen effect)
        process.stdout.write('\x1B[2J\x1B[0f');
        
        this.displayHeader();

        // Global Statistics
        console.log(chalk.yellow.bold('📊 GLOBAL STATISTICS'));
        console.log(chalk.gray('─'.repeat(75)));
        
        const uptimeStr = this.formatUptime(stats.global.uptime);
        console.log(chalk.white(`⏱️  Uptime:           ${chalk.green(uptimeStr)}`));
        console.log(chalk.white(`🎯 Active Attacks:    ${chalk.green(this.attacks.size)}`));
        console.log(chalk.white(`📈 Total Requests:    ${chalk.green(this.formatNumber(stats.global.totalRequests))}`));
        console.log(chalk.white(`📦 Total Packets:     ${chalk.green(this.formatNumber(stats.global.totalPackets))}`));
        console.log(chalk.white(`💾 Total Data:        ${chalk.green(this.formatBytes(stats.global.totalBytes))}`));
        console.log('');

        // Current Rates (BIG DISPLAY)
        console.log(chalk.red.bold('⚡ CURRENT RATES'));
        console.log(chalk.gray('─'.repeat(75)));
        console.log(chalk.white(`🔥 Requests/sec:      ${chalk.red.bold(this.formatNumber(stats.global.totalRPS) + ' RPS')}`));
        console.log(chalk.white(`📡 Packets/sec:       ${chalk.red.bold(this.formatNumber(stats.global.totalPPS) + ' PPS')}`));
        console.log(chalk.white(`🌐 Bandwidth:         ${chalk.red.bold(stats.global.totalGbps + ' Gbps')}`));
        console.log('');

        // Individual Attack Stats
        if (this.attacks.size > 0) {
            console.log(chalk.magenta.bold('🎯 ACTIVE ATTACKS'));
            console.log(chalk.gray('─'.repeat(75)));
            
            for (const attack of stats.attacks) {
                const elapsed = Math.floor((Date.now() - attack.startTime) / 1000);
                const elapsedStr = this.formatUptime(elapsed);
                
                console.log(chalk.cyan(`\n🔸 Attack ID: ${attack.id.substring(0, 8)}...`));
                console.log(chalk.white(`   Method:     ${chalk.yellow(attack.method)}`));
                console.log(chalk.white(`   Target:     ${chalk.yellow(attack.target)}`));
                console.log(chalk.white(`   Threads:    ${chalk.yellow(attack.threads)}`));
                console.log(chalk.white(`   Duration:   ${chalk.yellow(elapsedStr)}`));
                console.log(chalk.white(`   Requests:   ${chalk.green(this.formatNumber(attack.stats.totalRequests))}`));
                console.log(chalk.white(`   Success:    ${chalk.green(this.formatNumber(attack.stats.successfulRequests))}`));
                console.log(chalk.white(`   Failed:     ${chalk.red(this.formatNumber(attack.stats.failedRequests))}`));
                console.log(chalk.white(`   RPS:        ${chalk.red.bold(this.formatNumber(attack.rates.rps))}`));
                console.log(chalk.white(`   PPS:        ${chalk.red.bold(this.formatNumber(attack.rates.pps))}`));
                console.log(chalk.white(`   Gbps:       ${chalk.red.bold(attack.rates.gbps)}`));
            }
        }

        console.log(chalk.gray('\n' + '─'.repeat(75)));
        console.log(chalk.gray(`Last update: ${new Date().toLocaleTimeString()}`));
        console.log(chalk.gray('Press Ctrl+C to stop monitoring\n'));
    }

    /**
     * Format number with commas
     */
    formatNumber(num) {
        if (num >= 1000000000) {
            return (num / 1000000000).toFixed(2) + 'B';
        } else if (num >= 1000000) {
            return (num / 1000000).toFixed(2) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(2) + 'K';
        }
        return num.toString();
    }

    /**
     * Format bytes to human readable
     */
    formatBytes(bytes) {
        if (bytes >= 1099511627776) {
            return (bytes / 1099511627776).toFixed(2) + ' TB';
        } else if (bytes >= 1073741824) {
            return (bytes / 1073741824).toFixed(2) + ' GB';
        } else if (bytes >= 1048576) {
            return (bytes / 1048576).toFixed(2) + ' MB';
        } else if (bytes >= 1024) {
            return (bytes / 1024).toFixed(2) + ' KB';
        }
        return bytes + ' B';
    }

    /**
     * Format uptime to readable string
     */
    formatUptime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        }
        return `${secs}s`;
    }
}

// Export singleton
export const attackMonitor = new AttackMonitor();
