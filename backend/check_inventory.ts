import { supabaseAdmin } from './src/config/supabaseClient';

async function checkInventory() {
  const { data, error } = await supabaseAdmin.from('branch_inventory').select('*').limit(5);
  if (error) {
    console.log('Error: ' + error.message);
  } else {
    console.log('Data count: ' + (data?.length || 0));
    console.log('Data: ' + JSON.stringify(data));
  }
}

checkInventory();
