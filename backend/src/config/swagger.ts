import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '🛒 AutoCashier API',
      version: '1.0.0',
      description: `
## AutoCashier Backend API

REST API untuk sistem kasir otomatis berbasis AI dengan validasi produk menggunakan **YOLOv8**.

### Fitur Utama
- 🔐 **Autentikasi** JWT-based login
- 📦 **Master Produk** CRUD dengan validasi foto YOLO
- 🔍 **Live Detection** Deteksi produk real-time dari kamera
- 🗄️ **Database** Supabase PostgreSQL

### Base URL
- Development: \`http://localhost:5000/api\`
      `,
      contact: {
        name: 'AutoCashier Team',
        email: 'dev@autocashier.id',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: '🔧 Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Masukkan token JWT dari endpoint /auth/login',
        },
      },
      schemas: {
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
            sku: { type: 'string', example: 'PROD-AIR-8F2A1B3C' },
            name: { type: 'string', example: 'Air Mineral 600ml' },
            price: { type: 'number', example: 3000 },
            stock: { type: 'integer', example: 50 },
            category: { type: 'string', nullable: true, example: 'Minuman' },
            ai_label: { type: 'string', nullable: true, example: 'bottle' },
            image_url: { type: 'string', nullable: true, example: '/uploads/imageFront-123456.jpg' },
            created_at: { type: 'string', format: 'date-time', example: '2026-05-02T06:00:00Z' },
          },
        },
        CreateProductRequest: {
          type: 'object',
          required: ['name', 'basePrice', 'imageLeft', 'imageRight', 'imageFront'],
          properties: {
            name: { type: 'string', example: 'Air Mineral 600ml' },
            basePrice: { type: 'number', example: 3000 },
            category: { type: 'string', example: 'Minuman' },
            imageLeft: { type: 'string', format: 'binary', description: 'Foto sudut kiri produk' },
            imageRight: { type: 'string', format: 'binary', description: 'Foto sudut kanan produk' },
            imageFront: { type: 'string', format: 'binary', description: 'Foto sudut depan produk' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string', example: 'admin' },
            password: { type: 'string', example: 'admin123', format: 'password' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    username: { type: 'string', example: 'admin' },
                    role: { type: 'string', example: 'super_admin' },
                  },
                },
              },
            },
          },
        },
        DetectionResult: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            detected: { type: 'boolean', example: true },
            confidence: { type: 'number', format: 'float', example: 0.87 },
            label: { type: 'string', nullable: true, example: 'bottle' },
            all_detections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  class: { type: 'string', example: 'bottle' },
                  confidence: { type: 'number', example: 0.87 },
                },
              },
            },
            simulation: { type: 'boolean', example: false, description: 'true jika YOLO berjalan dalam mode simulasi' },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            error: { type: 'string', example: 'Pesan error detail' },
            code: { type: 'string', example: 'PGRST204', nullable: true },
          },
        },
      },
    },
    tags: [
      { name: 'Health', description: '🏥 Status server' },
      { name: 'Auth', description: '🔐 Autentikasi pengguna' },
      { name: 'Products', description: '📦 Master data produk dengan validasi YOLO' },
      { name: 'Detection', description: '🔍 Deteksi produk real-time menggunakan YOLOv8' },
    ],
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Cek status server',
          description: 'Mengembalikan status server dan waktu uptime.',
          responses: {
            200: {
              description: 'Server berjalan normal',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      uptime: { type: 'number', example: 3600 },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login pengguna',
          description: 'Autentikasi dengan username dan password. Mengembalikan JWT token.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'Login berhasil',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LoginResponse' },
                },
              },
            },
            401: {
              description: 'Kredensial salah',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Data pengguna yang sedang login',
          description: 'Mengembalikan data profil pengguna berdasarkan JWT token.',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Data pengguna berhasil diambil',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SuccessResponse' },
                },
              },
            },
            401: { description: 'Token tidak valid atau tidak diberikan' },
          },
        },
      },
      '/products': {
        get: {
          tags: ['Products'],
          summary: 'Ambil semua produk',
          description: 'Mengembalikan daftar semua produk dari database, diurutkan dari terbaru.',
          responses: {
            200: {
              description: 'Daftar produk berhasil diambil',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Product' },
                      },
                    },
                  },
                },
              },
            },
            500: {
              description: 'Gagal mengambil data',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
          },
        },
        post: {
          tags: ['Products'],
          summary: 'Tambah produk baru dengan validasi YOLO',
          description: `
Menambahkan produk baru ke database.

**Proses validasi:**
1. Upload 3 foto produk (kiri, kanan, depan)
2. Foto divalidasi menggunakan model **YOLOv8n**
3. Jika deteksi gagal → HTTP 422
4. Jika berhasil → produk disimpan ke Supabase dengan SKU auto-generated

**Catatan:** Gunakan \`Content-Type: multipart/form-data\`
          `,
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: { $ref: '#/components/schemas/CreateProductRequest' },
              },
            },
          },
          responses: {
            201: {
              description: 'Produk berhasil ditambahkan',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      data: { $ref: '#/components/schemas/Product' },
                      yolo: {
                        type: 'object',
                        properties: {
                          message: { type: 'string', example: 'Validasi YOLO berhasil!' },
                          ai_label: { type: 'string', example: 'bottle' },
                        },
                      },
                    },
                  },
                },
              },
            },
            400: { description: 'Foto tidak lengkap atau field wajib tidak diisi' },
            422: {
              description: 'Validasi YOLO gagal — produk tidak terdeteksi dalam foto',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'error' },
                      error: { type: 'string', example: 'Deteksi produk gagal pada 2 foto' },
                      details: { type: 'array', items: { type: 'object' } },
                    },
                  },
                },
              },
            },
            500: { description: 'Kesalahan server internal' },
          },
        },
      },
      '/products/{id}': {
        get: {
          tags: ['Products'],
          summary: 'Ambil produk berdasarkan ID',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'UUID produk',
              example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            },
          ],
          responses: {
            200: {
              description: 'Produk ditemukan',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } },
            },
            404: { description: 'Produk tidak ditemukan' },
          },
        },
        put: {
          tags: ['Products'],
          summary: 'Update produk',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'UUID produk',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'Nama Baru' },
                    price: { type: 'number', example: 5000 },
                    category: { type: 'string', example: 'Snack' },
                    stock: { type: 'integer', example: 100 },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Produk berhasil diupdate' },
            500: { description: 'Gagal update produk' },
          },
        },
        delete: {
          tags: ['Products'],
          summary: 'Hapus produk',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'uuid' },
              description: 'UUID produk',
            },
          ],
          responses: {
            200: { description: 'Produk berhasil dihapus' },
            500: { description: 'Gagal hapus produk' },
          },
        },
      },
      '/detect': {
        post: {
          tags: ['Detection'],
          summary: 'Deteksi objek pada gambar menggunakan YOLOv8',
          description: `
Menganalisis satu gambar menggunakan model **YOLOv8n** dan mengembalikan semua objek yang terdeteksi.

**Cara kerja:**
1. Upload satu gambar
2. Backend menjalankan Python script dengan \`ultralytics\`
3. Mengembalikan label, confidence, dan semua deteksi

**Field yang dikembalikan:**
- \`detected\`: apakah ada objek yang terdeteksi
- \`confidence\`: keyakinan tertinggi (0.0 – 1.0)  
- \`label\`: nama kelas objek utama (bottle, person, cup, dll)
- \`all_detections\`: semua objek yang terdeteksi dalam gambar
- \`simulation\`: \`true\` jika YOLOv8 tidak tersedia (mode simulasi)
          `,
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['image'],
                  properties: {
                    image: {
                      type: 'string',
                      format: 'binary',
                      description: 'Gambar produk (JPG/PNG/WebP, max 5MB)',
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Deteksi berhasil dijalankan',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/DetectionResult' },
                  examples: {
                    detected: {
                      summary: 'Produk terdeteksi',
                      value: {
                        status: 'success',
                        detected: true,
                        confidence: 0.87,
                        label: 'bottle',
                        all_detections: [
                          { class: 'bottle', confidence: 0.87 },
                          { class: 'person', confidence: 0.45 },
                        ],
                        simulation: false,
                      },
                    },
                    notDetected: {
                      summary: 'Tidak ada objek',
                      value: {
                        status: 'success',
                        detected: false,
                        confidence: 0,
                        label: null,
                        all_detections: [],
                        simulation: false,
                      },
                    },
                  },
                },
              },
            },
            400: { description: 'Tidak ada gambar yang diunggah' },
            500: { description: 'Gagal menjalankan YOLO' },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
