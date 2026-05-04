import { supabaseAdmin } from './src/config/supabaseClient';
import bcrypt from 'bcryptjs';

async function resetAdminPassword() {
  const newPassword = 'admin123'; // ganti sesuai keinginan
  const hash = await bcrypt.hash(newPassword, 10);

  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ password: hash })
    .eq('username', 'admin')
    .select('id, username, role');

  if (error) {
    console.error('❌ Gagal update password:', error.message);
    return;
  }

  console.log('✅ Password berhasil direset!');
  console.log('User:', data);
  console.log(`\nCredentials baru:\n  username: admin\n  password: ${newPassword}`);
}

resetAdminPassword();
