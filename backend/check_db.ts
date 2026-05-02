import { supabaseAdmin } from './src/config/supabaseClient';

async function check() {
  console.log('--- Database Check ---');
  
  // 1. Check products
  const { data: products, count: prodCount } = await supabaseAdmin
    .from('products')
    .select('id, name', { count: 'exact' });
  console.log(`Total Products: ${prodCount}`);
  if (products) products.forEach(p => console.log(` - ${p.name} (${p.id})`));

  // 2. Check product_images
  const { data: images, count: imgCount } = await supabaseAdmin
    .from('product_images')
    .select('*', { count: 'exact' });
  console.log(`Total Product Images: ${imgCount}`);
  if (images) images.forEach(i => console.log(` - Product ${i.product_id} Angle ${i.angle}: ${i.filename}`));

  console.log('--- End Check ---');
}

check();
