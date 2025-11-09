# ✅ Sistem Logging Telah Ditingkatkan!

## 🎯 Yang Telah Dibuat

### 1. **Enhanced Logger** (`src/utils/logger.js`)
Logger sekarang memiliki kemampuan:
- ✅ Menulis log ke file secara otomatis
- ✅ Pemisahan log berdasarkan tipe (general, errors, warnings, bot, attacks)
- ✅ Format timestamp ISO lengkap
- ✅ Stack trace untuk errors
- ✅ Auto-cleanup log > 30 hari
- ✅ Support untuk object/JSON logging

### 2. **Log Files** (folder `logs/`)
File log dibuat otomatis dengan format: `{type}-{YYYY-MM-DD}.log`

| File | Isi |
|------|-----|
| `general-{date}.log` | Semua log (INFO, DEBUG, WARNING, ERROR, SUCCESS, BOT, ATTACK) |
| `errors-{date}.log` | Khusus error dengan stack trace lengkap |
| `warnings-{date}.log` | Khusus warnings |
| `bot-{date}.log` | Aktivitas Telegram bot |
| `attacks-{date}.log` | Log serangan (start, stop, status) |

### 3. **Interactive Log Viewer** (`view_logs.sh`)
Script bash dengan menu interaktif untuk:
- 📄 Melihat berbagai tipe log
- 🔍 Search keyword dalam log
- 📊 Statistik log (count errors, warnings, dll)
- 🔄 Live monitoring real-time
- 📁 List semua file log dengan info size

### 4. **Enhanced Bot Logging**
Bot sekarang mencatat semua aktivitas:
- User masuk wizard
- Target yang dipilih
- Konfirmasi attack
- Command detection di wizard
- Unauthorized access attempts
- Bot start/stop
- Errors dengan detail lengkap

## 🚀 Cara Menggunakan

### Quick Start
```bash
# Jalankan bot
npm start

# Di terminal lain, lihat logs
./view_logs.sh
```

### Manual Commands
```bash
# Lihat semua log hari ini
cat logs/general-$(date +%Y-%m-%d).log

# Monitor real-time
tail -f logs/general-$(date +%Y-%m-%d).log

# Lihat hanya errors
cat logs/errors-$(date +%Y-%m-%d).log

# Cari keyword
grep -i "keyword" logs/*.log
```

## 📝 Contoh Log Entries

### Bot Activity Log
```
[2025-11-09T10:32:15.234Z] [BOT] User 123456789 (username) entered attack wizard
[2025-11-09T10:32:20.567Z] [BOT] User 123456789 set target: https://example.com
[2025-11-09T10:32:25.890Z] [BOT] User 123456789 confirmed attack
```

### Attack Log
```
[2025-11-09T10:33:00.123Z] [ATTACK] Attack initiated by user 123456789
[2025-11-09T10:33:05.456Z] [ATTACK] Starting attack - Target: https://example.com, Method: CFB, Threads: 100, Duration: 60s
[2025-11-09T10:33:10.789Z] [ATTACK] Attack successfully started
```

### Error Log (dengan Stack Trace)
```
[2025-11-09T10:31:00.789Z] [ERROR] Failed to start attack
Error: Invalid target URL
    at AttackManager.start (file:///workspace/src/core/attack-manager.js:123:15)
    at TelegramBot.startAttackFromWizard (file:///workspace/src/telegram/bot.js:341:38)
```

## 🔍 Troubleshooting

### Bot Error?
```bash
# Lihat error terakhir
tail -n 20 logs/errors-$(date +%Y-%m-%d).log

# Cek aktivitas bot
tail -n 50 logs/bot-$(date +%Y-%m-%d).log
```

### Attack Gagal?
```bash
# Cek attack logs
grep "Failed" logs/attacks-$(date +%Y-%m-%d).log

# Monitor real-time
tail -f logs/attacks-$(date +%Y-%m-%d).log
```

### Command Detection Issue?
Saat user ketik `/status` di tengah wizard:
```bash
# Cek log
grep "Command detected" logs/bot-$(date +%Y-%m-%d).log
```

Output:
```
[2025-11-09T10:32:30.123Z] [BOT] User 123456789 sent command '/status' during wizard, exiting...
```

## 📊 Monitoring & Analytics

### Count Errors Hari Ini
```bash
grep -c "\[ERROR\]" logs/general-$(date +%Y-%m-%d).log
```

### List User yang Aktif
```bash
grep "\[BOT\]" logs/bot-$(date +%Y-%m-%d).log | grep "User" | awk '{print $4}' | sort -u
```

### Total Attacks
```bash
grep "Attack initiated" logs/attacks-$(date +%Y-%m-%d).log | wc -l
```

### Top 10 Errors
```bash
grep "\[ERROR\]" logs/errors-*.log | cut -d']' -f3 | sort | uniq -c | sort -rn | head -10
```

## 🧹 Maintenance

### Auto-Cleanup
✅ Log files otomatis dihapus setelah 30 hari

### Manual Cleanup
```bash
# Hapus log > 7 hari
find logs/ -name "*.log" -mtime +7 -delete

# Compress old logs
tar -czf logs-backup-$(date +%Y-%m).tar.gz logs/*.log
```

## 📚 Dokumentasi Lengkap

- **`logs/README.md`** - Dokumentasi detail tentang log files
- **`LOGGING_GUIDE.md`** - Panduan lengkap sistem logging
- **`view_logs.sh`** - Interactive log viewer

## 💡 Tips

1. **Monitor Errors Berkala**: Cek `errors-{date}.log` setiap hari
2. **Backup Log Penting**: Backup attack logs untuk audit
3. **Watch Disk Space**: Monitor ukuran folder logs
4. **Use Live Monitor**: Gunakan `./view_logs.sh` option 8 untuk real-time
5. **Search Efficiently**: Gunakan grep dengan keyword spesifik

## ✅ Testing

Sistem logging telah ditest dan berfungsi dengan baik:
```
✓ File log dibuat otomatis di folder logs/
✓ Log ditulis dengan timestamp ISO lengkap
✓ Errors disimpan dengan stack trace
✓ Bot activities tercatat semua
✓ Attack logs terpisah untuk analisis
✓ Auto-cleanup berjalan normal
✓ Interactive viewer script berfungsi
```

## 🎉 Kesimpulan

Sekarang Anda bisa:
- ✅ Melacak semua aktivitas bot
- ✅ Menemukan error dengan cepat
- ✅ Monitoring real-time
- ✅ Analisis attack patterns
- ✅ Debug masalah dengan mudah
- ✅ Audit user activities

**Semua error dan aktivitas tercatat otomatis di folder `logs/`!**

---

**Quick Commands:**
```bash
# Start bot
npm start

# View logs interactively
./view_logs.sh

# Monitor live
tail -f logs/general-$(date +%Y-%m-%d).log

# Check errors
cat logs/errors-$(date +%Y-%m-%d).log
```

**Untuk pertanyaan tentang command detection di wizard:**
Saat user mengirim command `/status` di tengah attack wizard, bot akan:
1. Log aktivitas: `User {id} sent command '/status' during wizard, exiting...`
2. Exit dari wizard
3. Tampilkan pesan: "⚠️ Command detected. Exiting wizard..."

Ini adalah behavior yang benar dan sudah di-log dengan lengkap! 🎯
