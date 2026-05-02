import { supabaseAdmin, supabase } from '../config/supabaseClient';

const client = () => supabaseAdmin || supabase;

export async function getBranchSummaries() {
  const db = client();
  
  try {
    console.log('[branchInventoryService] 🔍 Fetching branch summaries...');
    
    // 1. Get all branches
    const { data: branches, error: bErr } = await db.from('branches').select('id, name');
    if (bErr) {
      console.error('[branchInventoryService] Branches fetch error:', bErr);
      return { ok: false, error: bErr };
    }

    if (!branches || branches.length === 0) {
      console.warn('[branchInventoryService] ⚠️ No branches found in database.');
      return { ok: true, data: [] };
    }

    // 2. Get stock data
    const { data: inventory, error: iErr } = await db
      .from('branch_inventory')
      .select('branch_id, stock, product_id');
    
    if (iErr) {
      console.error('[branchInventoryService] Inventory fetch error:', iErr);
      // Don't fail the whole page, just return empty inventory
    }

    // 3. Aggregate data per branch
    let totalActiveUnits = 0;
    let totalDiscrepancies = 0;

    const summaries = branches.map(b => {
      const branchItems = inventory?.filter(i => i.branch_id === b.id) || [];
      const totalItems = branchItems.length;
      const lowStock = branchItems.filter(i => (i.stock || 0) < 10).length;
      
      totalActiveUnits += totalItems;
      totalDiscrepancies += lowStock;

      return {
        id: b.id,
        name: b.name,
        items: totalItems,
        lowStock: lowStock,
        value: 0, 
        health: totalItems > 0 ? Math.round(((totalItems - lowStock) / totalItems) * 100) : 100
      };
    });

    const networkSummary = {
      activeUnits: totalActiveUnits,
      discrepancies: totalDiscrepancies,
      integrityScore: totalActiveUnits > 0 
        ? Math.round(((totalActiveUnits - totalDiscrepancies) / totalActiveUnits) * 1000) / 10 
        : 100
    };

    console.log(`[branchInventoryService] ✅ Successfully compiled ${summaries.length} branch summaries and network stats.`);
    return { ok: true, data: { branches: summaries, summary: networkSummary } };
  } catch (err) {
    console.error('[branchInventoryService] Critical Error:', err);
    return { ok: false, error: err };
  }
}

export async function getBranchInventory(branchId: string) {
  const db = client();
  
  const { data, error } = await db
    .from('branch_inventory')
    .select(`
      id,
      stock,
      last_updated,
      products (
        id,
        name,
        category,
        price,
        image_url,
        product_images (
          angle
        )
      )
    `)
    .eq('branch_id', branchId);
  
  if (error) return { ok: false, error };

  // Flatten data for frontend
  const formatted = data.map((item: any) => {
    const product = item.products;
    const images = product.product_images || [];
    
    // Create a map of existing photos
    const photos = {
      front: images.some((img: any) => img.angle === 'front'),
      back: images.some((img: any) => img.angle === 'back'),
      left: images.some((img: any) => img.angle === 'left'),
      right: images.some((img: any) => img.angle === 'right')
    };

    return {
      id: product.id,
      name: product.name,
      category: product.category,
      stock: item.stock,
      price: product.price,
      lastUpdated: item.last_updated,
      photos: photos,
      syncStatus: 'Synced'
    };
  });

  return { ok: true, data: formatted };
}
