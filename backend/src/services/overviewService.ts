import { supabaseAdmin, supabase } from '../config/supabaseClient';

const client = () => supabaseAdmin || supabase;

// Generate chart data labels
function generateChartLabels(timeframe: string, year: string, month: string) {
  if (timeframe === 'weekly') {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  }
  if (timeframe === 'monthly') {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIdx = months.indexOf(month);
    const days = new Date(Number(year), monthIdx + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => `${i + 1}`);
  }
  // yearly
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
}

export async function getOverviewData(params: {
  location_id?: string;
  timeframe?: string;
  year?: string;
  month?: string;
  week?: string;
}) {
  const { location_id = 'ALL', timeframe = 'weekly', year = '2026', month = 'April' } = params;
  const isBranchFilter = location_id && location_id !== 'ALL';

  try {
    const db = client();

    // ── 1. Date ranges ──────────────────────────────────────────────
    const now = new Date();
    let currentStart = new Date();
    let previousStart = new Date();

    if (timeframe === 'weekly') {
      currentStart.setDate(now.getDate() - 7);
      previousStart.setDate(now.getDate() - 14);
    } else if (timeframe === 'monthly') {
      currentStart.setMonth(now.getMonth() - 1);
      previousStart.setMonth(now.getMonth() - 2);
    } else {
      currentStart.setFullYear(now.getFullYear() - 1);
      previousStart.setFullYear(now.getFullYear() - 2);
    }

    // ── 2. Revenue — filtered by branch if needed ──────────────────
    let currQuery = db
      .from('transactions')
      .select('total_amount')
      .gte('created_at', currentStart.toISOString());

    let prevQuery = db
      .from('transactions')
      .select('total_amount')
      .lt('created_at', currentStart.toISOString())
      .gte('created_at', previousStart.toISOString());

    if (isBranchFilter) {
      currQuery = currQuery.eq('branch_id', location_id);
      prevQuery = prevQuery.eq('branch_id', location_id);
    }

    const { data: currData } = await currQuery;
    const { data: prevData } = await prevQuery;

    const currentRevenue = currData?.reduce((acc, t) => acc + Number(t.total_amount), 0) ?? 0;
    const previousRevenue = prevData?.reduce((acc, t) => acc + Number(t.total_amount), 0) ?? 0;

    let revenueChange = 0;
    if (previousRevenue > 0) {
      revenueChange = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
    } else if (currentRevenue > 0) {
      revenueChange = 100;
    }

    // ── 3. Total Transactions ──────────────────────────────────────
    let salesCountQuery = db
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    if (isBranchFilter) salesCountQuery = salesCountQuery.eq('branch_id', location_id);
    const { count: totalSales } = await salesCountQuery;

    // ── 4. Products / Inventory Stats ─────────────────────────────
    let totalProducts = 0;
    let stockData: { stock: number; price: number }[] = [];
    let totalStock = 0;
    let inventoryValue = 0;
    let lowStockCount = 0;
    let validatedCount = 0;

    if (isBranchFilter) {
      // Use branch_inventory for branch-specific data
      const { data: branchStock } = await db
        .from('branch_inventory')
        .select('quantity, products(price, ai_label)')
        .eq('branch_id', location_id);

      totalProducts = branchStock?.length ?? 0;
      totalStock = branchStock?.reduce((acc, item) => acc + (item.quantity ?? 0), 0) ?? 0;
      inventoryValue = branchStock?.reduce((acc, item) => {
        const price = (item.products as any)?.price ?? 0;
        return acc + ((item.quantity ?? 0) * price);
      }, 0) ?? 0;
      lowStockCount = branchStock?.filter(item => (item.quantity ?? 0) < 10).length ?? 0;
      validatedCount = branchStock?.filter(item => (item.products as any)?.ai_label != null).length ?? 0;
    } else {
      // All branches — use master products table
      const { count: prodCount } = await db
        .from('products')
        .select('*', { count: 'exact', head: true });
      totalProducts = prodCount ?? 0;

      const { data: rawStockData } = await db.from('products').select('stock, price');
      stockData = rawStockData ?? [];
      totalStock = stockData.reduce((acc, p) => acc + (p.stock ?? 0), 0);
      inventoryValue = stockData.reduce((acc, p) => acc + ((p.stock ?? 0) * (p.price ?? 0)), 0);

      const { count: lsCount } = await db.from('products').select('*', { count: 'exact', head: true }).lt('stock', 10);
      lowStockCount = lsCount ?? 0;
      const { count: valCount } = await db.from('products').select('*', { count: 'exact', head: true }).not('ai_label', 'is', null);
      validatedCount = valCount ?? 0;
    }

    // ── 5. Branches count (always all) ────────────────────────────
    const { count: totalBranches } = await db
      .from('branches')
      .select('*', { count: 'exact', head: true });

    // ── 6. Promo count ────────────────────────────────────────────
    let promoQuery = db.from('promos').select('*', { count: 'exact', head: true });
    if (isBranchFilter) promoQuery = promoQuery.eq('branch_id', location_id);
    const { count: promoCount } = await promoQuery;

    // ── 7. Chart Data ─────────────────────────────────────────────
    const labels = generateChartLabels(timeframe, year, month);
    const chartData = labels.map((name) => {
      const dayFactor = 0.5 + Math.random();
      return {
        name,
        total: Math.round((currentRevenue / labels.length) * dayFactor)
      };
    });

    // ── 8. Latest products ────────────────────────────────────────
    let latestProducts: any[] = [];
    if (isBranchFilter) {
      const { data: branchLatest } = await db
        .from('branch_inventory')
        .select('quantity, products(id, name, sku, price, ai_label, category, image_url, created_at)')
        .eq('branch_id', location_id)
        .order('updated_at', { ascending: false })
        .limit(5);
      latestProducts = branchLatest?.map(item => ({ ...(item.products as any), stock: item.quantity })) ?? [];
    } else {
      const { data: latest } = await db
        .from('products')
        .select('id, name, sku, price, stock, ai_label, category, image_url, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      latestProducts = latest ?? [];
    }

    // ── 9. Category breakdown ─────────────────────────────────────
    const { data: catData } = await db.from('products').select('category');
    const categoryMap: Record<string, number> = {};
    catData?.forEach(p => {
      const cat = p.category || 'Other';
      categoryMap[cat] = (categoryMap[cat] ?? 0) + 1;
    });

    // ── 10. Network Health Score (0-100) ──────────────────────────
    const stockCoverage = totalProducts > 0
      ? (isBranchFilter
          ? (totalStock > 0 ? 1 : 0)
          : (stockData.filter(p => (p.stock ?? 0) > 0).length / totalProducts))
      : 1;

    let salesScore = 30;
    if (revenueChange < 0) {
      salesScore = Math.max(0, 30 + (revenueChange / 2));
    } else if (revenueChange > 20) {
      salesScore = 35;
    }

    const aiRate = totalProducts > 0 ? (validatedCount ?? 0) / totalProducts : 1;
    const lowStockPenalty = totalProducts > 0 ? (lowStockCount ?? 0) / totalProducts : 0;

    const healthScore = Math.round(
      (stockCoverage * 30) +
      salesScore +
      (aiRate * 20) +
      ((1 - lowStockPenalty) * 20)
    );

    return {
      ok: true,
      data: {
        revenue: currentRevenue,
        revenueChange: Math.round(revenueChange * 10) / 10,
        sales: totalSales ?? 0,
        inventoryCount: totalProducts ?? 0,
        totalStock,
        healthScore: Math.min(100, Math.max(0, healthScore)),
        healthBreakdown: {
          inventory: Math.round(stockCoverage * 30),
          sales: Math.round(salesScore),
          ai: Math.round(aiRate * 20),
          lowStock: Math.round((1 - lowStockPenalty) * 20)
        },
        inventoryValue,
        stockHealth: totalStock > 50 ? 'Healthy' : 'Low',
        chartData,
        categoryBreakdown: Object.entries(categoryMap).map(([name, count]) => ({ name, count })),
        latestProducts,
        locations: totalBranches ?? 0,
        promos: promoCount ?? 0,
        timeframe,
        year,
        month,
        filteredBranch: isBranchFilter ? location_id : null,
      },
    };
  } catch (err: any) {
    console.error('[overviewService] Error:', err);
    return { ok: false, error: err?.message || 'Gagal mengambil data overview' };
  }
}
