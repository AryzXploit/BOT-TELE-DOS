# CloudFlare Setup Guide - ddos.aryapanel.xyz

## Setup untuk Aryzz DDoS Panel

---

## 🌐 Step 1: CloudFlare DNS Setup

### 1. Login ke CloudFlare Dashboard
- Buka: https://dash.cloudflare.com
- Login dengan akun kamu

### 2. Pilih Domain (aryapanel.xyz)
- Klik domain **aryapanel.xyz**
- Masuk ke menu **DNS**

### 3. Tambah A Record untuk Subdomain
```
Type: A
Name: ddos
Content: [IP_SERVER_KAMU]
Proxy status: Proxied (Orange Cloud)
TTL: Auto
```

**Contoh:**
```
Type: A
Name: ddos
Content: 103.123.45.67  (ganti dengan IP server kamu)
Proxy: ON (Orange Cloud)
```

### 4. Save DNS Record
- Klik **Save**
- Tunggu propagasi (biasanya 1-5 menit)

---

## 🔧 Step 2: Server Setup (Nginx Reverse Proxy)

### 1. Install Nginx
```bash
sudo apt update
sudo apt install nginx -y
```

### 2. Create Nginx Config
```bash
sudo nano /etc/nginx/sites-available/ddos.aryapanel.xyz
```

### 3. Paste Config Ini:
```nginx
server {
    listen 80;
    server_name ddos.aryapanel.xyz;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ddos.aryapanel.xyz;

    # SSL Certificate (CloudFlare Origin Certificate)
    ssl_certificate /etc/nginx/ssl/cloudflare.crt;
    ssl_certificate_key /etc/nginx/ssl/cloudflare.key;

    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Node.js App
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # WebSocket Support
        proxy_read_timeout 86400;
    }

    # Static Files (Optional)
    location /static {
        alias /home/arya/BOT-TELE-DOS/src/web/public;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Uploads (Optional)
    location /uploads {
        alias /home/arya/BOT-TELE-DOS/uploads;
        expires 7d;
    }
}
```

### 4. Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/ddos.aryapanel.xyz /etc/nginx/sites-enabled/
```

### 5. Test Nginx Config
```bash
sudo nginx -t
```

---

## 🔐 Step 3: SSL Certificate (CloudFlare Origin)

### Option A: CloudFlare Origin Certificate (Recommended)

#### 1. Generate Origin Certificate di CloudFlare
- Dashboard CloudFlare → **SSL/TLS** → **Origin Server**
- Klik **Create Certificate**
- Pilih:
  - **Private key type:** RSA (2048)
  - **Hostnames:** `*.aryapanel.xyz, aryapanel.xyz`
  - **Certificate Validity:** 15 years
- Klik **Create**

#### 2. Copy Certificate & Key
- Copy **Origin Certificate** → Save as `cloudflare.crt`
- Copy **Private Key** → Save as `cloudflare.key`

#### 3. Upload ke Server
```bash
# Create SSL directory
sudo mkdir -p /etc/nginx/ssl

# Upload certificates (paste content)
sudo nano /etc/nginx/ssl/cloudflare.crt
# Paste Origin Certificate

sudo nano /etc/nginx/ssl/cloudflare.key
# Paste Private Key

# Set permissions
sudo chmod 600 /etc/nginx/ssl/cloudflare.key
sudo chmod 644 /etc/nginx/ssl/cloudflare.crt
```

### Option B: Let's Encrypt (Alternative)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get Certificate
sudo certbot --nginx -d ddos.aryapanel.xyz

# Auto-renewal
sudo certbot renew --dry-run
```

---

## 🚀 Step 4: Start Application

### 1. Install PM2 (Process Manager)
```bash
npm install -g pm2
```

### 2. Start Web Dashboard
```bash
cd /home/arya/BOT-TELE-DOS
pm2 start index.js --name "aryzz-panel" -- web-dashboard
```

### 3. Save PM2 Config
```bash
pm2 save
pm2 startup
```

### 4. Restart Nginx
```bash
sudo systemctl restart nginx
```

---

## ⚙️ Step 5: CloudFlare Settings

### 1. SSL/TLS Mode
- Dashboard → **SSL/TLS** → **Overview**
- Set to: **Full (strict)**

### 2. Always Use HTTPS
- Dashboard → **SSL/TLS** → **Edge Certificates**
- Enable: **Always Use HTTPS**

### 3. Minimum TLS Version
- Set to: **TLS 1.2**

### 4. Automatic HTTPS Rewrites
- Enable: **ON**

### 5. Firewall Rules (Optional)
- Dashboard → **Security** → **WAF**
- Add rules untuk protect admin panel:
```
(http.request.uri.path contains "/admin" and not ip.geoip.country in {"ID"})
Action: Block
```

---

## 🔥 Step 6: Firewall Setup (UFW)

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP & HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## 📊 Step 7: Monitoring & Logs

### PM2 Logs
```bash
# View logs
pm2 logs aryzz-panel

# Monitor
pm2 monit
```

### Nginx Logs
```bash
# Access log
sudo tail -f /var/log/nginx/access.log

# Error log
sudo tail -f /var/log/nginx/error.log
```

---

## 🧪 Testing

### 1. Test DNS
```bash
nslookup ddos.aryapanel.xyz
```

### 2. Test HTTP → HTTPS Redirect
```bash
curl -I http://ddos.aryapanel.xyz
```

### 3. Test HTTPS
```bash
curl -I https://ddos.aryapanel.xyz
```

### 4. Test WebSocket
- Buka browser: https://ddos.aryapanel.xyz
- Login dan test attack control
- Check real-time stats update

---

## 🔧 Troubleshooting

### Issue: 502 Bad Gateway
**Solution:**
```bash
# Check if app is running
pm2 status

# Restart app
pm2 restart aryzz-panel

# Check nginx
sudo nginx -t
sudo systemctl restart nginx
```

### Issue: SSL Error
**Solution:**
```bash
# Check certificate
sudo openssl x509 -in /etc/nginx/ssl/cloudflare.crt -text -noout

# Check nginx config
sudo nginx -t
```

### Issue: WebSocket Not Working
**Solution:**
- Check CloudFlare WebSocket is enabled
- Dashboard → **Network** → Enable **WebSockets**

---

## 📝 Quick Commands

```bash
# Restart everything
pm2 restart aryzz-panel
sudo systemctl restart nginx

# View logs
pm2 logs aryzz-panel --lines 100

# Stop app
pm2 stop aryzz-panel

# Start app
pm2 start aryzz-panel

# Delete app from PM2
pm2 delete aryzz-panel
```

---

## 🎯 Final Checklist

- [ ] CloudFlare DNS A record created (ddos → IP)
- [ ] Nginx installed & configured
- [ ] SSL certificate installed
- [ ] CloudFlare SSL mode: Full (strict)
- [ ] PM2 installed & app running
- [ ] Firewall configured (UFW)
- [ ] HTTPS working
- [ ] WebSocket working
- [ ] Admin panel accessible
- [ ] Payment system working

---

## 🌐 Access URLs

**Production:**
- https://ddos.aryapanel.xyz

**Admin Panel:**
- https://ddos.aryapanel.xyz/admin

**Default Login:**
- Username: admin
- Password: admin123

---

## 🔒 Security Recommendations

1. **Change Default Admin Password**
```sql
-- Connect to database
sqlite3 panel.db

-- Update admin password
UPDATE users SET password = '[NEW_BCRYPT_HASH]' WHERE username = 'admin';
```

2. **Enable CloudFlare Bot Fight Mode**
- Dashboard → **Security** → **Bots**

3. **Add Rate Limiting**
- Dashboard → **Security** → **Rate Limiting**

4. **Enable DDoS Protection**
- Already enabled by CloudFlare proxy

5. **Regular Backups**
```bash
# Backup database
cp panel.db panel.db.backup.$(date +%Y%m%d)

# Backup uploads
tar -czf uploads.backup.tar.gz uploads/
```

---

## 📞 Support

**Developer:** Aryzz-Dev
**Telegram:** @AryzzXploit
**DANA:** 0899-9849-763

---

**Setup Complete! Your panel is now live at:**
**https://ddos.aryapanel.xyz** 🚀
