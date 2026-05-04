import { supabase } from './src/config/supabaseClient';

async function checkColumns() {
  const { data, error } = await supabase.from('users').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    if (data && data.length > 0) {
      console.log('Columns:', Object.keys(data[0]));
    } else {
      console.log('Table is empty. Cannot infer columns without data.');
      // Fallback: try inserting to see what columns fail
      const { error: insertErr } = await supabase.from('users').insert([{ id: '00000000-0000-0000-0000-000000000000' }]);
      console.log('Insert error hint:', insertErr);
    }
  }
}
checkColumns();
