import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zhghwaypdgpxlznkammt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoZ2h3YXlwZGdweGx6bmthbW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0ODYyMjEsImV4cCI6MjA5MzA2MjIyMX0.YBZzHYeOCAC5YMvSP8Vrh0It2nzCltP8oQPW85QVauw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumns() {
  const { data, error } = await supabase.rpc('get_table_info', { table_name: 'users' });
  if (error) {
    // try querying pg_attribute or just limit 1 row and Object.keys
    const { data: rows } = await supabase.from('users').select('*').limit(1);
    console.log(Object.keys(rows[0] || {}));
  } else {
    console.log(data);
  }
}

checkColumns();
