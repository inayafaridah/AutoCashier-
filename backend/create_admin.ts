import { supabaseAdmin } from './src/config/supabaseClient';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  const username = 'admin';
  const password = 'admin777';
  const role = 'super_admin';
  
  console.log(`🚀 Creating user: ${username} with role: ${role}`);
  
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);
  
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert([
      { 
        username, 
        password_hash, 
        role,
        full_name: 'System Administrator'
      }
    ])
    .select();
    
  if (error) {
    if (error.code === '23505') {
       console.log('💡 User already exists. Updating password and role...');
       const { error: updateError } = await supabaseAdmin
         .from('users')
         .update({ password_hash, role })
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

createAdmin();
