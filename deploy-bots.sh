#!/bin/bash

# ============================================
# 🚀 Deploy Multiple Simple Bots
# ============================================

# Configuration
NUM_BOTS=${1:-10}
C2_URL=${2:-"http://localhost:8080"}

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║        🚀 DEPLOYING MULTIPLE SIMPLE BOTS 🚀              ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Number of bots: $NUM_BOTS"
echo "C2 URL: $C2_URL"
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "⚠️  PM2 not found. Installing PM2..."
    npm install -g pm2
fi

# Check if simple-bot.js exists
if [ ! -f "simple-bot.js" ]; then
    echo "❌ simple-bot.js not found!"
    exit 1
fi

# Check dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install axios socket.io-client
fi

echo "🚀 Starting $NUM_BOTS bots..."
echo ""

# Start bots
for i in $(seq 1 $NUM_BOTS); do
    BOT_NAME="bot-$i"
    
    # Stop if already running
    pm2 delete $BOT_NAME 2>/dev/null
    
    # Start bot
    pm2 start simple-bot.js --name $BOT_NAME -- $C2_URL
    
    echo "✅ Started: $BOT_NAME"
    
    # Small delay to avoid overwhelming the system
    sleep 0.1
done

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║              ✅ ALL BOTS DEPLOYED! ✅                     ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "📊 View all bots:"
echo "   pm2 list"
echo ""
echo "📈 Monitor bots:"
echo "   pm2 monit"
echo ""
echo "📋 View logs:"
echo "   pm2 logs"
echo ""
echo "⚠️  Stop all bots:"
echo "   pm2 delete all"
echo ""
echo "💾 Save PM2 config:"
echo "   pm2 save"
echo ""

# Show PM2 list
pm2 list
