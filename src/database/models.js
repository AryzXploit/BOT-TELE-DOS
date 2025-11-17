import { getDatabase } from './db.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

/**
 * User Model
 */
export class User {
    /**
     * Create new user
     */
    static async create(userData) {
        const db = getDatabase();
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        const result = await db.run(
            `INSERT INTO users (username, email, password, role, ip_address) 
             VALUES (?, ?, ?, ?, ?)`,
            [userData.username, userData.email, hashedPassword, userData.role || 'user', userData.ip]
        );
        
        return await this.findById(result.lastID);
    }

    /**
     * Find user by ID
     */
    static async findById(id) {
        const db = getDatabase();
        return await db.get('SELECT * FROM users WHERE id = ?', [id]);
    }

    /**
     * Find user by username
     */
    static async findByUsername(username) {
        const db = getDatabase();
        return await db.get('SELECT * FROM users WHERE username = ?', [username]);
    }

    /**
     * Find user by email
     */
    static async findByEmail(email) {
        const db = getDatabase();
        return await db.get('SELECT * FROM users WHERE email = ?', [email]);
    }

    /**
     * Verify password
     */
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    /**
     * Update last login
     */
    static async updateLastLogin(userId) {
        const db = getDatabase();
        await db.run(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [userId]
        );
    }

    /**
     * Get all users (admin)
     */
    static async getAll(limit = 100, offset = 0) {
        const db = getDatabase();
        return await db.all(
            'SELECT id, username, email, role, credits, total_attacks, created_at, last_login, is_active, is_banned FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );
    }

    /**
     * Ban user
     */
    static async ban(userId, reason) {
        const db = getDatabase();
        await db.run(
            'UPDATE users SET is_banned = 1, ban_reason = ? WHERE id = ?',
            [reason, userId]
        );
    }

    /**
     * Unban user
     */
    static async unban(userId) {
        const db = getDatabase();
        await db.run(
            'UPDATE users SET is_banned = 0, ban_reason = NULL WHERE id = ?',
            [userId]
        );
    }
}

/**
 * Credit Model
 */
export class Credit {
    /**
     * Add credits to user
     */
    static async add(userId, amount, type, description) {
        const db = getDatabase();
        
        // Get current balance
        const user = await User.findById(userId);
        const balanceBefore = user.credits;
        const balanceAfter = balanceBefore + amount;
        
        // Update user credits
        await db.run(
            'UPDATE users SET credits = credits + ? WHERE id = ?',
            [amount, userId]
        );
        
        // Record history
        await db.run(
            `INSERT INTO credits_history (user_id, amount, type, description, balance_before, balance_after) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, amount, type, description, balanceBefore, balanceAfter]
        );
        
        return balanceAfter;
    }

    /**
     * Deduct credits from user
     */
    static async deduct(userId, amount, type, description) {
        const db = getDatabase();
        
        // Get current balance
        const user = await User.findById(userId);
        const balanceBefore = user.credits;
        
        if (balanceBefore < amount) {
            throw new Error('Insufficient credits');
        }
        
        const balanceAfter = balanceBefore - amount;
        
        // Update user credits
        await db.run(
            'UPDATE users SET credits = credits - ? WHERE id = ?',
            [amount, userId]
        );
        
        // Record history
        await db.run(
            `INSERT INTO credits_history (user_id, amount, type, description, balance_before, balance_after) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, -amount, type, description, balanceBefore, balanceAfter]
        );
        
        return balanceAfter;
    }

    /**
     * Get credit history
     */
    static async getHistory(userId, limit = 50) {
        const db = getDatabase();
        return await db.all(
            'SELECT * FROM credits_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
            [userId, limit]
        );
    }
}

/**
 * Transaction Model
 */
export class Transaction {
    /**
     * Create new transaction
     */
    static async create(transactionData) {
        const db = getDatabase();
        const transactionId = `TRX-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        
        const result = await db.run(
            `INSERT INTO transactions (user_id, package_type, amount, credits, payment_method, payment_proof, transaction_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                transactionData.userId,
                transactionData.packageType,
                transactionData.amount,
                transactionData.credits,
                transactionData.paymentMethod,
                transactionData.paymentProof,
                transactionId
            ]
        );
        
        return await this.findById(result.lastID);
    }

    /**
     * Find transaction by ID
     */
    static async findById(id) {
        const db = getDatabase();
        return await db.get('SELECT * FROM transactions WHERE id = ?', [id]);
    }

    /**
     * Get pending transactions (admin)
     */
    static async getPending() {
        const db = getDatabase();
        return await db.all(
            `SELECT t.*, u.username, u.email 
             FROM transactions t 
             JOIN users u ON t.user_id = u.id 
             WHERE t.status = 'pending' 
             ORDER BY t.created_at DESC`
        );
    }

    /**
     * Get user transactions
     */
    static async getUserTransactions(userId, limit = 50) {
        const db = getDatabase();
        return await db.all(
            'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
            [userId, limit]
        );
    }

    /**
     * Approve transaction
     */
    static async approve(transactionId, adminId, notes = null) {
        const db = getDatabase();
        
        // Get transaction
        const transaction = await this.findById(transactionId);
        if (!transaction) {
            throw new Error('Transaction not found');
        }
        
        if (transaction.status !== 'pending') {
            throw new Error('Transaction already processed');
        }
        
        // Update transaction
        await db.run(
            `UPDATE transactions 
             SET status = 'approved', admin_notes = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [notes, adminId, transactionId]
        );
        
        // Add credits to user
        await Credit.add(
            transaction.user_id,
            transaction.credits,
            'purchase',
            `Package: ${transaction.package_type}`
        );
        
        // Update user package
        await db.run(
            `UPDATE users 
             SET package_type = ?, package_expires = datetime('now', '+30 days') 
             WHERE id = ?`,
            [transaction.package_type, transaction.user_id]
        );
        
        // Create notification
        await Notification.create({
            userId: transaction.user_id,
            type: 'payment',
            title: 'Payment Approved',
            message: `Your payment for ${transaction.package_type} package has been approved. ${transaction.credits} credits added to your account.`
        });
        
        return await this.findById(transactionId);
    }

    /**
     * Reject transaction
     */
    static async reject(transactionId, adminId, reason) {
        const db = getDatabase();
        
        const transaction = await this.findById(transactionId);
        if (!transaction) {
            throw new Error('Transaction not found');
        }
        
        await db.run(
            `UPDATE transactions 
             SET status = 'rejected', admin_notes = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [reason, adminId, transactionId]
        );
        
        // Create notification
        await Notification.create({
            userId: transaction.user_id,
            type: 'payment',
            title: 'Payment Rejected',
            message: `Your payment has been rejected. Reason: ${reason}`
        });
        
        return await this.findById(transactionId);
    }
}

/**
 * Attack Model
 */
export class Attack {
    /**
     * Create new attack
     */
    static async create(attackData) {
        const db = getDatabase();
        
        const result = await db.run(
            `INSERT INTO attacks (user_id, target, method, threads, duration, rpc, credits_used, ip_address, user_agent) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                attackData.userId,
                attackData.target,
                attackData.method,
                attackData.threads,
                attackData.duration,
                attackData.rpc,
                attackData.creditsUsed,
                attackData.ip,
                attackData.userAgent
            ]
        );
        
        // Update user total attacks
        await db.run(
            'UPDATE users SET total_attacks = total_attacks + 1 WHERE id = ?',
            [attackData.userId]
        );
        
        return await this.findById(result.lastID);
    }

    /**
     * Find attack by ID
     */
    static async findById(id) {
        const db = getDatabase();
        return await db.get('SELECT * FROM attacks WHERE id = ?', [id]);
    }

    /**
     * Update attack status
     */
    static async updateStatus(attackId, status, stats = {}) {
        const db = getDatabase();
        
        await db.run(
            `UPDATE attacks 
             SET status = ?, total_requests = ?, successful_requests = ?, blocked_requests = ?, bypassed_requests = ?, completed_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [
                status,
                stats.totalRequests || 0,
                stats.successfulRequests || 0,
                stats.blockedRequests || 0,
                stats.bypassedRequests || 0,
                attackId
            ]
        );
    }

    /**
     * Get user attacks
     */
    static async getUserAttacks(userId, limit = 50) {
        const db = getDatabase();
        return await db.all(
            'SELECT * FROM attacks WHERE user_id = ? ORDER BY started_at DESC LIMIT ?',
            [userId, limit]
        );
    }

    /**
     * Get all attacks (admin)
     */
    static async getAll(limit = 100) {
        const db = getDatabase();
        return await db.all(
            `SELECT a.*, u.username 
             FROM attacks a 
             JOIN users u ON a.user_id = u.id 
             ORDER BY a.started_at DESC LIMIT ?`,
            [limit]
        );
    }

    /**
     * Get running attacks
     */
    static async getRunning() {
        const db = getDatabase();
        return await db.all(
            `SELECT a.*, u.username 
             FROM attacks a 
             JOIN users u ON a.user_id = u.id 
             WHERE a.status = 'running' 
             ORDER BY a.started_at DESC`
        );
    }
}

/**
 * Notification Model
 */
export class Notification {
    /**
     * Create notification
     */
    static async create(notificationData) {
        const db = getDatabase();
        
        await db.run(
            `INSERT INTO notifications (user_id, type, title, message) 
             VALUES (?, ?, ?, ?)`,
            [
                notificationData.userId,
                notificationData.type,
                notificationData.title,
                notificationData.message
            ]
        );
    }

    /**
     * Get user notifications
     */
    static async getUserNotifications(userId, limit = 50) {
        const db = getDatabase();
        return await db.all(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
            [userId, limit]
        );
    }

    /**
     * Mark as read
     */
    static async markAsRead(notificationId) {
        const db = getDatabase();
        await db.run(
            'UPDATE notifications SET is_read = 1 WHERE id = ?',
            [notificationId]
        );
    }

    /**
     * Get unread count
     */
    static async getUnreadCount(userId) {
        const db = getDatabase();
        const result = await db.get(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
            [userId]
        );
        return result.count;
    }
}

/**
 * Settings Model
 */
export class Settings {
    /**
     * Get setting
     */
    static async get(key) {
        const db = getDatabase();
        const result = await db.get('SELECT value FROM settings WHERE key = ?', [key]);
        return result ? result.value : null;
    }

    /**
     * Set setting
     */
    static async set(key, value) {
        const db = getDatabase();
        await db.run(
            `INSERT OR REPLACE INTO settings (key, value, updated_at) 
             VALUES (?, ?, CURRENT_TIMESTAMP)`,
            [key, value]
        );
    }

    /**
     * Get all settings
     */
    static async getAll() {
        const db = getDatabase();
        const rows = await db.all('SELECT * FROM settings');
        const settings = {};
        rows.forEach(row => {
            settings[row.key] = row.value;
        });
        return settings;
    }
}
