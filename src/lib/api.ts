/**
 * Mock API service for AutoCashier Admin Dashboard (Presentation Mode)
 * Zero backend dependency.
 */

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export type LocationID = 'ALL' | 'BR-001' | 'BR-002' | 'BR-003';

export const MOCK_LOCATIONS = [
  { id: 'ALL', name: 'All Branches' },
  { id: 'BR-001', name: 'Gegerkalong' },
  { id: 'BR-002', name: 'Surabaya Downtown' },
  { id: 'BR-003', name: 'Bandung Industrial' },
];

// Persistent Mock Storage in LocalStorage for dynamic updates
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
  { id: '4', catalogId: 'cat-3', stock: 88, price: 47500, location_id: 'BR-001', photos: { front: 'checked', back: 'checked', left: 'checked', right: 'checked' }, lastUpdated: '2024-04-22T09:15:00Z', syncStatus: 'Awaiting Audit' },
  { id: '5', catalogId: 'cat-4', stock: 15, price: 68000, location_id: 'BR-001', photos: { front: 'checked', back: 'checked', left: 'checked', right: 'checked' }, lastUpdated: '2024-04-23T14:20:00Z', syncStatus: 'Synced' },
  { id: '6', catalogId: 'cat-5', stock: 2500, price: 1250, location_id: 'BR-001', photos: { front: 'checked', back: 'checked', left: 'checked', right: 'checked' }, lastUpdated: '2024-04-24T08:45:00Z', syncStatus: 'Synced' },
  { id: '7', catalogId: 'cat-6', stock: 8, price: 75000, location_id: 'BR-001', photos: { front: 'checked', back: 'checked', left: 'checked', right: 'checked' }, lastUpdated: '2024-04-24T16:10:00Z', syncStatus: 'Awaiting Audit' },
];

export async function fetchBackend(action: string, data: any = {}) {
  await sleep(400); // Simulate network latency

  switch (action) {
    case 'login':
      if (data.username === 'admin' && data.password === 'admin') {
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
      return { status: 'success', data: MASTER_CATALOG };

    case 'getOverview':
      const locId = data.location_id || 'ALL';
      const timeframe = data.timeframe || 'weekly';
      const year = data.year || '2026';
      const month = data.month || 'April';
      const week = data.week || 'Week 17';

      const filtered = branchInventory.filter(item => locId === 'ALL' || item.location_id === locId);
      const multipliers: Record<string, number> = { 'ALL': 1, 'BR-001': 0.35, 'BR-002': 0.25, 'BR-003': 0.15 };
      
      // Dynamic shift based on selections
      const timeVariation = (year === '2026' ? 1.1 : 0.9) * (month === 'December' ? 1.5 : 1);
      const m = (multipliers[locId] || 1) * timeVariation;

      let chartData = [];
      if (timeframe === 'weekly') {
        chartData = [
          { name: 'Mon', total: 1400000 * m },
          { name: 'Tue', total: 1300000 * m },
          { name: 'Wed', total: 1500000 * m },
          { name: 'Thu', total: 1278000 * m },
          { name: 'Fri', total: 1189000 * m },
          { name: 'Sat', total: 2390000 * m },
          { name: 'Sun', total: 2490000 * m },
        ];
      } else if (timeframe === 'monthly') {
        chartData = [
          { name: 'Week 1', total: 3250000 * m },
          { name: 'Week 2', total: 3280000 * m },
          { name: 'Week 3', total: 3220000 * m },
          { name: 'Week 4', total: 3310000 * m },
        ];
      } else {
        chartData = [
          { name: 'Jan', total: 11200000 * m },
          { name: 'Feb', total: 11100000 * m },
          { name: 'Mar', total: 12500000 * m },
          { name: 'Apr', total: 11400000 * m },
          { name: 'May', total: 12600000 * m },
          { name: 'Jun', total: 11300000 * m },
          { name: 'Jul', total: 12550000 * m },
          { name: 'Aug', total: 13700000 * m },
          { name: 'Sep', total: 12650000 * m },
          { name: 'Oct', total: 12800000 * m },
          { name: 'Nov', total: 12900000 * m },
          { name: 'Dec', total: 14100000 * m },
        ];
      }
      
      return {
        status: 'success',
        data: {
          revenue: Math.floor(12840000 * m * (timeframe === 'monthly' ? 4 : timeframe === 'yearly' ? 48 : 1)),
          sales: Math.floor(1482 * m),
          locations: locId === 'ALL' ? 8 : 1,
          promos: Math.floor(24 * m),
          inventoryCount: filtered.length,
          chartData
        }
      };

    case 'getInventory':
      const targetLoc = data.location_id || 'ALL';
      const results = branchInventory
        .filter(item => targetLoc === 'ALL' || item.location_id === targetLoc)
        .map(inv => {
           const catalogItem = MASTER_CATALOG.find(c => c.id === inv.catalogId);
           return { ...inv, ...catalogItem, id: inv.id };
        });
      return { status: 'success', data: results };

    case 'addInventory':
      const newInvEntry = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        lastUpdated: new Date().toISOString()
      };
      branchInventory = [newInvEntry, ...branchInventory];
      return { status: 'success', data: newInvEntry };

    case 'updateInventory':
      branchInventory = branchInventory.map(item => 
        item.id === data.id ? { ...item, ...data, lastUpdated: new Date().toISOString() } : item
      );
      return { status: 'success' };

    case 'deleteInventory':
      branchInventory = branchInventory.filter(item => item.id !== data.id);
      return { status: 'success' };

    default:
      return { status: 'error', message: 'Action not implemented in Mock API' };
  }
}
