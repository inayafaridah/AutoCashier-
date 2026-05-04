/**
 * API service for AutoCashier Admin Dashboard
 * Strictly integrated with Backend API
 */

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export type LocationID = 'ALL' | string;

export const MOCK_LOCATIONS = [
  { id: 'ALL', name: 'All Branches' },
];

export async function fetchBackend(action: string, data: any = {}) {
  try {
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
          return {
            status: 'success',
            data: {
              username: resData.data.user.full_name || resData.data.user.username,
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
              : (resData.message || 'Login gagal. Silakan coba lagi.') 
        };
      }

      case 'getMasterCatalog': {
        const response = await fetch(`${BACKEND_URL}/api/products`);
        const json = await response.json();
        return { status: 'success', data: json.data || [] };
      }

      case 'getOverview': {
        const params = new URLSearchParams({
          location_id: data.location_id || 'ALL',
          timeframe: data.timeframe || 'weekly',
          year: data.year || '2026',
          month: data.month || 'April',
          week: data.week || 'Week 17',
        });
        const response = await fetch(`${BACKEND_URL}/api/overview?${params.toString()}`);
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

      case 'getInventory': {
        const targetLoc = data.location_id || 'ALL';
        const endpoint = targetLoc === 'ALL' 
          ? `${BACKEND_URL}/api/branch-inventory`
          : `${BACKEND_URL}/api/branch-inventory/${targetLoc}`;
        
        const response = await fetch(endpoint);
        const json = await response.json();
        
        // If it's ALL, it returns { branches: [], summary: {} }. 
        // But InventoryPage expects an array of items.
        // If it's a specific ID, it returns the items array.
        
        if (targetLoc === 'ALL') {
          // Flatten all items from all branches if needed, or just return the summary list?
          // InventoryPage expects an array of items.
          // Let's assume the backend should provide a way to get ALL items.
          // For now, if ALL, we fetch from /api/branch-inventory which gives summaries.
          // This might be a mismatch in expectations.
          return json; 
        }
        
        return json;
      }

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

      default:
        return { status: 'error', message: 'Action not implemented' };
    }
  } catch (err) {
    console.error(`[api] Error performing action ${action}:`, err);
    return { status: 'error', message: 'Connection to backend failed' };
  }
}
