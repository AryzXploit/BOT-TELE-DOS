#!/usr/bin/env node

/**
 * 🔐 ARYZZ-DEV ENCRYPTION TOOL
 * Encrypt source code to prevent renaming and unauthorized use
 * Only Aryzz-Dev can decrypt
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// 🔐 ENCRYPTION CONFIG - DO NOT MODIFY
// ============================================
const MASTER_KEY = 'ARYZZ-DEV-MASTER-KEY-2024-ULTRA-SECURE-ENCRYPTION';
const ENCRYPTION_ALGO = 'aes-256-gcm';
const KEY_DERIVATION_ITERATIONS = 100000;
const SALT_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Watermark to prevent renaming
const WATERMARK = {
    author: 'Aryzz-Dev',
    github: 'https://github.com/AryzXploit',
    tool: 'Aryzz-Stresser',
    version: '4.0',
    timestamp: Date.now(),
    signature: 'ARYZZ-DEV-ENCRYPTED-SOURCE-CODE'
};

/**
 * Generate encryption key from master key
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
 * Encrypt a file
 */
function encryptFile(inputPath, outputPath) {
    try {
        console.log(chalk.cyan(`\n🔒 Encrypting: ${chalk.yellow(inputPath)}`));
        
        // Read source file
        const sourceCode = fs.readFileSync(inputPath, 'utf-8');
        
        // Generate salt and IV
        const salt = crypto.randomBytes(SALT_LENGTH);
        const iv = crypto.randomBytes(IV_LENGTH);
        
        // Derive key
        const key = generateKey(salt);
        
        // Add watermark to source
        const watermarkedSource = `/*\n * ${WATERMARK.signature}\n * Author: ${WATERMARK.author}\n * Tool: ${WATERMARK.tool} v${WATERMARK.version}\n * GitHub: ${WATERMARK.github}\n * Encrypted: ${new Date(WATERMARK.timestamp).toISOString()}\n * DO NOT RENAME OR MODIFY\n */\n\n` + sourceCode;
        
        // Create cipher
        const cipher = crypto.createCipheriv(ENCRYPTION_ALGO, key, iv);
        
        // Encrypt
        let encrypted = cipher.update(watermarkedSource, 'utf-8', 'hex');
        encrypted += cipher.final('hex');
        
        // Get auth tag
        const authTag = cipher.getAuthTag();
        
        // Create encrypted package
        const encryptedPackage = {
            version: '1.0',
            algorithm: ENCRYPTION_ALGO,
            watermark: WATERMARK,
            salt: salt.toString('hex'),
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex'),
            data: encrypted,
            checksum: crypto.createHash('sha256').update(encrypted).digest('hex')
        };
        
        // Write encrypted file
        fs.writeFileSync(outputPath, JSON.stringify(encryptedPackage, null, 2));
        
        console.log(chalk.green(`✅ Encrypted successfully!`));
        console.log(chalk.gray(`   Output: ${outputPath}`));
        console.log(chalk.gray(`   Size: ${sourceCode.length} → ${encrypted.length} bytes\n`));
        
        return true;
    } catch (error) {
        console.log(chalk.red(`❌ Encryption failed: ${error.message}\n`));
        return false;
    }
}

/**
 * Encrypt entire directory
 */
function encryptDirectory(inputDir, outputDir, extensions = ['.js'], createZip = true) {
    try {
        console.log(chalk.bold.cyan('\n╔═══════════════════════════════════════════════════════════╗'));
        console.log(chalk.bold.cyan('║') + chalk.bold.yellow('        🔐 ARYZZ-DEV SOURCE CODE ENCRYPTION 🔐        ') + chalk.bold.cyan('║'));
        console.log(chalk.bold.cyan('╚═══════════════════════════════════════════════════════════╝'));
        console.log(chalk.gray('  Encrypting source code to prevent unauthorized use'));
        console.log(chalk.gray('  Only Aryzz-Dev can decrypt this code\n'));
        
        // Create output directory
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        let encrypted = 0;
        let failed = 0;
        let copiedFiles = 0;
        
        // Walk through directory
        function walkDir(dir, baseDir) {
            const files = fs.readdirSync(dir);
            
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                
                if (stat.isDirectory()) {
                    // Skip node_modules, hidden directories, tools, logs, docs
                    if (file === 'node_modules' || file.startsWith('.') || file === 'tools' || file === 'logs' || file === 'docs') {
                        continue;
                    }
                    
                    // Create output subdirectory
                    const relPath = path.relative(baseDir, filePath);
                    const outSubDir = path.join(outputDir, relPath);
                    if (!fs.existsSync(outSubDir)) {
                        fs.mkdirSync(outSubDir, { recursive: true });
                    }
                    
                    // Recurse
                    walkDir(filePath, baseDir);
                } else {
                    const ext = path.extname(file);
                    const relPath = path.relative(baseDir, filePath);
                    
                    // Encrypt .js files
                    if (extensions.includes(ext)) {
                        const outPath = path.join(outputDir, relPath + '.encrypted');
                        
                        if (encryptFile(filePath, outPath)) {
                            encrypted++;
                        } else {
                            failed++;
                        }
                    } 
                    // Copy important non-JS files
                    else if (['.json', '.txt', '.sh', '.example', '.md'].includes(ext) || file === 'Dockerfile' || file === 'docker-compose.yml' || file === 'LICENSE') {
                        // Skip .md files except README.md
                        if (ext === '.md' && file !== 'README.md') {
                            continue;
                        }
                        
                        const outPath = path.join(outputDir, relPath);
                        const outDir = path.dirname(outPath);
                        
                        if (!fs.existsSync(outDir)) {
                            fs.mkdirSync(outDir, { recursive: true });
                        }
                        
                        fs.copyFileSync(filePath, outPath);
                        copiedFiles++;
                    }
                }
            }
        }
        
        walkDir(inputDir, inputDir);
        
        // Copy files directory if exists
        const filesDir = path.join(inputDir, 'files');
        if (fs.existsSync(filesDir)) {
            const outFilesDir = path.join(outputDir, 'files');
            if (!fs.existsSync(outFilesDir)) {
                fs.mkdirSync(outFilesDir, { recursive: true });
            }
            
            console.log(chalk.cyan('\n📁 Copying files directory...'));
            execSync(`cp -r "${filesDir}"/* "${outFilesDir}/" 2>/dev/null || true`);
        }
        
        console.log(chalk.bold.green('\n╔═══════════════════════════════════════════════════════════╗'));
        console.log(chalk.bold.green('║') + chalk.bold.white(`           ✅ ENCRYPTION COMPLETED!                  `) + chalk.bold.green('║'));
        console.log(chalk.bold.green('╚═══════════════════════════════════════════════════════════╝'));
        console.log(chalk.yellow(`  🔒 Encrypted: ${encrypted} JS files`));
        console.log(chalk.cyan(`  📄 Copied: ${copiedFiles} config files`));
        console.log(chalk.red(`  ❌ Failed: ${failed} files`));
        console.log(chalk.gray(`  📁 Output directory: ${outputDir}`));
        
        // Create ZIP archive
        if (createZip) {
            console.log(chalk.cyan('\n📦 Creating ZIP archive...'));
            const zipName = path.basename(outputDir) + '.zip';
            const zipPath = path.join(path.dirname(outputDir), zipName);
            
            try {
                // Remove old zip if exists
                if (fs.existsSync(zipPath)) {
                    fs.unlinkSync(zipPath);
                }
                
                // Create zip
                execSync(`cd "${path.dirname(outputDir)}" && zip -r "${zipName}" "${path.basename(outputDir)}" -q`);
                
                const zipSize = (fs.statSync(zipPath).size / 1024 / 1024).toFixed(2);
                
                console.log(chalk.bold.green('\n📦 ZIP ARCHIVE CREATED!'));
                console.log(chalk.yellow(`  📦 File: ${zipPath}`));
                console.log(chalk.gray(`  💾 Size: ${zipSize} MB`));
            } catch (zipError) {
                console.log(chalk.yellow(`\n⚠️  ZIP creation failed: ${zipError.message}`));
                console.log(chalk.gray('  Manual zip: zip -r output.zip ' + path.basename(outputDir)));
            }
        }
        
        console.log(chalk.bold.cyan(`\n  👨‍💻 Encrypted by: Aryzz-Dev`));
        console.log(chalk.gray(`  🔐 Algorithm: ${ENCRYPTION_ALGO.toUpperCase()}`));
        console.log(chalk.gray(`  🔑 Key derivation: PBKDF2 (${KEY_DERIVATION_ITERATIONS} iterations)\n`));
        
        return { encrypted, failed, copiedFiles };
        
    } catch (error) {
        console.log(chalk.red(`\n❌ Directory encryption failed: ${error.message}\n`));
        return null;
    }
}

/**
 * Main
 */
const args = process.argv.slice(2);

if (args.length < 1) {
    console.log(chalk.bold.cyan('\n╔═══════════════════════════════════════════════════════════╗'));
    console.log(chalk.bold.cyan('║') + chalk.bold.yellow('         🔐 ARYZZ-DEV ENCRYPTION TOOL 🔐              ') + chalk.bold.cyan('║'));
    console.log(chalk.bold.cyan('╚═══════════════════════════════════════════════════════════╝'));
    console.log(chalk.white('\nUsage:'));
    console.log(chalk.yellow('  node tools/encrypt.js <output-name>'));
    console.log(chalk.gray('\nExamples:'));
    console.log(chalk.gray('  # Encrypt current project'));
    console.log(chalk.cyan('  node tools/encrypt.js aryzz-stresser-encrypted'));
    console.log(chalk.gray('  Output: ../aryzz-stresser-encrypted/ + .zip\n'));
    console.log(chalk.gray('  # Encrypt with custom path'));
    console.log(chalk.cyan('  node tools/encrypt.js ~/Desktop/aryzz-stresser-v4'));
    console.log(chalk.gray('  Output: ~/Desktop/aryzz-stresser-v4/ + .zip\n'));
    console.log(chalk.bold.yellow('Features:'));
    console.log(chalk.gray('  ✓ Encrypts all .js files'));
    console.log(chalk.gray('  ✓ Copies config files (.json, .txt, etc)'));
    console.log(chalk.gray('  ✓ Copies files/ directory'));
    console.log(chalk.gray('  ✓ Keeps only README.md (other .md excluded)'));
    console.log(chalk.gray('  ✓ Auto-creates .zip archive'));
    console.log(chalk.gray('  ✓ Skips node_modules, logs, tools, docs\n'));
    process.exit(1);
}

// Get current directory and output name
const currentDir = process.cwd();
const outputName = args[0];

// Determine output path
let output;
if (path.isAbsolute(outputName)) {
    output = outputName;
} else {
    // Put output in parent directory
    output = path.join(path.dirname(currentDir), outputName);
}

const input = currentDir;

// Check if input exists
if (!fs.existsSync(input)) {
    console.log(chalk.red(`\n❌ Input not found: ${input}\n`));
    process.exit(1);
}

// Check if input is file or directory
const stat = fs.statSync(input);

if (stat.isFile()) {
    // Encrypt single file
    encryptFile(input, output);
} else if (stat.isDirectory()) {
    // Encrypt directory
    encryptDirectory(input, output);
} else {
    console.log(chalk.red(`\n❌ Invalid input type\n`));
    process.exit(1);
}
