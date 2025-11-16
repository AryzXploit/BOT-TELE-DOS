import http from 'http';
import https from 'https';
import { URL } from 'url';
import { logger } from './logger.js';
import chalk from 'chalk';

/**
 * Target Health Monitor
 * Check if target is still up or down with Gen Z style output 🔥
 */
export class TargetMonitor {
    constructor(target) {
        this.target = target;
        this.isDown = false;
        this.consecutiveFailures = 0;
        this.consecutiveSuccess = 0;
        this.totalChecks = 0;
        this.downTime = null;
        this.upTime = null;
        this.lastStatus = null;
    }

    /**
     * Check if target is alive
     */
    async checkHealth() {
        try {
            this.totalChecks++;
            
            let url;
            try {
                if (!this.target.includes('://')) {
                    url = new URL(`http://${this.target}`);
                } else {
                    url = new URL(this.target);
                }
            } catch (err) {
                // If not a URL, might be IP:PORT
                return await this.checkSocket(this.target);
            }

            const startTime = Date.now();
            const isAlive = await this.makeRequest(url);
            const responseTime = Date.now() - startTime;

            if (isAlive) {
                this.consecutiveSuccess++;
                this.consecutiveFailures = 0;
                
                if (this.isDown) {
                    // Target came back up!
                    this.isDown = false;
                    this.upTime = new Date();
                    this.printTargetUp(responseTime);
                } else {
                    this.printTargetAlive(responseTime);
                }
                
                this.lastStatus = 'UP';
                return { status: 'UP', responseTime, isAlive: true };
            } else {
                this.consecutiveFailures++;
                this.consecutiveSuccess = 0;
                
                // Require 5 consecutive failures to declare DOWN (more strict)
                if (!this.isDown && this.consecutiveFailures >= 5) {
                    // Target is down!
                    this.isDown = true;
                    this.downTime = new Date();
                    this.printTargetDown();
                } else if (!this.isDown) {
                    this.printTargetSlow();
                } else {
                    this.printTargetStillDown();
                }
                
                this.lastStatus = 'DOWN';
                return { status: 'DOWN', responseTime: null, isAlive: false };
            }
        } catch (err) {
            logger.debug(`Health check error: ${err.message}`);
            this.consecutiveFailures++;
            
            // Require 5 consecutive failures (more strict)
            if (!this.isDown && this.consecutiveFailures >= 5) {
                this.isDown = true;
                this.downTime = new Date();
                this.printTargetDown();
            }
            
            return { status: 'DOWN', responseTime: null, isAlive: false };
        }
    }

    /**
     * Make HTTP request to check health
     */
    async makeRequest(url) {
        return new Promise((resolve) => {
            const protocol = url.protocol === 'https:' ? https : http;
            
            const options = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname || '/',
                method: 'HEAD',
                timeout: 5000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            };

            const req = protocol.request(options, (res) => {
                // Accept any response (even 4xx) as UP
                // Only 5xx or no response = DOWN
                const isUp = res.statusCode >= 200 && res.statusCode < 600;
                resolve(isUp);
            });

            req.on('error', (err) => {
                // Network errors = DOWN
                logger.debug(`Request error: ${err.code}`);
                resolve(false);
            });
                
            req.on('timeout', () => {
                req.destroy();
                resolve(false);
            });

            req.end();
        });
    }

    /**
     * Check socket connection for IP:PORT
     */
    async checkSocket(target) {
        return new Promise((resolve) => {
            try {
                const [host, port] = target.includes(':') 
                    ? target.split(':') 
                    : [target, 80];

                const net = require('net');
                const socket = new net.Socket();
                
                socket.setTimeout(5000);
                
                socket.connect(parseInt(port), host, () => {
                    socket.destroy();
                    resolve(true);
                });

                socket.on('error', () => {
                    socket.destroy();
                    resolve(false);
                });

                socket.on('timeout', () => {
                    socket.destroy();
                    resolve(false);
                });
            } catch (err) {
                resolve(false);
            }
        });
    }

    /**
     * Print target is alive (Gen Z style) 🔥
     */
    printTargetAlive(responseTime) {
        const emojis = ['💪', '🔥', '💀', '⚡', '🎯', '👊'];
        const messages = [
            'Target masih ngeyel cuy',
            'Belum mati nih target',
            'Masih kuat ternyata',
            'Target masih hidup bro',
            'Belum down nih, gas terus!',
            'Target masih standing strong'
        ];
        
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        const msg = messages[Math.floor(Math.random() * messages.length)];
        
        console.log(
            chalk.yellow(`\n${emoji} ${chalk.bold(msg)}\n`) +
            chalk.gray(`   Response Time: ${responseTime}ms\n`) +
            chalk.gray(`   Status: `) + chalk.green('🟢 ALIVE') +
            chalk.gray(` | Checks: ${this.totalChecks}\n`)
        );
    }

    /**
     * Print target is down (Gen Z style) 💀
     */
    printTargetDown() {
        const art = `
╔═══════════════════════════════════════╗
║                                       ║
║     💀 TARGET DOWN! 💀               ║
║                                       ║
║     ░██████╗░░██████╗                ║
║     ██╔════╝░██╔════╝                ║
║     ██║░░██╗░██║░░██╗                ║
║     ██║░░╚██╗██║░░╚██╗               ║
║     ╚██████╔╝╚██████╔╝               ║
║     ░╚═════╝░░╚═════╝░               ║
║                                       ║
║   🔥 SHEESH TARGET MATI! 🔥          ║
║                                       ║
╚═══════════════════════════════════════╝
`;
        
        console.log(chalk.red.bold(art));
        console.log(
            chalk.red.bold(`   💀 BUSETT TARGET DOWN COK!\n`) +
            chalk.yellow(`   🎯 Target: ${this.target}\n`) +
            chalk.red(`   ⚰️  Status: `) + chalk.red.bold('🔴 DOWN/OFFLINE') + '\n' +
            chalk.gray(`   ⏰ Down Time: ${this.downTime.toLocaleTimeString()}\n`) +
            chalk.gray(`   📊 Failed Checks: ${this.consecutiveFailures}\n`) +
            chalk.green.bold(`\n   ✅ GG EZ! TARGET BERHASIL DI-DOWN! 🔥\n`)
        );
    }

    /**
     * Print target came back up
     */
    printTargetUp(responseTime) {
        console.log(
            chalk.cyan.bold(`\n⚠️  ANJIR TARGET HIDUP LAGI!\n`) +
            chalk.yellow(`   🎯 Target: ${this.target}\n`) +
            chalk.green(`   Status: `) + chalk.green.bold('🟢 BACK ONLINE') + '\n' +
            chalk.gray(`   Response Time: ${responseTime}ms\n`) +
            chalk.gray(`   Up Time: ${this.upTime.toLocaleTimeString()}\n`) +
            chalk.yellow.bold(`\n   💪 Target recovered, gas lagi bro!\n`)
        );
    }

    /**
     * Print target is slow
     */
    printTargetSlow() {
        const emojis = ['🐌', '😴', '💤', '🥱'];
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        
        console.log(
            chalk.yellow(`\n${emoji} ${chalk.bold('Target lagi lemot nih')}\n`) +
            chalk.gray(`   Failed attempts: ${this.consecutiveFailures}/5\n`) +
            chalk.yellow(`   Status: `) + chalk.yellow('🟡 STRUGGLING') + '\n'
        );
    }

    /**
     * Print target still down
     */
    printTargetStillDown() {
        const emojis = ['💀', '⚰️', '🪦', '☠️'];
        const messages = [
            'Target masih mati cuy',
            'Masih down nih, mantap!',
            'Target masih KO',
            'Masih offline bro, sukses!',
            'Target masih RIP 💀'
        ];
        
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        const msg = messages[Math.floor(Math.random() * messages.length)];
        
        const downDuration = Math.floor((Date.now() - this.downTime.getTime()) / 1000);
        
        console.log(
            chalk.red(`\n${emoji} ${chalk.bold(msg)}\n`) +
            chalk.gray(`   Status: `) + chalk.red.bold('🔴 STILL DOWN') + '\n' +
            chalk.gray(`   Down for: ${downDuration}s\n`) +
            chalk.gray(`   Failed checks: ${this.consecutiveFailures}\n`)
        );
    }

    /**
     * Get current status
     */
    getStatus() {
        return {
            isDown: this.isDown,
            lastStatus: this.lastStatus,
            consecutiveFailures: this.consecutiveFailures,
            consecutiveSuccess: this.consecutiveSuccess,
            totalChecks: this.totalChecks,
            downTime: this.downTime,
            upTime: this.upTime
        };
    }

    /**
     * Print final summary
     */
    printSummary() {
        const totalTime = this.downTime 
            ? Math.floor((Date.now() - this.downTime.getTime()) / 1000)
            : 0;

        console.log(chalk.cyan.bold('\n╔═══════════════════════════════════════╗'));
        console.log(chalk.cyan.bold('║     📊 MONITORING SUMMARY 📊         ║'));
        console.log(chalk.cyan.bold('╚═══════════════════════════════════════╝\n'));
        
        console.log(chalk.white(`🎯 Target: ${chalk.yellow(this.target)}`));
        console.log(chalk.white(`📊 Total Checks: ${chalk.yellow(this.totalChecks)}`));
        console.log(chalk.white(`✅ Success: ${chalk.green(this.consecutiveSuccess)}`));
        console.log(chalk.white(`❌ Failures: ${chalk.red(this.consecutiveFailures)}`));
        
        if (this.isDown) {
            console.log(chalk.white(`\n💀 Final Status: ${chalk.red.bold('🔴 DOWN')}`));
            console.log(chalk.white(`⏰ Down Duration: ${chalk.red(totalTime + 's')}`));
            console.log(chalk.green.bold(`\n🔥 GG! TARGET BERHASIL DI-DOWN! 🔥\n`));
        } else {
            console.log(chalk.white(`\n💪 Final Status: ${chalk.green.bold('🟢 STILL UP')}`));
            console.log(chalk.yellow.bold(`\n⚠️  Target masih kuat, perlu attack lebih gede!\n`));
        }
    }
}

/**
 * Start monitoring target during attack
 */
export async function startMonitoring(target, intervalSeconds = 10) {
    const monitor = new TargetMonitor(target);
    
    console.log(chalk.cyan.bold('\n╔═══════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║   🎯 TARGET MONITORING STARTED 🎯   ║'));
    console.log(chalk.cyan.bold('╚═══════════════════════════════════════╝\n'));
    console.log(chalk.yellow(`Target: ${target}`));
    console.log(chalk.gray(`Check interval: ${intervalSeconds}s\n`));
    
    // Initial check
    await monitor.checkHealth();
    
    // Start interval checking
    const interval = setInterval(async () => {
        await monitor.checkHealth();
    }, intervalSeconds * 1000);
    
    // Return monitor and interval for cleanup
    return { monitor, interval };
}
