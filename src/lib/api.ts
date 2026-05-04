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

// ============ SUPABASE & BACKEND HELPERS ============

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

export async function fetchBackend(action: string, data: any = {}) {
  await sleep(400); // Simulate network latency

  switch (action) {
    case 'login': {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: data.username,
          password: data.password
        })
      });

      const resData = await response.json();

      if (response.ok && resData.status === 'success') {
        // Map backend user to frontend expectations
        return {
          status: 'success',
          data: {
            id: resData.data.user.id,
            username: resData.data.user.full_name || resData.data.user.username,
            email: resData.data.user.email,
            roleName: resData.data.user.role === 'super_admin' ? 'Super Admin (Pusat)' : 'Branch Admin',
            role: resData.data.user.role,
            location_id: resData.data.user.branch_id || 'ALL',
            token: resData.data.token
          }
        };
      }

      return {
        status: 'error',
        message: resData.error === 'USER_NOT_FOUND'
          ? 'Pengguna tidak ditemukan'
          : resData.error === 'INVALID_PASSWORD'
            ? 'Password salah'
            : 'Login gagal. Silakan coba lagi.'
      };
    }

    case 'getMasterCatalog':
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

    case 'getProducts': {
      const response = await fetch(`${BACKEND_URL}/api/products`);
      return await response.json();
    }

    case 'createProduct': {
      const response = await fetch(`${BACKEND_URL}/api/products`, {
        method: 'POST',
        body: data // FormData
      });
      return await response.json();
    }

    case 'updateProduct': {
      const { id, ...updateData } = data;
      const response = await fetch(`${BACKEND_URL}/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      return await response.json();
    }

    case 'deleteProduct': {
      const response = await fetch(`${BACKEND_URL}/api/products/${data.id}`, {
        method: 'DELETE'
      });
      return await response.json();
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

    case 'addInventory': {
      const response = await fetch(`${BACKEND_URL}/api/branch-inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    }

    case 'updateInventory': {
      const { id, ...updateData } = data;
      const response = await fetch(`${BACKEND_URL}/api/branch-inventory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      return await response.json();
    }

    case 'deleteInventory': {
      const response = await fetch(`${BACKEND_URL}/api/branch-inventory/${data.id}${data.location_id ? `?branch_id=${data.location_id}` : ''}`, {
        method: 'DELETE'
      });
      return await response.json();
    }

    case 'getBranchSummaries': {
      const response = await fetch(`${BACKEND_URL}/api/branch-inventory`);
      return await response.json();
    }

    case 'getBranchInventoryDetails': {
      const response = await fetch(`${BACKEND_URL}/api/branch-inventory/${data.id}`);
      return await response.json();
    }

    case 'getUsers': {
      const response = await fetch(`${BACKEND_URL}/api/users`);
      return await response.json();
    }

    case 'getBranches': {
      const response = await fetch(`${BACKEND_URL}/api/branches`);
      return await response.json();
    }

    case 'getBroadcasts': {
      const response = await fetch(`${BACKEND_URL}/api/broadcasts`);
      return await response.json();
    }

    case 'sendBroadcast': {
      const response = await fetch(`${BACKEND_URL}/api/broadcasts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    }

    case 'createUser': {
      const response = await fetch(`${BACKEND_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    }

    case 'updateUser': {
      const response = await fetch(`${BACKEND_URL}/api/users/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    }

    case 'deleteUser': {
      const response = await fetch(`${BACKEND_URL}/api/users/${data.id}`, {
        method: 'DELETE'
      });
      return await response.json();
    }

    case 'aiInsight': {
      const response = await fetch(`${BACKEND_URL}/api/ai/insight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    }

    case 'aiAutoAnalysis': {
      const response = await fetch(`${BACKEND_URL}/api/ai/auto-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    }

    default:
      return { status: 'error', message: 'Action not implemented' };
  }
}
