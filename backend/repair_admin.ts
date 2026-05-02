import { supabaseAdmin } from './src/config/supabaseClient';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  const username = 'admin';
  const password = 'admin777';
  const role = 'super_admin';
  
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  
  // Try common column names
  const payloads = [
    { username, password_hash: hash, role, full_name: 'System Admin' },
    { username, password: hash, role, full_name: 'System Admin' },
    { username, password_hash: hash, role: 'admin', full_name: 'System Admin' }
  ];

  for (const payload of payloads) {
    console.log(`Testing payload:`, Object.keys(payload));
    const { data, error } = await supabaseAdmin.from('users').upsert([payload], { onConflict: 'username' }).select();
    if (!error) {
      console.log('✅ Success with columns:', Object.keys(payload));
      console.log('User:', data);
      return;
    } else {
      console.log(`❌ Failed: ${error.message}`);
    }
  }
}

createAdmin();
