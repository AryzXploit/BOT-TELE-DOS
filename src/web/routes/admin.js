import express from 'express';
import { User, Transaction, Attack, Credit, Settings } from '../../database/models.js';
import { body, validationResult } from 'express-validator';
import { getDatabase } from '../../database/db.js';

const router = express.Router();

/**
 * Admin Dashboard
 */
router.get('/', async (req, res) => {
    try {
        const db = getDatabase();
        
        // Get statistics
        const totalUsers = await db.get('SELECT COUNT(*) as count FROM users WHERE role = "user"');
        const totalAttacks = await db.get('SELECT COUNT(*) as count FROM attacks');
        const pendingPayments = await db.get('SELECT COUNT(*) as count FROM transactions WHERE status = "pending"');
        const totalRevenue = await db.get('SELECT SUM(amount) as total FROM transactions WHERE status = "approved"');
        
        // Get recent activity
        const recentUsers = await User.getAll(10, 0);
        const recentAttacks = await Attack.getAll(10);
        const runningAttacks = await Attack.getRunning();
        
        res.render('admin/dashboard-pro', {
            title: 'Admin Dashboard - Aryzz DDoS Panel',
            user: req.user,
            stats: {
                totalUsers: totalUsers.count,
                totalAttacks: totalAttacks.count,
                pendingPayments: pendingPayments.count,
                totalRevenue: totalRevenue.total || 0
            },
            recentUsers,
            recentAttacks,
            runningAttacks
        });
    } catch (err) {
        console.error('Admin dashboard error:', err);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load admin dashboard'
        });
    }
});

/**
 * User Management
 */
router.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 50;
        const offset = (page - 1) * limit;
        
        const users = await User.getAll(limit, offset);
        
        res.render('admin/users-pro', {
            title: 'User Management - Aryzz DDoS Panel',
            user: req.user,
            users,
            page
        });
    } catch (err) {
        console.error('Users page error:', err);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load users'
        });
    }
});

/**
 * Ban User
 */
router.post('/users/:id/ban',
    [
        body('reason').trim().notEmpty().withMessage('Ban reason is required')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: errors.array()[0].msg
                });
            }

            const { reason } = req.body;
            await User.ban(req.params.id, reason);

            res.json({
                success: true,
                message: 'User banned successfully'
            });

        } catch (err) {
            console.error('Ban user error:', err);
            res.status(500).json({
                success: false,
                message: 'Failed to ban user'
            });
        }
    }
);

/**
 * Unban User
 */
router.post('/users/:id/unban', async (req, res) => {
    try {
        await User.unban(req.params.id);

        res.json({
            success: true,
            message: 'User unbanned successfully'
        });

    } catch (err) {
        console.error('Unban user error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to unban user'
        });
    }
});

/**
 * Add Credits to User
 */
router.post('/users/:id/add-credits',
    [
        body('amount').isInt({ min: 1 }).withMessage('Amount must be positive'),
        body('reason').trim().notEmpty().withMessage('Reason is required')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: errors.array()[0].msg
                });
            }

            const { amount, reason } = req.body;
            await Credit.add(req.params.id, parseInt(amount), 'admin_add', reason);

            res.json({
                success: true,
                message: 'Credits added successfully'
            });

        } catch (err) {
            console.error('Add credits error:', err);
            res.status(500).json({
                success: false,
                message: 'Failed to add credits'
            });
        }
    }
);

/**
 * Remove Credits from User
 */
router.post('/users/:id/remove-credits',
    [
        body('amount').isInt({ min: 1 }).withMessage('Amount must be positive'),
        body('reason').trim().notEmpty().withMessage('Reason is required')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: errors.array()[0].msg
                });
            }

            const { amount, reason } = req.body;
            await Credit.deduct(req.params.id, parseInt(amount), 'admin_remove', reason);

            res.json({
                success: true,
                message: 'Credits removed successfully'
            });

        } catch (err) {
            console.error('Remove credits error:', err);
            res.status(500).json({
                success: false,
                message: 'Failed to remove credits: ' + err.message
            });
        }
    }
);

/**
 * Payment Management
 */
router.get('/payments', async (req, res) => {
    try {
        const pendingPayments = await Transaction.getPending();
        
        res.render('admin/payments-pro', {
            title: 'Payment Management - Aryzz DDoS Panel',
            user: req.user,
            payments: pendingPayments
        });
    } catch (err) {
        console.error('Payments page error:', err);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load payments'
        });
    }
});

/**
 * Approve Payment
 */
router.post('/payments/:id/approve',
    [
        body('notes').optional().trim()
    ],
    async (req, res) => {
        try {
            const { notes } = req.body;
            await Transaction.approve(req.params.id, req.user.id, notes);

            res.json({
                success: true,
                message: 'Payment approved successfully'
            });

        } catch (err) {
            console.error('Approve payment error:', err);
            res.status(500).json({
                success: false,
                message: 'Failed to approve payment: ' + err.message
            });
        }
    }
);

/**
 * Reject Payment
 */
router.post('/payments/:id/reject',
    [
        body('reason').trim().notEmpty().withMessage('Rejection reason is required')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: errors.array()[0].msg
                });
            }

            const { reason } = req.body;
            await Transaction.reject(req.params.id, req.user.id, reason);

            res.json({
                success: true,
                message: 'Payment rejected successfully'
            });

        } catch (err) {
            console.error('Reject payment error:', err);
            res.status(500).json({
                success: false,
                message: 'Failed to reject payment'
            });
        }
    }
);

/**
 * Attack Logs
 */
router.get('/attacks', async (req, res) => {
    try {
        const attacks = await Attack.getAll(100);
        
        res.render('admin/attacks-pro', {
            title: 'Attack Logs - Aryzz DDoS Panel',
            user: req.user,
            attacks
        });
    } catch (err) {
        console.error('Attacks page error:', err);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load attacks'
        });
    }
});

/**
 * System Settings
 */
router.get('/settings', async (req, res) => {
    try {
        const settings = await Settings.getAll();
        
        res.render('admin/settings', {
            title: 'System Settings - Aryzz DDoS Panel',
            user: req.user,
            settings
        });
    } catch (err) {
        console.error('Settings page error:', err);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load settings'
        });
    }
});

/**
 * Update Settings
 */
router.post('/settings',
    [
        body('key').trim().notEmpty().withMessage('Key is required'),
        body('value').trim().notEmpty().withMessage('Value is required')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: errors.array()[0].msg
                });
            }

            const { key, value } = req.body;
            await Settings.set(key, value);

            res.json({
                success: true,
                message: 'Settings updated successfully'
            });

        } catch (err) {
            console.error('Update settings error:', err);
            res.status(500).json({
                success: false,
                message: 'Failed to update settings'
            });
        }
    }
);

export default router;
