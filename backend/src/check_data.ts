import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

async function checkData() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('--- Checking products table ---');
    const { data: pData, error: pErr } = await supabase.from('products').select('id, name').limit(5);
    console.log('Products:', pData || pErr);

    console.log('--- Checking branch_inventory table ---');
    const { data: iData, error: iErr } = await supabase.from('branch_inventory').select('id, product_id').limit(5);
    console.log('Inventory:', iData || iErr);
}

checkData();
