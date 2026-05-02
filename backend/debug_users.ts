import { supabaseAdmin } from './src/config/supabaseClient';

async function listUsers() {
  // Query a table that we know exists to see if the connection is even working
  const { data: prodData, error: prodError } = await supabaseAdmin.from('products').select('*').limit(1);
  console.log('Product Check:', prodError ? 'Error: ' + prodError.message : 'OK');
  if (prodData && prodData.length > 0) console.log('Product Columns:', Object.keys(prodData[0]));

  const { data, error } = await supabaseAdmin.from('users').select('*').limit(1);
  if (error) {
    console.error('Users Table Error:', error.message);
    if (error.message.includes('not found')) {
       console.log('💡 The "users" table might not exist in this database.');
    }
  } else {
    console.log('Users Data length:', data?.length);
    if (data && data.length > 0) {
      console.log('Users Columns:', Object.keys(data[0]));
    } else {
      console.log('💡 Users table exists but is empty. Trying to discover columns via insert-dryrun...');
      // Try to discover columns by inserting an invalid row
      const { error: insertError } = await supabaseAdmin.from('users').insert([{ invalid_column: 'test' }]);
      console.log('Discovery Error (expected):', insertError?.message);
    }
  }
}

listUsers();
