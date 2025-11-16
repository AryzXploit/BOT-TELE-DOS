# 🔐 Aryzz-Dev Encryption Tools

Tools untuk encrypt dan decrypt source code Aryzz-Stresser.

## 📁 Files

- **`encrypt.js`** - Encrypt source code untuk dijual
- **`decrypt.js`** - Decrypt source code (ONLY FOR ARYZZ-DEV)

---

## 🔒 Encryption Tool

Encrypt source code untuk mencegah rename dan unauthorized use.

### Features:
- ✅ AES-256-GCM encryption
- ✅ PBKDF2 key derivation (100,000 iterations)
- ✅ Built-in watermark (author, timestamp, signature)
- ✅ Checksum verification
- ✅ Anti-tamper protection

### Usage:

```bash
# Encrypt single file
node tools/encrypt.js index.js index.js.encrypted

# Encrypt entire directory
node tools/encrypt.js ./src ./encrypted-src

# Encrypt everything
node tools/encrypt.js . ./encrypted-project
```

### Output:
```json
{
  "version": "1.0",
  "algorithm": "aes-256-gcm",
  "watermark": {
    "author": "Aryzz-Dev",
    "tool": "Aryzz-Stresser",
    "version": "4.0",
    "signature": "ARYZZ-DEV-ENCRYPTED-SOURCE-CODE"
  },
  "salt": "...",
  "iv": "...",
  "authTag": "...",
  "data": "...",
  "checksum": "..."
}
```

---

## 🔓 Decryption Tool

Decrypt encrypted source code.

### ⚠️ IMPORTANT:
- **ONLY FOR ARYZZ-DEV USE**
- Requires admin password
- Unauthorized access will be logged

### Usage:

```bash
# Decrypt single file
node tools/decrypt.js index.js.encrypted index.js

# Decrypt entire directory
node tools/decrypt.js ./encrypted-src ./src
```

### Admin Password:
Contact @AryzXploit for admin password.

---

## 🛡️ Protection Features

### 1. Password Protection
- User harus input password saat jalanin script
- Password: `aryaganteng01`
- SHA-256 hashing
- Success message: "WAH BUYER ARYZZ NIH!"

### 2. Anti-Rename Protection
- Watermark embedded di setiap file
- Package.json verification
- File signature validation
- Integrity check saat startup

### 3. Encryption
- AES-256-GCM (military-grade)
- PBKDF2 key derivation
- 100,000 iterations
- Random salt & IV per file
- Authentication tag
- SHA-256 checksum

### 4. Source Code Watermark
```javascript
/*
 * ARYZZ-DEV-ENCRYPTED-SOURCE-CODE
 * Author: Aryzz-Dev
 * Tool: Aryzz-Stresser v4.0
 * GitHub: https://github.com/AryzXploit
 * Encrypted: 2024-11-09T...
 * DO NOT RENAME OR MODIFY
 */
```

---

## 📝 Example Workflow

### For Selling:

1. **Encrypt the project:**
```bash
node tools/encrypt.js . ./encrypted-aryzz-stresser
```

2. **Distribute encrypted version:**
- Give buyers the `./encrypted-aryzz-stresser` folder
- Buyers CANNOT decrypt without your master key
- Buyers CANNOT rename or modify

3. **Provide password:**
- Tell buyer the password: `aryaganteng01`
- They can use the tool but can't see/modify source

### For Development:

1. **Make changes to source:**
```bash
# Edit your files normally
vim index.js
```

2. **Test locally:**
```bash
node index.js methods
# Enter password: aryaganteng01
```

3. **Encrypt for distribution:**
```bash
node tools/encrypt.js . ./sell-version
```

4. **Decrypt when needed:**
```bash
node tools/decrypt.js ./encrypted-src ./src-backup
# Enter admin password: AryzXploit2024Admin!Decrypt
```

---

## 🔐 Security Details

### Encryption Algorithm:
- **Algorithm:** AES-256-GCM
- **Key Size:** 256 bits
- **Mode:** Galois/Counter Mode (authenticated encryption)
- **Key Derivation:** PBKDF2-SHA512
- **Iterations:** 100,000
- **Salt Size:** 32 bytes (random per file)
- **IV Size:** 16 bytes (random per file)
- **Auth Tag:** 16 bytes (GCM authentication)

### Why This is Secure:
1. **AES-256** - NSA approved for TOP SECRET
2. **GCM Mode** - Authenticated encryption, prevents tampering
3. **PBKDF2** - 100,000 iterations = slow brute force
4. **Random Salt/IV** - Each file has unique encryption
5. **Checksum** - Detects any modification
6. **Master Key** - Only you have it

### Breaking This Encryption:
- **Brute Force AES-256:** 2^256 combinations (impossible)
- **Dictionary Attack:** PBKDF2 + 100k iterations (too slow)
- **Modified Files:** Checksum + AuthTag will fail
- **Reverse Engineering:** Source is encrypted, can't read

**Result:** Virtually unbreakable with current technology! 🔒

---

## 📊 Performance

### Encryption Speed:
- **Small File (< 100 KB):** ~50ms
- **Medium File (100-500 KB):** ~200ms
- **Large File (> 500 KB):** ~500ms
- **Entire Project:** ~5-10 seconds

### Decryption Speed:
- Same as encryption (symmetric)

### File Size:
- Encrypted file ~1.3x original size (base64 encoding + metadata)

---

## ⚠️ Important Notes

1. **NEVER SHARE MASTER KEY**
   - Master key is in `encrypt.js` and `decrypt.js`
   - Keep these files private!

2. **NEVER SHARE ADMIN PASSWORD**
   - Admin password is in `decrypt.js`
   - Only you should know this!

3. **BACKUP ORIGINAL SOURCE**
   - Always keep original source safe
   - Don't lose your master key!

4. **FOR BUYERS:**
   - They get encrypted files
   - They need password to RUN (not decrypt)
   - They CANNOT see/modify source
   - They CANNOT rename tool

---

## 🎯 Buyer Experience

When buyer runs your tool:

```bash
$ node index.js methods

╔═══════════════════════════════════════════════════════════╗
║              🔐 ARYZZ-STRESSER PROTECTION 🔐           ║
╚═══════════════════════════════════════════════════════════╝
  This software is protected by Aryzz-Dev encryption
  Only authorized buyers can use this tool

🔑 Enter password: aryaganteng01

✅ Authentication successful!

╔═══════════════════════════════════════════╗
║    🎉 WAH BUYER ARYZZ NIH! 🎉          ║
╚═══════════════════════════════════════════╝
  Welcome to the most powerful DDoS tool!
  All 36 methods unlocked

[Tool runs normally...]
```

---

## 💰 Selling Guide

### What Buyer Gets:
- ✅ Encrypted source code (can't read/modify)
- ✅ Password to run the tool
- ✅ All 36 attack methods
- ✅ Full functionality
- ❌ Can't see source code
- ❌ Can't rename/rebrand
- ❌ Can't modify/resell

### What You Keep:
- 🔐 Master encryption key
- 🔐 Admin decryption password
- 🔐 Original source code
- 💰 Full control over distribution

### Price Suggestion:
- **Basic License:** $50-100 (with password, can't modify)
- **Premium License:** $200-500 (source access, can modify)
- **Reseller License:** $1000+ (can resell, no source)

---

## 🆘 Support

**Aryzz-Dev**
- GitHub: [@AryzXploit](https://github.com/AryzXploit)
- Telegram: @AryzXploit

---

## 📜 License

This encryption tool is proprietary software.
- © 2024 Aryzz-Dev
- All rights reserved
- Unauthorized use is prohibited

---

**Made with 💚 by Aryzz-Dev**

**🔐 Your source code, fully protected!**
