import { supabaseAdmin } from './src/config/supabaseClient';
import bcrypt from 'bcryptjs';

async function createSuperAdmin() {
  const username = 'superadmin';
  const password = 'adminautocashier';
  const role = 'admin';
  
  console.log(`🚀 Creating user: ${username} with role: ${role}`);
  
  if (!supabaseAdmin) {
    console.error('❌ Supabase Admin client not configured. Ensure SUPABASE_SERVICE_ROLE_KEY is set in .env');
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);
  
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert([
      { 
        username, 
        password: password_hash, 
        role,
        full_name: 'Super Administrator'
      }
    ])
    .select();
    
  if (error) {
    if (error.code === '23505') {
       console.log('💡 User already exists. Updating password and role...');
       const { error: updateError } = await supabaseAdmin
         .from('users')
         .update({ password: password_hash, role })
         .eq('username', username);
       if (updateError) {
         console.error('❌ Update failed:', updateError);
       } else {
         console.log('✅ User updated successfully!');
       }
    } else {
      console.error('❌ Failed to create user:', error);
    }
  } else {
    console.log('✅ User created successfully!', data);
  }
}

createSuperAdmin();
