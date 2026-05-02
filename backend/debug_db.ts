import { supabaseAdmin } from './src/config/supabaseClient';

async function check() {
  const { count: bCount } = await supabaseAdmin.from('branches').select('*', { count: 'exact', head: true });
  const { count: pCount } = await supabaseAdmin.from('products').select('*', { count: 'exact', head: true });
  console.log('Branches count: ' + bCount);
  console.log('Products count: ' + pCount);
  
  if (bCount === 0) {
    const { data } = await supabaseAdmin.from('branches').select('*').limit(5);
    console.log('Sample branches: ' + JSON.stringify(data));
  }
}

check();
