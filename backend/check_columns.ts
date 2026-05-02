import { supabaseAdmin } from './src/config/supabaseClient';

async function checkColumns() {
  const { data, error } = await supabaseAdmin
    .from('branch_inventory')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Columns:', Object.keys(data[0] || {}));
  }
}

checkColumns();
