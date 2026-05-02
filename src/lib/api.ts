/**
 * API service for AutoCashier Admin Dashboard
 * Integrates with Supabase PostgreSQL database with fallback to mock data
 */

import { supabase } from './supabase';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

let useSupabase = true; // Toggle between Supabase and mock data

export type LocationID = 'ALL' | 'BR-001' | 'BR-002' | 'BR-003';

export const MOCK_LOCATIONS = [
  { id: 'ALL', name: 'All Branches' },
  { id: 'BR-001', name: 'Gegerkalong' },
  { id: 'BR-002', name: 'Surabaya Downtown' },
  { id: 'BR-003', name: 'Bandung Industrial' },
];

// Persistent Mock Storage
const MASTER_CATALOG = [
  { id: 'cat-1', name: 'Arabica Signature Blend', category: 'Coffee Beans', basePrice: 120000 },
  { id: 'cat-2', name: 'Robusta Gold', category: 'Coffee Beans', basePrice: 85000 },
  { id: 'cat-3', name: 'Oat Milk 1L', category: 'Ingredients', basePrice: 45000 },
  { id: 'cat-4', name: 'Caramel Syrup', category: 'Syrups', basePrice: 65000 },
  { id: 'cat-5', name: 'Paper Cups 8oz', category: 'Packaging', basePrice: 1200 },
  { id: 'cat-6', name: 'Hazelnut Praline Syrup', category: 'Syrups', basePrice: 72000 },
  { id: 'cat-7', name: 'Organic Matcha Powder', category: 'Tea', basePrice: 155000 },
];

let branchInventory = [
  { id: '1', catalogId: 'cat-1', stock: 45, price: 125000, location_id: 'BR-001', photos: { front: 'checked', back: 'checked', left: 'checked', right: 'checked' }, lastUpdated: '2024-04-20T10:00:00Z', syncStatus: 'Synced' },
  { id: '2', catalogId: 'cat-2', stock: 12, price: 85000, location_id: 'BR-001', photos: { front: 'checked', back: 'checked', left: 'checked', right: 'checked' }, lastUpdated: '2024-04-21T11:30:00Z', syncStatus: 'Synced' },
  { id: '3', catalogId: 'cat-3', stock: 120, price: 45000, location_id: 'BR-002', photos: { front: 'checked', back: 'checked', left: 'checked', right: 'checked' }, lastUpdated: '2024-04-22T09:15:00Z', syncStatus: 'Synced' },
];

// ============ SUPABASE FUNCTIONS ============

export async function getMasterCatalogFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('master_catalog')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Failed to fetch master catalog from Supabase:', error);
    useSupabase = false;
    return MASTER_CATALOG;
  }
}

export async function getProductsFromBackend() {
  const response = await fetch(`${BACKEND_URL}/api/products`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load products: ${response.status}`);
  }

  const payload = await response.json();

  if (payload?.status !== 'success') {
    throw new Error(payload?.error || 'Backend returned an error while loading products');
  }

  return Array.isArray(payload.data) ? payload.data : [];
}

export async function getInventoryFromSupabase(locationId?: string) {
  try {
    let query = supabase.from('branch_inventory').select('*, master_catalog(*)');
    
    if (locationId && locationId !== 'ALL') {
      query = query.eq('location_id', locationId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Failed to fetch inventory from Supabase:', error);
    useSupabase = false;
    return branchInventory.filter(item => !locationId || locationId === 'ALL' || item.location_id === locationId);
  }
}

export async function createInventoryItemInSupabase(data: any) {
  try {
    const { data: newItem, error } = await supabase
      .from('branch_inventory')
      .insert([{ ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }])
      .select()
      .single();
    
    if (error) throw error;
    return newItem;
  } catch (error) {
    console.error('❌ Failed to create inventory item in Supabase:', error);
    useSupabase = false;
    const newItem = { ...data, id: Math.random().toString(36).substr(2, 9), lastUpdated: new Date().toISOString() };
    branchInventory = [newItem, ...branchInventory];
    return newItem;
  }
}

export async function updateInventoryItemInSupabase(id: string, data: any) {
  try {
    const { error } = await supabase
      .from('branch_inventory')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
    return { status: 'success' };
  } catch (error) {
    console.error('❌ Failed to update inventory item in Supabase:', error);
    useSupabase = false;
    branchInventory = branchInventory.map(item => 
      item.id === id ? { ...item, ...data, lastUpdated: new Date().toISOString() } : item
    );
    return { status: 'success' };
  }
}

export async function deleteInventoryItemFromSupabase(id: string) {
  try {
    const { error } = await supabase
      .from('branch_inventory')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { status: 'success' };
  } catch (error) {
    console.error('❌ Failed to delete inventory item from Supabase:', error);
    useSupabase = false;
    branchInventory = branchInventory.filter(item => item.id !== id);
    return { status: 'success' };
  }
}

export async function fetchBackend(action: string, data: any = {}) {
  await sleep(400); // Simulate network latency

  switch (action) {
    case 'login':
      if (data.username === 'admin' && (data.password === 'admin' || data.password === 'admin777')) {
        return {
          status: 'success',
          data: {
            username: 'Budi Santoso',
            roleName: 'Manajer Operasional (Pusat)',
            role: 'super_admin',
            location_id: 'ALL'
          }
        };
      }
      if (data.username === 'admin_jkt' && data.password === 'admin123') {
        return {
          status: 'success',
          data: {
            username: 'Andi Wijaya',
            roleName: 'Staf Logistik (Jakarta)',
            role: 'branch_admin',
            location_id: 'BR-001'
          }
        };
      }
      return { status: 'error', message: 'Kredensial salah. Gunakan admin/admin atau admin_jkt/admin123' };

    case 'getMasterCatalog':
      if (useSupabase) {
        const catalogData = await getMasterCatalogFromSupabase();
        return { status: 'success', data: catalogData };
      }
      return { status: 'success', data: MASTER_CATALOG };

    case 'getOverview': {
      // Hit the real backend endpoint
      const params = new URLSearchParams({
        location_id: data.location_id || 'ALL',
        timeframe: data.timeframe || 'weekly',
        year: data.year || '2026',
        month: data.month || 'April',
        week: data.week || 'Week 17',
      });
      const overviewRes = await fetch(`${BACKEND_URL}/api/overview?${params.toString()}`);
      const overviewJson = await overviewRes.json();
      return overviewJson;
    }

    case 'getPromos': {
      const response = await fetch(`${BACKEND_URL}/api/promos`);
      return await response.json();
    }

    case 'createPromo': {
      const response = await fetch(`${BACKEND_URL}/api/promos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    }

    case 'deletePromo': {
      const response = await fetch(`${BACKEND_URL}/api/promos/${data.id}`, {
        method: 'DELETE'
      });
      return await response.json();
    }

    case 'getInventory':
      if (useSupabase) {
        const targetLoc = data.location_id || 'ALL';
        const inventoryData = await getInventoryFromSupabase(targetLoc === 'ALL' ? undefined : targetLoc);
        return { status: 'success', data: inventoryData };
      }
      const targetLoc = data.location_id || 'ALL';
      const results = branchInventory
        .filter(item => targetLoc === 'ALL' || item.location_id === targetLoc)
        .map(inv => {
           const catalogItem = MASTER_CATALOG.find(c => c.id === inv.catalogId);
           return { ...inv, ...catalogItem, id: inv.id };
        });
      return { status: 'success', data: results };

    case 'addInventory':
      if (useSupabase) {
        const newItem = await createInventoryItemInSupabase(data);
        return { status: 'success', data: newItem };
      }
      const newInvEntry = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        lastUpdated: new Date().toISOString()
      };
      branchInventory = [newInvEntry, ...branchInventory];
      return { status: 'success', data: newInvEntry };

    case 'updateInventory':
      if (useSupabase) {
        return await updateInventoryItemInSupabase(data.id, data);
      }
      branchInventory = branchInventory.map(item => 
        item.id === data.id ? { ...item, ...data, lastUpdated: new Date().toISOString() } : item
      );
      return { status: 'success' };

    case 'deleteInventory':
      if (useSupabase) {
        return await deleteInventoryItemFromSupabase(data.id);
      }
      branchInventory = branchInventory.filter(item => item.id !== data.id);
      return { status: 'success' };

    case 'getBranchSummaries': {
      const response = await fetch(`${BACKEND_URL}/api/branch-inventory`);
      return await response.json();
    }

    case 'getBranchInventoryDetails': {
      const response = await fetch(`${BACKEND_URL}/api/branch-inventory/${data.id}`);
      return await response.json();
    }

    default:
      return { status: 'error', message: 'Action not implemented' };
  }
}
