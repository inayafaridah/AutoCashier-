import { supabaseAdmin } from './src/config/supabaseClient';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  const username = 'admin';
  const password = 'admin777';
  const role = 'super_admin';
  const email = 'admin@autocashier.com';
  
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  
  const payload = { 
    username, 
    password: hash, 
    role, 
    full_name: 'System Admin',
    email
  };

  console.log(`🚀 Creating user: ${username} with role: ${role} and email: ${email}`);
  const { data, error } = await supabaseAdmin
    .from('users')
    .upsert([payload], { onConflict: 'username' })
    .select();
    
  if (error) {
    console.error('❌ Failed:', error.message);
  } else {
    console.log('✅ Success!', data);
  }
}

createAdmin();
