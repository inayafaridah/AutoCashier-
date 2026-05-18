import { supabaseAdmin, supabase } from '../src/config/supabaseClient';

async function run() {
  const db = supabaseAdmin || supabase;
  const { data, error } = await db.from('branches').select('*');
  console.log("Branches:", data);
}
run();
