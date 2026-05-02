# Backend Implementation Plan - AutoCashier

## 📊 Analisis Kebutuhan Backend

Berdasarkan analisis frontend (src/lib/api.ts), berikut semua yang diperlukan untuk backend:

---

## 🔌 API Endpoints yang Dibutuhkan

### Authentication
- `POST /api/auth/login` - User login dengan username/password
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user info

### Master Catalog (Products)
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Branch Inventory
- `GET /api/inventory` - Get all inventory (with optional filter by location_id)
- `GET /api/inventory/:id` - Get inventory by ID
- `POST /api/inventory` - Create inventory item
- `PUT /api/inventory/:id` - Update inventory item
- `DELETE /api/inventory/:id` - Delete inventory item

### Dashboard/Analytics
- `GET /api/overview` - Get dashboard overview data
  - Query params: `location_id`, `timeframe`, `year`, `month`, `week`

### Branches/Locations
- `GET /api/branches` - Get all branch locations
- `GET /api/branches/:id` - Get branch by ID
- `POST /api/branches` - Create new branch
- `PUT /api/branches/:id` - Update branch
- `DELETE /api/branches/:id` - Delete branch

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

---

## 📁 Backend Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts         ← Supabase configuration
│   │   ├── environment.ts      ← Environment variables
│   │   └── constants.ts        ← App constants
│   │
│   ├── middleware/
│   │   ├── auth.ts             ← JWT authentication middleware
│   │   ├── validation.ts       ← Input validation middleware
│   │   ├── errorHandler.ts     ← Global error handler
│   │   └── cors.ts             ← CORS configuration
│   │
│   ├── models/
│   │   ├── User.ts             ← User model/interface
│   │   ├── Product.ts          ← Product model/interface
│   │   ├── Inventory.ts        ← Inventory model/interface
│   │   ├── Branch.ts           ← Branch model/interface
│   │   └── index.ts            ← Export all models
│   │
│   ├── controllers/
│   │   ├── authController.ts   ← Authentication logic
│   │   ├── productController.ts ← Product CRUD logic
│   │   ├── inventoryController.ts ← Inventory CRUD logic
│   │   ├── branchController.ts  ← Branch CRUD logic
│   │   ├── userController.ts    ← User CRUD logic
│   │   └── analyticsController.ts ← Dashboard analytics logic
│   │
│   ├── routes/
│   │   ├── auth.ts             ← Auth routes
│   │   ├── products.ts         ← Product routes
│   │   ├── inventory.ts        ← Inventory routes
│   │   ├── branches.ts         ← Branch routes
│   │   ├── users.ts            ← User routes
│   │   ├── analytics.ts        ← Analytics routes
│   │   └── index.ts            ← Consolidate all routes
│   │
│   ├── services/
│   │   ├── authService.ts      ← Auth business logic
│   │   ├── productService.ts   ← Product business logic
│   │   ├── inventoryService.ts ← Inventory business logic
│   │   ├── supabaseService.ts  ← Supabase operations
│   │   └── index.ts            ← Export all services
│   │
│   ├── utils/
│   │   ├── validators.ts       ← Input validators
│   │   ├── jwt.ts              ← JWT utility functions
│   │   ├── passwords.ts        ← Password hashing utilities
│   │   ├── errors.ts           ← Custom error classes
│   │   └── logger.ts           ← Logging utility
│   │
│   ├── types/
│   │   ├── index.ts            ← TypeScript type definitions
│   │   └── express.d.ts        ← Express type extensions
│   │
│   ├── migrations/
│   │   ├── 001_create_users.sql
│   │   ├── 002_create_products.sql
│   │   ├── 003_create_inventory.sql
│   │   ├── 004_create_branches.sql
│   │   └── 005_create_roles.sql
│   │
│   └── app.ts                  ← Express app setup
│   └── server.ts               ← Server entry point
│
├── .env                        ← Environment variables
├── .env.example                ← Environment template
├── package.json                ← Dependencies
├── tsconfig.json               ← TypeScript config
├── .eslintrc.json              ← ESLint config
└── README.md                   ← Backend documentation
```

---

## 📦 Dependencies yang Diperlukan

### Core
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "dotenv": "^16.0.3",
    "@supabase/supabase-js": "^2.35.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-validator": "^7.0.0",
    "uuid": "^9.0.0",
    "axios": "^1.5.0"
  },
  "devDependencies": {
    "typescript": "^5.2.2",
    "@types/express": "^4.17.17",
    "@types/node": "^20.4.5",
    "@types/jsonwebtoken": "^9.0.3",
    "@types/bcryptjs": "^2.4.2",
    "ts-node": "^10.9.1",
    "nodemon": "^3.0.1",
    "tsx": "^3.12.10",
    "@types/cors": "^2.8.13",
    "eslint": "^8.46.0",
    "@typescript-eslint/eslint-plugin": "^6.3.0",
    "@typescript-eslint/parser": "^6.3.0"
  }
}
```

---

## 🗄️ Database Schema

### users table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL ('super_admin' | 'branch_admin' | 'staff'),
  branch_id UUID,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### products table
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  base_price NUMERIC NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### branch_inventory table
```sql
CREATE TABLE branch_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  product_id UUID NOT NULL REFERENCES products(id),
  stock INTEGER NOT NULL DEFAULT 0,
  price NUMERIC NOT NULL,
  photos JSONB DEFAULT '{}',
  sync_status TEXT DEFAULT 'pending',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### branches table
```sql
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  phone TEXT,
  manager_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

---

## 🔐 Authentication Flow

1. **Login**: User submit username + password
2. **Validation**: Check credentials in database
3. **Token Generation**: Generate JWT token valid 24 hours
4. **Response**: Return token + user info
5. **Usage**: Client attach token di Authorization header
6. **Verification**: Middleware verify token setiap request

---

## 🔧 Environment Variables (.env)

```env
# Server
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000

# Supabase
SUPABASE_URL=https://zhghwaypdgpxlznkammt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=your_service_role_key

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:3001

# Logging
LOG_LEVEL=info
```

---

## 🎯 Priority Implementation Order

1. **Phase 1 (Critical)**: Setup & Authentication
   - Express server setup
   - Supabase connection
   - Login endpoint
   - JWT middleware
   - Error handling

2. **Phase 2 (Core CRUD)**: Product & Inventory
   - Product endpoints (GET, POST, PUT, DELETE)
   - Inventory endpoints (GET, POST, PUT, DELETE)
   - Validation

3. **Phase 3 (Complete)**: Users, Branches, Analytics
   - User management endpoints
   - Branch endpoints
   - Analytics endpoint
   - Permission checks

---

## 🚀 Running Backend

```bash
# Install dependencies
cd backend
npm install

# Development
npm run dev

# Production
npm run build
npm start

# API will be at: http://localhost:5000/api
```

---

## 📝 API Response Format

### Success Response
```json
{
  "status": "success",
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "status": "error",
  "error": "ERROR_CODE",
  "message": "Human readable error message"
}
```

---

## ✅ What's Next?

1. Create backend folder structure
2. Setup Express server + Supabase
3. Implement authentication
4. Implement CRUD endpoints
5. Add validation & error handling
6. Connect frontend to backend
7. Test all endpoints

Would you like me to start implementing this step by step?
