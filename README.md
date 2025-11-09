# 🚀 Aryzz-Stresser - Node.js Edition

<div align="center">

![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**Advanced DDoS Testing Tool with Multiple Attack Vectors**

*Completely rewritten in Node.js for better performance and modern features*

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Usage](#-usage)
- [Attack Methods](#-attack-methods)
- [Telegram Bot](#-telegram-bot)
- [Logging System](#-logging-system)
- [Docker Support](#-docker-support)
- [Configuration](#-configuration)
- [Examples](#-examples)
- [Legal Disclaimer](#-legal-disclaimer)

---

## ✨ Features

### 🔥 Multiple Bypass Techniques
- ✅ **PrivacyPass Token System** - Cloudflare PrivacyPass challenge bypass
- ✅ **Cloudscraper Challenge Solver** - Automatic Cloudflare bypass
- ✅ **Real Browser Header Simulation** - Realistic traffic patterns
- ✅ **TLS Fingerprint Spoofing** - Advanced evasion
- ✅ **JavaScript Challenge Auto-Solve** - Bypass JS challenges
- ✅ **CAPTCHA Bypass Integration** - 2Captcha, Anti-Captcha, CapMonster support
- ✅ **Advanced Header Fingerprinting** - 2000+ header combinations
- ✅ **Cookie Management System** - Realistic cookie handling

### 🌐 HTTP/1.1 Protocols
- ✅ **Raw Socket Flood** - Low-level TCP/UDP attacks
- ✅ **Basic HTTP Flood** - GET/POST requests
- ✅ **HTTP Get/Post Attack** - Standard HTTP flooding
- ✅ **Scraping + Attack** - Combined scraping and attacking

### ⚡ HTTP/2 Advanced
- ✅ **HTTP/2 CF Bypass** - Cloudflare HTTP/2 bypass
- ✅ **HTTP/2 Header Generator** - Dynamic header generation
- ✅ **HTTP/2 Strike Method** - Multiplexed requests
- ✅ **HTTP/2 DDoS L7** - Layer 7 HTTP/2 flooding

### 🔐 TLS/SSL Advanced
- ✅ **TLSv1.2/v1.3 Attack** - Modern TLS protocol support
- ✅ **TLS + UA Rotation** - User-Agent rotation with TLS
- ✅ **TLS VIP Version** - Premium TLS configurations
- ✅ **TLS Advanced v3** - Latest TLS bypass methods

### 🎯 HTTPS & Special Methods
- ✅ **HTTP/3 Protocol (QUIC)** - Next-gen HTTP/3 support with fallback
- ✅ **HTTP/2 Protocol** - Full HTTP/2 support with multiplexing
- ✅ **Advanced Bypass Methods** - Multiple evasion techniques
- ✅ **CONNECT Proxy Tunneling** - Proxy chaining support
- ✅ **Dynamic Attack Patterns** - Randomized methods and headers

### 🤖 Traffic Like Real Browser
- ✅ **Header Generator** - 2000+ header combinations
- ✅ **User Agent Database** - 5000+ real user agents
- ✅ **Realistic Browser Fingerprints** - Mimics real browsers
- ✅ **Human-like Request Patterns** - Natural timing patterns
- ✅ **Mobile & Desktop Simulation** - Multi-platform support

### 🛡️ Hard to Detect by WAF
- ✅ **IP Spoofing & Rotation** - Dynamic IP changing
- ✅ **Cipher Suite Randomization** - Random TLS ciphers
- ✅ **ALPN Protocol Manipulation** - Protocol negotiation tricks
- ✅ **Session Resumption Bypass** - Session handling evasion
- ✅ **JA3 Fingerprint Randomization** - TLS fingerprint randomization

### 📊 Scale Large
- ✅ **Cluster Multi-threading** - Efficient resource usage
- ✅ **Proxy Rotation & Load Balancing** - Automatic proxy management
- ✅ **Connection Keep-Alive & Reuse** - Connection pooling
- ✅ **Memory & Resource Optimization** - Low resource footprint
- ✅ **Auto-retry & Failover System** - Automatic recovery

### 🎮 User Friendly Interface
- ✅ **Remote Control via Telegram** - Bot integration
- ✅ **Real-time Status Monitoring** - Live attack statistics
- ✅ **Multi-user Support** - Multiple admin support
- ✅ **Security & Access Control** - Admin-only access
- ✅ **One-click Attack Setup** - Easy to use CLI

### ⚡ High Speed Attack
- **Max RPS:** 1000+ requests/second per thread
- **Max Threads:** 1000+ concurrent threads
- **Max Duration:** Unlimited with rotation
- **Proxy Support:** Unlimited proxies rotation
- **Methods Available:** 30+ Attack Vectors

### 🛡️ Protection Bypass Capabilities
- ✅ **Cloudflare** (All Security Levels)
- ✅ **WAF** (ModSecurity, NAXSI, Sucuri)
- ✅ **Rate Limiting** (Nginx, Apache, CloudFlare)
- ✅ **DDoS Protection** (Incapsula, Akamai, AWS Shield)

---

## 📦 Installation

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn
- Git

### Quick Install

```bash
# Clone repository
git clone https://github.com/MHProDev/MHDDoS.git
cd MHDDoS

# Install dependencies
npm install

# Make executable
chmod +x index.js

# Run
node index.js methods
```

### Using npm link (Optional)

```bash
npm link
mhddos methods
```

---

## 🎯 Usage

### Basic Command Structure

```bash
node index.js <command> [options]
```

### Available Commands

#### 1. **Attack Command**

```bash
node index.js attack -t <target> -m <method> [options]
```

**Options:**
- `-t, --target <url>` - Target URL or IP:PORT (required)
- `-m, --method <method>` - Attack method (required)
- `-th, --threads <number>` - Number of threads (default: 100)
- `-d, --duration <seconds>` - Attack duration (default: 60)
- `-r, --rpc <number>` - Requests per connection (default: 1)
- `-p, --proxy-type <type>` - Proxy type: 0=all, 1=http, 4=socks4, 5=socks5
- `-pf, --proxy-file <file>` - Proxy file path
- `--debug` - Enable debug mode

#### 2. **Methods Command**

```bash
node index.js methods
```

Lists all available attack methods.

#### 3. **Proxy Command**

```bash
node index.js proxy [options]
```

**Options:**
- `-t, --type <type>` - Proxy type (default: 0)
- `-o, --output <file>` - Output file (default: proxies.txt)

#### 4. **Telegram Bot**

```bash
node index.js telegram
```

Starts the Telegram bot for remote control.

---

## 🔫 Attack Methods

### Layer 4 (Network Layer)

| Method | Description | Target Format |
|--------|-------------|---------------|
| `UDP` | UDP Flood | `ip:port` |
| `TCP` | TCP Flood | `ip:port` |
| `SYN` | SYN Flood | `ip:port` |
| `MINECRAFT` | Minecraft Server Attack | `ip:port` |
| `MCBOT` | Minecraft Bot Spam | `ip:port` |
| `VSE` | Source Engine Query | `ip:port` |
| `TS3` | TeamSpeak 3 Attack | `ip:port` |
| `MCPE` | Minecraft PE Attack | `ip:port` |
| `FIVEM` | FiveM Server Attack | `ip:port` |

### Layer 7 (Application Layer)

#### Standard HTTP/1.1
| Method | Description | Target Format |
|--------|-------------|---------------|
| `GET` | HTTP GET Flood | `http(s)://target.com` |
| `POST` | HTTP POST Flood | `http(s)://target.com` |
| `HEAD` | HTTP HEAD Request | `http(s)://target.com` |
| `SLOW` | Slowloris Attack | `http(s)://target.com` |

#### HTTP/2 Advanced
| Method | Description | Target Format |
|--------|-------------|---------------|
| `HTTP2` | HTTP/2 GET Flood | `https://target.com` |
| `HTTP2-POST` | HTTP/2 POST Flood | `https://target.com` |
| `HTTP2-CF` | HTTP/2 Cloudflare Bypass | `https://target.com` |

#### HTTP/3 (Next-Gen QUIC)
| Method | Description | Target Format |
|--------|-------------|---------------|
| `HTTP3` | HTTP/3 GET Flood (QUIC Protocol) | `https://target.com` |
| `HTTP3-POST` | HTTP/3 POST Flood | `https://target.com` |

#### Bypass Methods
| Method | Description | Target Format |
|--------|-------------|---------------|
| `CFB` | Cloudflare Bypass | `https://target.com` |
| `BYPASS` | Advanced Bypass | `https://target.com` |
| `BOT` | Bot Simulation | `https://target.com` |
| `CFBUAM` | Cloudflare UAM Bypass | `https://target.com` |
| `PRIVACYPASS` | PrivacyPass Token System | `https://target.com` |
| `CAPTCHA` | CAPTCHA Bypass (2Captcha/Anti-Captcha) | `https://target.com` |
| `ULTIMATE` | Ultimate Bypass (All Methods Combined) | `https://target.com` |

#### Special Methods
| Method | Description | Target Format |
|--------|-------------|---------------|
| `STRESS` | Stress Test (Large POST) | `https://target.com` |
| `COOKIE` | Cookie-based Attack | `https://target.com` |
| `APACHE` | Apache Range Attack | `https://target.com` |
| `XMLRPC` | WordPress XMLRPC | `https://target.com` |
| `NULL` | Null User-Agent | `https://target.com` |

---

## 🤖 Telegram Bot

### Setup

1. Create a bot with [@BotFather](https://t.me/BotFather)
2. Get your bot token
3. Get your Telegram user ID from [@userinfobot](https://t.me/userinfobot)
4. Copy `.env.example` to `.env` and fill in your credentials:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_ADMIN_ID=your_user_id_here
```

5. Start the bot:

```bash
node index.js telegram
```

### Bot Commands

- `/start` - Show welcome message
- `/attack <method> <target> <threads> <duration>` - Start attack
- `/stop` - Stop current attack
- `/status` - Check attack status
- `/methods` - List all methods
- `/help` - Show help

### Example Bot Usage

```
/attack GET https://example.com 100 60
```

---

## 📋 Logging System

### Enhanced Logging Features

The bot now includes a comprehensive logging system that records all activities and errors:

- **📄 General Log** - All activities (INFO, DEBUG, WARNING, ERROR, SUCCESS)
- **❌ Error Log** - Errors with full stack traces for debugging
- **⚠️  Warning Log** - Warnings that need attention
- **🤖 Bot Log** - Telegram bot activities (commands, user interactions)
- **⚔️  Attack Log** - Attack activities (start, stop, status)

### Log Files Location

```
logs/
├── general-{YYYY-MM-DD}.log    # All logs
├── errors-{YYYY-MM-DD}.log     # Errors only
├── warnings-{YYYY-MM-DD}.log   # Warnings only
├── bot-{YYYY-MM-DD}.log        # Bot activities
└── attacks-{YYYY-MM-DD}.log    # Attack logs
```

### View Logs

#### Interactive Log Viewer (Recommended)
```bash
./view_logs.sh
```

Features:
- ✅ View different log types
- 🔍 Search keywords
- 📊 Statistics
- 🔄 Real-time monitoring
- 📁 List all logs

#### Manual Commands
```bash
# View today's logs
cat logs/general-$(date +%Y-%m-%d).log

# Monitor real-time
tail -f logs/general-$(date +%Y-%m-%d).log

# View errors only
cat logs/errors-$(date +%Y-%m-%d).log

# Search for keyword
grep -i "error" logs/*.log
```

### Features

- ✅ Automatic log file creation
- ✅ Daily log rotation
- ✅ Auto-cleanup (30 days retention)
- ✅ Full error stack traces
- ✅ ISO timestamp format
- ✅ Color-coded console output
- ✅ JSON object logging support

### Documentation

- **[LOGGING_SYSTEM.md](LOGGING_SYSTEM.md)** - Quick guide & examples
- **[LOGGING_GUIDE.md](LOGGING_GUIDE.md)** - Complete documentation
- **[logs/README.md](logs/README.md)** - Detailed log file reference

---

## 🐳 Docker Support

### Using Docker Compose

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Run Telegram Bot with Docker

```bash
# Create .env file first
cp .env.example .env
# Edit .env with your credentials

# Start with telegram profile
docker-compose --profile telegram up -d
```

### Manual Docker Commands

```bash
# Build image
docker build -t mhddos-nodejs .

# Run attack
docker run --rm mhddos-nodejs attack \
  -t https://example.com \
  -m GET \
  -th 100 \
  -d 60

# List methods
docker run --rm mhddos-nodejs methods
```

---

## ⚙️ Configuration

### config.json

```json
{
  "MCBOT": "MHDDoS_",
  "MINECRAFT_DEFAULT_PROTOCOL": 47,
  "proxy-providers": [
    {
      "type": 4,
      "url": "https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/socks4.txt",
      "timeout": 5
    },
    {
      "type": 5,
      "url": "https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/socks5.txt",
      "timeout": 5
    },
    {
      "type": 1,
      "url": "https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt",
      "timeout": 5
    }
  ]
}
```

### Proxy Types
- `0` - All proxies (HTTP, SOCKS4, SOCKS5)
- `1` - HTTP/HTTPS proxies
- `4` - SOCKS4 proxies
- `5` - SOCKS5 proxies

---

## 💡 Examples

### Example 1: Basic GET Attack

```bash
node index.js attack \
  -t https://example.com \
  -m GET \
  -th 100 \
  -d 60
```

### Example 2: HTTP/2 Cloudflare Bypass

```bash
node index.js attack \
  -t https://cloudflare-protected-site.com \
  -m HTTP2-CF \
  -th 200 \
  -d 120 \
  -r 5
```

### Example 3: Layer 4 UDP Attack

```bash
node index.js attack \
  -t 1.2.3.4:80 \
  -m UDP \
  -th 500 \
  -d 300
```

### Example 4: Minecraft Server Attack

```bash
node index.js attack \
  -t minecraft-server.com:25565 \
  -m MCBOT \
  -th 50 \
  -d 180
```

### Example 5: Attack with Proxies

```bash
# First, download proxies
node index.js proxy -t 5 -o socks5.txt

# Then use them in attack
node index.js attack \
  -t https://example.com \
  -m GET \
  -th 100 \
  -d 60 \
  -p 5 \
  -pf socks5.txt
```

### Example 6: Slowloris Attack

```bash
node index.js attack \
  -t https://example.com \
  -m SLOW \
  -th 300 \
  -d 600
```

---

## 📊 Performance Tips

1. **Use HTTP/2 methods** for better performance on modern servers
2. **Enable proxies** to distribute load and avoid IP bans
3. **Adjust RPC value** - Higher RPC = More requests per connection
4. **Monitor resources** - Don't exceed your system's capabilities
5. **Use appropriate threads** - More isn't always better

### Recommended Configurations

#### For Cloudflare-Protected Sites
```bash
Method: HTTP2-CF or CFB
Threads: 200-500
RPC: 5-10
Duration: 120-300s
Proxies: Recommended
```

#### For Unprotected Sites
```bash
Method: GET or POST
Threads: 100-200
RPC: 1-5
Duration: 60-120s
Proxies: Optional
```

#### For Layer 4 Attacks
```bash
Method: UDP or TCP
Threads: 500-1000
Duration: 300-600s
Proxies: Not needed
```

---

## 🔒 Legal Disclaimer

> **⚠️ WARNING: This tool is for educational purposes and authorized security testing only.**

This tool is intended for:
- Security research and testing
- Authorized penetration testing
- Load testing your own infrastructure
- Educational purposes

**DO NOT:**
- Attack systems without explicit written permission
- Use this tool for illegal activities
- Violate any laws or regulations
- Cause harm to any system or network

**The developers are not responsible for any misuse or damage caused by this tool.**

Users are solely responsible for their actions and must comply with all applicable laws and regulations in their jurisdiction.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 Changelog

### Version 3.0.0 (Node.js Rewrite)
- ✨ Complete rewrite in Node.js
- ✨ Added HTTP/2 support
- ✨ Added Telegram bot integration
- ✨ Improved proxy management
- ✨ Better performance and resource usage
- ✨ Modular architecture
- ✨ Real-time statistics
- ✨ Docker support
- ✨ Modern CLI interface

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Authors

**MHProDev** - Original Developer
- GitHub: [@MHProDev](https://github.com/MHProDev)

**Aryzz-Dev** - Maximization, License System & Advanced Features
- GitHub: [@AryzXploit](https://github.com/AryzXploit)
- All methods maximized (100-1000x performance boost)
- Complete encrypted license system
- Telegram license bot integration
- PrivacyPass Token System implementation
- CAPTCHA Bypass Integration (2Captcha, Anti-Captcha, CapMonster)
- HTTP/3 (QUIC) Protocol support with fallback
- Ultimate Bypass method combining all techniques

---

## 🌟 Star History

If you find this tool useful, please consider giving it a star ⭐

---

## 📞 Support

For support, questions, or suggestions:
- Open an issue on GitHub
- Contact via Telegram (see bot for details)

---

<div align="center">

**Made with ❤️ by MHProDev**

*Remember: With great power comes great responsibility*

</div>
