-- Run this SQL in Supabase SQL Editor to create the product_requests table
CREATE TABLE IF NOT EXISTS product_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id TEXT NOT NULL,
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  sku TEXT,
  description TEXT,
  unit TEXT DEFAULT 'pcs',
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE product_requests ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated service_role reads (backend uses service role)
DROP POLICY IF EXISTS "service_role_all" ON product_requests;
CREATE POLICY "service_role_all" ON product_requests FOR ALL USING (true);
