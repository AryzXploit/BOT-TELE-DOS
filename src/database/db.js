import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db = null;

/**
 * Initialize Database
 */
export async function initDatabase() {
    try {
        // Open database
        db = await open({
            filename: join(process.cwd(), 'panel.db'),
            driver: sqlite3.Database
        });

        // Read and execute schema
        const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
        await db.exec(schema);

        // Create default admin if not exists
        await createDefaultAdmin();

        console.log('✅ Database initialized successfully');
        return db;
    } catch (err) {
        console.error('❌ Database initialization failed:', err);
        throw err;
    }
}

/**
 * Create default admin user
 */
async function createDefaultAdmin() {
    try {
        const adminExists = await db.get('SELECT id FROM users WHERE username = ?', ['admin']);
        
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            await db.run(
                `INSERT INTO users (username, email, password, role, credits, is_active) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                ['admin', 'admin@aryapanel.xyz', hashedPassword, 'admin', 999999, 1]
            );
            
            console.log('✅ Default admin user created');
            console.log('   Username: admin');
            console.log('   Password: admin123');
        }
    } catch (err) {
        console.error('Error creating default admin:', err);
    }
}

/**
 * Get database instance
 */
export function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return db;
}

/**
 * Close database connection
 */
export async function closeDatabase() {
    if (db) {
        await db.close();
        db = null;
        console.log('✅ Database connection closed');
    }
}

// Export database instance
export { db };
