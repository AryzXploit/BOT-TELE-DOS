import { User } from '../../database/models.js';

/**
 * Authentication Middleware
 */
export async function authMiddleware(req, res, next) {
    try {
        if (!req.session.userId) {
            if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            return res.redirect('/auth/login');
        }
        
        // Get user from database
        const user = await User.findById(req.session.userId);
        
        if (!user) {
            req.session.destroy();
            return res.redirect('/auth/login');
        }
        
        // Check if user is banned
        if (user.is_banned) {
            req.session.destroy();
            if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
                return res.status(403).json({
                    success: false,
                    message: 'Your account has been banned. Reason: ' + user.ban_reason
                });
            }
            return res.render('banned', {
                reason: user.ban_reason
            });
        }
        
        // Attach user to request
        req.user = user;
        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
}

/**
 * Admin Middleware
 */
export async function adminMiddleware(req, res, next) {
    try {
        if (!req.user || req.user.role !== 'admin') {
            if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
                return res.status(403).json({
                    success: false,
                    message: 'Admin access required'
                });
            }
            return res.status(403).render('403', {
                title: '403 - Forbidden',
                message: 'Admin access required'
            });
        }
        next();
    } catch (err) {
        console.error('Admin middleware error:', err);
        res.status(500).json({
            success: false,
            message: 'Authorization error'
        });
    }
}

/**
 * Check credits middleware
 */
export async function checkCredits(requiredCredits) {
    return async (req, res, next) => {
        try {
            if (req.user.credits < requiredCredits) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient credits',
                    required: requiredCredits,
                    available: req.user.credits
                });
            }
            next();
        } catch (err) {
            console.error('Check credits error:', err);
            res.status(500).json({
                success: false,
                message: 'Error checking credits'
            });
        }
    };
}
