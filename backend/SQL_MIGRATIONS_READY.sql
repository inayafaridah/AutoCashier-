-- AutoCashier Database Migrations
-- Run these in Supabase Dashboard → SQL Editor
-- Copy-paste all and run together

-- 1) categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2) users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'staff',
  branch_id UUID,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  profile_url TEXT,
  last_login TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3) branches
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'ID',
  phone TEXT,
  manager_id UUID REFERENCES users(id),
  timezone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4) products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  base_price NUMERIC NOT NULL,
  cost_price NUMERIC,
  unit TEXT DEFAULT 'pcs',
  tax_rate NUMERIC DEFAULT 0,
  description TEXT,
  default_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- 5) product_images
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  angle TEXT,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);

-- 6) product_validations
CREATE TABLE IF NOT EXISTS product_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  images JSONB,
  result JSONB,
  passed BOOLEAN,
  score NUMERIC,
  notes TEXT,
  validated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  validated_by UUID REFERENCES users(id)
);

-- 7) suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8) branch_inventory
CREATE TABLE IF NOT EXISTS branch_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  product_id UUID NOT NULL REFERENCES products(id),
  stock INTEGER NOT NULL DEFAULT 0,
  reserved INTEGER NOT NULL DEFAULT 0,
  price NUMERIC NOT NULL,
  cost_price NUMERIC,
  min_reorder INTEGER DEFAULT 0,
  max_stock INTEGER,
  photos JSONB DEFAULT '{}'::jsonb,
  sync_status TEXT DEFAULT 'pending',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(branch_id, product_id)
);

-- 9) audits
CREATE TABLE IF NOT EXISTS audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  changes JSONB,
  performed_by UUID REFERENCES users(id),
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Done! All tables created.
