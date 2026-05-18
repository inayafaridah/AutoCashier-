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
    let token = '';
    const savedUser = localStorage.getItem('autocashier_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.token) token = parsed.token;
      } catch (e) {}
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    switch (action) {
      case 'login': {
        const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
          method: 'POST',
          headers,
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
              username: resData.data.user.username,
              roleName: resData.data.user.role === 'super_admin' ? 'Super Admin (Pusat)' : 'Branch Admin',
              role: resData.data.user.role,
              location_id: resData.data.user.branch_id || 'ALL',
              email: resData.data.user.email || '',
              whatsapp: resData.data.user.whatsapp || '',
              full_name: resData.data.user.full_name || '',
              avatar_url: resData.data.user.avatar_url || '',
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
        const response = await fetch(`${BACKEND_URL}/api/products`, { headers });
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
        const response = await fetch(`${BACKEND_URL}/api/overview?${params.toString()}`, { headers });
        return await response.json();
      }

      case 'getProductAnalytics': {
        const params = new URLSearchParams({
          location_id: data.location_id || 'ALL',
          timeframe: data.timeframe || 'weekly'
        });
        const response = await fetch(`${BACKEND_URL}/api/monitor/products?${params.toString()}`, { headers });
        return await response.json();
      }

      case 'getPromos': {
        const response = await fetch(`${BACKEND_URL}/api/promos`, { headers });
        return await response.json();
      }

      case 'createPromo': {
        const response = await fetch(`${BACKEND_URL}/api/promos`, {
          method: 'POST',
          headers,
          body: JSON.stringify(data)
        });
        return await response.json();
      }

      case 'deletePromo': {
        const response = await fetch(`${BACKEND_URL}/api/promos/${data.id}`, {
          method: 'DELETE',
          headers
        });
        return await response.json();
      }

      case 'validatePromo': {
        // data: { code, total_price, user_id? }
        const response = await fetch(`${BACKEND_URL}/api/promos/validate`, {
          method: 'POST',
          headers,
          body: JSON.stringify(data)
        });
        return await response.json();
      }

      case 'getInventory': {
        const targetLoc = data.location_id || 'ALL';

        if (targetLoc === 'ALL') {
          // Instead of fetching from all branches and duplicating items,
          // simply fetch from the master catalog (products table) which has the combined data.
          const response = await fetch(`${BACKEND_URL}/api/products`, { headers });
          const json = await response.json();
          return { status: 'success', data: json.data || [] };
        }

        // Specific branch
        const response = await fetch(`${BACKEND_URL}/api/branch-inventory/${targetLoc}`, { headers });
        const json = await response.json();
        const items = Array.isArray(json?.data) ? json.data : [];
        return { status: 'success', data: items };
      }

      case 'addInventory': {
        const response = await fetch(`${BACKEND_URL}/api/branch-inventory`, {
          method: 'POST',
          headers,
          body: JSON.stringify(data)
        });
        return await response.json();
      }

      case 'adjustInventory': {
        const response = await fetch(`${BACKEND_URL}/api/branch-inventory/adjust`, {
          method: 'POST',
          headers,
          body: JSON.stringify(data)
        });
        return await response.json();
      }

      case 'updateInventory': {
        const { id, ...updateData } = data;
        const response = await fetch(`${BACKEND_URL}/api/branch-inventory/${id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(updateData)
        });
        return await response.json();
      }

      case 'deleteInventory': {
        const response = await fetch(`${BACKEND_URL}/api/branch-inventory/${data.id}${data.location_id ? `?branch_id=${data.location_id}` : ''}`, {
          method: 'DELETE',
          headers
        });
        return await response.json();
      }

      case 'deleteProduct': {
        const response = await fetch(`${BACKEND_URL}/api/products/${data.id}`, {
          method: 'DELETE',
          headers
        });
        return await response.json();
      }

      case 'getBranchSummaries': {
        const response = await fetch(`${BACKEND_URL}/api/branch-inventory`, { headers });
        return await response.json();
      }

      case 'getBranchInventoryDetails': {
        const response = await fetch(`${BACKEND_URL}/api/branch-inventory/${data.id}`, { headers });
        return await response.json();
      }

      case 'getInventoryMovements': {
        const url = data.product_id
          ? `${BACKEND_URL}/api/branch-inventory/${data.id}/movements?product_id=${data.product_id}`
          : `${BACKEND_URL}/api/branch-inventory/${data.id}/movements`;
        const response = await fetch(url, { headers });
        return await response.json();
      }

      case 'getUsers': {
        const response = await fetch(`${BACKEND_URL}/api/users`, { headers });
        return await response.json();
      }

      case 'getBranches': {
        const response = await fetch(`${BACKEND_URL}/api/branches`, { headers });
        return await response.json();
      }

      case 'getBroadcasts': {
        const response = await fetch(`${BACKEND_URL}/api/broadcasts`, { headers });
        return await response.json();
      }

      case 'sendBroadcast': {
        const response = await fetch(`${BACKEND_URL}/api/broadcasts`, {
          method: 'POST',
          headers,
          body: JSON.stringify(data)
        });
        return await response.json();
      }

      case 'createUser': {
        const response = await fetch(`${BACKEND_URL}/api/users`, {
          method: 'POST',
          headers,
          body: JSON.stringify(data)
        });
        return await response.json();
      }

      case 'updateUser': {
        const response = await fetch(`${BACKEND_URL}/api/users/${data.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(data)
        });
        return await response.json();
      }

      case 'deleteUser': {
        const response = await fetch(`${BACKEND_URL}/api/users/${data.id}`, {
          method: 'DELETE',
          headers
        });
        return await response.json();
      }

      case 'assignMemberPromo': {
        const { userId, ...promoData } = data;
        const response = await fetch(`${BACKEND_URL}/api/users/${userId}/promos`, {
          method: 'POST',
          headers,
          body: JSON.stringify(promoData)
        });
        return await response.json();
      }

      case 'getProfile': {
        const response = await fetch(`${BACKEND_URL}/api/profile`, { headers });
        return await response.json();
      }

      case 'updateProfile': {
        const response = await fetch(`${BACKEND_URL}/api/profile`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(data)
        });
        return await response.json();
      }

      case 'updatePassword': {
        const response = await fetch(`${BACKEND_URL}/api/profile/password`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(data)
        });
        return await response.json();
      }

      case 'uploadProfilePhoto': {
        // Remove Content-Type header so the browser sets it to multipart/form-data with boundary
        const uploadHeaders = { ...headers };
        delete uploadHeaders['Content-Type'];
        
        const response = await fetch(`${BACKEND_URL}/api/profile/photo`, {
          method: 'POST',
          headers: uploadHeaders,
          body: data // data should be a FormData instance
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
