const { Client } = require('pg');
require('dotenv').config();

// Extract PG connection string from SUPABASE_URL or use direct postgres URI if available
// Or we can just read from process.env.DATABASE_URL if they have it.
async function run() {
  if (!process.env.DATABASE_URL) {
    console.error("No DATABASE_URL found");
    return;
  }
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to DB");

    const sql = `
DROP TABLE IF EXISTS products CASCADE;

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  base_price NUMERIC NOT NULL,
  stock INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'pcs',
  description TEXT,
  image_url TEXT,
  ai_label TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(branch_id, sku)
);
    `;
    await client.query(sql);
    console.log("SQL executed successfully");
  } catch (err) {
    console.error("SQL Error:", err.message);
  } finally {
    await client.end();
  }
}
run();
