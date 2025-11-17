import express from 'express';
import { Attack, Credit, Notification, Settings } from '../../database/models.js';

const router = express.Router();

/**
 * Dashboard Home
 */
router.get('/', async (req, res) => {
    try {
        const user = req.user;
        
        // Get user statistics
        const recentAttacks = await Attack.getUserAttacks(user.id, 5);
        const creditHistory = await Credit.getHistory(user.id, 5);
        const notifications = await Notification.getUserNotifications(user.id, 5);
        const unreadCount = await Notification.getUnreadCount(user.id);
        
        // Get system settings
        const settings = await Settings.getAll();
        
        res.render('dashboard/index', {
            title: 'Dashboard - Aryzz DDoS Panel',
            user,
            recentAttacks,
            creditHistory,
            notifications,
            unreadCount,
            settings
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load dashboard'
        });
    }
});

/**
 * Profile Page
 */
router.get('/profile', async (req, res) => {
    try {
        const user = req.user;
        const creditHistory = await Credit.getHistory(user.id, 20);
        
        res.render('dashboard/profile', {
            title: 'Profile - Aryzz DDoS Panel',
            user,
            creditHistory
        });
    } catch (err) {
        console.error('Profile error:', err);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load profile'
        });
    }
});

/**
 * Attack History
 */
router.get('/history', async (req, res) => {
    try {
        const user = req.user;
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const offset = (page - 1) * limit;
        
        const attacks = await Attack.getUserAttacks(user.id, limit);
        
        res.render('dashboard/history', {
            title: 'Attack History - Aryzz DDoS Panel',
            user,
            attacks,
            page
        });
    } catch (err) {
        console.error('History error:', err);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load history'
        });
    }
});

/**
 * Notifications Page
 */
router.get('/notifications', async (req, res) => {
    try {
        const user = req.user;
        const notifications = await Notification.getUserNotifications(user.id, 50);
        
        res.render('dashboard/notifications', {
            title: 'Notifications - Aryzz DDoS Panel',
            user,
            notifications
        });
    } catch (err) {
        console.error('Notifications error:', err);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load notifications'
        });
    }
});

/**
 * Mark notification as read
 */
router.post('/notifications/:id/read', async (req, res) => {
    try {
        await Notification.markAsRead(req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error('Mark read error:', err);
        res.status(500).json({ success: false, message: 'Failed to mark as read' });
    }
});

export default router;
