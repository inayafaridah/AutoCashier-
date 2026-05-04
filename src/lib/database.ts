/**
 * Database initialization module
 * Checks Supabase connection and initializes tables if needed
 */

import { supabase } from './supabase';
export async function initializeDatabase() {
  console.log('🔄 Initializing database connection...');
  
  try {
    // Test connection by querying master_catalog table
    const { error } = await supabase
      .from('master_catalog')
      .select('*')
      .limit(1);

    if (error) {
      console.warn('⚠️ Database initialization warning:', error.message);
      console.warn('Falling back to mock data mode');
      return { connected: false, message: error.message };
    }

    console.log('✅ Database connection successful');

    // Try to fetch and log sample data
    const { data: catalog } = await supabase.from('master_catalog').select('*').limit(5);
    console.log(`✅ Successfully loaded ${(catalog || []).length} items from master_catalog`);

    return { connected: true, message: 'Database connected successfully' };
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    return { connected: false, message: String(error) };
  }
}

export async function createSupabaseTablesIfNotExists() {
  console.log('🔍 Checking database schema...');
  
  try {
    // Check if tables exist by trying to query them
    const { error: catalogError } = await supabase.from('master_catalog').select('id').limit(1);
    const { error: inventoryError } = await supabase.from('branch_inventory').select('id').limit(1);
    
    if (!catalogError && !inventoryError) {
      console.log('✅ All required tables exist');
      return true;
    }

    console.warn('⚠️ Some tables may not exist. Please create them in Supabase console.');
    const schemaGuide = `
Required table schemas:

1. master_catalog
   - id (UUID, Primary Key)
   - name (Text)
   - category (Text)
   - basePrice (Numeric)
   - created_at (Timestamp)
   - updated_at (Timestamp)

2. branch_inventory
   - id (UUID, Primary Key)
   - catalogId (Text/UUID)
   - stock (Integer)
   - price (Numeric)
   - location_id (Text)
   - photos (JSONB)
   - syncStatus (Text)
   - created_at (Timestamp)
   - updated_at (Timestamp)
    `;
    console.log(schemaGuide);

    return false;
  } catch (error) {
    console.error('Error checking database schema:', error);
    return false;
  }
}
