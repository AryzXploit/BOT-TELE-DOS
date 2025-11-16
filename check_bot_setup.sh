#!/bin/bash

echo "🤖 Telegram Bot Configuration Check"
echo "===================================="
echo ""

# Check if config.json exists
if [ ! -f "config.json" ]; then
    echo "❌ config.json not found!"
    exit 1
fi

# Read config
BOT_TOKEN=$(grep -o '"bot_token":\s*"[^"]*"' config.json | cut -d'"' -f4)
ADMIN_ID=$(grep -o '"admin_ids":\s*\["[^"]*"\]' config.json | cut -d'"' -f4)
ENABLED=$(grep -o '"enabled":\s*[^,}]*' config.json | awk '{print $2}' | tr -d ',')

echo "📋 Current Configuration:"
echo ""
echo "Bot Token: $BOT_TOKEN"
echo "Admin ID: $ADMIN_ID"
echo "Enabled: $ENABLED"
echo ""

# Check if configured
if [ "$BOT_TOKEN" = "YOUR_BOT_TOKEN_HERE" ]; then
    echo "⚠️  Bot token not configured!"
    echo ""
    echo "To fix:"
    echo "1. Open Telegram and message @BotFather"
    echo "2. Send /newbot and create your bot"
    echo "3. Copy the token"
    echo "4. Edit config.json and replace YOUR_BOT_TOKEN_HERE with your token"
    echo ""
fi

if [ "$ADMIN_ID" = "YOUR_TELEGRAM_USER_ID" ]; then
    echo "⚠️  Admin ID not configured!"
    echo ""
    echo "To fix:"
    echo "1. Open Telegram and message @userinfobot"
    echo "2. Send /start to get your user ID"
    echo "3. Edit config.json and replace YOUR_TELEGRAM_USER_ID with your ID"
    echo ""
fi

if [ "$ENABLED" = "false" ]; then
    echo "⚠️  Bot is disabled!"
    echo ""
    echo "To fix:"
    echo "1. Edit config.json"
    echo "2. Change \"enabled\": false to \"enabled\": true"
    echo ""
fi

if [ "$BOT_TOKEN" != "YOUR_BOT_TOKEN_HERE" ] && [ "$ADMIN_ID" != "YOUR_TELEGRAM_USER_ID" ] && [ "$ENABLED" = "true" ]; then
    echo "✅ Configuration looks good!"
    echo ""
    echo "To start the bot, run:"
    echo "  node index.js telegram"
    echo ""
fi

echo "📖 For detailed instructions, see: SETUP_BOT.md"
