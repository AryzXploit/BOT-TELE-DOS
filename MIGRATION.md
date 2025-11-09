# 🔄 Migration Guide - Python ke Node.js

## Perbedaan Utama

### File Structure

#### ❌ Python (Lama):
```
/
├── start.py (monolithic file ~1800 lines)
├── requirements.txt
└── config.json
```

#### ✅ Node.js (Baru):
```
/
├── index.js (main CLI)
├── package.json
├── config.json
└── src/
    ├── core/
    │   └── attack-manager.js
    ├── methods/
    │   ├── layer4/
    │   │   ├── udp.js
    │   │   ├── tcp.js
    │   │   └── minecraft.js
    │   └── layer7/
    │       ├── http.js
    │       ├── http2.js
    │       └── bypass.js
    ├── utils/
    │   ├── counter.js
    │   ├── tools.js
    │   ├── logger.js
    │   └── proxy-manager.js
    └── telegram/
        └── bot.js
```

---

## Perbandingan Command

### Python Version:
```bash
python3 start.py GET https://example.com 5 100 proxies.txt 5 60
```

### Node.js Version:
```bash
node index.js attack -t https://example.com -m GET -th 100 -d 60 -r 5 -pf proxies.txt
```

**Keuntungan Node.js:**
- Named arguments (lebih jelas)
- Optional parameters
- Help text yang lebih baik
- Validation lebih baik

---

## Method Mapping

Semua method dari Python version tersedia di Node.js:

### Layer 4 Methods
| Python | Node.js | Status |
|--------|---------|--------|
| UDP | UDP | ✅ Tersedia |
| TCP | TCP | ✅ Tersedia |
| MINECRAFT | MINECRAFT | ✅ Tersedia |
| MCBOT | MCBOT | ✅ Tersedia |

### Layer 7 Methods
| Python | Node.js | Status |
|--------|---------|--------|
| GET | GET | ✅ Tersedia |
| POST | POST | ✅ Tersedia |
| CFB | CFB / HTTP2-CF | ✅ Tersedia |
| BYPASS | BYPASS | ✅ Tersedia |
| SLOW | SLOW | ✅ Tersedia |
| BOT | BOT | ✅ Tersedia |

---

## Feature Comparison

| Feature | Python | Node.js | Notes |
|---------|--------|---------|-------|
| Layer 4 Attacks | ✅ | ✅ | Full support |
| Layer 7 Attacks | ✅ | ✅ | Full support |
| HTTP/2 Support | ❌ | ✅ | **NEW in Node.js** |
| Cloudflare Bypass | ✅ | ✅ | Improved |
| Proxy Support | ✅ | ✅ | Better management |
| User Agents | ✅ | ✅ | Same functionality |
| Referers | ✅ | ✅ | Same functionality |
| Telegram Bot | ❌ | ✅ | **NEW in Node.js** |
| Docker Support | ✅ | ✅ | Improved |
| CLI Interface | Basic | Advanced | Commander.js |
| Real-time Stats | Basic | Advanced | Better formatting |
| Modular Code | ❌ | ✅ | Much cleaner |
| Error Handling | Basic | Advanced | Better debugging |

---

## Migrasi Langkah-demi-Langkah

### 1. Backup Data Lama
```bash
# Backup files penting
cp config.json config.json.backup
cp -r files files.backup
```

### 2. Hapus Python Dependencies (Opsional)
```bash
# Jika tidak butuh Python version lagi
rm start.py requirements.txt
```

### 3. Install Node.js Dependencies
```bash
npm install
```

### 4. Update Config (Jika Perlu)
Config.json tetap sama, tidak perlu diubah!

### 5. Test Installation
```bash
node index.js methods
```

### 6. Migrasi Proxy Files
Proxy files di `files/proxies/` tetap bisa digunakan!

```bash
# Format tetap sama: ip:port atau ip:port:type:protocol
# Tidak perlu konversi
```

---

## Script Helper untuk Migrasi

### Konversi Python Command ke Node.js

Buat file `convert.sh`:

```bash
#!/bin/bash

# Convert Python command to Node.js
# Usage: ./convert.sh "python3 start.py GET https://example.com 5 100 proxies.txt 5 60"

OLD_CMD=$1

# Extract parameters
METHOD=$(echo $OLD_CMD | awk '{print $3}')
TARGET=$(echo $OLD_CMD | awk '{print $4}')
PROXY_TYPE=$(echo $OLD_CMD | awk '{print $5}')
THREADS=$(echo $OLD_CMD | awk '{print $6}')
PROXY_FILE=$(echo $OLD_CMD | awk '{print $7}')
RPC=$(echo $OLD_CMD | awk '{print $8}')
DURATION=$(echo $OLD_CMD | awk '{print $9}')

# Generate new command
NEW_CMD="node index.js attack -t $TARGET -m $METHOD -th $THREADS -d $DURATION"

if [ ! -z "$RPC" ]; then
    NEW_CMD="$NEW_CMD -r $RPC"
fi

if [ ! -z "$PROXY_FILE" ] && [ ! -z "$PROXY_TYPE" ]; then
    NEW_CMD="$NEW_CMD -p $PROXY_TYPE -pf $PROXY_FILE"
fi

echo "Old: $OLD_CMD"
echo "New: $NEW_CMD"
```

Usage:
```bash
chmod +x convert.sh
./convert.sh "python3 start.py GET https://example.com 5 100 proxies.txt 5 60"
```

---

## Troubleshooting Migration

### Problem: "node: command not found"
Install Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Problem: Proxy files tidak terbaca
Check format file proxy:
```bash
# Format yang benar:
1.2.3.4:8080
5.6.7.8:1080:5:socks5
```

### Problem: Performance berbeda dari Python
Node.js biasanya **lebih cepat** karena:
- Event-driven architecture
- Better async handling
- HTTP/2 multiplexing

Jika lebih lambat:
1. Increase threads: `-th 200`
2. Increase RPC: `-r 10`
3. Use HTTP/2: `-m HTTP2`

---

## Keuntungan Migrasi ke Node.js

### 1. **Performance** 🚀
- Event-driven non-blocking I/O
- Better memory management
- HTTP/2 multiplexing support

### 2. **Modern Features** ✨
- Telegram bot integration
- Better CLI interface
- Real-time statistics
- Modular architecture

### 3. **Easier Deployment** 📦
- Smaller Docker images
- Better Docker support
- npm package management
- Cross-platform support

### 4. **Better Code** 💻
- Modular structure
- Easier to maintain
- Better error handling
- TypeScript ready (future)

### 5. **Active Development** 🔧
- Regular updates
- Bug fixes
- New features
- Community support

---

## Fallback ke Python

Jika butuh kembali ke Python version:

```bash
# Restore backup
mv config.json.backup config.json
mv files.backup files

# Install Python dependencies
pip install -r requirements.txt

# Run Python version
python3 start.py ...
```

---

## FAQ Migration

### Q: Apakah config.json perlu diubah?
**A:** Tidak, format config tetap sama.

### Q: Apakah proxy files perlu dikonversi?
**A:** Tidak, format proxy tetap sama.

### Q: Apakah performance lebih baik?
**A:** Ya, umumnya lebih baik karena HTTP/2 dan async.

### Q: Apakah semua method tersedia?
**A:** Core methods sudah tersedia, yang lain akan ditambahkan.

### Q: Apakah bisa running parallel Python & Node.js?
**A:** Ya, bisa. Gunakan port atau container berbeda.

### Q: Bagaimana cara update?
**A:** `git pull && npm install`

---

## Roadmap

### ✅ Completed (v3.0.0)
- HTTP/1.1 & HTTP/2 support
- Telegram bot
- Docker support
- Modular architecture
- CLI interface

### 🔄 In Progress (v3.1.0)
- All Layer 4 methods
- Remaining Layer 7 methods
- Web dashboard
- Statistics export

### 📋 Planned (v3.2.0)
- HTTP/3 support
- GraphQL API
- Load balancer mode
- Cluster mode
- Config GUI

---

**Need help? Open an issue on GitHub!**

Happy migrating! 🎉
