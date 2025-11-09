# 📋 Panduan Sistem Logging

Sistem logging telah ditingkatkan untuk mencatat semua aktivitas dan error ke file log yang terorganisir.

## 🚀 Quick Start

### Melihat Log dengan Script
```bash
./view_logs.sh
```

Script ini menyediakan menu interaktif untuk:
- ✅ Melihat log general, error, warning, bot, dan attack
- 🔍 Mencari keyword dalam log
- 📊 Melihat statistik log
- 🔄 Monitoring real-time
- 📁 List semua file log

### Melihat Log Manual

#### Lihat Log Hari Ini
```bash
# Semua log
cat logs/general-$(date +%Y-%m-%d).log

# Hanya errors
cat logs/errors-$(date +%Y-%m-%d).log

# Bot activities
cat logs/bot-$(date +%Y-%m-%d).log

# Attack logs
cat logs/attacks-$(date +%Y-%m-%d).log
```

#### Monitor Real-time
```bash
# Monitor semua aktivitas
tail -f logs/general-$(date +%Y-%m-%d).log

# Monitor hanya errors
tail -f logs/errors-$(date +%Y-%m-%d).log

# Monitor bot activities
tail -f logs/bot-$(date +%Y-%m-%d).log
```

#### Cari Error Spesifik
```bash
# Cari keyword dalam log
grep -i "error" logs/*.log

# Cari dengan context (3 baris sebelum & sesudah)
grep -i "failed" logs/errors-*.log -A 3 -B 3

# Lihat 50 error terakhir
tail -n 50 logs/errors-$(date +%Y-%m-%d).log
```

## 📁 Struktur Log Files

### Tipe Log Files

| File | Deskripsi |
|------|-----------|
| `general-{date}.log` | Semua log aktivitas (INFO, DEBUG, WARNING, ERROR, SUCCESS) |
| `errors-{date}.log` | Khusus error logs dengan stack trace lengkap |
| `warnings-{date}.log` | Khusus warning logs |
| `bot-{date}.log` | Aktivitas Telegram bot (commands, callbacks, user interactions) |
| `attacks-{date}.log` | Log aktivitas attack (start, stop, status) |

### Format Log Entry
```
[2025-11-09T10:30:45.123Z] [LEVEL] Message
```

### Contoh Log Entries

#### General Activity
```
[2025-11-09T10:30:45.123Z] [INFO] 🤖 Starting Telegram bot...
[2025-11-09T10:30:46.456Z] [SUCCESS] 🤖 Telegram bot is running!
```

#### Error dengan Stack Trace
```
[2025-11-09T10:31:00.789Z] [ERROR] Failed to start attack
Error: Invalid target URL
    at AttackManager.start (file:///workspace/src/core/attack-manager.js:123:15)
    at TelegramBot.startAttackFromWizard (file:///workspace/src/telegram/bot.js:341:38)
```

#### Bot Activity
```
[2025-11-09T10:32:15.234Z] [BOT] User 123456789 (username) entered attack wizard
[2025-11-09T10:32:20.567Z] [BOT] User 123456789 set target: https://example.com
[2025-11-09T10:32:25.890Z] [BOT] User 123456789 confirmed attack
```

#### Attack Activity
```
[2025-11-09T10:33:00.123Z] [ATTACK] Attack initiated by user 123456789
[2025-11-09T10:33:05.456Z] [ATTACK] Starting attack - Target: https://example.com, Method: CFB, Threads: 100, Duration: 60s
[2025-11-09T10:33:10.789Z] [ATTACK] Attack successfully started
```

## 🔍 Troubleshooting dengan Log

### 1. Bot Tidak Merespon
```bash
# Cek error terakhir
tail -n 20 logs/errors-$(date +%Y-%m-%d).log

# Cek aktivitas bot
tail -n 50 logs/bot-$(date +%Y-%m-%d).log
```

### 2. Attack Gagal Start
```bash
# Cek attack logs
grep "Failed" logs/attacks-$(date +%Y-%m-%d).log

# Cek error detail
grep -A 10 "attack" logs/errors-$(date +%Y-%m-%d).log
```

### 3. Command Detection di Wizard
Ketika user mengirim command (seperti `/status`) di tengah wizard, bot akan:
- Log aktivitas: `User {id} sent command '{command}' during wizard, exiting...`
- Exit dari wizard
- Show pesan: "⚠️ Command detected. Exiting wizard..."

Cek log:
```bash
grep "Command detected" logs/bot-$(date +%Y-%m-%d).log
```

### 4. Unauthorized Access
```bash
# Cek siapa yang mencoba akses
grep "Unauthorized" logs/warnings-$(date +%Y-%m-%d).log
```

## 📊 Analisis Log

### Count Errors per Jam
```bash
awk -F'[T:]' '/ERROR/ {print $2":00"}' logs/errors-$(date +%Y-%m-%d).log | sort | uniq -c
```

### List Unique Users
```bash
grep "\[BOT\]" logs/bot-$(date +%Y-%m-%d).log | grep "User" | awk '{print $4}' | sort -u
```

### Attack Statistics
```bash
# Hitung total attacks hari ini
grep "Attack initiated" logs/attacks-$(date +%Y-%m-%d).log | wc -l

# List targets yang diserang
grep "Starting attack" logs/attacks-$(date +%Y-%m-%d).log | grep -o "Target: [^ ]*" | sort | uniq
```

### Error Frequency
```bash
# 10 error paling sering
grep "\[ERROR\]" logs/errors-*.log | cut -d']' -f3 | sort | uniq -c | sort -rn | head -10
```

## 🧹 Manajemen Log

### Auto-Cleanup
- ✅ Log files otomatis dihapus setelah **30 hari**
- ✅ Cleanup berjalan saat logger diinisialisasi
- ✅ Konfigurasi di `src/utils/logger.js`

### Manual Cleanup
```bash
# Hapus log > 7 hari
find logs/ -name "*.log" -mtime +7 -delete

# Hapus semua log
rm -f logs/*.log

# Compress old logs
tar -czf logs/archive-$(date +%Y-%m).tar.gz logs/*.log
```

## 🔧 Konfigurasi Logging

### Level Logging
Di `src/utils/logger.js`:
```javascript
// Default: INFO
// Options: DEBUG, INFO, WARNING, ERROR
const logger = new Logger('DEBUG'); // untuk debugging detail
```

### Custom Log Directory
```javascript
const logger = new Logger('INFO', './custom-logs');
```

### Menggunakan Logger dalam Kode
```javascript
import { logger } from './src/utils/logger.js';

// General logs
logger.info('Info message');
logger.error('Error message', errorObject);
logger.warning('Warning message');
logger.success('Success message');
logger.debug('Debug message');

// Specialized logs
logger.bot('Bot activity');       // Masuk ke bot-{date}.log
logger.attack('Attack activity'); // Masuk ke attacks-{date}.log
```

## 💡 Tips & Best Practices

### 1. Monitor Errors Secara Berkala
```bash
# Setup cron job untuk alert
*/5 * * * * [ -f logs/errors-$(date +\%Y-\%m-\%d).log ] && tail -n 10 logs/errors-$(date +\%Y-\%m-\%d).log
```

### 2. Backup Log Penting
```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="logs/backups"
mkdir -p $BACKUP_DIR
cp logs/errors-$(date +%Y-%m-%d).log $BACKUP_DIR/ 2>/dev/null
cp logs/attacks-$(date +%Y-%m-%d).log $BACKUP_DIR/ 2>/dev/null
```

### 3. Monitor Disk Space
```bash
# Cek ukuran folder logs
du -sh logs/

# Alert jika > 1GB
[ $(du -s logs/ | awk '{print $1}') -gt 1048576 ] && echo "Warning: logs folder > 1GB"
```

### 4. Debug Mode untuk Development
```bash
# Set DEBUG level untuk detail logging
export LOG_LEVEL=DEBUG
node index.js
```

### 5. Integrasi dengan Monitoring Tools
```bash
# Send errors to external monitoring
tail -f logs/errors-$(date +%Y-%m-%d).log | while read line; do
    curl -X POST https://your-monitoring-service.com/alert \
         -d "message=$line"
done
```

## 📚 File Log Reference

### Lokasi Files
```
/workspace/logs/
├── general-2025-11-09.log    # Semua aktivitas
├── errors-2025-11-09.log     # Errors only
├── warnings-2025-11-09.log   # Warnings only
├── bot-2025-11-09.log        # Bot activities
├── attacks-2025-11-09.log    # Attack logs
└── README.md                 # Dokumentasi detail
```

### Permissions
```bash
# Pastikan directory writable
chmod 755 logs/
chmod 644 logs/*.log
```

## ❓ FAQ

**Q: Log file tidak dibuat?**
A: Pastikan folder `logs/` ada dan writable. Jalankan: `mkdir -p logs && chmod 755 logs/`

**Q: Log file terlalu besar?**
A: Implementasi rotation manual atau gunakan logrotate. Auto-cleanup akan hapus file > 30 hari.

**Q: Cara melihat log dari tanggal tertentu?**
A: `cat logs/general-2025-11-08.log` (ganti tanggal sesuai kebutuhan)

**Q: Cara disable file logging?**
A: Edit `src/utils/logger.js` dan comment out `this.writeToFile()` calls.

**Q: Error "Permission denied" saat write log?**
A: Jalankan: `sudo chown -R $USER:$USER logs/ && chmod -R 755 logs/`

---

## 🎯 Kesimpulan

Sistem logging sekarang lengkap dengan:
- ✅ File-based logging dengan rotasi otomatis
- ✅ Pemisahan log berdasarkan tipe (general, errors, warnings, bot, attacks)
- ✅ Stack trace lengkap untuk errors
- ✅ Interactive log viewer script
- ✅ Auto-cleanup log files > 30 hari
- ✅ Support untuk monitoring real-time
- ✅ Format log yang konsisten dan mudah dibaca

**Jalankan bot dan lihat log secara real-time:**
```bash
# Terminal 1: Jalankan bot
npm start

# Terminal 2: Monitor logs
./view_logs.sh
# Pilih option 8 (Live Monitor) > 1 (General)
```

Sekarang Anda bisa dengan mudah melacak semua aktivitas dan menemukan error dengan cepat! 🎉
