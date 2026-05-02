import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabaseClient';

const SQL_MIGRATIONS = [
  // categories
  `
  CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  );
  `,

  // users
  `
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
  `,

  // branches
  `
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
  `,

  // products
  `
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
  `,

  // product_images
  `
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
  `,

  // product_validations
  `
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
  `,

  // suppliers
  `
  CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  );
  `,

  // branch_inventory
  `
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
  `,

  // audits
  `
  CREATE TABLE IF NOT EXISTS audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity TEXT NOT NULL,
    entity_id UUID,
    action TEXT NOT NULL,
    changes JSONB,
    performed_by UUID REFERENCES users(id),
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  );
  `,
];

export async function initSchemaController(req: Request, res: Response) {
  // Require service-role admin client to execute DDL safely
  if (!supabaseAdmin) {
    return res.status(400).json({
      status: 'error',
      message: 'Service role key not configured on server. Cannot execute migrations programmatically.',
      hint: 'Set SUPABASE_SERVICE_ROLE_KEY in backend .env (service role) or run the SQL manually in Supabase Dashboard SQL Editor',
      sqlSamples: SQL_MIGRATIONS.map(s => s.substring(0, 200))
    });
  }

  const results: any[] = [];
  for (const sql of SQL_MIGRATIONS) {
    try {
      // Try to run using an rpc helper function named exec_sql if available
      let execResult: any = null;
      try {
        execResult = await (supabaseAdmin as any).rpc('exec_sql', { query: sql });
      } catch (rpcErr) {
        // rpc not available; fallback to direct SQL via Postgres REST endpoint using service key
        try {
          // Use the Postgres query endpoint provided by Supabase client if available
          if ((supabaseAdmin as any).postgrest) {
            // postgrest doesn't execute raw SQL, so use rpc fallback
            throw rpcErr;
          }
        } catch (inner) {
          throw rpcErr;
        }
      }

      if (execResult?.error) {
        results.push({ status: 'error', error: execResult.error.message });
      } else {
        results.push({ status: 'success' });
      }
    } catch (err: any) {
      results.push({ status: 'error', error: err.message });
    }
  }

  return res.json({ status: 'info', message: 'Migration attempted', results });
}

export async function seedDataController(req: Request, res: Response) {
  try {
    const client = supabaseAdmin || supabase;
    if (!client) return res.status(500).json({ status: 'error', message: 'Supabase client not configured' });

    const results: any = {};

    // Seed categories
    try {
      const catRes: any = await (client as any)
        .from('categories')
        .insert([
          { name: 'Coffee', slug: 'coffee', description: 'Coffee products' },
          { name: 'Pastry', slug: 'pastry', description: 'Pastries' },
          { name: 'Beverage', slug: 'beverage', description: 'Non-coffee beverages' },
        ])
        .select();
      results.categories = catRes.data?.length || 0;
      if (catRes?.error) console.error('Categories error:', catRes.error);
    } catch (e: any) {
      console.error('Categories catch:', e.message);
    }

    // Wait for categories to settle
    await new Promise(r => setTimeout(r, 500));

    // Seed branches
    try {
      const brRes: any = await (client as any)
        .from('branches')
        .insert([
          { code: 'JKT001', name: 'Jakarta Central', city: 'Jakarta', address: 'Jl. Sudirman', is_active: true },
          { code: 'BDG001', name: 'Bandung Branch', city: 'Bandung', address: 'Jl. Braga', is_active: true },
        ])
        .select();
      results.branches = brRes.data?.length || 0;
      if (brRes?.error) console.error('Branches error:', brRes.error);
    } catch (e: any) {
      console.error('Branches catch:', e.message);
    }

    await new Promise(r => setTimeout(r, 500));

    // Seed products
    try {
      const prodRes: any = await (client as any)
        .from('products')
        .insert([
          { sku: 'PROD-ESP-001', name: 'Espresso', base_price: 20000, cost_price: 8000, unit: 'cup', description: 'Strong black espresso', is_active: true },
          { sku: 'PROD-CAP-001', name: 'Cappuccino', base_price: 25000, cost_price: 10000, unit: 'cup', description: 'Espresso with steamed milk', is_active: true },
          { sku: 'PROD-LAT-001', name: 'Iced Latte', base_price: 28000, cost_price: 11000, unit: 'cup', description: 'Cold latte with ice', is_active: true },
          { sku: 'PROD-AME-001', name: 'Americano', base_price: 22000, cost_price: 9000, unit: 'cup', description: 'Espresso with hot water', is_active: true },
          { sku: 'PROD-CRS-001', name: 'Croissant', base_price: 35000, cost_price: 15000, unit: 'pcs', description: 'Butter croissant', is_active: true },
        ])
        .select();
      results.products = prodRes.data?.length || 0;
      if (prodRes?.error) console.error('Products error:', prodRes.error);
    } catch (e: any) {
      console.error('Products catch:', e.message);
    }

    return res.json({
      status: 'success',
      message: 'Sample data seeded successfully',
      summary: results,
      note: 'Check backend logs for any errors during insertion',
    });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
