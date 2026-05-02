import { supabaseAdmin } from './src/config/supabaseClient';

async function seed() {
  const { data: branches } = await supabaseAdmin.from('branches').select('id');
  const { data: products } = await supabaseAdmin.from('products').select('id');
  
  if (!branches || !products) return;

  const inventoryItems = [];
  for (const branch of branches) {
    for (const product of products) {
      inventoryItems.push({
        branch_id: branch.id,
        product_id: product.id,
        stock: Math.floor(Math.random() * 50) + 5
      });
    }
  }

  const { error } = await supabaseAdmin.from('branch_inventory').insert(inventoryItems);
  if (error) console.log('Error: ' + error.message);
  else console.log('✅ Seeded ' + inventoryItems.length + ' items.');
}

seed();
