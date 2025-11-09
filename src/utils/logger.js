import chalk from 'chalk';
import { appendFileSync, mkdirSync, existsSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';

/**
 * Custom logger with colors and file logging
 */
export class Logger {
    constructor(level = 'INFO', logDir = './logs') {
        this.level = level;
        this.logDir = logDir;
        this.levels = {
            'DEBUG': 0,
            'INFO': 1,
            'WARNING': 2,
            'ERROR': 3
        };
        
        // Create logs directory if it doesn't exist
        this.ensureLogDir();
        
        // Clean old logs (keep only last 30 days)
        this.cleanOldLogs();
    }

    ensureLogDir() {
        try {
            if (!existsSync(this.logDir)) {
                mkdirSync(this.logDir, { recursive: true });
            }
        } catch (error) {
            console.error('Failed to create log directory:', error);
        }
    }

    cleanOldLogs() {
        try {
            if (!existsSync(this.logDir)) return;
            
            const files = readdirSync(this.logDir);
            const now = Date.now();
            const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
            
            files.forEach(file => {
                const filePath = join(this.logDir, file);
                const stats = statSync(filePath);
                
                if (now - stats.mtime.getTime() > maxAge) {
                    unlinkSync(filePath);
                    console.log(`Deleted old log file: ${file}`);
                }
            });
        } catch (error) {
            console.error('Failed to clean old logs:', error);
        }
    }

    getLogFileName(type = 'general') {
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        return join(this.logDir, `${type}-${date}.log`);
    }

    writeToFile(logFile, message) {
        try {
            appendFileSync(logFile, message + '\n', 'utf-8');
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    setLevel(level) {
        this.level = level.toUpperCase();
    }

    _shouldLog(level) {
        return this.levels[level] >= this.levels[this.level];
    }

    _format(level, ...messages) {
        const timestamp = new Date().toISOString();
        const message = messages.map(m => {
            if (m instanceof Error) {
                return `${m.message}\n${m.stack}`;
            }
            return typeof m === 'object' ? JSON.stringify(m, null, 2) : m;
        }).join(' ');
        return `[${timestamp}] [${level}] ${message}`;
    }

    _formatConsole(level, ...messages) {
        const timestamp = new Date().toLocaleTimeString();
        const message = messages.map(m => {
            if (m instanceof Error) {
                return `${m.message}`;
            }
            return typeof m === 'object' ? JSON.stringify(m) : m;
        }).join(' ');
        return `[${timestamp}] [${level}] ${message}`;
    }

    debug(...messages) {
        if (this._shouldLog('DEBUG')) {
            const formatted = this._formatConsole('DEBUG', ...messages);
            const fileFormatted = this._format('DEBUG', ...messages);
            
            console.log(chalk.gray(formatted));
            this.writeToFile(this.getLogFileName('general'), fileFormatted);
        }
    }

    info(...messages) {
        if (this._shouldLog('INFO')) {
            const formatted = this._formatConsole('INFO', ...messages);
            const fileFormatted = this._format('INFO', ...messages);
            
            console.log(chalk.blue(formatted));
            this.writeToFile(this.getLogFileName('general'), fileFormatted);
        }
    }

    warning(...messages) {
        if (this._shouldLog('WARNING')) {
            const formatted = this._formatConsole('WARNING', ...messages);
            const fileFormatted = this._format('WARNING', ...messages);
            
            console.log(chalk.yellow(formatted));
            this.writeToFile(this.getLogFileName('general'), fileFormatted);
            this.writeToFile(this.getLogFileName('warnings'), fileFormatted);
        }
    }

    error(...messages) {
        if (this._shouldLog('ERROR')) {
            const formatted = this._formatConsole('ERROR', ...messages);
            const fileFormatted = this._format('ERROR', ...messages);
            
            console.log(chalk.red(formatted));
            this.writeToFile(this.getLogFileName('general'), fileFormatted);
            this.writeToFile(this.getLogFileName('errors'), fileFormatted);
        }
    }

    success(...messages) {
        if (this._shouldLog('INFO')) {
            const formatted = this._formatConsole('SUCCESS', ...messages);
            const fileFormatted = this._format('SUCCESS', ...messages);
            
            console.log(chalk.green(formatted));
            this.writeToFile(this.getLogFileName('general'), fileFormatted);
        }
    }

    // Special method for bot logs
    bot(...messages) {
        if (this._shouldLog('INFO')) {
            const formatted = this._formatConsole('BOT', ...messages);
            const fileFormatted = this._format('BOT', ...messages);
            
            console.log(chalk.cyan(formatted));
            this.writeToFile(this.getLogFileName('general'), fileFormatted);
            this.writeToFile(this.getLogFileName('bot'), fileFormatted);
        }
    }

    // Special method for attack logs
    attack(...messages) {
        if (this._shouldLog('INFO')) {
            const formatted = this._formatConsole('ATTACK', ...messages);
            const fileFormatted = this._format('ATTACK', ...messages);
            
            console.log(chalk.magenta(formatted));
            this.writeToFile(this.getLogFileName('general'), fileFormatted);
            this.writeToFile(this.getLogFileName('attacks'), fileFormatted);
        }
    }
}

export const logger = new Logger();
