#!/usr/bin/env node

/**
 * Real-time Attack Monitor CLI
 * Usage: node monitor.js [--interval 2000]
 */

import { attackMonitor } from './src/c2/monitor.js';
import { C2Database } from './src/c2/database.js';
import { logger } from './src/utils/logger.js';

const args = process.argv.slice(2);
const intervalIndex = args.indexOf('--interval');
const interval = intervalIndex !== -1 ? parseInt(args[intervalIndex + 1]) : 2000;

console.log(`
╔═══════════════════════════════════════════════════════════╗
║        🔥 ARYZZ-STRESSER REAL-TIME MONITOR 🔥            ║
╚═══════════════════════════════════════════════════════════╝

Starting monitor with ${interval}ms update interval...
Press Ctrl+C to exit
`);

// Start monitoring
attackMonitor.startMonitoring(interval);

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n⚠️  Stopping monitor...');
    attackMonitor.stopMonitoring();
    process.exit(0);
});

// Keep process alive
setInterval(() => {}, 1000);
