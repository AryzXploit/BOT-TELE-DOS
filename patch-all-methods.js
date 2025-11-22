#!/usr/bin/env node

/**
 * Auto-Patch All Methods dengan Stats Tracking
 * Run: node patch-all-methods.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const METHODS_DIRS = [
    path.join(__dirname, 'src/methods/layer4'),
    path.join(__dirname, 'src/methods/layer7')
];

const STATS_IMPORT = `import { StatsTracker } from '../../utils/stats-tracker.js';\n`;

const STATS_INIT = `
        // Stats tracking for monitor
        this.statsTracker = new StatsTracker();
        this.stats = this.statsTracker.stats;`;

function patchFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Skip if already patched
    if (content.includes('StatsTracker') || content.includes('this.statsTracker')) {
        console.log(`⏭️  Skipped (already patched): ${path.basename(filePath)}`);
        return false;
    }
    
    // Skip index files
    if (filePath.endsWith('index.js')) {
        return false;
    }
    
    // Add import if not exists
    if (!content.includes('StatsTracker')) {
        // Find first import line
        const importMatch = content.match(/^import .+ from .+;$/m);
        if (importMatch) {
            const insertPos = content.indexOf(importMatch[0]) + importMatch[0].length;
            content = content.slice(0, insertPos) + '\n' + STATS_IMPORT + content.slice(insertPos);
            modified = true;
        }
    }
    
    // Find all class constructors
    const classRegex = /constructor\([^)]*\)\s*{/g;
    let match;
    const positions = [];
    
    while ((match = classRegex.exec(content)) !== null) {
        positions.push({
            start: match.index + match[0].length,
            text: match[0]
        });
    }
    
    // Add stats init to each constructor (reverse order to maintain positions)
    for (let i = positions.length - 1; i >= 0; i--) {
        const pos = positions[i];
        
        // Check if this.active exists (common pattern)
        const constructorEnd = content.indexOf('}', pos.start);
        const constructorBody = content.slice(pos.start, constructorEnd);
        
        if (constructorBody.includes('this.active') && !constructorBody.includes('this.statsTracker')) {
            // Insert after this.active = true
            const activePos = content.indexOf('this.active', pos.start);
            const lineEnd = content.indexOf('\n', activePos);
            
            content = content.slice(0, lineEnd) + STATS_INIT + content.slice(lineEnd);
            modified = true;
        }
    }
    
    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Patched: ${path.basename(filePath)}`);
        return true;
    }
    
    return false;
}

function patchDirectory(dir) {
    const files = fs.readdirSync(dir);
    let patchedCount = 0;
    
    for (const file of files) {
        if (file.endsWith('.js') && !file.startsWith('.')) {
            const filePath = path.join(dir, file);
            if (patchFile(filePath)) {
                patchedCount++;
            }
        }
    }
    
    return patchedCount;
}

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║     🔧 AUTO-PATCH ALL METHODS WITH STATS TRACKING 🔧    ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

let totalPatched = 0;

for (const dir of METHODS_DIRS) {
    console.log(`\n📁 Processing: ${path.basename(dir)}`);
    console.log('─'.repeat(60));
    
    const count = patchDirectory(dir);
    totalPatched += count;
    
    console.log(`\n✅ Patched ${count} files in ${path.basename(dir)}\n`);
}

console.log('═'.repeat(60));
console.log(`\n🎉 Total files patched: ${totalPatched}`);
console.log('\n✅ All methods now have stats tracking!');
console.log('📊 Run "node monitor.js" to see real-time stats\n');
