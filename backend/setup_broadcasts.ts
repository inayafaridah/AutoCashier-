import { supabaseAdmin } from './src/config/supabaseClient';

async function createTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS broadcasts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      audience TEXT NOT NULL,
      target_id TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `;
  
  // Try to use a common RPC name for executing SQL if it exists
  const { error } = await supabaseAdmin.rpc('exec_sql', { query: sql });
  
  if (error) {
    console.log('RPC exec_sql not found or failed. Please run the SQL manually in Supabase Dashboard.');
    console.log('SQL Statement:');
    console.log(sql);
  } else {
    console.log('✅ Table broadcasts created successfully!');
  }
}

createTable();
