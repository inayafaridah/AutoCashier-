import { supabaseAdmin } from './src/config/supabaseClient';

async function checkBroadcasts() {
  const { data, error } = await supabaseAdmin.from('broadcasts').select('*').limit(1);
  if (error) {
    console.log('Error: ' + error.message);
  } else {
    console.log('Columns: ' + JSON.stringify(Object.keys(data?.[0] || {})));
  }
}

checkBroadcasts();
