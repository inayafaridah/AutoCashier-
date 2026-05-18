import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {Card, CardContent} from '@/shared/components/ui/card';
import {motion} from 'motion/react';
import {
  ShoppingBag, 
  Store, 
  ArrowUpRight, 
  ArrowDownRight,
  CircleDollarSign,
  Loader2,
  Package,
  FileDown,
  Info,
  ChevronDown,
  MapPin,
  Globe,
  Tag,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import {useAuth} from '@/shared/context/AuthContext';
import {useLocation} from '@/shared/context/LocationContext';
import {fetchBackend} from '@/shared/lib/api';
import {cn} from '@/shared/lib/utils';
import {Button} from '@/shared/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { toast } from 'sonner';

import { BranchSelector } from '@/shared/components/layout/BranchSelector';
import { ExportConfirmationModal } from '@/shared/components/layout/ExportConfirmationModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';

export default function OverviewPage() {
  const {user} = useAuth();
  const {currentLocation, locationName} = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  
  // Dynamic Date Selectors State
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('April');
  const [selectedWeek, setSelectedWeek] = useState('Week 17');
  const [isExporting, setIsExporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadOverview = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchBackend('getOverview', { 
          location_id: currentLocation,
          timeframe: timeframe,
          year: selectedYear,
          month: selectedMonth,
          week: selectedWeek
        });
        if (res.status === 'success' && res.data) {
          setData(res.data);
        } else {
          setError(res.message || 'Failed to sync enterprise data');
        }
      } catch (err) {
        setError('A critical connection error occurred');
      } finally {
        setLoading(false);
      }
    };
    loadOverview();
  }, [currentLocation, timeframe, selectedYear, selectedMonth, selectedWeek]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
         <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
         <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Synchronizing Enterprise Data...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
         <div className="w-20 h-20 bg-rose-50 rounded-[32px] flex items-center justify-center border border-rose-100 shadow-sm">
            <Package className="w-10 h-10 text-rose-500" />
         </div>
         <div className="space-y-2">
            <h3 className="text-2xl font-black text-gray-900 tracking-tighter">System Desync</h3>
            <p className="text-gray-500 font-medium max-w-xs">{error || 'No operational data found for this selection.'}</p>
         </div>
         <Button 
           variant="outline" 
           onClick={() => window.location.reload()}
           className="rounded-2xl px-8 h-12 font-bold border-gray-200 hover:bg-gray-50"
         >
           Retry Connection
         </Button>
      </div>
    );
  }

  const isSuperAdmin = user?.role === 'super_admin';

  const handleExportPDF = () => {
    setIsModalOpen(false);
    setIsExporting(true);
    toast.info(`Report for ${locationName} is being generated...`, {
      description: "Compiling financial velocity and stock metadata.",
      duration: 3000,
    });
    
    setTimeout(() => {
      setIsExporting(false);
      toast.success("Report Ready", {
        description: "Dashboard view has been exported to PDF.",
      });
      window.print();
    }, 1500);
  };

  const getVsLabel = () => {
    switch(timeframe) {
      case 'weekly': return 'vs last week';
      case 'monthly': return 'vs last month';
      case 'yearly': return 'vs last year';
      default: return 'vs last cycle';
    }
  };

  const statCards = [
    { 
      label: 'Total Revenue',
      displayLabel: (
        <span className="flex items-center gap-1.5 text-gray-400 group-hover:text-emerald-600 transition-colors duration-500">
          Total Revenue
          {currentLocation !== 'ALL' && (
            <span className="text-gray-400 font-medium lowercase tracking-normal">({locationName})</span>
          )}
        </span>
      ),
      description: null,
      value: `Rp ${(data?.revenue || 0).toLocaleString()}`, 
      trend: `${(data?.revenueChange ?? 0) >= 0 ? '+' : ''}${data?.revenueChange ?? 0}%`, 
      vsLabel: getVsLabel(),
      isUp: (data?.revenueChange ?? 0) >= 0, 
      icon: CircleDollarSign, 
      glow: 'shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(16,185,129,0.15)] border-gray-100 hover:border-emerald-200',
      iconBox: 'bg-emerald-50 text-emerald-600 border-transparent group-hover:bg-emerald-500 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-[0_8px_20px_rgba(16,185,129,0.3)]',
      accentOrb: 'bg-emerald-100',
      textColor: 'text-gray-900 group-hover:text-emerald-950',
      path: null
    },
    { 
      label: 'Total Products', 
      value: data?.inventoryCount || 0, 
      trend: null, 
      isUp: true, 
      icon: ShoppingBag, 
      glow: 'shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(99,102,241,0.15)] border-gray-100 hover:border-indigo-200',
      iconBox: 'bg-indigo-50 text-indigo-600 border-transparent group-hover:bg-indigo-500 group-hover:text-white group-hover:scale-110 group-hover:-rotate-3 group-hover:shadow-[0_8px_20px_rgba(99,102,241,0.3)]',
      accentOrb: 'bg-indigo-100',
      textColor: 'text-gray-900 group-hover:text-indigo-950',
      path: isSuperAdmin ? '/catalog' : '/inventory'
    },
    { 
      label: isSuperAdmin ? 'Total Branches' : 'Active Promos', 
      value: isSuperAdmin ? (data?.locations || 0) : (data?.promos || 0), 
      trend: null, 
      isUp: true, 
      icon: isSuperAdmin ? Store : Tag, 
      glow: isSuperAdmin ? 'shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(245,158,11,0.15)] border-gray-100 hover:border-amber-200' : 'shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(244,63,94,0.15)] border-gray-100 hover:border-rose-200',
      iconBox: isSuperAdmin ? 'bg-amber-50 text-amber-600 border-transparent group-hover:bg-amber-500 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-[0_8px_20px_rgba(245,158,11,0.3)]' : 'bg-rose-50 text-rose-600 border-transparent group-hover:bg-rose-500 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-[0_8px_20px_rgba(244,63,94,0.3)]',
      accentOrb: isSuperAdmin ? 'bg-amber-100' : 'bg-rose-100',
      textColor: 'text-gray-900 group-hover:text-gray-900',
      path: isSuperAdmin ? '/monitor' : '/promo'
    },
    { 
      label: 'Stock Status', 
      value: (data?.totalStock || 0) > 50 ? 'Healthy' : 'Low Stock', 
      trend: (data?.totalStock || 0) > 50 ? 'Normal' : 'Critical', 
      isUp: (data?.totalStock || 0) > 50, 
      icon: Package, 
      glow: (data?.totalStock || 0) > 50 ? 'shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(16,185,129,0.15)] border-gray-100 hover:border-emerald-200' : 'shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(244,63,94,0.15)] border-gray-100 hover:border-rose-200',
      iconBox: (data?.totalStock || 0) > 50 ? 'bg-emerald-50 text-emerald-600 border-transparent group-hover:bg-emerald-500 group-hover:text-white group-hover:scale-110 group-hover:-rotate-3 group-hover:shadow-[0_8px_20px_rgba(16,185,129,0.3)]' : 'bg-rose-50 text-rose-600 border-transparent group-hover:bg-rose-500 group-hover:text-white group-hover:scale-110 group-hover:-rotate-3 group-hover:shadow-[0_8px_20px_rgba(244,63,94,0.3)]',
      accentOrb: (data?.totalStock || 0) > 50 ? 'bg-emerald-100' : 'bg-rose-100',
      textColor: 'text-gray-900 group-hover:text-gray-900',
      path: isSuperAdmin ? '/monitor' : '/inventory'
    }
  ];

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

      {/* Header Info */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-indigo-600 rounded-full shadow-[0_0_8px_#4F46E5]" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Live Feed Analytics</span>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter leading-none">
              Enterprise Dashboard
            </h2>
          </div>
          <p className="text-gray-500 font-medium tracking-tight max-w-xl">
            Real-time operational and financial performance metrics.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
            <Tooltip>
              <TooltipTrigger render={<div className="px-6 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-start cursor-help group hover:border-indigo-100 transition-colors" />}>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-1 group-hover:text-indigo-400">
                  Network Health Score <Info className="w-3 h-3" />
                </span>
                <span className="text-xl font-black text-indigo-600 leading-none">{data?.healthScore || 0}/100</span>
              </TooltipTrigger>
              <TooltipContent className="bg-[#0F172A] text-white border border-white/10 rounded-[24px] p-6 shadow-2xl min-w-[280px]">
                <div className="space-y-4">
                  <div className="flex flex-col gap-1 border-b border-white/10 pb-3">
                    <p className="text-xs font-black uppercase tracking-widest text-indigo-400">Score Breakdown</p>
                    <p className="text-[10px] text-white/50 font-bold uppercase italic">Real-time performance metrics</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase">
                      <span className="text-white/60">Inventory Coverage</span>
                      <span className="text-white">{data?.healthBreakdown?.inventory || 0}/30</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${((data?.healthBreakdown?.inventory || 0)/30)*100}%` }} />
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-black uppercase">
                      <span className="text-white/60">Sales Performance</span>
                      <span className="text-white">{data?.healthBreakdown?.sales || 0}/30</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${((data?.healthBreakdown?.sales || 0)/30)*100}%` }} />
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-black uppercase">
                      <span className="text-white/60">AI Validation Coverage</span>
                      <span className="text-white">{data?.healthBreakdown?.ai || 0}/20</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-amber-500 rounded-full" style={{ width: `${((data?.healthBreakdown?.ai || 0)/20)*100}%` }} />
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-black uppercase">
                      <span className="text-white/60">Stock Health Alert</span>
                      <span className="text-white">{data?.healthBreakdown?.lowStock || 0}/20</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-rose-500 rounded-full" style={{ width: `${((data?.healthBreakdown?.lowStock || 0)/20)*100}%` }} />
                    </div>
                  </div>

                  <p className="text-[9px] text-white/40 font-bold leading-relaxed pt-2 border-t border-white/10 italic">
                    A weighted score based on real-time operational and financial health across the entire network.
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>

            <Button 
              onClick={() => setIsModalOpen(true)}
              disabled={isExporting}
              className="h-[68px] px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-600/20 font-black uppercase tracking-widest text-xs gap-3 transition-all hover:scale-[1.02] border-none"
            >
              {isExporting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <FileDown className="w-5 h-5" />
              )}
              <span>{isExporting ? 'Generating...' : 'Export Summary Report'}</span>
            </Button>
        </div>
      </div>

      <ExportConfirmationModal 
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onConfirm={handleExportPDF}
        isLoading={isExporting}
        branchName={locationName}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => {
          const isClickable = !!stat.path;
          const CardWrapper = isClickable ? (
            ({ children }: { children: React.ReactNode }) => (
              <Tooltip>
                <TooltipTrigger render={children as React.ReactElement} />
                <TooltipContent className="bg-indigo-600 text-white border-none rounded-xl px-4 py-2 shadow-xl">
                  <p className="text-xs font-black uppercase tracking-widest">Click to view details</p>
                </TooltipContent>
              </Tooltip>
            )
          ) : (
            ({ children }: { children: React.ReactNode }) => <>{children}</>
          );

          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
              className="flex w-full"
            >
              <CardWrapper>
                <Card 
                  onClick={() => isClickable && navigate(stat.path!)}
                  className={cn(
                    "w-full rounded-2xl border border-gray-100 bg-white relative group transition-all duration-500 ease-out",
                    "hover:shadow-lg hover:-translate-y-1",
                    isClickable ? "cursor-pointer" : "cursor-default"
                  )}
                >
                  {/* Subtle top border gradient replacement or reflection */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  
                  {/* Soft colorful orb background */}
                  <div className={cn(
                    "absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[70px] opacity-40 group-hover:opacity-70 transition-all duration-700 ease-out pointer-events-none group-hover:scale-[2]",
                    stat.accentOrb
                  )} />

                  <CardContent className="p-6 sm:p-8 relative z-10 flex flex-col h-full justify-between">
                    <div className="flex justify-between items-start mb-8">
                      <div className={cn("p-4 rounded-2xl border transition-all duration-500", stat.iconBox)}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      {stat.trend && (
                        <div className="flex flex-col items-end gap-1">
                          <div className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black border transition-colors duration-500 shadow-sm",
                            stat.isUp ? "bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100 group-hover:bg-rose-100"
                          )}>
                            <Tooltip>
                              <TooltipTrigger render={<div className="flex items-center gap-1 cursor-help" />}>
                                {stat.isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                {stat.trend}
                              </TooltipTrigger>
                              <TooltipContent className="bg-[#0F172A] text-white border-none rounded-xl p-3 shadow-2xl max-w-[200px]">
                                <p className="text-[10px] font-bold leading-relaxed">
                                  Growth compared to the previous period based on your active {timeframe === 'weekly' ? 'Week' : timeframe === 'monthly' ? 'Month' : 'Year'} filter.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          {stat.vsLabel && (
                            <span className="text-[9px] font-bold text-gray-400 italic pr-1">
                              {stat.vsLabel}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 mt-auto">
                      <div className="text-[10px] font-black uppercase tracking-widest font-mono">
                        {stat.displayLabel || <span className="text-gray-400 group-hover:text-indigo-600 transition-colors duration-500">{stat.label}</span>}
                      </div>
                      <p className={cn("text-4xl font-black tracking-tighter leading-none font-mono transition-colors duration-500", stat.textColor)}>
                        {stat.value}
                      </p>
                      {stat.description && (
                        <p className="text-[10px] font-bold text-indigo-500 mt-2 leading-tight italic">
                          {stat.description}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </CardWrapper>
            </motion.div>
          );
        })}
      </div>

      {/* Main Analytics Chart - FULL WIDTH */}
      <Card className="rounded-3xl border-none shadow-sm bg-[#0F172A] text-white p-6 md:p-8 lg:p-10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-indigo-600/20 blur-[100px] rounded-full" />
        <div className="relative z-10 space-y-12">
          <div className="flex justify-between items-center gap-4 flex-col md:flex-row pb-6 border-b border-white/5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <h3 className="text-xl font-black tracking-tighter text-white uppercase">
                  {isSuperAdmin ? 'Enterprise Sales Velocity' : 'Velocity Performance'}
                </h3>
              </div>
              <p className="text-white/30 text-[11px] font-bold uppercase tracking-widest">
                {isSuperAdmin 
                  ? 'Consolidated transaction distribution across network.' 
                  : `Real-time analytics for ${locationName} operational group.`
                }
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden lg:flex items-center gap-2">
                    {/* Year Selector */}
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className="h-10 bg-[#1E293B] border-none text-white min-w-[90px] rounded-xl hover:bg-[#2D3B4E] transition-all text-[10px] font-black uppercase tracking-widest ring-0 focus:ring-0">
                        <SelectValue placeholder="YEAR" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1E293B] border-white/5 text-white rounded-2xl">
                        {['2024', '2025', '2026'].map(y => (
                          <SelectItem key={y} value={y} className="focus:bg-white/10 focus:text-white rounded-xl text-[10px] font-bold">{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
 
                    {timeframe !== 'yearly' && (
                      <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="h-10 bg-[#1E293B] border-none text-white min-w-[110px] rounded-xl hover:bg-[#2D3B4E] transition-all text-[10px] font-black uppercase tracking-widest ring-0 focus:ring-0">
                          <SelectValue placeholder="MONTH" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1E293B] border-white/5 text-white rounded-2xl">
                          {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                            <SelectItem key={m} value={m} className="focus:bg-white/10 focus:text-white rounded-xl text-[10px] font-bold uppercase">{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
              </div>

              <div className="flex gap-1 p-1 bg-[#1E293B] rounded-xl border border-white/5 shadow-2xl backdrop-blur-md">
                <button 
                  onClick={() => setTimeframe('weekly')}
                  className={cn(
                    "px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-300",
                    timeframe === 'weekly' ? "bg-white text-blue-600 shadow-xl scale-[1.05]" : "text-white/40 hover:text-white/60"
                  )}
                >
                  WEEK
                </button>
                <button 
                  onClick={() => {
                    setTimeframe('monthly');
                    if (!selectedMonth) setSelectedMonth('April');
                  }}
                  className={cn(
                    "px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-300",
                    timeframe === 'monthly' ? "bg-white text-blue-600 shadow-xl scale-[1.05]" : "text-white/40 hover:text-white/60"
                  )}
                >
                  MONTH
                </button>
                <button 
                  onClick={() => setTimeframe('yearly')}
                  className={cn(
                    "px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-300",
                    timeframe === 'yearly' ? "bg-white text-blue-600 shadow-xl scale-[1.05]" : "text-white/40 hover:text-white/60"
                  )}
                >
                  YEAR
                </button>
              </div>
            </div>
          </div>

          <div className="h-[400px] w-full mt-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={data?.chartData || []}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#475569', fontSize: 10, fontWeight: 800}}
                  dy={15}
                />
                <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{fill: '#475569', fontSize: 10, fontWeight: 800}}
                   allowDecimals={false}
                   tickFormatter={(value) => {
                     if (typeof value !== 'number' || value === 0) return 'Rp0';
                     if (value >= 1000000) return `Rp${(value / 1000000).toFixed(1)}M`;
                     if (value >= 1000) return `Rp${Math.floor(value / 1000)}k`;
                     return `Rp${value}`;
                   }}
                   dx={-10}
                />
                <RechartsTooltip 
                   contentStyle={{
                     backgroundColor: '#0F172A', 
                     border: '1px solid rgba(255,255,255,0.1)', 
                     borderRadius: '24px', 
                     color: '#fff', 
                     fontSize: '12px', 
                     fontWeight: 'bold',
                     padding: '20px',
                     boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                   }}
                   cursor={{stroke: '#3b82f6', strokeWidth: 2}}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#3b82f6" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </div>
  );
}
