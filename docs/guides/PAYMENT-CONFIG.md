# 💰 Payment Configuration - Aryzz DDoS Panel

## Payment Methods

### 1. DANA
- **Nomor:** 0899-9849-763
- **Atas Nama:** Arya (sesuaikan)
- **Metode:** Transfer DANA

### 2. QRIS
- **Merchant:** HotelMurah / Arya
- **Scan:** Upload QR Code image
- **Support:** All e-wallets (GoPay, OVO, ShopeePay, LinkAja, dll)

---

## 💎 Credit Packages

### Starter Package
- **Price:** Rp 15.000
- **Credits:** 100 credits
- **Duration:** 30 days
- **Features:**
  - Basic attack methods
  - Max 300 threads
  - Max 60s duration
  - 10 attacks per day

### Bronze Package
- **Price:** Rp 30.000
- **Credits:** 250 credits
- **Duration:** 30 days
- **Features:**
  - All attack methods
  - Max 500 threads
  - Max 120s duration
  - 25 attacks per day

### Silver Package
- **Price:** Rp 50.000
- **Credits:** 500 credits
- **Duration:** 30 days
- **Features:**
  - All attack methods
  - Max 800 threads
  - Max 180s duration
  - 50 attacks per day
  - Priority support

### Gold Package
- **Price:** Rp 100.000
- **Credits:** 1200 credits
- **Duration:** 30 days
- **Features:**
  - All attack methods
  - Max 1000 threads
  - Max 300s duration
  - Unlimited attacks
  - Priority support
  - Custom profiles

### Platinum Package
- **Price:** Rp 200.000
- **Credits:** 3000 credits
- **Duration:** 60 days
- **Features:**
  - All attack methods
  - Max 1000 threads
  - Max 600s duration
  - Unlimited attacks
  - VIP support
  - Custom profiles
  - API access

---

## 📊 Credit Usage

### Per Attack Cost:
```
Credit Cost = (Threads / 10) × (Duration / 60)

Examples:
- 100 threads, 60s = 10 credits
- 500 threads, 180s = 150 credits
- 1000 threads, 300s = 500 credits
```

### Combo Attack:
```
Credit Cost = Base Cost × Number of Methods × 1.5

Example:
- 500 threads, 180s, 4 methods = 150 × 4 × 1.5 = 900 credits
```

---

## 🔄 Payment Flow

### User Side:
1. Login to panel
2. Go to "Buy Credits"
3. Select package
4. Choose payment method (DANA/QRIS)
5. See payment details
6. Make payment
7. Upload proof (screenshot)
8. Wait for admin approval
9. Credits added automatically

### Admin Side:
1. Receive notification
2. Check payment proof
3. Verify transaction
4. Approve/Reject
5. Credits auto-added if approved
6. User gets notification

---

## 📱 Payment Instructions

### DANA Payment:
```
1. Buka aplikasi DANA
2. Pilih "Kirim"
3. Masukkan nomor: 0899-9849-763
4. Masukkan nominal sesuai paket
5. Tambahkan catatan: Username Panel
6. Konfirmasi pembayaran
7. Screenshot bukti transfer
8. Upload ke panel
```

### QRIS Payment:
```
1. Buka e-wallet (GoPay/OVO/ShopeePay/dll)
2. Pilih "Scan QR"
3. Scan QR Code yang ditampilkan
4. Masukkan nominal sesuai paket
5. Tambahkan catatan: Username Panel
6. Konfirmasi pembayaran
7. Screenshot bukti transfer
8. Upload ke panel
```

---

## 🎯 Auto-Approval Rules

### Instant Approval (if enabled):
- Amount matches exactly
- Valid proof image
- Recent timestamp (< 1 hour)
- No duplicate transaction

### Manual Approval:
- Admin reviews within 1-24 hours
- Check proof validity
- Verify amount
- Approve/Reject with reason

---

## 📧 Notification System

### User Notifications:
- Payment submitted
- Payment approved
- Payment rejected (with reason)
- Credits added
- Credits low warning
- Package expired

### Admin Notifications:
- New payment request
- User registered
- High credit usage
- Suspicious activity

---

## 🔐 Security

### Payment Proof:
- Image validation (JPG, PNG only)
- Max size: 5MB
- Stored securely
- Auto-delete after 30 days

### Transaction:
- Unique transaction ID
- Timestamp tracking
- IP logging
- Duplicate prevention

---

## 📊 Admin Dashboard

### Payment Management:
- Pending payments list
- Approved payments history
- Rejected payments log
- Revenue statistics
- Popular packages

### User Management:
- Active users
- Credit balance
- Usage statistics
- Ban/Unban users
- Manual credit adjustment

---

## 🚀 Deployment Config

### Environment Variables:
```env
# Payment Config
DANA_NUMBER=089998497763
DANA_NAME=Arya
QRIS_IMAGE_URL=/uploads/qris.png

# Package Prices (in IDR)
STARTER_PRICE=15000
BRONZE_PRICE=30000
SILVER_PRICE=50000
GOLD_PRICE=100000
PLATINUM_PRICE=200000

# Auto Approval
AUTO_APPROVE=false
APPROVAL_TIMEOUT=24

# Upload Config
UPLOAD_MAX_SIZE=5242880
UPLOAD_PATH=/uploads/proofs/
```

---

## 💡 Tips for Users

1. **Screenshot harus jelas** - Tampilkan nominal, waktu, dan nomor tujuan
2. **Sesuaikan nominal** - Transfer exact amount untuk auto-approval
3. **Tambahkan catatan** - Tulis username panel di catatan transfer
4. **Upload segera** - Jangan tunggu lama setelah transfer
5. **Cek status** - Monitor status approval di dashboard

---

## 📞 Support

**Admin Contact:**
- Telegram: @AryzzXploit
- WhatsApp: 0899-9849-763 (DANA number)
- Email: support@aryapanel.xyz

**Panel URL:**
- https://ddos.aryapanel.xyz

---

**🔥 PREMIUM DDOS PANEL - PAYMENT SYSTEM 🔥**

Developed by Aryzz-Dev (@AryzXploit)
