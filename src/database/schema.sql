-- Aryzz DDoS Panel Database Schema
-- SQLite Database

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user', -- 'user' or 'admin'
    credits INTEGER DEFAULT 0,
    total_attacks INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT 1,
    is_banned BOOLEAN DEFAULT 0,
    ban_reason TEXT,
    package_type VARCHAR(50),
    package_expires DATETIME,
    telegram_id VARCHAR(50),
    ip_address VARCHAR(45)
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    package_type VARCHAR(50) NOT NULL,
    amount INTEGER NOT NULL,
    credits INTEGER NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'dana' or 'qris'
    payment_proof VARCHAR(255), -- path to uploaded image
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    admin_notes TEXT,
    approved_by INTEGER,
    approved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    transaction_id VARCHAR(100) UNIQUE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Credits History Table
CREATE TABLE IF NOT EXISTS credits_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL, -- positive for add, negative for deduct
    type VARCHAR(50) NOT NULL, -- 'purchase', 'attack', 'admin_add', 'admin_remove', 'refund'
    description TEXT,
    balance_before INTEGER,
    balance_after INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Attacks Table
CREATE TABLE IF NOT EXISTS attacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    target VARCHAR(255) NOT NULL,
    method VARCHAR(50) NOT NULL,
    threads INTEGER NOT NULL,
    duration INTEGER NOT NULL,
    rpc INTEGER NOT NULL,
    credits_used INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'running', -- 'running', 'completed', 'stopped', 'failed'
    total_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    blocked_requests INTEGER DEFAULT 0,
    bypassed_requests INTEGER DEFAULT 0,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    ip_address VARCHAR(45),
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- System Settings Table
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'payment', 'credit', 'attack', 'system'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_attacks_user_id ON attacks(user_id);
CREATE INDEX IF NOT EXISTS idx_attacks_status ON attacks(status);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Insert Default Admin User
-- Password: admin123 (hashed with bcrypt)
INSERT OR IGNORE INTO users (id, username, email, password, role, credits, is_active)
VALUES (1, 'admin', 'admin@aryapanel.xyz', '$2b$10$rKvVPZqGvVZxJxKxKxKxKOqGvVZxJxKxKxKxKxKxKxKxKxKxKxKxK', 'admin', 999999, 1);

-- Insert Default System Settings
INSERT OR IGNORE INTO settings (key, value, description) VALUES
('site_name', 'Aryzz DDoS Panel', 'Website name'),
('site_url', 'https://ddos.aryapanel.xyz', 'Website URL'),
('dana_number', '089998497763', 'DANA payment number'),
('dana_name', 'Arya', 'DANA account name'),
('qris_image', '/uploads/qris.png', 'QRIS image path'),
('auto_approve', 'false', 'Auto approve payments'),
('max_threads', '1000', 'Maximum threads allowed'),
('max_duration', '600', 'Maximum duration in seconds'),
('registration_enabled', 'true', 'Allow new registrations'),
('maintenance_mode', 'false', 'Maintenance mode');
