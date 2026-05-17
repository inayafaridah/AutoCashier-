import { supabaseAdmin } from '../src/config/supabaseClient';

async function deepCheck() {
  // Check member_points full data
  const { data: mp, error: mpErr } = await supabaseAdmin.from('member_points').select('*');
  console.log('=== MEMBER_POINTS DATA ===');
  console.log(JSON.stringify(mp, null, 2));
  
  // Check possible promo table names
  const promoNames = ['promos', 'promo', 'promotions', 'vouchers', 'coupons', 'promo_codes'];
  console.log('\n=== PROMO TABLE NAMES CHECK ===');
  for (const t of promoNames) {
    const { error } = await supabaseAdmin.from(t).select('*').limit(1);
    console.log(`  ${t}: ${error ? '❌' : '✅'}`);
  }

  // Check users full data
  const { data: users } = await supabaseAdmin.from('users').select('*');
  console.log('\n=== ALL USERS ===');
  users?.forEach(u => {
    console.log(`  [${u.role}] ${u.username} | ${u.email} | ${u.full_name}`);
  });

  // Check transactions columns
  const { data: tx } = await supabaseAdmin.from('transactions').select('*').limit(1);
  console.log('\n=== TRANSACTIONS columns ===', tx ? Object.keys(tx[0] || {}) : 'empty');

  // Check products columns
  const { data: prod } = await supabaseAdmin.from('products').select('*').limit(1);
  console.log('\n=== PRODUCTS columns ===', prod ? Object.keys(prod[0] || {}) : 'empty');
}

deepCheck();
