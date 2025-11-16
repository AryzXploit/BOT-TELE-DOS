# 🤖 Telegram Bot Setup Guide

## Cara Setup Telegram Bot dengan UI Modern

### 📋 Langkah-langkah Setup

#### 1️⃣ Buat Bot di Telegram

1. Buka Telegram dan cari **@BotFather**
2. Kirim command `/newbot`
3. Ikuti instruksi:
   - Masukkan nama bot (contoh: `MHDDoS Control`)
   - Masukkan username bot (harus diakhiri `bot`, contoh: `mhddos_control_bot`)
4. **Simpan token** yang diberikan (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

#### 2️⃣ Dapatkan User ID Telegram Kamu

1. Buka Telegram dan cari **@userinfobot**
2. Kirim `/start` ke bot tersebut
3. Bot akan memberitahu **User ID** kamu (format: `123456789`)
4. **Simpan ID** ini

#### 3️⃣ Konfigurasi config.json

Copy file example dan edit:

```bash
cp config.example.json config.json
nano config.json  # atau gunakan text editor favorit
```

Edit bagian `telegram`:

```json
{
  "telegram": {
    "bot_token": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
    "admin_ids": ["123456789"],
    "enabled": true
  }
}
```

**Penjelasan:**
- `bot_token` - Token dari BotFather
- `admin_ids` - Array user ID yang boleh akses bot (bisa lebih dari 1)
- `enabled` - Set `true` untuk mengaktifkan bot

#### 4️⃣ Install Dependencies

```bash
npm install
```

#### 5️⃣ Jalankan Bot

```bash
node index.js telegram
```

Atau dengan npm:

```bash
npm run telegram
```

Jika berhasil, akan muncul:

```
[06:30:45 - INFO] 🤖 Starting Telegram bot...
[06:30:45 - INFO] 🔧 Loading Telegram bot configuration...
[06:30:45 - INFO] 👤 Authorized Admin IDs: 123456789
[06:30:46 - SUCCESS] 🤖 Telegram bot is running!
```

#### 6️⃣ Test Bot

1. Buka Telegram
2. Cari bot kamu (username yang kamu buat tadi)
3. Kirim `/start`
4. Bot akan menampilkan menu utama dengan tombol-tombol!

---

## 🎨 Fitur UI Bot

### 🚀 Main Menu

Ketika `/start`, bot menampilkan:

```
🚀 Welcome to MHDDoS Control Panel

Version: 3.0.0
Status: 🟢 Online

Select an option below to get started:

[⚡ Start Attack]
[📊 Check Status]
[🔧 Methods List]
[❓ Help]
```

### ⚡ Attack Wizard (Step-by-step)

#### Step 1: Choose Layer
```
🎯 Choose Attack Layer

Select the type of attack you want to perform:

[🌐 Layer 7 (HTTP)] [⚡ Layer 4 (TCP/UDP)]
[❌ Cancel]
```

#### Step 2: Choose Method
```
🔧 Choose Attack Method

Layer: Layer 7 (HTTP)

Select your preferred attack method:

[GET] [POST] [HTTP2]
[HTTP2-CF] [BYPASS] [SLOW]
[BOT] [STRESS] [COOKIE]
...
[⬅️ Back] [❌ Cancel]
```

#### Step 3: Enter Target
```
🎯 Enter Target

Method: HTTP2-CF

Please enter the target:
Format: https://example.com

Example: https://target.com
```

User ketik: `https://cloudflare-site.com`

#### Step 4: Choose Configuration
```
⚙️ Configure Attack

Target: https://cloudflare-site.com
Method: HTTP2-CF

Choose your configuration or use recommended settings:

[⚡ Quick Attack (Recommended)]
[💪 Powerful Attack]
[🔥 Maximum Power]
[⚙️ Custom Settings]
[⬅️ Back] [❌ Cancel]
```

**Preset Settings:**

| Preset | Threads | Duration | RPC |
|--------|---------|----------|-----|
| Quick | 100 | 60s | 1 |
| Powerful | 300 | 180s | 5 |
| Maximum | 500 | 300s | 10 |

Jika pilih **Custom Settings**, bot minta input:
```
⚙️ Custom Settings

Please enter settings in this format:
threads duration rpc

Example: 200 120 5

Threads: 50-1000
Duration: 30-600 seconds
RPC: 1-20
```

#### Step 5: Confirmation
```
📋 Attack Summary

🎯 Target: https://cloudflare-site.com
🔧 Method: HTTP2-CF
⚡ Threads: 300
⏱ Duration: 180s
🔄 RPC: 5

Are you sure you want to start this attack?

[✅ Confirm & Start] [❌ Cancel]
```

#### Step 6: Attack Running
```
⚡ Attack in Progress

🎯 Target: https://cloudflare-site.com
🔧 Method: HTTP2-CF

📊 Progress: ████████░░ 80%
📤 Requests: 125.4k
📦 Data Sent: 45.67 MB
⏱ Time: 144s / 180s

Status: 🟢 Running

[🔄 Refresh] [🛑 Stop]
```

Progress bar update otomatis setiap 3 detik!

#### Step 7: Completed
```
✅ Attack Completed!

The attack has finished successfully.

[🔄 New Attack]
```

---

## 📱 Commands Available

### Basic Commands

- `/start` - Show main menu dengan tombol interaktif
- `/status` - Check status attack yang sedang berjalan
- `/stop` - Stop attack yang sedang berjalan
- `/methods` - Lihat daftar semua method available
- `/help` - Tampilkan panduan penggunaan

### Interactive Buttons

Semua fitur bisa diakses lewat **tombol**, tidak perlu ketik command!

---

## 🔧 Advanced Configuration

### Multiple Admin Users

Tambahkan lebih dari 1 admin:

```json
{
  "telegram": {
    "bot_token": "YOUR_TOKEN",
    "admin_ids": ["123456789", "987654321", "555555555"],
    "enabled": true
  }
}
```

### Custom Update Interval

Ubah seberapa sering progress bar update:

```json
{
  "telegram": {
    "bot_token": "YOUR_TOKEN",
    "admin_ids": ["123456789"],
    "enabled": true,
    "update_interval": 5000
  }
}
```

Default: 3000ms (3 detik)

---

## 🐳 Running dengan Docker

### 1. Edit config.json di host

```bash
nano config.json
```

Isi dengan token dan admin ID kamu.

### 2. Start Bot Container

```bash
docker-compose --profile telegram up -d
```

### 3. Check Logs

```bash
docker-compose logs -f telegram-bot
```

### 4. Stop Bot

```bash
docker-compose --profile telegram down
```

---

## 🎯 Example Usage Flow

### Scenario: Attack Cloudflare-Protected Site

1. Buka bot di Telegram
2. Kirim `/start`
3. Klik tombol **"⚡ Start Attack"**
4. Pilih **"🌐 Layer 7 (HTTP)"**
5. Pilih method **"HTTP2-CF"**
6. Ketik target: `https://cloudflare-site.com`
7. Pilih **"💪 Powerful Attack"**
8. Klik **"✅ Confirm & Start"**
9. Bot akan menampilkan progress real-time!
10. Setelah selesai, klik **"🔄 New Attack"** untuk attack lagi

### Scenario: Check Running Attack

1. Ada attack yang sedang berjalan
2. Kirim `/status` atau klik tombol **"📊 Check Status"**
3. Bot tampilkan progress dengan progress bar
4. Klik **"🔄 Refresh"** untuk update manual
5. Klik **"🛑 Stop"** jika ingin hentikan

---

## 🔍 Troubleshooting

### Problem: "Access Denied"

**Penyebab:** User ID tidak ada di `admin_ids`

**Solusi:**
1. Check user ID kamu dengan @userinfobot
2. Pastikan ID sudah ada di config.json
3. Restart bot

### Problem: "Telegram bot is disabled"

**Penyebab:** `enabled: false` di config.json

**Solusi:**
```json
{
  "telegram": {
    "enabled": true
  }
}
```

### Problem: Bot tidak respon

**Penyebab:** Token salah atau bot tidak running

**Solusi:**
1. Check token di config.json
2. Pastikan bot running: `node index.js telegram`
3. Check logs untuk error

### Problem: "Cannot find module telegraf"

**Penyebab:** Dependencies belum terinstall

**Solusi:**
```bash
rm -rf node_modules
npm install
```

---

## 💡 Tips & Best Practices

### 1. **Keamanan**

- **JANGAN share** bot token atau admin ID
- **JANGAN commit** config.json ke git
- Gunakan username yang tidak obvious

### 2. **Performance**

- Jalankan bot di VPS/server yang stabil
- Gunakan Docker untuk isolasi yang lebih baik
- Monitor logs secara berkala

### 3. **Usage**

- Gunakan preset "Quick" untuk testing
- Gunakan preset "Powerful" untuk attack serius
- Gunakan preset "Maximum" hanya jika server kuat
- Custom settings untuk fine-tuning

### 4. **Monitoring**

- Check status secara berkala dengan `/status`
- Gunakan tombol "Refresh" untuk update real-time
- Stop attack jika tidak efektif dan ganti method

---

## 📊 Comparison: CLI vs Telegram Bot

| Feature | CLI | Telegram Bot |
|---------|-----|--------------|
| Start Attack | Complex command | Click 6 tombol |
| Check Status | Run command lagi | Klik 1 tombol |
| Stop Attack | Ctrl+C atau kill | Klik 1 tombol |
| Monitoring | Terminal only | Dari HP/anywhere |
| UI/UX | Text-based | Modern dengan tombol |
| Learning Curve | Medium | Easy |
| Remote Access | Perlu SSH | Built-in |
| Real-time Update | Manual | Otomatis |

---

## 🎓 FAQ

### Q: Apakah bot bisa diakses dari mana saja?
**A:** Ya! Selama bot running di server, kamu bisa kontrol dari HP/PC mana saja lewat Telegram.

### Q: Berapa banyak admin yang bisa ditambahkan?
**A:** Unlimited! Tambahkan semua user ID ke array `admin_ids`.

### Q: Apakah attack bisa running di background saat bot stop?
**A:** Tidak. Jika bot di-stop, attack juga akan berhenti. Gunakan Docker atau screen/tmux untuk keep running.

### Q: Bisa multiple attack sekaligus?
**A:** Saat ini 1 bot = 1 attack. Untuk multiple attack, jalankan multiple bot dengan config berbeda.

### Q: Apakah history attack disimpan?
**A:** Belum. Fitur history akan ditambahkan di versi mendatang.

---

## 🚀 Next Steps

Setelah bot running:

1. Test dengan attack kecil (Quick preset)
2. Monitor progress dan lihat efektivitas
3. Eksperimen dengan method berbeda
4. Scale up ke Powerful/Maximum jika perlu
5. Share bot dengan tim (tambah admin ID)

---

## 📞 Need Help?

- Open issue di GitHub
- Check logs: `docker-compose logs -f telegram-bot`
- Read full documentation di README.md

---

**Happy Attacking! 🎉**

*Remember: Use responsibly and only for authorized testing!*
