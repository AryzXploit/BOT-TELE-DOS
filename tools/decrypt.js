#!/usr/bin/env node

/**
 * 🔓 ARYZZ-DEV DECRYPTION TOOL
 * Decrypt encrypted source code
 * ONLY FOR ARYZZ-DEV USE
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// 🔐 DECRYPTION CONFIG - MATCH ENCRYPT.JS
// ============================================
const MASTER_KEY = 'ARYZZ-DEV-MASTER-KEY-2024-ULTRA-SECURE-ENCRYPTION';
const KEY_DERIVATION_ITERATIONS = 100000;

// Admin password for decryption (ONLY ARYZZ-DEV KNOWS THIS)
const ADMIN_PASSWORD = 'AryzXploit2024Admin!Decrypt';

/**
 * Generate decryption key from master key
 */
function generateKey(salt) {
    return crypto.pbkdf2Sync(
        MASTER_KEY,
        salt,
        KEY_DERIVATION_ITERATIONS,
        32,
        'sha512'
    );
}

/**
 * Verify admin password
 */
async function verifyAdmin() {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log(chalk.bold.red('\n╔═══════════════════════════════════════════════════════════╗'));
        console.log(chalk.bold.red('║') + chalk.bold.yellow('           ⚠️  ADMIN ACCESS REQUIRED ⚠️               ') + chalk.bold.red('║'));
        console.log(chalk.bold.red('╚═══════════════════════════════════════════════════════════╝'));
        console.log(chalk.gray('  This tool is for Aryzz-Dev ONLY'));
        console.log(chalk.gray('  Unauthorized access will be logged\n'));

        rl.question(chalk.bold.white('🔑 Enter admin password: '), (password) => {
            rl.close();
            
            if (password === ADMIN_PASSWORD) {
                console.log(chalk.green('\n✅ Admin authenticated!\n'));
                resolve(true);
            } else {
                console.log(chalk.red('\n❌ Invalid admin password!\n'));
                console.log(chalk.yellow('⚠️  Unauthorized access attempt logged!'));
                console.log(chalk.gray(`   Timestamp: ${new Date().toISOString()}`));
                console.log(chalk.gray(`   IP: ${require('os').networkInterfaces().eth0?.[0]?.address || 'unknown'}\n`));
                process.exit(1);
            }
        });
    });
}

/**
 * Decrypt a file
 */
function decryptFile(inputPath, outputPath) {
    try {
        console.log(chalk.cyan(`\n🔓 Decrypting: ${chalk.yellow(inputPath)}`));
        
        // Read encrypted file
        const encryptedPackage = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
        
        // Verify watermark
        if (!encryptedPackage.watermark || encryptedPackage.watermark.signature !== 'ARYZZ-DEV-ENCRYPTED-SOURCE-CODE') {
            throw new Error('Invalid watermark - not an Aryzz-Dev encrypted file');
        }
        
        console.log(chalk.gray(`   Encrypted by: ${encryptedPackage.watermark.author}`));
        console.log(chalk.gray(`   Tool: ${encryptedPackage.watermark.tool} v${encryptedPackage.watermark.version}`));
        console.log(chalk.gray(`   Date: ${new Date(encryptedPackage.watermark.timestamp).toISOString()}`));
        
        // Extract encryption data
        const salt = Buffer.from(encryptedPackage.salt, 'hex');
        const iv = Buffer.from(encryptedPackage.iv, 'hex');
        const authTag = Buffer.from(encryptedPackage.authTag, 'hex');
        const encrypted = encryptedPackage.data;
        
        // Verify checksum
        const checksum = crypto.createHash('sha256').update(encrypted).digest('hex');
        if (checksum !== encryptedPackage.checksum) {
            throw new Error('Checksum mismatch - file may be corrupted');
        }
        
        // Derive key
        const key = generateKey(salt);
        
        // Create decipher
        const decipher = crypto.createDecipheriv(encryptedPackage.algorithm, key, iv);
        decipher.setAuthTag(authTag);
        
        // Decrypt
        let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
        decrypted += decipher.final('utf-8');
        
        // Write decrypted file
        fs.writeFileSync(outputPath, decrypted);
        
        console.log(chalk.green(`✅ Decrypted successfully!`));
        console.log(chalk.gray(`   Output: ${outputPath}\n`));
        
        return true;
    } catch (error) {
        console.log(chalk.red(`❌ Decryption failed: ${error.message}\n`));
        return false;
    }
}

/**
 * Decrypt entire directory
 */
function decryptDirectory(inputDir, outputDir) {
    try {
        console.log(chalk.bold.cyan('\n╔═══════════════════════════════════════════════════════════╗'));
        console.log(chalk.bold.cyan('║') + chalk.bold.yellow('        🔓 ARYZZ-DEV SOURCE CODE DECRYPTION 🔓        ') + chalk.bold.cyan('║'));
        console.log(chalk.bold.cyan('╚═══════════════════════════════════════════════════════════╝\n'));
        
        // Create output directory
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        let decrypted = 0;
        let failed = 0;
        
        // Walk through directory
        function walkDir(dir, baseDir) {
            const files = fs.readdirSync(dir);
            
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                
                if (stat.isDirectory()) {
                    // Create output subdirectory
                    const relPath = path.relative(baseDir, filePath);
                    const outSubDir = path.join(outputDir, relPath);
                    if (!fs.existsSync(outSubDir)) {
                        fs.mkdirSync(outSubDir, { recursive: true });
                    }
                    
                    // Recurse
                    walkDir(filePath, baseDir);
                } else {
                    // Check if file is encrypted
                    if (file.endsWith('.encrypted')) {
                        const relPath = path.relative(baseDir, filePath);
                        const outPath = path.join(outputDir, relPath.replace('.encrypted', ''));
                        
                        if (decryptFile(filePath, outPath)) {
                            decrypted++;
                        } else {
                            failed++;
                        }
                    }
                }
            }
        }
        
        walkDir(inputDir, inputDir);
        
        console.log(chalk.bold.green('\n╔═══════════════════════════════════════════════════════════╗'));
        console.log(chalk.bold.green('║') + chalk.bold.white(`           ✅ DECRYPTION COMPLETED!                  `) + chalk.bold.green('║'));
        console.log(chalk.bold.green('╚═══════════════════════════════════════════════════════════╝'));
        console.log(chalk.yellow(`  📊 Decrypted: ${decrypted} files`));
        console.log(chalk.red(`  ❌ Failed: ${failed} files`));
        console.log(chalk.gray(`  📁 Output directory: ${outputDir}\n`));
        
    } catch (error) {
        console.log(chalk.red(`\n❌ Directory decryption failed: ${error.message}\n`));
    }
}

/**
 * Main
 */
(async () => {
    // Verify admin access
    await verifyAdmin();
    
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log(chalk.white('\nUsage:'));
        console.log(chalk.yellow('  node tools/decrypt.js <input> <output>'));
        console.log(chalk.gray('\nExamples:'));
        console.log(chalk.gray('  # Decrypt single file'));
        console.log(chalk.cyan('  node tools/decrypt.js index.js.encrypted index.js'));
        console.log(chalk.gray('\n  # Decrypt entire directory'));
        console.log(chalk.cyan('  node tools/decrypt.js ./encrypted-src ./src\n'));
        process.exit(1);
    }

    const input = path.resolve(args[0]);
    const output = path.resolve(args[1]);

    // Check if input exists
    if (!fs.existsSync(input)) {
        console.log(chalk.red(`\n❌ Input not found: ${input}\n`));
        process.exit(1);
    }

    // Check if input is file or directory
    const stat = fs.statSync(input);

    if (stat.isFile()) {
        // Decrypt single file
        decryptFile(input, output);
    } else if (stat.isDirectory()) {
        // Decrypt directory
        decryptDirectory(input, output);
    } else {
        console.log(chalk.red(`\n❌ Invalid input type\n`));
        process.exit(1);
    }
})();
