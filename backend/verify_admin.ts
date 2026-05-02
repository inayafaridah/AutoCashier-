import { supabaseAdmin } from './src/config/supabaseClient';

async function verify() {
  const { data, error } = await supabaseAdmin.from('users').select('id, username, role').eq('username', 'admin').maybeSingle();
  if (error) console.log('Error: ' + error.message);
  else console.log('Admin User: ' + JSON.stringify(data));
}

verify();
