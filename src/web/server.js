import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from '../database/db.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import attackRoutes from './routes/attack.js';
import paymentRoutes from './routes/payment.js';
import adminRoutes from './routes/admin.js';
import { authMiddleware, adminMiddleware } from './middleware/auth.js';
import { globalStats } from '../utils/statistics-tracker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Trust proxy for rate limiting (GitHub Codespaces/production)
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: 'aryzz-ddos-panel-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Static files
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/auth', authRoutes);
app.use('/dashboard', authMiddleware, dashboardRoutes);
app.use('/attack', authMiddleware, attackRoutes);
app.use('/payment', authMiddleware, paymentRoutes);
app.use('/admin', authMiddleware, adminMiddleware, adminRoutes);

// Home page
app.get('/', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/dashboard');
    }
    res.redirect('/auth/login');
});

// WebSocket for real-time updates
io.use((socket, next) => {
    const sessionMiddleware = session({
        secret: 'aryzz-ddos-panel-secret-key-change-this',
        resave: false,
        saveUninitialized: false
    });
    sessionMiddleware(socket.request, {}, next);
});

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Join user room
    if (socket.request.session.userId) {
        socket.join(`user_${socket.request.session.userId}`);
    }
    
    // Listen to statistics updates
    globalStats.on('update', (stats) => {
        socket.emit('stats_update', stats);
    });
    
    globalStats.on('request', (data) => {
        socket.emit('request_update', data);
    });
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', {
        title: '404 - Page Not Found'
    });
});

/**
 * Start server
 */
export async function startWebServer(port = 3000) {
    try {
        // Initialize database
        await initDatabase();
        
        // Start server
        httpServer.listen(port, () => {
            console.log('╔═══════════════════════════════════════════════════════════╗');
            console.log('║                                                           ║');
            console.log('║        🔥 ARYZZ DDOS PANEL - WEB DASHBOARD 🔥            ║');
            console.log('║                                                           ║');
            console.log('╚═══════════════════════════════════════════════════════════╝');
            console.log('');
            console.log(`✅ Server running on: http://localhost:${port}`);
            console.log(`✅ Database: Initialized`);
            console.log(`✅ WebSocket: Ready`);
            console.log('');
            console.log('📝 Default Admin Credentials:');
            console.log('   Username: admin');
            console.log('   Password: admin123');
            console.log('');
            console.log('🌐 Access the panel at: http://localhost:' + port);
            console.log('');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        });
        
        return { app, httpServer, io };
    } catch (err) {
        console.error('Failed to start web server:', err);
        throw err;
    }
}

// Export for external use
export { app, httpServer, io };
