import { supabaseAdmin } from './src/config/supabaseClient';

async function checkStructure() {
  const { data, error } = await supabaseAdmin.rpc('exec_sql', { 
    query: "SELECT column_name FROM information_schema.columns WHERE table_name = 'branch_inventory';" 
  });
  
  if (error) {
    console.error('Error:', error);
    // If RPC fails, try a direct query
    const { data: data2 } = await supabaseAdmin.from('branch_inventory').select('*').limit(1);
    console.log('Sample data keys:', Object.keys(data2?.[0] || {}));
  } else {
    console.log('Columns:', data);
  }
}

checkStructure();
