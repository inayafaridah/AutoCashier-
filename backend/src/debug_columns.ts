import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Try a very minimal insert to discover exactly which columns are allowed
  // Step 1: only sku, name, price (required non-null fields)
  const { error: e1 } = await supabase.from('products').insert([{
    sku: 'TEST-PROBE-001',
    name: 'Probe Test',
    price: 1000
  }]);
  console.log('Insert 1 (sku+name+price):', JSON.stringify(e1));

  // Step 2: Try adding description
  const { error: e2 } = await supabase.from('products').insert([{
    sku: 'TEST-PROBE-002',
    name: 'Probe Test 2',
    price: 1000,
    notes: 'test notes'
  }]);
  console.log('Insert 2 (with notes):', JSON.stringify(e2));

  // Step 3: Check what rows now exist to see actual columns
  const { data, error: e3 } = await supabase.from('products').select('*').limit(3);
  console.log('Select error:', JSON.stringify(e3));
  if (data && data.length > 0) {
    console.log('ACTUAL DB COLUMNS:', Object.keys(data[0]).join(', '));
    console.log('Sample row:', JSON.stringify(data[0], null, 2));
  }
}

main();
