#!/bin/bash

echo "🧪 Testing Telegram Bot Configuration..."
echo ""

# Check configuration
if ! ./check_bot_setup.sh; then
    exit 1
fi

echo ""
echo "✅ All fixes applied:"
echo "  - Added /menu command"
echo "  - Fixed .extra() deprecated API (10 places)"
echo "  - Fixed replyWithMarkdown deprecated API (6 places)"
echo "  - Enabled bot in config.json"
echo ""
echo "🚀 Ready to start! Run:"
echo "   node index.js telegram"
echo ""
