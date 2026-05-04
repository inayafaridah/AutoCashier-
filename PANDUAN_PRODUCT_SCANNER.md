# 📱 Panduan Product Scanner - Fokus Produk Terdaftar

## Cara Kerja Scanner Baru

Scanner sekarang **hanya fokus ke produk yang sudah terdaftar** di Master Products. Ini membuat deteksi lebih akurat dan menghindari kesalahan pencocokan.

```
📸 Scan Produk → 🤖 Deteksi YOLO → ✅ Cocokkan ke Database → ✔️ Tampilkan Hasil
```

---

## Langkah Registrasi Produk untuk Scanner

### 1️⃣ **Buka Master Products**
- Pergi ke `Master Products` menu
- Klik `+ New Product`

### 2️⃣ **Isi Data Produk**
```
Nama: Tel U Water 1500ml
SKU: TEL-U-1500
Harga: Rp 15.000
Stok: 100
Kategori: Minuman
```

### 3️⃣ **Set AI Label (PENTING!)**
AI Label digunakan scanner untuk pencocokan. Gunakan format:
- **Brand + Deskripsi Singkat**
- Contoh: `water bottle`, `mineral water`, `cimory yogurt`
- Hindari: terlalu panjang, spesifikasi teknis

**Contoh AI Labels yang Baik:**
```
✅ water bottle plain
✅ cimory yogurt plain
✅ coca cola bottle
✅ sprite drink
❌ water bottle clear transparent 1500ml
❌ mineral water for scanning detection
```

### 4️⃣ **Upload Foto Produk**
Ambil foto dari 4 sudut:
- **Front**: Logo/label utama terlihat
- **Back**: Barcode/informasi
- **Left & Right**: Sisi produk

**Tips Foto Berkualitas:**
- ✅ Pencahayaan terang merata
- ✅ Background netral/kontras
- ✅ Produk terlihat jelas dan tajam
- ✅ Tidak blur atau berkilau

### 5️⃣ **Simpan Produk**
- Klik `Save Product`
- YOLO akan validasi dan ekstrak AI label
- Produk siap untuk di-scan!

---

## Saat Menggunakan Scanner

### ✅ Scan Berhasil
```
[Produk Terdaftar Ditemukan]
✓ Cimory Yogurt Plain
✓ Harga: Rp 8.000
✓ Stok: 50 pcs
✓ Match: 93% (Exact)
```

### ❌ Produk Tidak Terdaftar
```
[Produk Tidak Terdaftar]
Terdeteksi sebagai: water bottle
Scanner hanya mencocokkan produk yang terdaftar 
di Master Products.
```

**Solusi:**
1. Registrasi produk ke Master Products terlebih dahulu
2. Set AI Label yang sesuai
3. Coba scan lagi

---

## Troubleshooting

### Scan tidak mengenali produk terdaftar
**Penyebab:** Foto produk kurang jelas atau AI Label tidak sesuai

**Solusi:**
1. Edit produk → Update foto dengan pencahayaan lebih baik
2. Ubah AI Label menjadi lebih deskriptif
3. Coba scan ulang

### Scan detect produk lain
**Penyebab:** Kemiripan visual dengan produk lain atau ai_label tidak spesifik

**Solusi:**
1. Update AI Label menjadi lebih unik
2. Pastikan foto produk berbeda dengan produk lain
3. Jika hasil tetap salah, edit manual di hasil scan

### Foto produk terlalu blur/tidak jelas
**Penyebab:** Pencahayaan buruk, fokus tidak tepat

**Solusi:**
- Ambil ulang foto di ruangan dengan cahaya alami
- Pastikan produk diam/tidak bergerak
- Jarak optimal: 15-30 cm dari kamera

---

## Best Practices

| ✅ DO | ❌ DON'T |
|------|---------|
| Gunakan AI Label spesifik | Gunakan AI Label generik |
| Foto jelas dan terang | Foto gelap/blur |
| Satu produk per registrasi | Mix multiple variants |
| Background netral | Background berantakan |
| Produk utama visible | Produk tertutup/sebagian |

---

## Tips untuk Akurasi Maksimal

1. **Saat Registrasi:**
   - Foto dari berbagai sudut
   - Set AI Label unik dan spesifik
   - Test scan 2-3 kali sebelum finalkan

2. **Saat Scanning:**
   - Cahaya cukup (jangan backlight)
   - Arahkan produk ke kamera dengan lurus
   - Tahan steady 2-3 detik

3. **Monitoring:**
   - Catat produk yang sering terdeteksi salah
   - Update AI Label berdasarkan pola error
   - Refresh foto produk secara berkala

---

**Butuh bantuan?** Hubungi admin untuk training lebih detail!
