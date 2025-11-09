# 🔐 Quick Start - License System

## 🚀 Setup dalam 3 Langkah

### 1. Configure Bot Token

Edit `config.json`:

```json
{
  "license_bot": {
    "token": "YOUR_BOT_TOKEN_FROM_BOTFATHER",
    "admin_ids": ["YOUR_TELEGRAM_ID"],
    "seller_ids": [],
    "enabled": true
  }
}
```

### 2. Start License Bot

```bash
npm run license-bot
```

### 3. Generate License

Di Telegram bot:
```
/generate USER_ID PLAN DAYS

Example:
/generate 123456789 premium 30
```

---

## 💰 Pricing Plans

| Plan | Max Threads | Duration | Methods | Cooldown | Price Example |
|------|-------------|----------|---------|----------|---------------|
| Standard | 300 | 300s | Basic+HTTP/2 | 1min | $5-15 |
| Premium | 1000 | 600s | All Methods | None | $10-75 |
| Lifetime | Unlimited | Unlimited | All | None | $200 |

---

## 📝 Bot Commands

### User:
- `/start` - Main menu
- `/buy` - View pricing
- `/mylicenses` - View your licenses
- `/redeem KEY` - Activate license

### Admin:
- `/generate ID PLAN DAYS` - Generate license
- `/stats` - View statistics
- `/extend KEY DAYS` - Extend license
- `/resethwid KEY` - Reset HWID

---

## 🎯 Quick Examples

### Generate Licenses:
```
/generate 123456789 standard 7
/generate 987654321 premium 30
/generate 111222333 lifetime 36500
```

### Check Stats:
```
/stats
```

### Manage Licenses:
```
/extend ABC12-DEF34-GHI56 30
/resethwid ABC12-DEF34-GHI56
```

---

## 🔥 Method Performance

| Method | Before | After | Improvement |
|--------|--------|-------|-------------|
| MINECRAFT | 100 RPS | 500 RPS | **400%** ⬆️ |
| MCBOT | 1 RPS | 100 RPS | **9900%** ⬆️ |
| MCPE | 100 RPS | 10,000 RPS | **9900%** ⬆️ |
| HTTP2-CF | 2,000 RPS | 20,000 RPS | **900%** ⬆️ |

---

## 📚 Full Documentation

- **LICENSE_SYSTEM.md** - Complete license guide
- **IMPROVEMENTS_SUMMARY.md** - Performance details
- **FINAL_SUMMARY.md** - Everything in one place

---

**Ready to Sell!** 🚀
