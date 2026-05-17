import { supabaseAdmin } from '../src/config/supabaseClient';

async function checkSchema() {
  // Get users table columns by fetching one row
  const { data: users, error: usersErr } = await supabaseAdmin
    .from('users')
    .select('*')
    .limit(1);
  
  if (usersErr) console.log("Users error:", usersErr);
  else console.log("=== USERS TABLE COLUMNS ===\n", users ? Object.keys(users[0] || {}) : 'empty');

  // Try to get password_hash column
  const { data: withHash, error: hashErr } = await supabaseAdmin
    .from('users')
    .select('id, username, password, password_hash')
    .limit(1);
  
  if (hashErr) console.log("password/password_hash check error:", hashErr.message);
  else console.log("\n=== PASSWORD FIELDS ===\n", withHash);

  // Check if branch_id exists
  const { data: withBranch, error: branchErr } = await supabaseAdmin
    .from('users')
    .select('id, username, branch_id, is_active')
    .limit(1);
  
  if (branchErr) console.log("branch_id/is_active check error:", branchErr.message);
  else console.log("\n=== BRANCH/STATUS FIELDS ===\n", withBranch);

  // Full data dump
  const { data: all } = await supabaseAdmin.from('users').select('*');
  console.log("\n=== ALL USERS (raw) ===\n", JSON.stringify(all, null, 2));
}

checkSchema();
