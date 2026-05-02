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

    // 2. Get stock data with product price
    const { data: inventory, error: iErr } = await db
      .from('branch_inventory')
      .select(`
        branch_id, 
        stock, 
        products (
          price
        )
      `);
    
    if (iErr) {
      console.error('[branchInventoryService] Inventory fetch error:', iErr);
    }

    // 3. Aggregate data per branch
    let totalActiveUnits = 0;
    let totalDiscrepancies = 0;
    let totalNetworkValue = 0;

    const summaries = branches.map(b => {
      const branchItems = (inventory || []).filter((i: any) => i.branch_id === b.id);
      const totalItems = branchItems.length;
      const lowStock = branchItems.filter((i: any) => (i.stock || 0) < 10).length;
      const branchValue = branchItems.reduce((acc: number, i: any) => acc + ((i.stock || 0) * Number(i.products?.price || 0)), 0);
      
      totalActiveUnits += totalItems;
      totalDiscrepancies += lowStock;
      totalNetworkValue += branchValue;

      return {
        id: b.id,
        name: b.name,
        items: totalItems,
        lowStock: lowStock,
        value: branchValue, 
        health: totalItems > 0 ? Math.round(((totalItems - lowStock) / totalItems) * 100) : 100
      };
    });

    const networkSummary = {
      activeUnits: totalActiveUnits,
      discrepancies: totalDiscrepancies,
      totalValue: totalNetworkValue,
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
      branch_id: item.branch_id,
      lastUpdated: item.last_updated,
      photos: photos,
      syncStatus: 'Synced'
    };
  });

  return { ok: true, data: formatted };
}

export async function addItem(payload: any) {
  const db = client();
  const { catalogId, location_id, stock, price } = payload;
  
  const { data, error } = await db.from('branch_inventory').insert({
    product_id: catalogId,
    branch_id: location_id,
    stock: Number(stock),
    last_updated: new Date().toISOString()
  }).select().single();

  if (error) return { ok: false, error };
  return { ok: true, data };
}

export async function updateItem(payload: any) {
  const db = client();
  const { id, stock, price } = payload; // id here refers to the branch_inventory id or product_id?
  // In our formatted data, 'id' was product.id. We need the branch_inventory entry id.
  
  // Actually, usually we update by (branch_id, product_id)
  const { data, error } = await db.from('branch_inventory')
    .update({ stock: Number(stock), last_updated: new Date().toISOString() })
    .match({ product_id: payload.catalogId || id, branch_id: payload.location_id })
    .select();

  if (error) return { ok: false, error };
  return { ok: true, data };
}

export async function deleteItem(id: string, branchId?: string) {
  const db = client();
  // If we have branchId and productId, use match
  const query = db.from('branch_inventory').delete();
  
  if (branchId) {
    query.match({ product_id: id, branch_id: branchId });
  } else {
    query.eq('id', id);
  }

  const { error } = await query;
  if (error) return { ok: false, error };
  return { ok: true };
}
