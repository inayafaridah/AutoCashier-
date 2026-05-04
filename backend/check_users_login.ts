import { supabaseAdmin } from './src/config/supabaseClient';

async function main() {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id,username,email,role,full_name,password');

  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  console.log('Total users:', data?.length ?? 0);
  if (data) {
    for (const u of data) {
      console.log({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        full_name: u.full_name,
        hasPassword: !!u.password,
        passwordPreview: u.password ? u.password.slice(0, 20) + '...' : 'NULL'
      });
    }
  }
}

main();
