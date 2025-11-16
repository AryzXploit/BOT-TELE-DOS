# 🤖 Telegram Bot Setup Guide

## Issue Fixed
- ✅ Added `/menu` command (was missing)
- ✅ Enabled bot in config.json
- ✅ Both `/start` and `/menu` now work

## Configuration Steps

### 1. Get Telegram Bot Token
1. Open Telegram and search for `@BotFather`
2. Send `/newbot`
3. Follow instructions to create your bot
4. Copy the token (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Get Your Telegram User ID
1. Open Telegram and search for `@userinfobot`
2. Send `/start`
3. Copy your user ID (a number like: `123456789`)

### 3. Update config.json
Edit `/workspace/config.json` and replace:
```json
{
  "telegram": {
    "bot_token": "YOUR_BOT_TOKEN_HERE",  ← Replace with your bot token
    "admin_ids": ["YOUR_TELEGRAM_USER_ID"],  ← Replace with your user ID
    "enabled": true
  }
}
```

Example:
```json
{
  "telegram": {
    "bot_token": "6789012345:ABCdef1234567890abcdefghijklmnopqrs",
    "admin_ids": ["123456789"],
    "enabled": true
  }
}
```

### 4. Start the Bot

```bash
node index.js telegram
```

### 5. Use the Bot
Once running, open Telegram and:
- Send `/start` or `/menu` to your bot
- You should see the control panel with buttons

## Available Commands
- `/start` or `/menu` - Show main menu
- `/attack` - Start new attack
- `/status` - Check attack status
- `/stop` - Stop running attack
- `/methods` - List available methods
- `/help` - Show help

## Troubleshooting

**Bot not responding?**
- Check if bot is running (look for "Telegram bot is running!" message)
- Verify your user ID is correct in admin_ids
- Make sure bot token is valid

**Access Denied?**
- Your Telegram user ID must be in the admin_ids list in config.json
