import express from 'express';
import multer from 'multer';
import path from 'path';
import { body, validationResult } from 'express-validator';
import { Transaction, Settings, Notification } from '../../database/models.js';
import { existsSync, mkdirSync } from 'fs';

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'proofs');
        if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `proof-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only JPG and PNG images are allowed'));
        }
    }
});

// Package configurations
const PACKAGES = {
    starter: {
        name: 'Starter Package',
        price: 15000,
        credits: 100,
        duration: 30,
        features: ['Basic methods', 'Max 300 threads', 'Max 60s duration', '10 attacks/day']
    },
    bronze: {
        name: 'Bronze Package',
        price: 30000,
        credits: 250,
        duration: 30,
        features: ['All methods', 'Max 500 threads', 'Max 120s duration', '25 attacks/day']
    },
    silver: {
        name: 'Silver Package',
        price: 50000,
        credits: 500,
        duration: 30,
        features: ['All methods', 'Max 800 threads', 'Max 180s duration', '50 attacks/day', 'Priority support']
    },
    gold: {
        name: 'Gold Package',
        price: 100000,
        credits: 1200,
        duration: 30,
        features: ['All methods', 'Max 1000 threads', 'Max 300s duration', 'Unlimited attacks', 'Priority support', 'Custom profiles']
    },
    platinum: {
        name: 'Platinum Package',
        price: 200000,
        credits: 3000,
        duration: 60,
        features: ['All methods', 'Max 1000 threads', 'Max 600s duration', 'Unlimited attacks', 'VIP support', 'Custom profiles', 'API access']
    }
};

/**
 * Buy Credits Page
 */
router.get('/buy', async (req, res) => {
    try {
        const settings = await Settings.getAll();
        
        res.render('payment/buy-pro', {
            title: 'Buy Credits - Aryzz DDoS Panel',
            user: req.user,
            packages: PACKAGES,
            settings
        });
    } catch (err) {
        console.error('Buy page error:', err);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load payment page'
        });
    }
});

/**
 * Submit Payment
 */
router.post('/submit',
    upload.single('proof'),
    [
        body('package').isIn(Object.keys(PACKAGES)).withMessage('Invalid package'),
        body('paymentMethod').isIn(['dana', 'qris']).withMessage('Invalid payment method')
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

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Payment proof is required'
                });
            }

            const { package: packageType, paymentMethod } = req.body;
            const packageInfo = PACKAGES[packageType];

            // Create transaction
            const transaction = await Transaction.create({
                userId: req.user.id,
                packageType: packageInfo.name,
                amount: packageInfo.price,
                credits: packageInfo.credits,
                paymentMethod,
                paymentProof: `/uploads/proofs/${req.file.filename}`
            });

            // Notify user
            await Notification.create({
                userId: req.user.id,
                type: 'payment',
                title: 'Payment Submitted',
                message: `Your payment for ${packageInfo.name} has been submitted. Please wait for admin approval.`
            });

            res.json({
                success: true,
                message: 'Payment submitted successfully. Please wait for admin approval.',
                transactionId: transaction.transaction_id
            });

        } catch (err) {
            console.error('Submit payment error:', err);
            res.status(500).json({
                success: false,
                message: 'Failed to submit payment: ' + err.message
            });
        }
    }
);

/**
 * Transaction History
 */
router.get('/history', async (req, res) => {
    try {
        const transactions = await Transaction.getUserTransactions(req.user.id, 50);
        
        res.render('payment/history', {
            title: 'Transaction History - Aryzz DDoS Panel',
            user: req.user,
            transactions
        });
    } catch (err) {
        console.error('History error:', err);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Failed to load transaction history'
        });
    }
});

/**
 * Get Transaction Status
 */
router.get('/status/:transactionId', async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.transactionId);
        
        if (!transaction || transaction.user_id !== req.user.id) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        res.json({
            success: true,
            transaction
        });

    } catch (err) {
        console.error('Status error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to get transaction status'
        });
    }
});

export default router;
