# 🎯 Target Health Monitor - Gen Z Edition 🔥

## 💀 Fitur Baru: Real-time Target Monitoring

Monitor target secara real-time selama attack! Tau kapan target down atau masih ngeyel! 💪

---

## 🔥 Features:

### ✅ Target Masih Hidup (Belum Down)
```
💪 Target masih ngeyel cuy

   Response Time: 234ms
   Status: 🟢 ALIVE | Checks: 5
```

### 💀 Target DOWN! (BERHASIL!)
```
╔═══════════════════════════════════════╗
║                                       ║
║     💀 TARGET DOWN! 💀               ║
║                                       ║
║     ░██████╗░░██████╗                ║
║     ██╔════╝░██╔════╝                ║
║     ██║░░██╗░██║░░██╗                ║
║     ██║░░╚██╗██║░░╚██╗               ║
║     ╚██████╔╝╚██████╔╝               ║
║     ░╚═════╝░░╚═════╝░               ║
║                                       ║
║   🔥 SHEESH TARGET MATI! 🔥          ║
║                                       ║
╚═══════════════════════════════════════╝

   💀 BUSETT TARGET DOWN COK!
   🎯 Target: https://target.com
   ⚰️  Status: 🔴 DOWN/OFFLINE
   ⏰ Down Time: 12:34:56
   📊 Failed Checks: 5

   ✅ GG EZ! TARGET BERHASIL DI-DOWN! 🔥
```

### 🐌 Target Lagi Lemot
```
🐌 Target lagi lemot nih

   Failed attempts: 2/3
   Status: 🟡 STRUGGLING
```

### ⚰️ Target Masih Down
```
💀 Target masih mati cuy

   Status: 🔴 STILL DOWN
   Down for: 45s
   Failed checks: 8
```

### ⚠️ Target Hidup Lagi (Recovered)
```
⚠️  ANJIR TARGET HIDUP LAGI!

   🎯 Target: https://target.com
   Status: 🟢 BACK ONLINE
   Response Time: 156ms
   Up Time: 12:35:30

   💪 Target recovered, gas lagi bro!
```

---

## 🚀 Usage:

### Default (Monitoring Enabled):
```bash
# Monitoring otomatis aktif
npm run attack -- -t https://target.com -m GET -th 500 -d 120
```

### Disable Monitoring:
```bash
# Kalau gak mau monitoring
npm run attack -- -t https://target.com -m GET -th 500 -d 120 --no-monitor
```

### Manual Monitoring:
```bash
# Direct node command
NODE_OPTIONS="--max-old-space-size=8192" node index.js attack -t https://target.com -m GET -th 500 --no-monitor
```

---

## 📊 Monitoring Summary (Setelah Attack Selesai):

### Target Berhasil Down:
```
╔═══════════════════════════════════════╗
║     📊 MONITORING SUMMARY 📊         ║
╚═══════════════════════════════════════╝

🎯 Target: https://target.com
📊 Total Checks: 12
✅ Success: 4
❌ Failures: 8

💀 Final Status: 🔴 DOWN
⏰ Down Duration: 67s

🔥 GG! TARGET BERHASIL DI-DOWN! 🔥
```

### Target Masih Kuat:
```
╔═══════════════════════════════════════╗
║     📊 MONITORING SUMMARY 📊         ║
╚═══════════════════════════════════════╝

🎯 Target: https://target.com
📊 Total Checks: 12
✅ Success: 10
❌ Failures: 2

💪 Final Status: 🟢 STILL UP

⚠️  Target masih kuat, perlu attack lebih gede!
```

---

## 🎯 How It Works:

1. **Check Interval:** Setiap 10 detik
2. **Health Check:** HTTP HEAD request ke target
3. **Down Detection:** 3 consecutive failures = DOWN
4. **Recovery Detection:** 1 success setelah down = BACK UP
5. **Real-time Output:** Update langsung di terminal

---

## 💡 Status Indicators:

| Status | Emoji | Meaning |
|--------|-------|---------|
| 🟢 ALIVE | 💪🔥 | Target masih hidup |
| 🟡 STRUGGLING | 🐌😴 | Target mulai lemot |
| 🔴 DOWN | 💀⚰️ | Target mati/offline |
| 🟢 BACK ONLINE | ⚠️ | Target hidup lagi |

---

## 🔥 Gen Z Vibes:

### Random Messages:
- "Target masih ngeyel cuy" 💪
- "Belum mati nih target" 🔥
- "BUSETT TARGET DOWN COK!" 💀
- "Target masih standing strong" 👊
- "Masih kuat ternyata" ⚡
- "Target masih RIP 💀" ⚰️
- "GG EZ! TARGET BERHASIL DI-DOWN!" 🔥

### Random Emojis:
- Success: 💪🔥💀⚡🎯👊
- Down: 💀⚰️🪦☠️
- Slow: 🐌😴💤🥱

---

## 🎮 Examples:

### 1. Normal Attack dengan Monitoring:
```bash
npm run attack -- -t https://target.com -m GET -th 500 -d 120

# Output:
🎯 TARGET MONITORING STARTED 🎯
Target: https://target.com
Check interval: 10s

💪 Target masih ngeyel cuy
   Response Time: 234ms
   Status: 🟢 ALIVE | Checks: 1

🐌 Target lagi lemot nih
   Failed attempts: 2/3
   Status: 🟡 STRUGGLING

💀 BUSETT TARGET DOWN COK!
   🎯 Target: https://target.com
   ⚰️  Status: 🔴 DOWN/OFFLINE
   ✅ GG EZ! TARGET BERHASIL DI-DOWN! 🔥
```

### 2. Combo Attack dengan Monitoring:
```bash
npm run combo -- -t https://target.com -p MAXIMUM_POWER

# Monitoring otomatis aktif untuk semua methods!
```

### 3. Smart Attack dengan Monitoring:
```bash
npm run smart -- -t https://target.com -th 500

# Auto-detect + monitoring = PERFECT! 🔥
```

---

## 📈 Performance:

- **CPU Usage:** Minimal (~1-2%)
- **Memory:** ~10MB
- **Network:** 1 request per 10s
- **Impact:** Tidak mengganggu attack

---

## 💪 Pro Tips:

1. **Always enable monitoring** untuk tau kapan target down
2. **Watch the output** untuk adjust attack strategy
3. **If target still up**, increase threads atau ganti method
4. **If target down**, GG EZ! 🔥
5. **Share screenshot** ke temen-temen biar pada tau! 💀

---

## 🐛 Troubleshooting:

### Monitoring tidak jalan?
```bash
# Check apakah target valid
npm run scan -- -t https://target.com

# Atau disable monitoring
npm run attack -- -t target.com -m GET --no-monitor
```

### False positive (target down tapi masih hidup)?
- Target mungkin punya rate limiting
- Coba increase check interval
- Atau disable monitoring

---

## 🔥 Kesimpulan:

Fitur monitoring ini bikin lo tau **real-time** kapan target down atau masih ngeyel!

**Output Gen Z banget** dengan emoji dan bahasa gaul! 💀🔥

**GG EZ!** 💪

---

Made with 🔥 by **Aryzz-Dev**

**No cap, this feature is bussin fr fr!** 💀
