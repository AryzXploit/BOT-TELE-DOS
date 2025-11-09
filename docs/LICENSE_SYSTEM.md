# 🔐 License System - Complete Guide

## 🎯 Overview

Sistem lisensi lengkap dengan Telegram bot untuk manage dan sell licenses. Semua data ter-enkripsi dan aman.

---

## 📦 Features

### ✅ License Management
- ✅ **Encrypted Database** - Semua license data ter-enkripsi dengan AES-256
- ✅ **HWID Binding** - License di-bind ke device hardware ID
- ✅ **Plan-based Limits** - Different plans dengan limits berbeda
- ✅ **Expiry Management** - Auto-expire dan extend licenses
- ✅ **Usage Tracking** - Track attack count dan last usage

### ✅ Telegram Bot
- ✅ **Buy License** - User bisa beli license via bot
- ✅ **View Licenses** - Lihat semua license yang dimiliki
- ✅ **Redeem Key** - Activate license dengan key
- ✅ **Admin Panel** - Generate dan manage licenses
- ✅ **Seller Panel** - Untuk reseller

### ✅ Plans Available
- **Free Trial** (Optional)
  - Max Threads: 50
  - Max Duration: 60s
  - Limited Methods
  - 5min Cooldown

- **Standard Plan**
  - Max Threads: 300
  - Max Duration: 300s
  - Basic + HTTP/2 Methods
  - 1min Cooldown

- **Premium Plan**
  - Max Threads: 1000
  - Max Duration: 600s
  - All Methods Available
  - No Cooldown

- **Lifetime Plan**
  - Unlimited Everything
  - All Methods
  - Priority Support

---

## 🚀 Setup

### 1. Configure Telegram Bot

Edit `config.json`:

```json
{
  "license_bot": {
    "token": "YOUR_BOT_TOKEN_HERE",
    "admin_ids": ["YOUR_TELEGRAM_ID"],
    "seller_ids": ["SELLER_ID_1", "SELLER_ID_2"],
    "enabled": true
  },
  "license_system": {
    "enabled": true,
    "require_license": true,
    "free_trial_enabled": false
  }
}
```

### 2. Start License Bot

```bash
# Start license bot
node src/license/license-bot.js

# Or via npm
npm run license-bot
```

### 3. Get Your Telegram ID

Send `/start` to [@userinfobot](https://t.me/userinfobot) di Telegram.

---

## 💰 Pricing Configuration

Edit pricing di `src/license/license-bot.js`:

```javascript
this.pricing = {
    'standard_7': { plan: 'standard', days: 7, price: 5, label: 'Standard 7 Days' },
    'standard_30': { plan: 'standard', days: 30, price: 15, label: 'Standard 30 Days' },
    'premium_7': { plan: 'premium', days: 7, price: 10, label: 'Premium 7 Days' },
    'premium_30': { plan: 'premium', days: 30, price: 30, label: 'Premium 30 Days' },
    'premium_90': { plan: 'premium', days: 90, price: 75, label: 'Premium 90 Days' },
    'lifetime': { plan: 'lifetime', days: 36500, price: 200, label: 'Lifetime License' }
};
```

---

## 📱 Bot Commands

### User Commands:
- `/start` - Show main menu
- `/buy` - View pricing
- `/mylicenses` - View your licenses
- `/redeem <key>` - Redeem license key
- `/help` - Show help

### Admin Commands:
- `/generate <userId> <plan> <days>` - Generate license
- `/stats` - View statistics
- `/extend <key> <days>` - Extend license
- `/deactivate <key>` - Deactivate license
- `/resethwid <key>` - Reset HWID binding

### Examples:

```bash
# Generate license for user
/generate 123456789 premium 30

# Extend license
/extend ABC12-DEF34-GHI56 30

# View stats
/stats
```

---

## 🔑 Using Licenses

### Method 1: Via Telegram Bot (Attack Bot)

Update attack bot untuk integrate dengan license:

```javascript
import { licenseChecker } from './src/license/license-checker.js';

// Before attack
await licenseChecker.checkLicense(licenseKey);
licenseChecker.validateAttack(method, threads, duration);

// Start attack
// ...
```

### Method 2: Via CLI

```bash
# Set license key sebagai environment variable
export LICENSE_KEY="YOUR-LICENSE-KEY"

# Run attack
node index.js attack -t https://target.com -m GET -th 100 -d 60
```

---

## 🛡️ Security Features

### Encryption
- **AES-256-CBC** encryption untuk database
- **SHA-256** hashing untuk checksums
- **Scrypt** key derivation

### HWID Binding
- License automatically bind ke device
- Prevent sharing across multiple devices
- Can reset via admin command

### Data Protection
- License keys tidak dapat di-reverse engineer
- Encrypted storage untuk semua license data
- Checksum validation untuk prevent tampering

---

## 📊 License Database

Database location: `./licenses.json` (encrypted)

Structure:
```json
{
  "users": {
    "123456789": {
      "userId": "123456789",
      "licenses": ["ABC12-DEF34-..."],
      "totalPurchases": 1,
      "registered": 1699999999999
    }
  },
  "keys": {
    "ABC12-DEF34-GHI56-JKL78-MNO90": {
      "userId": "123456789",
      "plan": "premium",
      "created": 1699999999999,
      "expires": 1702591999999,
      "active": true,
      "hwid": "ABC123...",
      "usage": {
        "attacks": 42,
        "lastUsed": 1700000000000
      }
    }
  }
}
```

---

## 🔧 Advanced Configuration

### Custom Plan Limits

Edit `src/license/license-checker.js`:

```javascript
getPlanLimits(plan) {
    const limits = {
        'free': {
            maxThreads: 50,
            maxDuration: 60,
            methods: ['GET', 'POST', 'UDP', 'TCP'],
            cooldown: 300
        },
        'custom': {
            maxThreads: 500,
            maxDuration: 400,
            methods: ['GET', 'POST', 'HTTP2', 'UDP', 'TCP'],
            cooldown: 120
        }
    };
    return limits[plan] || limits['free'];
}
```

### License Key Format

Format: `XXXX-XXXX-XXXX-XXXX-XXXX`
- Uppercase letters and numbers
- Checksum included untuk validation
- Unique per user dan timestamp

---

## 💡 Business Model

### Selling Licenses

1. **Direct Sales**
   - User contact you via Telegram
   - You generate license
   - Send key to user

2. **Reseller Program**
   - Add resellers to `seller_ids`
   - They can generate licenses
   - Track sales via stats

3. **Automated Payment** (Optional)
   - Integrate dengan payment gateway
   - Auto-generate on payment
   - Requires additional development

### Payment Methods

Terserah Anda:
- Cryptocurrency (BTC, ETH, USDT)
- PayPal
- Bank Transfer
- Other payment gateways

---

## 📈 Statistics & Monitoring

### View Stats

```bash
/stats
```

Output:
```
📊 License Statistics

Total Licenses: 150
Active Licenses: 120
Total Users: 80

Plans Distribution:
standard: 50
premium: 60
lifetime: 10
```

### Export Data (Admin)

```javascript
import { licenseManager } from './src/license/license-manager.js';

// Get all licenses
const licenses = licenseManager.licenses;

// Export to JSON
console.log(JSON.stringify(licenses, null, 2));
```

---

## ⚠️ Troubleshooting

### License Not Working

```bash
# Check license status
/mylicenses

# Reset HWID if needed
/resethwid ABC12-DEF34-GHI56-JKL78-MNO90
```

### Database Corrupted

```bash
# Backup first
cp licenses.json licenses.json.backup

# Reset (will lose all licenses!)
rm licenses.json

# Restart bot
node src/license/license-bot.js
```

### HWID Changed

Device change atau reinstall OS:
```bash
# Admin reset HWID
/resethwid LICENSE-KEY

# User can then activate again
```

---

## 🎓 Best Practices

### For Admins:
1. ✅ Backup `licenses.json` regularly
2. ✅ Keep `LICENSE_SECRET` environment variable secure
3. ✅ Monitor stats untuk detect abuse
4. ✅ Use different bot for license vs attack
5. ✅ Set appropriate prices

### For Users:
1. ✅ Keep license key private
2. ✅ Don't share HWID-bound licenses
3. ✅ Contact admin if issues
4. ✅ Renew before expiry

### For Sellers:
1. ✅ Verify payment before generating
2. ✅ Keep track of sales
3. ✅ Provide support to customers
4. ✅ Report issues to admin

---

## 🔐 Environment Variables

```bash
# License secret untuk encryption
export LICENSE_SECRET="your-secret-key-here"

# License bot token
export LICENSE_BOT_TOKEN="your-bot-token"

# Optional: Auto-load license
export LICENSE_KEY="your-license-key"
```

---

## 📞 Support

Jika ada issues:
1. Check logs: `logs/bot-*.log`
2. Verify config: `config.json`
3. Test bot: `/start` command
4. Contact admin

---

## 🎉 Conclusion

Sistem lisensi lengkap dengan:
- ✅ Encryption & Security
- ✅ HWID Binding
- ✅ Telegram Bot Management
- ✅ Multiple Plans
- ✅ Usage Tracking
- ✅ Reseller Support

**Ready untuk production & commercial use!**

---

**Last Updated:** 2025-11-09  
**Version:** 3.2.0 - License System Edition
