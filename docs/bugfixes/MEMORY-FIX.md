# 🔧 Memory Fix - JavaScript Heap Out of Memory

## 🐛 Problem:
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

## ✅ Solutions:

### 1. **Run dengan Memory Limit (RECOMMENDED)**

#### Linux/Mac:
```bash
# Make script executable
chmod +x run.sh

# Run dengan 8GB memory
./run.sh attack -t target.com -m GET -th 500 -d 120

# Atau langsung:
NODE_OPTIONS="--max-old-space-size=8192 --expose-gc" node index.js attack -t target.com -m GET
```

#### Windows:
```powershell
# PowerShell
$env:NODE_OPTIONS="--max-old-space-size=8192 --expose-gc"
node index.js attack -t target.com -m GET -th 500 -d 120

# CMD
set NODE_OPTIONS=--max-old-space-size=8192 --expose-gc
node index.js attack -t target.com -m GET -th 500 -d 120
```

### 2. **Reduce Threads (Quick Fix)**

Kalau masih out of memory, kurangi threads:

```bash
# Dari 1000 threads → 500 threads
node index.js attack -t target.com -m GET -th 500 -d 120

# Atau lebih rendah lagi
node index.js attack -t target.com -m GET -th 300 -d 120
```

### 3. **Update package.json Scripts**

Tambahkan di `package.json`:

```json
{
  "scripts": {
    "start": "NODE_OPTIONS='--max-old-space-size=8192 --expose-gc' node index.js",
    "attack": "NODE_OPTIONS='--max-old-space-size=8192 --expose-gc' node index.js attack",
    "telegram": "NODE_OPTIONS='--max-old-space-size=8192 --expose-gc' node index.js telegram"
  }
}
```

Lalu run:
```bash
npm run attack -- -t target.com -m GET -th 500 -d 120
npm run telegram
```

### 4. **Telegram Bot (Auto-Fixed)**

Bot sudah auto-handle memory dengan garbage collection setelah attack selesai.

---

## 📊 Memory Limits:

| Threads | Recommended Memory | Command |
|---------|-------------------|---------|
| 100-300 | 2GB | `--max-old-space-size=2048` |
| 300-500 | 4GB | `--max-old-space-size=4096` |
| 500-1000 | 8GB | `--max-old-space-size=8192` |
| 1000+ | 16GB | `--max-old-space-size=16384` |

---

## 🎯 Best Practices:

1. **Always use memory limit** saat run attack
2. **Start dengan threads rendah** (300-500) terus naikkan
3. **Monitor memory usage** dengan `htop` atau Task Manager
4. **Stop attack** sebelum memory penuh
5. **Restart bot** kalau memory usage tinggi

---

## 🔥 Quick Commands:

```bash
# Safe attack (500 threads, 8GB memory)
NODE_OPTIONS="--max-old-space-size=8192" node index.js attack -t target.com -m GET -th 500 -d 120

# Combo attack (8GB memory)
NODE_OPTIONS="--max-old-space-size=8192" node index.js combo -t target.com -p MAXIMUM_POWER

# Telegram bot (8GB memory)
NODE_OPTIONS="--max-old-space-size=8192" node index.js telegram
```

---

## 💡 Tips:

- Kalau masih out of memory, **restart terminal** dan run lagi
- Kalau server RAM kecil, **gunakan VPS dengan RAM lebih besar**
- **Close aplikasi lain** yang consume memory
- **Use swap** kalau RAM kurang

---

Made with 🔥 by **Aryzz-Dev**
