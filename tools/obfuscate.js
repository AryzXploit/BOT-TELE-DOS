#!/usr/bin/env node

/**
 * 🔐 ARYZZ-DEV OBFUSCATION TOOL
 * Obfuscate source code to prevent reading and unauthorized use
 * Files remain as .js and can be executed normally
 */

import JavaScriptObfuscator from 'javascript-obfuscator';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// 🔐 OBFUSCATION CONFIG
// ============================================
const OBFUSCATION_OPTIONS = {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 1,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 1,
    debugProtection: true,
    debugProtectionInterval: 4000,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    renameGlobals: false,
    selfDefending: true,
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 5,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayCallsTransformThreshold: 1,
    stringArrayEncoding: ['rc4'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 5,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 5,
    stringArrayWrappersType: 'function',
    stringArrayThreshold: 1,
    transformObjectKeys: true,
    unicodeEscapeSequence: false
};

// Watermark comment
const WATERMARK = `/**
 * 🔐 ARYZZ-STRESSER v4.0 - PROTECTED
 * 
 * This code has been obfuscated by Aryzz-Dev
 * Unauthorized modification or redistribution is prohibited
 * 
 * Developer: Aryzz-Dev (@AryzXploit)
 * GitHub: https://github.com/AryzXploit
 * 
 * © 2024 Aryzz-Dev. All rights reserved.
 * 
 * DO NOT:
 * - Attempt to deobfuscate
 * - Remove this header
 * - Rename or rebrand
 * - Resell without permission
 */

`;

/**
 * Obfuscate a single file
 */
function obfuscateFile(inputPath, outputPath) {
    try {
        console.log(chalk.cyan(`🔒 Obfuscating: ${chalk.yellow(path.basename(inputPath))}`));
        
        // Read source file
        const sourceCode = fs.readFileSync(inputPath, 'utf-8');
        
        // Obfuscate
        const obfuscationResult = JavaScriptObfuscator.obfuscate(sourceCode, OBFUSCATION_OPTIONS);
        const obfuscatedCode = obfuscationResult.getObfuscatedCode();
        
        // Add watermark
        const finalCode = WATERMARK + obfuscatedCode;
        
        // Write obfuscated file
        fs.writeFileSync(outputPath, finalCode, 'utf-8');
        
        const originalSize = (sourceCode.length / 1024).toFixed(2);
        const obfuscatedSize = (finalCode.length / 1024).toFixed(2);
        const increase = ((finalCode.length / sourceCode.length - 1) * 100).toFixed(0);
        
        console.log(chalk.green(`   ✅ Success! ${originalSize}KB → ${obfuscatedSize}KB (+${increase}%)\n`));
        
        return true;
    } catch (error) {
        console.log(chalk.red(`   ❌ Failed: ${error.message}\n`));
        return false;
    }
}

/**
 * Obfuscate entire directory
 */
function obfuscateDirectory(inputDir, outputDir, createZip = true) {
    try {
        console.log(chalk.bold.cyan('\n╔═══════════════════════════════════════════════════════════╗'));
        console.log(chalk.bold.cyan('║') + chalk.bold.yellow('        🔐 ARYZZ-DEV CODE OBFUSCATION 🔐          ') + chalk.bold.cyan('║'));
        console.log(chalk.bold.cyan('╚═══════════════════════════════════════════════════════════╝'));
        console.log(chalk.gray('  Making source code unreadable while keeping it executable'));
        console.log(chalk.gray('  Files remain as .js and work with node/npm\n'));
        
        // Create output directory
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        let obfuscated = 0;
        let failed = 0;
        let copied = 0;
        
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
                    
                    // Obfuscate .js files
                    if (ext === '.js') {
                        const outPath = path.join(outputDir, relPath);
                        const outDir = path.dirname(outPath);
                        
                        if (!fs.existsSync(outDir)) {
                            fs.mkdirSync(outDir, { recursive: true });
                        }
                        
                        if (obfuscateFile(filePath, outPath)) {
                            obfuscated++;
                        } else {
                            failed++;
                        }
                    } 
                    // Copy other important files
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
                        copied++;
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
            
            console.log(chalk.cyan('📁 Copying files directory...\n'));
            execSync(`cp -r "${filesDir}"/* "${outFilesDir}/" 2>/dev/null || true`);
        }
        
        console.log(chalk.bold.green('╔═══════════════════════════════════════════════════════════╗'));
        console.log(chalk.bold.green('║') + chalk.bold.white(`           ✅ OBFUSCATION COMPLETED!                `) + chalk.bold.green('║'));
        console.log(chalk.bold.green('╚═══════════════════════════════════════════════════════════╝'));
        console.log(chalk.yellow(`  🔒 Obfuscated: ${obfuscated} JS files`));
        console.log(chalk.cyan(`  📄 Copied: ${copied} config files`));
        console.log(chalk.red(`  ❌ Failed: ${failed} files`));
        console.log(chalk.gray(`  📁 Output: ${outputDir}`));
        
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
        
        console.log(chalk.bold.cyan(`\n  👨‍💻 Obfuscated by: Aryzz-Dev`));
        console.log(chalk.gray(`  🔐 Protection: Unreadable but executable`));
        console.log(chalk.gray(`  ✅ Files can run with: node index.js or npm start\n`));
        
        return { obfuscated, failed, copied };
        
    } catch (error) {
        console.log(chalk.red(`\n❌ Obfuscation failed: ${error.message}\n`));
        return null;
    }
}

/**
 * Main
 */
const args = process.argv.slice(2);

if (args.length < 1) {
    console.log(chalk.bold.cyan('\n╔═══════════════════════════════════════════════════════════╗'));
    console.log(chalk.bold.cyan('║') + chalk.bold.yellow('        🔐 ARYZZ-DEV OBFUSCATION TOOL 🔐          ') + chalk.bold.cyan('║'));
    console.log(chalk.bold.cyan('╚═══════════════════════════════════════════════════════════╝'));
    console.log(chalk.white('\nUsage:'));
    console.log(chalk.yellow('  node tools/obfuscate.js <output-name>'));
    console.log(chalk.gray('\nExamples:'));
    console.log(chalk.gray('  # Obfuscate current project'));
    console.log(chalk.cyan('  node tools/obfuscate.js aryzz-stresser-obfuscated'));
    console.log(chalk.gray('  Output: ../aryzz-stresser-obfuscated/ + .zip\n'));
    console.log(chalk.gray('  # Obfuscate with custom path'));
    console.log(chalk.cyan('  node tools/obfuscate.js ~/Desktop/aryzz-stresser-v4'));
    console.log(chalk.gray('  Output: ~/Desktop/aryzz-stresser-v4/ + .zip\n'));
    console.log(chalk.bold.yellow('Features:'));
    console.log(chalk.gray('  ✓ Obfuscates all .js files (unreadable)'));
    console.log(chalk.gray('  ✓ Files remain as .js (can be executed)'));
    console.log(chalk.gray('  ✓ Works with node index.js & npm start'));
    console.log(chalk.gray('  ✓ Copies config files (.json, .txt, etc)'));
    console.log(chalk.gray('  ✓ Copies files/ directory'));
    console.log(chalk.gray('  ✓ Keeps only README.md (other .md excluded)'));
    console.log(chalk.gray('  ✓ Auto-creates .zip archive'));
    console.log(chalk.gray('  ✓ Skips node_modules, logs, tools, docs\n'));
    console.log(chalk.bold.yellow('Protection Level:'));
    console.log(chalk.gray('  🔒 Control flow flattening'));
    console.log(chalk.gray('  🔒 Dead code injection'));
    console.log(chalk.gray('  🔒 String array encoding (RC4)'));
    console.log(chalk.gray('  🔒 Self-defending code'));
    console.log(chalk.gray('  🔒 Debug protection'));
    console.log(chalk.gray('  🔒 Identifier renaming'));
    console.log(chalk.gray('  🔒 Extremely difficult to reverse!\n'));
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

// Check if input is directory
const stat = fs.statSync(input);

if (stat.isDirectory()) {
    // Obfuscate directory
    obfuscateDirectory(input, output);
} else {
    console.log(chalk.red(`\n❌ Input must be a directory\n`));
    process.exit(1);
}
