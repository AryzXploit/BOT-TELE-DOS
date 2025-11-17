import express from 'express';
import { User } from '../../database/models.js';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: 'Too many attempts, please try again later'
});

/**
 * Login Page
 */
router.get('/login', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    res.render('auth/login', {
        title: 'Login - Aryzz DDoS Panel',
        error: null
    });
});

/**
 * Login Handler
 */
router.post('/login', 
    authLimiter,
    [
        body('username').trim().notEmpty().withMessage('Username is required'),
        body('password').notEmpty().withMessage('Password is required')
    ],
    async (req, res) => {
        try {
            // Validate input
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.render('auth/login', {
                    title: 'Login - Aryzz DDoS Panel',
                    error: errors.array()[0].msg
                });
            }

            const { username, password } = req.body;

            // Find user
            const user = await User.findByUsername(username);
            if (!user) {
                return res.render('auth/login', {
                    title: 'Login - Aryzz DDoS Panel',
                    error: 'Invalid username or password'
                });
            }

            // Check if banned
            if (user.is_banned) {
                return res.render('auth/login', {
                    title: 'Login - Aryzz DDoS Panel',
                    error: 'Your account has been banned. Reason: ' + user.ban_reason
                });
            }

            // Verify password
            const isValid = await User.verifyPassword(password, user.password);
            if (!isValid) {
                return res.render('auth/login', {
                    title: 'Login - Aryzz DDoS Panel',
                    error: 'Invalid username or password'
                });
            }

            // Update last login
            await User.updateLastLogin(user.id);

            // Set session
            req.session.userId = user.id;
            req.session.username = user.username;
            req.session.role = user.role;

            res.redirect('/dashboard');
        } catch (err) {
            console.error('Login error:', err);
            res.render('auth/login', {
                title: 'Login - Aryzz DDoS Panel',
                error: 'An error occurred. Please try again.'
            });
        }
    }
);

/**
 * Register Page
 */
router.get('/register', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    res.render('auth/register', {
        title: 'Register - Aryzz DDoS Panel',
        error: null,
        success: null
    });
});

/**
 * Register Handler
 */
router.post('/register',
    authLimiter,
    [
        body('username')
            .trim()
            .isLength({ min: 3, max: 20 })
            .withMessage('Username must be 3-20 characters')
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Username can only contain letters, numbers, and underscores'),
        body('email')
            .trim()
            .isEmail()
            .withMessage('Invalid email address')
            .normalizeEmail(),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters'),
        body('confirmPassword')
            .custom((value, { req }) => value === req.body.password)
            .withMessage('Passwords do not match')
    ],
    async (req, res) => {
        try {
            // Validate input
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.render('auth/register', {
                    title: 'Register - Aryzz DDoS Panel',
                    error: errors.array()[0].msg,
                    success: null
                });
            }

            const { username, email, password } = req.body;

            // Check if username exists
            const existingUser = await User.findByUsername(username);
            if (existingUser) {
                return res.render('auth/register', {
                    title: 'Register - Aryzz DDoS Panel',
                    error: 'Username already taken',
                    success: null
                });
            }

            // Check if email exists
            const existingEmail = await User.findByEmail(email);
            if (existingEmail) {
                return res.render('auth/register', {
                    title: 'Register - Aryzz DDoS Panel',
                    error: 'Email already registered',
                    success: null
                });
            }

            // Create user
            await User.create({
                username,
                email,
                password,
                role: 'user',
                ip: req.ip
            });

            res.render('auth/register', {
                title: 'Register - Aryzz DDoS Panel',
                error: null,
                success: 'Registration successful! You can now login.'
            });
        } catch (err) {
            console.error('Register error:', err);
            res.render('auth/register', {
                title: 'Register - Aryzz DDoS Panel',
                error: 'An error occurred. Please try again.',
                success: null
            });
        }
    }
);

/**
 * Logout Handler
 */
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/auth/login');
    });
});

export default router;
