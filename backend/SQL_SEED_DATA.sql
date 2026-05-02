-- AutoCashier Database Seeding
-- Run this in Supabase Dashboard → SQL Editor after creating tables

-- 1) Seed categories
INSERT INTO categories (name, slug, description) VALUES
('Coffee', 'coffee', 'Coffee products'),
('Pastry', 'pastry', 'Pastries and baked goods'),
('Beverage', 'beverage', 'Non-coffee beverages'),
('Cake', 'cake', 'Cakes and desserts'),
('Sandwich', 'sandwich', 'Sandwiches')
ON CONFLICT (name) DO NOTHING;

-- 2) Seed branches
INSERT INTO branches (code, name, city, address, is_active) VALUES
('JKT001', 'Jakarta Central', 'Jakarta', 'Jl. Sudirman No. 123', true),
('BDG001', 'Bandung Branch', 'Bandung', 'Jl. Braga No. 456', true),
('SBY001', 'Surabaya Branch', 'Surabaya', 'Jl. Pemuda No. 789', true)
ON CONFLICT (code) DO NOTHING;

-- 3) Seed products
INSERT INTO products (sku, name, base_price, cost_price, unit, tax_rate, description, is_active) VALUES
('PROD-ESP-001', 'Espresso', 20000, 8000, 'cup', 0, 'Strong black espresso', true),
('PROD-CAP-001', 'Cappuccino', 25000, 10000, 'cup', 0, 'Espresso with steamed milk', true),
('PROD-LAT-001', 'Iced Latte', 28000, 11000, 'cup', 0, 'Cold latte with ice', true),
('PROD-AME-001', 'Americano', 22000, 9000, 'cup', 0, 'Espresso with hot water', true),
('PROD-MAC-001', 'Macchiato', 26000, 10500, 'cup', 0, 'Espresso with milk foam', true),
('PROD-CRS-001', 'Croissant', 35000, 15000, 'pcs', 0, 'Butter croissant', true),
('PROD-CNK-001', 'Cheese Cake', 45000, 18000, 'pcs', 0, 'NY style cheese cake', true),
('PROD-MFN-001', 'Muffin', 30000, 12000, 'pcs', 0, 'Chocolate muffin', true),
('PROD-OJU-001', 'Orange Juice', 15000, 5000, 'glass', 0, 'Fresh orange juice', true),
('PROD-ICE-001', 'Iced Tea', 18000, 6000, 'glass', 0, 'Cold iced tea', true)
ON CONFLICT (sku) DO NOTHING;

-- Verification queries (optional - run these to verify data)
-- SELECT COUNT(*) as category_count FROM categories;
-- SELECT COUNT(*) as branch_count FROM branches;
-- SELECT COUNT(*) as product_count FROM products;
