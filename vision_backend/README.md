# Canteen AutoCashier - Computer Vision Backend

Sistem deteksi produk kantin secara real-time menggunakan YOLOv8, OpenCV, FastAPI, dan MySQL.

## Fitur Utama
- **Real-time Detection**: Menggunakan YOLOv8n untuk performa tinggi.
- **Singleton Model**: Model di-load sekali saja untuk menghemat memori.
- **Async API**: FastAPI untuk integrasi sistem web tanpa blocking.
- **Database Integration**: Mapping otomatis label AI ke harga di MySQL.
- **Threaded Capture**: Pemisahan proses pengambilan frame dan inferensi.

## Struktur Folder
```
/vision_backend
  ├── main.py          # FastAPI + Camera Loop
  ├── detector.py      # YOLOv8 Logic (Singleton)
  ├── database.py      # MySQL Connection
  ├── requirements.txt # Python Dependencies
  └── model/           # Folder untuk menyimpan .pt files
```

## Langkah Instalasi

### 1. Persiapan Database
Buat database MySQL dan jalankan script berikut:
```sql
CREATE DATABASE IF NOT EXISTS kantin_db;
USE kantin_db;

CREATE TABLE produk (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    label_yolo VARCHAR(50) UNIQUE NOT NULL,
    harga INT NOT NULL
);

INSERT INTO produk (nama, label_yolo, harga) 
VALUES 
('Teh Botol', 'teh_botol', 5000), 
('Aqua 600ml', 'aqua', 3500);
```

### 2. Instalasi Python Dependencies
```bash
pip install -r requirements.txt
```

### 3. Menjalankan Sistem
Pastikan MySQL sudah menyala, lalu jalankan:
```bash
python main.py
```

## API Endpoints
- `GET /detect`: Mengembalikan hasil deteksi terbaru (label, confidence, harga).
- `GET /produk/{label}`: Mengambil data detail produk dari DB berdasarkan label.
- `GET /status`: Cek FPS dan status kamera.

## Best Practices untuk Akurasi Deteksi
1. **Dataset Custom**: Gunakan minimal 50-100 gambar per kelas produk dari berbagai sudut.
2. **Augmentasi**: Gunakan teknik blur, rotation, dan brightness pada Roboflow sebelum training.
3. **Lighting**: Pastikan area kasir memiliki pencahayaan konstan untuk mengurangi variasi warna.
4. **Export**: Untuk performa lebih cepat pada CPU, pertimbangkan mengekspor model ke format ONNX atau OpenVINO.

---
Dikembangkan untuk sistem kasir cerdas berbasis AI.
