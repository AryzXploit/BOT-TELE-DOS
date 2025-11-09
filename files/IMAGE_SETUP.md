# Image Setup untuk Telegram Bot

## Instruksi

Untuk menampilkan gambar pada command `/start` dan saat attack dimulai, Anda perlu menambahkan file `image.jpg` di folder ini.

### Langkah-langkah:

1. Siapkan gambar yang ingin ditampilkan (format: JPG/JPEG)
2. Rename gambar tersebut menjadi `image.jpg`
3. Copy file `image.jpg` ke folder `/workspace/files/`

### Contoh struktur folder:
```
/workspace/
├── files/
│   ├── image.jpg          <-- Letakkan gambar di sini
│   ├── referers.txt
│   └── useragent.txt
```

### Catatan:
- Jika file `image.jpg` tidak ditemukan, bot akan tetap berfungsi normal tanpa mengirim gambar
- Format yang didukung: JPG, JPEG
- Ukuran gambar yang direkomendasikan: maksimal 5MB
- Resolusi yang direkomendasikan: 1280x720 atau lebih kecil

### Testing:
Setelah menambahkan gambar, test dengan command:
- `/start` - Harus menampilkan gambar dengan welcome message
- Start attack - Harus menampilkan gambar saat attack dimulai
