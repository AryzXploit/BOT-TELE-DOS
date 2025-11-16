import http from 'http';
import https from 'https';
import { URL } from 'url';
import { logger } from './logger.js';

/**
 * Domain Monitor for Telegram Bot
 * Monitor multiple domains and send notifications when status changes
 */
export class DomainMonitor {
    constructor(bot) {
        this.bot = bot;
        this.domains = new Map(); // chatId -> [domains]
        this.intervals = new Map(); // chatId -> interval
        this.domainStatus = new Map(); // domain -> { isUp, lastCheck, consecutiveFailures }
    }

    /**
     * Add domain to monitor for a user
     */
    addDomain(chatId, domain) {
        if (!this.domains.has(chatId)) {
            this.domains.set(chatId, []);
        }

        const userDomains = this.domains.get(chatId);
        
        // Check if domain already monitored
        if (userDomains.includes(domain)) {
            return { success: false, message: '⚠️ Domain sudah di-monitor!' };
        }

        // Max 5 domains per user
        if (userDomains.length >= 5) {
            return { success: false, message: '⚠️ Max 5 domains per user!' };
        }

        userDomains.push(domain);
        
        // Initialize domain status
        if (!this.domainStatus.has(domain)) {
            this.domainStatus.set(domain, {
                isUp: true,
                lastCheck: null,
                consecutiveFailures: 0,
                responseTime: null
            });
        }

        // Start monitoring if not already started
        if (!this.intervals.has(chatId)) {
            this.startMonitoring(chatId);
        }

        return { success: true, message: '✅ Domain berhasil ditambahkan!' };
    }

    /**
     * Remove domain from monitoring
     */
    removeDomain(chatId, domain) {
        if (!this.domains.has(chatId)) {
            return { success: false, message: '⚠️ Tidak ada domain yang di-monitor!' };
        }

        const userDomains = this.domains.get(chatId);
        const index = userDomains.indexOf(domain);

        if (index === -1) {
            return { success: false, message: '⚠️ Domain tidak ditemukan!' };
        }

        userDomains.splice(index, 1);

        // Stop monitoring if no more domains
        if (userDomains.length === 0) {
            this.stopMonitoring(chatId);
            this.domains.delete(chatId);
        }

        return { success: true, message: '✅ Domain berhasil dihapus!' };
    }

    /**
     * Get all monitored domains for a user
     */
    getDomains(chatId) {
        return this.domains.get(chatId) || [];
    }

    /**
     * Start monitoring for a user
     */
    startMonitoring(chatId) {
        // Check every 30 seconds
        const interval = setInterval(async () => {
            const userDomains = this.domains.get(chatId);
            if (!userDomains || userDomains.length === 0) {
                this.stopMonitoring(chatId);
                return;
            }

            for (const domain of userDomains) {
                await this.checkDomain(chatId, domain);
            }
        }, 30000); // 30 seconds

        this.intervals.set(chatId, interval);
        logger.info(`Started monitoring for chat ${chatId}`);
    }

    /**
     * Stop monitoring for a user
     */
    stopMonitoring(chatId) {
        const interval = this.intervals.get(chatId);
        if (interval) {
            clearInterval(interval);
            this.intervals.delete(chatId);
            logger.info(`Stopped monitoring for chat ${chatId}`);
        }
    }

    /**
     * Check domain health
     */
    async checkDomain(chatId, domain) {
        try {
            const startTime = Date.now();
            const isUp = await this.checkHealth(domain);
            const responseTime = Date.now() - startTime;

            const status = this.domainStatus.get(domain);
            const wasUp = status.isUp;

            if (isUp) {
                status.consecutiveFailures = 0;
                status.responseTime = responseTime;

                // Domain came back up
                if (!wasUp) {
                    status.isUp = true;
                    await this.sendNotification(chatId, domain, 'up', responseTime);
                }
            } else {
                status.consecutiveFailures++;

                // Domain went down (3 consecutive failures)
                if (wasUp && status.consecutiveFailures >= 3) {
                    status.isUp = false;
                    await this.sendNotification(chatId, domain, 'down');
                }
            }

            status.lastCheck = new Date();
            this.domainStatus.set(domain, status);

        } catch (err) {
            logger.debug(`Error checking domain ${domain}:`, err.message);
        }
    }

    /**
     * Check if domain is up
     */
    async checkHealth(domain) {
        return new Promise((resolve) => {
            try {
                let url;
                if (!domain.includes('://')) {
                    url = new URL(`http://${domain}`);
                } else {
                    url = new URL(domain);
                }

                const protocol = url.protocol === 'https:' ? https : http;
                
                const options = {
                    hostname: url.hostname,
                    port: url.port || (url.protocol === 'https:' ? 443 : 80),
                    path: '/',
                    method: 'HEAD',
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                };

                const req = protocol.request(options, (res) => {
                    resolve(res.statusCode < 500);
                });

                req.on('error', () => resolve(false));
                req.on('timeout', () => {
                    req.destroy();
                    resolve(false);
                });

                req.end();
            } catch (err) {
                resolve(false);
            }
        });
    }

    /**
     * Send notification to user
     */
    async sendNotification(chatId, domain, status, responseTime = null) {
        try {
            let message;

            if (status === 'down') {
                message = 
                    `╔═══════════════════════════════╗\n` +
                    `║  💀 *DOMAIN DOWN!* 💀        ║\n` +
                    `╚═══════════════════════════════╝\n\n` +
                    `🎯 *Domain:* \`${domain}\`\n` +
                    `⚰️  *Status:* 🔴 OFFLINE/DOWN\n` +
                    `⏰ *Time:* ${new Date().toLocaleTimeString()}\n\n` +
                    `💀 *BUSETT DOMAIN MATI COK!*\n` +
                    `🔥 Target berhasil di-down! GG EZ!`;
            } else {
                message = 
                    `╔═══════════════════════════════╗\n` +
                    `║  ✅ *DOMAIN UP!* ✅          ║\n` +
                    `╚═══════════════════════════════╝\n\n` +
                    `🎯 *Domain:* \`${domain}\`\n` +
                    `🟢 *Status:* ONLINE/UP\n` +
                    `⚡ *Response:* ${responseTime}ms\n` +
                    `⏰ *Time:* ${new Date().toLocaleTimeString()}\n\n` +
                    `⚠️ *ANJIR DOMAIN HIDUP LAGI!*\n` +
                    `💪 Target recovered, gas lagi bro!`;
            }

            await this.bot.telegram.sendMessage(chatId, message, {
                parse_mode: 'Markdown'
            });

        } catch (err) {
            logger.error(`Failed to send notification to ${chatId}:`, err.message);
        }
    }

    /**
     * Get status of all monitored domains for a user
     */
    getStatus(chatId) {
        const userDomains = this.domains.get(chatId) || [];
        const statuses = [];

        for (const domain of userDomains) {
            const status = this.domainStatus.get(domain);
            if (status) {
                statuses.push({
                    domain,
                    isUp: status.isUp,
                    lastCheck: status.lastCheck,
                    responseTime: status.responseTime,
                    consecutiveFailures: status.consecutiveFailures
                });
            }
        }

        return statuses;
    }

    /**
     * Stop all monitoring
     */
    stopAll() {
        for (const [chatId, interval] of this.intervals.entries()) {
            clearInterval(interval);
        }
        this.intervals.clear();
        logger.info('Stopped all domain monitoring');
    }
}
