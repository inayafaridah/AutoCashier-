import { supabaseAdmin } from '../src/config/supabaseClient';

async function checkAllTables() {
  // Check users table columns
  const { data: users } = await supabaseAdmin.from('users').select('*').limit(1);
  console.log('=== USERS columns:', users ? Object.keys(users[0] || {}) : 'empty');

  // Check if password_hash now exists
  const { data: pw, error: pwErr } = await supabaseAdmin.from('users').select('password_hash').limit(1);
  console.log('password_hash:', pwErr ? `❌ ${pwErr.message}` : '✅ exists');

  // Check if branch_id now exists  
  const { data: br, error: brErr } = await supabaseAdmin.from('users').select('branch_id').limit(1);
  console.log('branch_id:', brErr ? `❌ ${brErr.message}` : '✅ exists');

  // Check member_points table
  const { data: mp, error: mpErr } = await supabaseAdmin.from('member_points').select('*').limit(1);
  if (mpErr) console.log('member_points: ❌', mpErr.message);
  else console.log('=== MEMBER_POINTS columns:', mp ? Object.keys(mp[0] || {}) : 'empty (table exists)');

  // List common tables
  const tables = ['users', 'products', 'transactions', 'branches', 'promos', 'member_points', 'members', 'loyalty_points'];
  console.log('\n=== TABLE EXISTENCE CHECK ===');
  for (const t of tables) {
    const { error } = await supabaseAdmin.from(t).select('id').limit(1);
    console.log(`  ${t}: ${error ? '❌ ' + error.message.substring(0, 60) : '✅ exists'}`);
  }
}

checkAllTables();
