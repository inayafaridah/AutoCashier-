import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp, Package, BarChart3, Clock, Globe, MapPin, Loader2,
  RefreshCw, DollarSign, ShoppingCart, Tag, Layers, Search, ArrowUpRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, Tooltip as RechartsTooltip, Cell
} from 'recharts';
import { useAuth } from '@/shared/context/AuthContext';
import { useLocation } from '@/shared/context/LocationContext';
import { fetchBackend } from '@/shared/lib/api';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { BranchSelector } from '@/shared/components/layout/BranchSelector';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/shared/components/ui/select';
import { toast } from 'sonner';
import BranchInventoryPage from '@/modules/inventory/pages/BranchInventoryPage';

function formatRp(val: number) {
  return 'Rp ' + val.toLocaleString('id-ID');
}

// Sleek color palette for chart bars
const COLORS = ['#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];

export default function MonitorPage() {
  const { user } = useAuth();
  const { currentLocation, locationName } = useLocation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'visual' | 'list'>('visual');

  if (user?.role === 'super_admin') {
    return <BranchInventoryPage />;
  }

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchBackend('getProductAnalytics', {
        location_id: currentLocation,
        timeframe
      });
      if (res.status === 'success') {
        setData(res.data);
      } else {
        toast.error('Gagal mengambil data analitik');
      }
    } catch (e) {
      toast.error('Error saat menghubungi server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentLocation, timeframe]);

  // Filtered products list for search
  const filteredProducts = (data?.productsList || []).filter((p: any) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Top category computation
  const getTopCategory = () => {
    if (!data?.categoryBreakdown || data.categoryBreakdown.length === 0) return 'Tidak ada';
    const sorted = [...data.categoryBreakdown].sort((a, b) => b.value - a.value);
    return sorted[0].name;
  };

  return (
    <div className="space-y-8 pb-12 w-full max-w-full overflow-x-hidden">
      
      {/* ── Branch Filter Bar ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-2.5 bg-white rounded-full border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] mb-2">
        <div className="flex items-center gap-4 pl-3">
          <div className="w-10 h-10 bg-indigo-50/80 rounded-full flex items-center justify-center border border-indigo-100/50">
            {currentLocation === 'ALL' ? (
              <Globe className="w-5 h-5 text-indigo-600" />
            ) : (
              <MapPin className="w-5 h-5 text-indigo-600" />
            )}
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">Viewing Data For</p>
            <p className="text-sm font-black text-gray-900 leading-none">
              {currentLocation === 'ALL' ? 'All Branches (Consolidated)' : locationName}
            </p>
          </div>
        </div>
        <div className="pr-1">
          <BranchSelector />
        </div>
      </div>

      {/* ── Header Info ────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-indigo-600 rounded-full shadow-[0_0_8px_#4F46E5]" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">System Performance</span>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter leading-none">
              Product Sales Analytics
            </h2>
          </div>
          <p className="text-gray-500 font-medium tracking-tight max-w-xl">
            Monitor real-time product performance, identify top-selling items, and optimize supply-demand trends.
          </p>
        </div>

        {/* Timeframe & View Controllers */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-gray-100/80 p-1 rounded-xl flex gap-1 border border-gray-200/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveView('visual')}
              className={cn(
                "rounded-lg px-4 text-xs font-bold transition-all duration-300",
                activeView === 'visual'
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              Visual Dashboard
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveView('list')}
              className={cn(
                "rounded-lg px-4 text-xs font-bold transition-all duration-300",
                activeView === 'list'
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              Products List
            </Button>
          </div>

          <Select
            value={timeframe}
            onValueChange={(val: any) => setTimeframe(val)}
          >
            <SelectTrigger className="w-[140px] bg-white border-gray-200/80 rounded-xl font-bold text-xs text-gray-700 shadow-sm">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-gray-100 shadow-xl">
              <SelectItem value="weekly" className="text-xs font-bold rounded-lg">Weekly View</SelectItem>
              <SelectItem value="monthly" className="text-xs font-bold rounded-lg">Monthly View</SelectItem>
              <SelectItem value="yearly" className="text-xs font-bold rounded-lg">Yearly View</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={loadData}
            variant="outline"
            className="rounded-xl border-gray-200 hover:bg-gray-50 p-2.5 h-10 w-10 flex items-center justify-center shadow-sm"
          >
            <RefreshCw className={cn("w-4 h-4 text-gray-600", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* ── Loading Overlay ─────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <p className="text-sm font-semibold text-gray-400">Memuat analisis penjualan...</p>
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeView === 'visual' ? (
            <motion.div
              key="visual"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* ── Stat Cards ─────────────────────────────────── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Revenue Card */}
                <Card className="border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-3xl overflow-hidden relative group hover:shadow-[0_20px_50px_rgba(99,102,241,0.12)] transition-all duration-500">
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Total Sales Revenue</span>
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                        <DollarSign className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-3xl font-black text-gray-900 tracking-tight">
                        {formatRp(data?.totalRevenue || 0)}
                      </h3>
                      <p className="text-xs text-gray-400 font-medium">Accumulated product revenue</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Items Sold Card */}
                <Card className="border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-3xl overflow-hidden relative group hover:shadow-[0_20px_50px_rgba(16,185,129,0.12)] transition-all duration-500">
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Total Items Sold</span>
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-3xl font-black text-gray-900 tracking-tight">
                        {(data?.totalItemsSold || 0).toLocaleString('id-ID')} unit
                      </h3>
                      <p className="text-xs text-gray-400 font-medium">Quantity dispatched to customers</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Top Category Card */}
                <Card className="border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-3xl overflow-hidden relative group hover:shadow-[0_20px_50px_rgba(245,158,11,0.12)] transition-all duration-500">
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Best Selling Category</span>
                      <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
                        <Layers className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-3xl font-black text-gray-900 tracking-tight capitalize truncate">
                        {getTopCategory()}
                      </h3>
                      <p className="text-xs text-gray-400 font-medium">Highest revenue contribution category</p>
                    </div>
                  </CardContent>
                </Card>

              </div>

              {/* ── Charts ─────────────────────────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Product Sales Chart */}
                <Card className="border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] rounded-3xl p-6 space-y-6 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-lg font-black text-gray-900 tracking-tight">Top Products Sales</h4>
                      <p className="text-xs text-gray-400 font-medium">Highest generating items based on timeframe sales</p>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    {data?.topProducts && data.topProducts.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={data.topProducts}
                          margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                            tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${v/1000}k`}
                          />
                          <RechartsTooltip
                            cursor={{ fill: '#f8fafc' }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const p = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-1 text-white">
                                    <p className="text-xs font-black leading-none mb-1 text-slate-400 uppercase tracking-widest">{p.category}</p>
                                    <p className="text-sm font-black">{p.name}</p>
                                    <p className="text-xs font-bold text-slate-300">Revenue: {formatRp(p.revenue)}</p>
                                    <p className="text-xs text-indigo-400 font-bold">Qty Sold: {p.quantitySold} unit</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="revenue" radius={[10, 10, 0, 0]} barSize={24}>
                            {data.topProducts.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-sm font-semibold text-gray-400">Belum ada data penjualan pada periode ini.</p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Sales Trends Chart */}
                <Card className="border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] rounded-3xl p-6 space-y-6 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-lg font-black text-gray-900 tracking-tight">Sales Trends</h4>
                      <p className="text-xs text-gray-400 font-medium">Periodic sales projection and distribution curve</p>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    {data?.salesTrend && data.salesTrend.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={data.salesTrend}
                          margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
                        >
                          <defs>
                            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                            tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : `${v/1000}k`}
                          />
                          <RechartsTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const p = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-1 text-white">
                                    <p className="text-xs font-black leading-none mb-1 text-slate-400 uppercase tracking-widest">{p.date}</p>
                                    <p className="text-sm font-black text-indigo-400">Sales: {formatRp(payload[0].value as number)}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#6366F1"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#trendGrad)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-sm font-semibold text-gray-400">Belum ada tren data penjualan.</p>
                      </div>
                    )}
                  </div>
                </Card>

              </div>

              {/* ── Category Breakdown Progress Bars ──────────────── */}
              <Card className="border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] rounded-3xl p-8 bg-white space-y-6">
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-gray-900 tracking-tight">Category Contribution</h4>
                  <p className="text-xs text-gray-400 font-medium">Proportional allocation of product categories by gross profit</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {data?.categoryBreakdown && data.categoryBreakdown.length > 0 ? (
                    data.categoryBreakdown.map((cat: any, index: number) => {
                      const percentage = data.totalRevenue > 0 ? (cat.value / data.totalRevenue) * 100 : 0;
                      return (
                        <div key={cat.name} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-bold text-gray-800 capitalize">{cat.name}</span>
                            <span className="font-black text-indigo-600">{percentage.toFixed(1)}% ({formatRp(cat.value)})</span>
                          </div>
                          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-2 py-4 flex items-center justify-center">
                      <p className="text-sm font-semibold text-gray-400">Belum ada data kategori.</p>
                    </div>
                  )}
                </div>
              </Card>

            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Search Bar */}
              <div className="relative w-full max-w-md">
                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama, SKU, atau kategori..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                />
              </div>

              {/* Data Table */}
              <Card className="border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] rounded-3xl overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Information</th>
                        <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                        <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Base Price</th>
                        <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Quantity Sold</th>
                        <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map((p: any, idx: number) => (
                          <motion.tr
                            key={p.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group hover:bg-slate-50/40 transition-colors duration-300"
                          >
                            <td className="p-6">
                              <div className="flex flex-col gap-1">
                                <span className="font-black text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">{p.name}</span>
                                <span className="text-xs font-bold text-gray-400">SKU: {p.sku}</span>
                              </div>
                            </td>
                            <td className="p-6">
                              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-black rounded-full capitalize">{p.category}</span>
                            </td>
                            <td className="p-6 font-bold text-gray-600">
                              {formatRp(p.price)}
                            </td>
                            <td className="p-6">
                              <span className="font-extrabold text-gray-900 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl text-xs">
                                {p.quantitySold} unit
                              </span>
                            </td>
                            <td className="p-6 font-black text-gray-900 text-right">
                              {formatRp(p.revenue)}
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-12 text-center text-sm font-semibold text-gray-400">
                            Tidak ada produk yang cocok dengan pencarian Anda.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      )}

    </div>
  );
}
