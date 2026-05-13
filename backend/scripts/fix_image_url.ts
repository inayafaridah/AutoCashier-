import { supabaseAdmin, supabase } from '../src/config/supabaseClient';

const STORAGE_BUCKET = 'product-images';

async function fixImageUrls() {
  const client = supabaseAdmin || supabase;
  console.log('Fetching product images with missing image_url...');
  
  const { data: images, error } = await client
    .from('product_images')
    .select('*')
    .is('image_url', null);

  if (error) {
    console.error('Error fetching images:', error);
    return;
  }

  console.log(`Found ${images?.length || 0} images to update.`);

  if (images && images.length > 0) {
    for (const img of images) {
      if (!img.storage_path) continue;

      const { data: publicUrlData } = client.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(img.storage_path);

      const url = publicUrlData?.publicUrl;

      if (url) {
        const { error: updateError } = await client
          .from('product_images')
          .update({ image_url: url })
          .eq('id', img.id);

        if (updateError) {
          console.error(`Failed to update ${img.id}:`, updateError);
        } else {
          console.log(`Updated ${img.id} with ${url}`);
        }
      }
    }
  }

  console.log('Done fixing image URLs.');
}

fixImageUrls();
