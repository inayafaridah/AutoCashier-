import { supabase, supabaseAdmin } from '../config/supabaseClient';
import { Product } from '../models/Product';

// Columns: id, sku, name, price, stock, ai_label, category, image_url, created_at
const PRODUCT_COLUMNS = 'id, sku, name, price, stock, ai_label, category, image_url, created_at';

export async function getAllProducts(): Promise<{ ok: boolean; data?: Product[]; error?: any }> {
  try {
    // Use admin client to bypass RLS for backend reads
    const client = supabaseAdmin || supabase;
    const res: any = await client
      .from('products')
      .select(PRODUCT_COLUMNS)
      .order('created_at', { ascending: false });
    if (res?.error) return { ok: false, error: res.error };
    return { ok: true, data: res?.data || [] };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export async function getProductById(id: string) {
  try {
    const client = supabaseAdmin || supabase;
    const res: any = await client
      .from('products')
      .select(PRODUCT_COLUMNS)
      .eq('id', id)
      .limit(1)
      .maybeSingle();
    if (res?.error) return { ok: false, error: res.error };
    return { ok: true, data: res?.data || null };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export async function createProduct(payload: Omit<Product, 'id' | 'created_at'>) {
  try {
    const client = supabaseAdmin || supabase;
    console.log(`[productService] 🏗️  Creating product using ${client === supabaseAdmin ? 'ADMIN' : 'ANON'} client`);

    const safePayload: any = {
      sku: payload.sku,
      name: payload.name,
      price: payload.price,
      category: payload.category ?? null,
      image_url: payload.image_url ?? null,
      ai_label: payload.ai_label ?? null,
      stock: payload.stock ?? 0,
    };

    // Use .select().single() to get back the full created row (including DB-generated id)
    const res: any = await client
      .from('products')
      .insert([safePayload])
      .select('id, sku, name, price, stock, ai_label, category, image_url, created_at')
      .single();

    if (res?.error) {
      return { ok: false, error: res.error };
    }

    return { ok: true, data: res?.data };
  } catch (err) {
    return { ok: false, error: err };
  }
}

// Save all 3 angle images to product_images table
export async function insertProductImages(
  productId: string,
  images: { angle: string; filename: string; storagePath: string }[]
) {
  try {
    const client = supabaseAdmin || supabase;
    console.log(`[productService] 📸 Inserting product images using ${client === supabaseAdmin ? 'ADMIN' : 'ANON'} client`);
    const rows = images.map(img => ({
      product_id: productId,
      angle: img.angle,
      filename: img.filename,
      storage_path: img.storagePath,
    }));
    const res: any = await client.from('product_images').insert(rows);
    if (res?.error) return { ok: false, error: res.error };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err };
  }
}

export async function updateProduct(id: string, payload: Partial<Product>) {
  try {
    const client = supabaseAdmin || supabase;
    const res: any = await client.from('products').update(payload).eq('id', id);
    if (res?.error) return { ok: false, error: res.error };
    return { ok: true, data: res?.data };
  } catch (err) {
    return { ok: false, error: err };
  }
}

// Get all image filenames for a product (from product_images + image_url fallback)
export async function getProductImagePaths(id: string): Promise<string[]> {
  try {
    const client = supabaseAdmin || supabase;
    const paths: string[] = [];

    console.log(`[productService] 🔍 Fetching image paths for ID: ${id}`);

    // From product_images table (all angles)
    const { data: imgs, error: imgErr } = await client
      .from('product_images')
      .select('filename')
      .eq('product_id', id);
    
    if (imgErr) console.error('[productService] Error fetching product_images:', imgErr);
    
    if (imgs && imgs.length > 0) {
      imgs.forEach((r: any) => {
        if (r.filename && !paths.includes(r.filename)) {
          paths.push(r.filename);
        }
      });
      console.log(`[productService] 📸 Found ${imgs.length} files in product_images table.`);
    } else {
      console.log('[productService] ❓ No files found in product_images table.');
    }

    // From products.image_url (fallback for older products or main image)
    const { data: prod } = await client
      .from('products')
      .select('image_url')
      .eq('id', id)
      .maybeSingle();
      
    if (prod?.image_url) {
      const fname = prod.image_url.split('/').pop();
      if (fname && !paths.includes(fname)) {
        paths.push(fname);
        console.log(`[productService] 🖼️  Found additional main image: ${fname}`);
      }
    }

    console.log(`[productService] 📁 Total unique files to delete: ${paths.length}`);
    return paths;
  } catch (err) {
    console.error('[productService] Critical error in getProductImagePaths:', err);
    return [];
  }
}

export async function deleteProduct(id: string) {
  try {
    const client = supabaseAdmin || supabase;
    const res: any = await client.from('products').delete().eq('id', id);
    if (res?.error) return { ok: false, error: res.error };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err };
  }
}

/**
 * Automatically creates stock entries for a new product in ALL existing branches
 */
export async function initializeProductInAllBranches(productId: string, initialPrice: number) {
  try {
    const client = supabaseAdmin || supabase;
    
    // 1. Get all branch IDs
    const { data: branches, error: bErr } = await client.from('branches').select('id');
    if (bErr) throw bErr;
    if (!branches || branches.length === 0) return { ok: true, message: 'No branches to initialize' };

    // 2. Prepare inventory rows
    const inventoryRows = branches.map(branch => ({
      branch_id: branch.id,
      product_id: productId,
      stock: 0,
      price: initialPrice,
      last_updated: new Date().toISOString()
    }));

    // 3. Bulk insert to branch_inventory
    const { error: iErr } = await client.from('branch_inventory').insert(inventoryRows);
    if (iErr) throw iErr;

    console.log(`[productService] 🚀 Initialized product ${productId} in ${branches.length} branches.`);
    return { ok: true };
  } catch (err) {
    console.error('[productService] ❌ Failed to initialize product in branches:', err);
    return { ok: false, error: err };
  }
}

export async function searchProductByLabel(label: string) {
  try {
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('products')
      .select(PRODUCT_COLUMNS)
      .eq('ai_label', label)
      .maybeSingle();
      
    if (error) throw error;
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err };
  }
}
