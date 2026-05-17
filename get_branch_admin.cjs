const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, role')
    .eq('role', 'branch_admin');
  
  if (error) console.error(error);
  else console.log(data);
}
run();
