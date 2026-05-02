import React, {useState, useEffect} from 'react';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {motion, AnimatePresence} from 'motion/react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MapPin, 
  MonitorCheck, 
  ArrowRight, 
  ArrowLeft, 
  Camera, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Activity,
  Box,
  Zap,
  Globe,
  Database,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import {cn} from '@/lib/utils';
import {fetchBackend} from '@/lib/api';
import {ExportConfirmationModal} from '@/components/layout/ExportConfirmationModal';
import {useAuth} from '@/context/AuthContext';
import {useLocation} from '@/context/LocationContext';
import {toast} from 'sonner';

export default function BranchInventoryPage() {
  const {user} = useAuth();
  const [branches, setBranches] = useState<any[]>([]);
  const [networkStats, setNetworkStats] = useState({ activeUnits: 0, discrepancies: 0, integrityScore: 100 });
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {locationName} = useLocation();

  const loadBranchSummaries = async () => {
    setLoading(true);
    try {
      const res = await fetchBackend('getBranchSummaries');
      if (res.status === 'success') {
        setBranches(res.data.branches);
        setNetworkStats(res.data.summary);
      }
    } catch (err) {
      console.error('[BranchInventory] ❌ API Error:', err);
      toast.error('Gagal sinkronisasi data jaringan cabang');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranchSummaries();
  }, []);

  const viewBranchDetails = async (id: string) => {
     setSelectedBranch(id);
     setLoading(true);
     try {
       const res = await fetchBackend('getBranchInventoryDetails', { id });
       if (res.status === 'success') setInventory(res.data);
     } catch (err) {
       toast.error('Gagal memuat detail node inventaris');
     } finally {
       setLoading(false);
     }
  };

  const handleExport = () => {
    setIsModalOpen(false);
    setIsExporting(true);
    toast.info(`Generating global network report...`);
    
    setTimeout(() => {
      setIsExporting(false);
      toast.success("PDF Report Generated");
      window.print();
    }, 1500);
  };

  if (loading && !selectedBranch) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
         <div className="relative">
           <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full animate-pulse" />
           <div className="relative z-10 w-24 h-24 bg-white rounded-[32px] border border-gray-100 shadow-2xl flex items-center justify-center">
             <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
           </div>
         </div>
         <div className="text-center space-y-2">
           <p className="text-gray-900 font-black uppercase tracking-[0.4em] text-[10px]">Synchronizing Nodes</p>
           <p className="text-gray-400 text-[10px] font-bold">Connecting to global branch inventory database...</p>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFF] -m-6 p-6 lg:p-10 space-y-12 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <AnimatePresence mode="wait">
        {!selectedBranch ? (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 max-w-7xl mx-auto w-full">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/20">
                    <Globe className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Network Fleet Monitor</span>
                </div>
                <h2 className="text-5xl font-black text-gray-900 tracking-tighter leading-none">Branch Inventory</h2>
                <p className="text-gray-500 font-medium tracking-tight max-w-xl text-lg">
                  Advanced command center for real-time stock orchestration and multi-angle visual verification across your entire enterprise.
                </p>
              </div>
              <div className="flex items-center gap-6 bg-white p-4 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/20">
                <div className="flex flex-col px-2 border-r border-gray-100 pr-6">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Branches</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-2xl font-black text-gray-900 tracking-tighter">{branches.length}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={loadBranchSummaries} className="h-14 w-14 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-95">
                  <Activity className="h-6 w-6" />
                </Button>
              </div>
            </div>

            {/* Branch Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto w-full">
              {branches.map((b, idx) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card 
                    onClick={() => viewBranchDetails(b.id)}
                    className="group relative overflow-hidden rounded-[48px] border-none bg-white p-10 shadow-[0_8px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_40px_80px_rgba(79,70,229,0.15)] transition-all duration-700 cursor-pointer"
                  >
                    {/* Glass Decor */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-5 rounded-bl-[100px] group-hover:opacity-10 group-hover:scale-150 transition-all duration-1000" />
                    
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-12">
                        <div className="flex items-center gap-5">
                          <div className="p-5 bg-gray-50 rounded-[28px] text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner group-hover:shadow-indigo-600/30">
                            <MapPin className="w-7 h-7" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-2xl font-black text-gray-900 tracking-tight group-hover:text-indigo-900 transition-colors">{b.name}</h4>
                            <div className="flex items-center gap-1.5">
                              <Database className="w-3 h-3 text-gray-300" />
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{b.id.slice(0, 8)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                           <div className="px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center gap-2">
                             <TrendingUp className="w-3 h-3" />
                             <span className="text-[10px] font-black uppercase tracking-widest">{b.health}% Health</span>
                           </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8 mb-12 border-t border-gray-50 pt-8">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-400">
                             <Box className="w-3 h-3" />
                             <span className="text-[10px] font-black uppercase tracking-[0.2em]">Inventory</span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                             <span className="text-4xl font-black text-gray-900 tracking-tighter leading-none">{b.items}</span>
                             <span className="text-[10px] font-bold text-gray-400 uppercase italic">Nodes</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-400">
                             <Zap className="w-3 h-3" />
                             <span className="text-[10px] font-black uppercase tracking-[0.2em]">Status</span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                             <span className={cn("text-4xl font-black tracking-tighter leading-none", b.lowStock > 5 ? "text-rose-500" : "text-emerald-500")}>
                               {b.lowStock}
                             </span>
                             <span className="text-[10px] font-bold text-gray-400 uppercase italic">Critical</span>
                          </div>
                        </div>
                      </div>

                      <Button variant="outline" className="w-full h-16 rounded-[24px] border-2 border-gray-100 bg-transparent font-black uppercase tracking-widest text-[11px] group-hover:border-indigo-600 group-hover:text-indigo-600 transition-all duration-500 group-hover:bg-indigo-50/50">
                         Access Branch Monitor <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-2 transition-transform" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Network Integrity Dashboard Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-7xl mx-auto w-full pt-6"
            >
               <Card className="rounded-[56px] border-none bg-[#0B0F1A] p-16 overflow-hidden relative group shadow-2xl">
                  {/* Digital Background Pattern */}
                  <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #4F46E5 1px, transparent 0)', backgroundSize: '40px 40px' }} />
                  <div className="absolute top-0 right-0 w-2/3 h-full bg-indigo-600/30 blur-[140px] rounded-full transition-all duration-1000 group-hover:bg-indigo-400/40" />
                  
                  <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-16">
                     <div className="space-y-8 max-w-2xl">
                        <div className="flex items-center gap-6">
                           <div className="w-16 h-16 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[28px] flex items-center justify-center text-indigo-400 shadow-2xl">
                              <ShieldCheck className="w-8 h-8" />
                           </div>
                           <div className="space-y-2">
                             <div className="flex items-center gap-2">
                               <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                               <span className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em]">Operational Integrity Module</span>
                             </div>
                             <h3 className="text-5xl font-black tracking-tighter text-white leading-none">
                               Network Score: <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 italic ml-2">{networkStats.integrityScore}%</span>
                             </h3>
                           </div>
                        </div>
                        <p className="text-white/40 text-lg font-medium leading-relaxed">
                           Global synchronization health across all enterprise nodes. High-fidelity consistency maintains 
                           <span className="text-white mx-1.5 font-bold underline decoration-indigo-500/50 underline-offset-4">99.9% uptime</span> 
                           on visual stock verification chains.
                        </p>
                     </div>
                     
                     <div className="flex items-center gap-20 px-12 py-10 bg-white/5 backdrop-blur-3xl rounded-[40px] border border-white/10 shadow-2xl">
                        <div className="flex flex-col items-center">
                           <span className="text-7xl font-black tracking-tighter text-white font-mono leading-none">{networkStats.activeUnits}</span>
                           <div className="flex items-center gap-2 mt-4">
                             <Box className="w-4 h-4 text-indigo-400" />
                             <span className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em]">Active Nodes</span>
                           </div>
                        </div>
                        <div className="w-px h-24 bg-white/10" />
                        <div className="flex flex-col items-center">
                           <span className="text-7xl font-black tracking-tighter text-rose-500 font-mono leading-none">{networkStats.discrepancies}</span>
                           <div className="flex items-center gap-2 mt-4">
                             <AlertCircle className="w-4 h-4 text-rose-500" />
                             <span className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em]">Desync Alerts</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </Card>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div 
            key="details"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-12 max-w-7xl mx-auto w-full"
          >
            {/* Detailed View Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <Button onClick={() => setSelectedBranch(null)} variant="ghost" className="group gap-4 font-black uppercase tracking-[0.2em] text-[11px] text-gray-500 hover:text-indigo-600 rounded-3xl px-8 h-14 bg-white border border-gray-100 shadow-sm transition-all hover:scale-105 active:scale-95">
                 <ArrowLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform" /> Return to Fleet Overview
              </Button>
              <div className="flex items-center gap-4">
                 <Badge className="bg-indigo-600 text-white border-none py-4 px-10 rounded-[24px] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-indigo-600/30">
                    <Activity className="w-4 h-4 mr-3 inline-block" />
                    Live Monitoring: {branches.find(b => b.id === selectedBranch)?.name}
                 </Badge>
                 <Button onClick={() => setIsModalOpen(true)} className="h-14 px-8 rounded-[24px] bg-white border border-gray-100 text-gray-900 font-black uppercase tracking-widest text-[10px] hover:bg-gray-50 shadow-sm transition-all">
                    <MonitorCheck className="w-4 h-4 mr-2" /> Synchronized Export
                 </Button>
              </div>
            </div>

            {/* Inventory Table Card */}
            <Card className="rounded-[64px] border-none shadow-[0_40px_100px_rgba(0,0,0,0.06)] bg-white overflow-hidden">
               <CardContent className="p-0">
                  <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead>
                           <tr className="bg-gray-50/40 text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">
                              <th className="py-10 pl-14">Stock Asset</th>
                              <th className="py-10">Real-time Volume</th>
                              <th className="py-10">Asset Valuation</th>
                              <th className="py-10">Verification Chain</th>
                              <th className="py-10 pr-14 text-right">Node Consistency</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                           {loading ? (
                              <tr>
                                 <td colSpan={5} className="py-40 text-center">
                                    <div className="flex flex-col items-center gap-8">
                                       <Loader2 className="w-14 h-14 text-indigo-600 animate-spin" />
                                       <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em]">Querying Distributed Ledger...</span>
                                    </div>
                                 </td>
                              </tr>
                           ) : (
                              inventory.map((item, idx) => (
                                 <motion.tr 
                                   key={item.id}
                                   initial={{ opacity: 0, x: -10 }}
                                   animate={{ opacity: 1, x: 0 }}
                                   transition={{ delay: idx * 0.05 }}
                                   className="group hover:bg-indigo-50/40 transition-all duration-300"
                                 >
                                    <td className="py-10 pl-14">
                                       <div className="flex flex-col gap-2">
                                          <span className="font-black text-gray-900 text-xl tracking-tighter leading-none group-hover:text-indigo-950 transition-colors">{item.name}</span>
                                          <div className="flex items-center gap-2">
                                             <div className="w-2 h-2 bg-indigo-500 rounded-full group-hover:scale-125 transition-transform" />
                                             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.category}</span>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="py-10">
                                       <div className="flex items-baseline gap-2">
                                          <span className={cn("text-3xl font-black font-mono tracking-tighter leading-none", item.stock < 10 ? "text-rose-500 animate-pulse" : "text-gray-900")}>
                                             {item.stock.toString().padStart(2, '0')}
                                          </span>
                                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic opacity-50">Units</span>
                                       </div>
                                    </td>
                                    <td className="py-10">
                                       <div className="space-y-1">
                                          <span className="font-mono font-black text-gray-900 text-lg tracking-tighter leading-none">Rp {item.price.toLocaleString()}</span>
                                          <div className="flex items-center gap-2">
                                             <span className="px-2 py-0.5 bg-gray-100 rounded-lg text-[9px] font-black text-gray-500 uppercase tracking-tighter">GLOBAL_BASE</span>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="py-10">
                                       <div className="flex gap-2.5">
                                          {[
                                            { label: 'F', key: 'front', name: 'Front' },
                                            { label: 'B', key: 'back', name: 'Back' },
                                            { label: 'L', key: 'left', name: 'Left' },
                                            { label: 'R', key: 'right', name: 'Right' }
                                          ].map(side => {
                                             const hasPhoto = item.photos && item.photos[side.key as keyof typeof item.photos];
                                             return (
                                               <React.Fragment key={side.label}>
                                                  <Tooltip>
                                                    <TooltipTrigger asChild>
                                                      <div className={cn(
                                                        "w-11 h-11 rounded-[14px] flex items-center justify-center text-[12px] font-black cursor-help transition-all duration-500 shadow-sm border-2",
                                                        hasPhoto 
                                                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-600/20 scale-105" 
                                                          : "bg-white text-gray-200 border-gray-100 opacity-40 hover:opacity-100"
                                                      )}>
                                                         {side.label}
                                                      </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-gray-900 text-white border-none rounded-2xl px-5 py-3 shadow-2xl">
                                                      <p className="text-[11px] font-black uppercase tracking-[0.2em]">
                                                        {side.name} View: {hasPhoto ? 'VERIFIED ✓' : 'UNAVAILABLE ✗'}
                                                      </p>
                                                    </TooltipContent>
                                                  </Tooltip>
                                               </React.Fragment>
                                             );
                                          })}
                                          <Button variant="ghost" size="icon" className="ml-3 h-11 w-11 rounded-[14px] bg-gray-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-inner">
                                             <Camera className="w-5 h-5" />
                                          </Button>
                                       </div>
                                    </td>
                                    <td className="py-10 pr-14 text-right">
                                       <div className="flex flex-col items-end gap-3">
                                          <div className={cn(
                                            "rounded-2xl px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] border flex items-center gap-2 shadow-sm transition-all",
                                            item.syncStatus === 'Synced' 
                                              ? "bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-100" 
                                              : "bg-amber-50 text-amber-600 border-amber-100 group-hover:bg-amber-100"
                                          )}>
                                             {item.syncStatus === 'Synced' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                             {item.syncStatus || 'Synced'}
                                          </div>
                                          <div className="flex flex-col items-end opacity-40 group-hover:opacity-100 transition-opacity">
                                             <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Last Sync Event</span>
                                             <span className="text-[11px] font-black text-indigo-600 font-mono">{new Date(item.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                          </div>
                                       </div>
                                    </td>
                                 </motion.tr>
                              ))
                           )}
                        </tbody>
                     </table>
                  </div>
               </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <ExportConfirmationModal 
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onConfirm={handleExport}
        isLoading={isExporting}
        branchName={locationName}
      />
    </div>
  );
}
