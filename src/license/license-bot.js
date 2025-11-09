import { Telegraf, Markup } from 'telegraf';
import { readFileSync } from 'fs';
import { licenseManager } from './license-manager.js';
import { logger } from '../utils/logger.js';

/**
 * License Bot - Telegram Bot untuk manage licenses
 */
export class LicenseBot {
    constructor(token, adminIds, sellerIds = []) {
        this.bot = new Telegraf(token);
        this.adminIds = adminIds.map(id => id.toString());
        this.sellerIds = sellerIds.map(id => id.toString());
        
        // Pricing (dalam USD atau mata uang lainnya)
        this.pricing = {
            'standard_7': { plan: 'standard', days: 7, price: 5, label: 'Standard 7 Days' },
            'standard_30': { plan: 'standard', days: 30, price: 15, label: 'Standard 30 Days' },
            'premium_7': { plan: 'premium', days: 7, price: 10, label: 'Premium 7 Days' },
            'premium_30': { plan: 'premium', days: 30, price: 30, label: 'Premium 30 Days' },
            'premium_90': { plan: 'premium', days: 90, price: 75, label: 'Premium 90 Days' },
            'lifetime': { plan: 'lifetime', days: 36500, price: 200, label: 'Lifetime License' }
        };

        this.setupCommands();
        this.setupCallbacks();
    }

    /**
     * Check if user is admin
     */
    isAdmin(userId) {
        return this.adminIds.includes(userId.toString());
    }

    /**
     * Check if user is seller
     */
    isSeller(userId) {
        return this.sellerIds.includes(userId.toString()) || this.isAdmin(userId);
    }

    /**
     * Setup commands
     */
    setupCommands() {
        // Start command
        this.bot.start((ctx) => {
            const userId = ctx.from.id.toString();
            logger.bot(`User ${userId} (@${ctx.from.username}) started license bot`);
            
            let message = `🎉 *Welcome to Aryzz-Stresser License Manager!*\n\n`;
            message += `📊 *User ID:* \`${userId}\`\n\n`;
            message += `Choose an option below:\n\n`;
            
            const buttons = [
                [Markup.button.callback('💳 Buy License', 'buy_license')],
                [Markup.button.callback('🔑 My Licenses', 'my_licenses')],
                [Markup.button.callback('ℹ️ Plans & Pricing', 'pricing')],
                [Markup.button.callback('❓ Help', 'help')]
            ];

            if (this.isAdmin(userId)) {
                buttons.push([Markup.button.callback('⚙️ Admin Panel', 'admin_panel')]);
            } else if (this.isSeller(userId)) {
                buttons.push([Markup.button.callback('👤 Seller Panel', 'seller_panel')]);
            }

            ctx.reply(message, {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard(buttons)
            });
        });

        // Buy command
        this.bot.command('buy', (ctx) => {
            this.showPricing(ctx);
        });

        // My licenses command
        this.bot.command('mylicenses', (ctx) => {
            this.showMyLicenses(ctx);
        });

        // Redeem command
        this.bot.command('redeem', (ctx) => {
            const args = ctx.message.text.split(' ');
            if (args.length < 2) {
                ctx.reply('Usage: `/redeem LICENSE-KEY`', { parse_mode: 'Markdown' });
                return;
            }
            
            const licenseKey = args[1].toUpperCase();
            this.redeemLicense(ctx, licenseKey);
        });

        // Admin commands
        this.bot.command('generate', (ctx) => {
            if (!this.isAdmin(ctx.from.id)) {
                ctx.reply('⛔️ Admin only command');
                return;
            }
            
            const args = ctx.message.text.split(' ');
            if (args.length < 4) {
                ctx.reply('Usage: `/generate <userId> <plan> <days>`\nExample: `/generate 123456789 premium 30`', { parse_mode: 'Markdown' });
                return;
            }
            
            const [, userId, plan, days] = args;
            this.generateLicense(ctx, userId, plan, parseInt(days));
        });

        this.bot.command('stats', (ctx) => {
            if (!this.isAdmin(ctx.from.id)) {
                ctx.reply('⛔️ Admin only command');
                return;
            }
            
            this.showStats(ctx);
        });

        // Help command
        this.bot.command('help', (ctx) => {
            this.showHelp(ctx);
        });
    }

    /**
     * Setup callback handlers
     */
    setupCallbacks() {
        // Buy license
        this.bot.action('buy_license', (ctx) => {
            ctx.answerCbQuery();
            this.showPricing(ctx);
        });

        // My licenses
        this.bot.action('my_licenses', (ctx) => {
            ctx.answerCbQuery();
            this.showMyLicenses(ctx);
        });

        // Pricing
        this.bot.action('pricing', (ctx) => {
            ctx.answerCbQuery();
            this.showPricing(ctx);
        });

        // Help
        this.bot.action('help', (ctx) => {
            ctx.answerCbQuery();
            this.showHelp(ctx);
        });

        // Admin panel
        this.bot.action('admin_panel', (ctx) => {
            if (!this.isAdmin(ctx.from.id)) {
                ctx.answerCbQuery('Access denied');
                return;
            }
            ctx.answerCbQuery();
            this.showAdminPanel(ctx);
        });

        // Seller panel
        this.bot.action('seller_panel', (ctx) => {
            if (!this.isSeller(ctx.from.id)) {
                ctx.answerCbQuery('Access denied');
                return;
            }
            ctx.answerCbQuery();
            this.showSellerPanel(ctx);
        });

        // Buy plan callbacks
        Object.keys(this.pricing).forEach(planKey => {
            this.bot.action(`buy_${planKey}`, (ctx) => {
                ctx.answerCbQuery();
                this.processPurchase(ctx, planKey);
            });
        });
    }

    /**
     * Show pricing
     */
    showPricing(ctx) {
        let message = `💎 *Aryzz-Stresser License Plans*\n\n`;
        
        message += `📦 *Standard Plan*\n`;
        message += `• Max Threads: 300\n`;
        message += `• Max Duration: 300s\n`;
        message += `• Basic + HTTP/2 Methods\n`;
        message += `• 1min Cooldown\n\n`;
        
        message += `⭐ *Premium Plan*\n`;
        message += `• Max Threads: 1000\n`;
        message += `• Max Duration: 600s\n`;
        message += `• All Methods Available\n`;
        message += `• No Cooldown\n\n`;
        
        message += `🏆 *Lifetime Plan*\n`;
        message += `• Unlimited Everything\n`;
        message += `• All Methods\n`;
        message += `• Priority Support\n`;
        message += `• One-time Payment\n\n`;
        
        message += `💰 *Pricing:*\n`;
        message += `Standard 7 Days - $${this.pricing.standard_7.price}\n`;
        message += `Standard 30 Days - $${this.pricing.standard_30.price}\n`;
        message += `Premium 7 Days - $${this.pricing.premium_7.price}\n`;
        message += `Premium 30 Days - $${this.pricing.premium_30.price}\n`;
        message += `Premium 90 Days - $${this.pricing.premium_90.price}\n`;
        message += `Lifetime - $${this.pricing.lifetime.price}\n\n`;
        
        message += `📞 Contact seller to purchase!`;

        const buttons = [
            [Markup.button.callback('📞 Contact Seller', 'contact_seller')],
            [Markup.button.callback('⬅️ Back', 'back_to_menu')]
        ];

        ctx.reply(message, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard(buttons)
        });
    }

    /**
     * Show my licenses
     */
    showMyLicenses(ctx) {
        const userId = ctx.from.id.toString();
        const licenses = licenseManager.getUserLicenses(userId);

        if (licenses.length === 0) {
            ctx.reply('📭 You have no licenses yet.\n\nUse /buy to purchase a license!');
            return;
        }

        let message = `🔑 *Your Licenses:*\n\n`;
        
        licenses.forEach((license, index) => {
            const status = license.active && license.expires > Date.now() ? '✅ Active' : '❌ Expired';
            const daysLeft = Math.ceil((license.expires - Date.now()) / (24 * 60 * 60 * 1000));
            
            message += `*License ${index + 1}*\n`;
            message += `Plan: ${license.plan.toUpperCase()}\n`;
            message += `Key: \`${license.key}\`\n`;
            message += `Status: ${status}\n`;
            message += `Days Left: ${daysLeft > 0 ? daysLeft : 0} days\n`;
            message += `Attacks: ${license.usage.attacks}\n`;
            message += `Bound: ${license.bound ? 'Yes' : 'No'}\n\n`;
        });

        ctx.reply(message, { parse_mode: 'Markdown' });
    }

    /**
     * Redeem license
     */
    redeemLicense(ctx, licenseKey) {
        const userId = ctx.from.id.toString();
        const info = licenseManager.getLicenseInfo(licenseKey);

        if (!info) {
            ctx.reply('❌ Invalid license key!');
            return;
        }

        let message = `✅ *License Activated!*\n\n`;
        message += `Plan: ${info.plan.toUpperCase()}\n`;
        message += `Days Remaining: ${info.daysRemaining}\n`;
        message += `Expires: ${new Date(info.expires).toLocaleDateString()}\n\n`;
        message += `Use this key in the attack bot to start attacking!`;

        ctx.reply(message, { parse_mode: 'Markdown' });
    }

    /**
     * Process purchase (untuk seller)
     */
    processPurchase(ctx, planKey) {
        const plan = this.pricing[planKey];
        
        let message = `💳 *Purchase ${plan.label}*\n\n`;
        message += `Price: $${plan.price}\n`;
        message += `Duration: ${plan.days} days\n\n`;
        message += `Please contact seller to complete payment and receive your license key!`;

        ctx.reply(message, { parse_mode: 'Markdown' });
    }

    /**
     * Generate license (admin only)
     */
    generateLicense(ctx, userId, plan, days) {
        try {
            const licenseKey = licenseManager.generateLicenseKey(userId, days, plan);
            
            let message = `✅ *License Generated!*\n\n`;
            message += `User ID: \`${userId}\`\n`;
            message += `Plan: ${plan.toUpperCase()}\n`;
            message += `Duration: ${days} days\n`;
            message += `Key: \`${licenseKey}\`\n\n`;
            message += `Send this key to the user!`;

            ctx.reply(message, { parse_mode: 'Markdown' });
            logger.success(`Admin ${ctx.from.id} generated license for user ${userId}`);
        } catch (error) {
            ctx.reply(`❌ Error: ${error.message}`);
            logger.error('License generation error:', error);
        }
    }

    /**
     * Show stats (admin only)
     */
    showStats(ctx) {
        const stats = licenseManager.getStats();
        
        let message = `📊 *License Statistics*\n\n`;
        message += `Total Licenses: ${stats.totalLicenses}\n`;
        message += `Active Licenses: ${stats.activeLicenses}\n`;
        message += `Total Users: ${stats.totalUsers}\n\n`;
        message += `*Plans Distribution:*\n`;
        
        Object.entries(stats.planCounts).forEach(([plan, count]) => {
            message += `${plan}: ${count}\n`;
        });

        ctx.reply(message, { parse_mode: 'Markdown' });
    }

    /**
     * Show admin panel
     */
    showAdminPanel(ctx) {
        let message = `⚙️ *Admin Panel*\n\n`;
        message += `Available Commands:\n\n`;
        message += `/generate <userId> <plan> <days> - Generate license\n`;
        message += `/stats - View statistics\n`;
        message += `/extend <key> <days> - Extend license\n`;
        message += `/deactivate <key> - Deactivate license\n`;
        message += `/resethwid <key> - Reset HWID binding\n`;

        ctx.reply(message, { parse_mode: 'Markdown' });
    }

    /**
     * Show seller panel
     */
    showSellerPanel(ctx) {
        let message = `👤 *Seller Panel*\n\n`;
        message += `Available Commands:\n\n`;
        message += `/generate <userId> <plan> <days> - Generate license\n`;
        message += `/mylicenses - View your sales\n`;

        ctx.reply(message, { parse_mode: 'Markdown' });
    }

    /**
     * Show help
     */
    showHelp(ctx) {
        let message = `❓ *Help & Information*\n\n`;
        message += `*Available Commands:*\n`;
        message += `/start - Show main menu\n`;
        message += `/buy - View pricing\n`;
        message += `/mylicenses - View your licenses\n`;
        message += `/redeem <key> - Redeem license key\n`;
        message += `/help - Show this help\n\n`;
        message += `*How to Use:*\n`;
        message += `1. Buy a license from seller\n`;
        message += `2. Receive your license key\n`;
        message += `3. Use key in attack bot\n`;
        message += `4. Start attacking!\n\n`;
        message += `For support, contact admin.`;

        ctx.reply(message, { parse_mode: 'Markdown' });
    }

    /**
     * Launch bot
     */
    launch() {
        logger.info('🤖 Starting License Bot...');
        
        this.bot.catch((err, ctx) => {
            logger.error('License bot error:', err);
        });
        
        this.bot.launch();
        
        process.once('SIGINT', () => {
            this.bot.stop('SIGINT');
        });
        process.once('SIGTERM', () => {
            this.bot.stop('SIGTERM');
        });
        
        logger.success('🤖 License Bot is running!');
    }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
    const config = JSON.parse(readFileSync('./config.json', 'utf-8'));
    
    if (!config.license_bot || !config.license_bot.token) {
        logger.error('❌ License bot configuration not found in config.json');
        process.exit(1);
    }

    const bot = new LicenseBot(
        config.license_bot.token,
        config.license_bot.admin_ids || [],
        config.license_bot.seller_ids || []
    );
    bot.launch();
}
