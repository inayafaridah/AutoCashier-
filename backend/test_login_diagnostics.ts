import { supabaseAdmin } from './src/config/supabaseClient';
import bcrypt from 'bcryptjs';

async function testLogin() {
  const username = 'admin';
  const password = 'admin777';

  const { data, error } = await supabaseAdmin.from('users').select('*').eq('username', username).maybeSingle();
  
  if (error || !data) {
    console.log('User not found or error: ' + (error?.message || 'Not found'));
    return;
  }

  const hash = data.password;
  console.log('Hash in DB: ' + hash);
  
  const match = await bcrypt.compare(password, hash);
  console.log('Password Match Result: ' + match);
  
  if (!match) {
    // Try plain text compare just in case
    if (hash === password) {
      console.log('⚠️ WARNING: Password in DB is PLAIN TEXT, not hashed!');
    }
  }
}

testLogin();
