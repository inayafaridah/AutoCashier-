import { supabaseAdmin } from '../src/config/supabaseClient';

async function getUsers() {
  const { data, error } = await supabaseAdmin.from('users').select('*');
  console.log(JSON.stringify(data, null, 2));
}

getUsers();
