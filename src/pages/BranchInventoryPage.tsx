import React, {useState} from 'react';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {MapPin, MonitorCheck, ArrowRight, ArrowLeft, Camera, Loader2, FileDown, CheckCircle2, AlertCircle} from 'lucide-react';
import {cn} from '@/lib/utils';
import {fetchBackend} from '@/lib/api';
import {BranchSelector} from '@/components/layout/BranchSelector';
import {ExportConfirmationModal} from '@/components/layout/ExportConfirmationModal';
import {useAuth} from '@/context/AuthContext';
import {useLocation} from '@/context/LocationContext';
import {toast} from 'sonner';

export default function BranchInventoryPage() {
  const {user} = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const [branchStocks, setBranchStocks] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {locationName} = useLocation();

  // Mock aggregate data for branches
  const branches = [
    { id: 'BR-001', name: 'Gegerkalong', items: 156, lowStock: 12, value: 45000000, health: 98 },
    { id: 'BR-002', name: 'Surabaya Downtown', items: 142, lowStock: 4, value: 38000000, health: 95 },
    { id: 'BR-003', name: 'Bandung Industrial', items: 98, lowStock: 22, value: 24000000, health: 88 },
  ];

  const viewBranchDetails = async (id: string) => {
     setSelectedBranch(id);
     setLoading(true);
     const res = await fetchBackend('getInventory', { location_id: id });
     if (res.status === 'success') setInventory(res.data);
     setLoading(false);
  };

  const handleExport = () => {
    setIsModalOpen(false);
    setIsExporting(true);
    toast.info(`Inventory Report for ${locationName} is being generated...`, {
      description: "Aggregating branch stock levels and verification proofs.",
      duration: 3000,
    });
    
    setTimeout(() => {
      setIsExporting(false);
      toast.success("Inventory Exported", {
        description: "The current stock monitor view has been saved as PDF.",
      });
      window.print();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] -m-6 p-6 lg:p-10 space-y-12 font-sans">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 max-w-7xl mx-auto w-full mb-4">
        <div className="flex flex-col gap-3">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Branch Stock Monitor</h2>
          <p className="text-gray-500 font-medium tracking-tight">Real-time stock levels and verification across all branch locations.</p>
        </div>
        <div className="flex flex-col items-end gap-8 pt-0 min-h-[140px] justify-between">
        </div>
      </div>

      <ExportConfirmationModal 
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onConfirm={handleExport}
        isLoading={isExporting}
        branchName={locationName}
      />

      {!selectedBranch ? (
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto w-full">
            {branches.map((b) => (
               <Card 
                 key={b.id} 
                 onClick={() => viewBranchDetails(b.id)}
                 className="rounded-[32px] border border-gray-100 shadow-sm bg-white p-8 group hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer overflow-hidden relative"
               >
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-indigo-50 rounded-full group-hover:scale-150 transition-transform duration-500 opacity-20" />
                  <div className="flex justify-between items-start mb-6 relative z-10">
                     <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <MapPin className="w-5 h-5" />
                     </div>
                     <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Branch Health</span>
                        <span className="text-xs font-bold text-emerald-500">{b.health}%</span>
                     </div>
                  </div>
                  <div className="space-y-4 relative z-10">
                     <div>
                        <h4 className="text-2xl font-black text-gray-900 tracking-tight">{b.name}</h4>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Branch ID: {b.id}</p>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Products</span>
                           <span className="font-mono font-black text-indigo-600 text-lg">{b.items}</span>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Alerts</span>
                           <span className={cn("font-mono font-black text-lg", b.lowStock > 10 ? "text-rose-500" : "text-gray-900")}>{b.lowStock}</span>
                        </div>
                     </div>
                     <Button variant="ghost" className="w-full mt-4 h-12 rounded-2xl border border-dashed border-gray-100 group-hover:border-indigo-200 group-hover:text-indigo-600 flex items-center gap-2 font-bold transition-all">
                        View Stock Details <ArrowRight className="w-4 h-4" />
                     </Button>
                  </div>
               </Card>
            ))}
         </div>
      ) : (
         <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-between">
               <Button onClick={() => setSelectedBranch(null)} variant="ghost" className="gap-2 font-bold text-gray-500 hover:text-indigo-600 rounded-full px-4">
                  <ArrowLeft className="w-4 h-4" /> Back to Network Overview
               </Button>
               <Badge className="bg-blue-50 text-blue-600 border border-blue-100 py-2 px-5 rounded-full font-black uppercase tracking-widest text-[10px]">
                  Branch Profile: {branches.find(b => b.id === selectedBranch)?.name}
               </Badge>
            </div>

            <Card className="rounded-[40px] border border-gray-100 shadow-sm bg-white overflow-hidden">
               <CardContent className="p-0">
                  <div className="overflow-x-auto">
                     <table className="w-full text-left font-sans">
                        <thead>
                           <tr className="bg-[#F8F9FA]/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                              <th className="py-6 pl-8">Product</th>
                              <th className="py-6">Current Stock</th>
                              <th className="py-6">Local Price</th>
                              <th className="py-6">Stock Proof (Photos)</th>
                              <th className="py-6 pr-8 text-right">Synchronization</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                           {loading ? (
                              <tr>
                                 <td colSpan={5} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                       <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Querying Operational Data...</span>
                                    </div>
                                 </td>
                              </tr>
                           ) : (
                              inventory.map((item) => (
                                 <tr key={item.id} className="group hover:bg-[#F8F9FA]/50 transition-colors">
                                    <td className="py-6 pl-8">
                                       <div className="flex flex-col">
                                          <span className="font-black text-gray-900 tracking-tight">{item.name}</span>
                                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{item.category}</span>
                                       </div>
                                    </td>
                                    <td className="py-6">
                                       <span className={cn("font-mono font-black", item.stock < 10 ? "text-rose-500" : "text-gray-900")}>
                                          {item.stock} Units
                                       </span>
                                    </td>
                                    <td className="py-6">
                                       <div className="flex flex-col gap-1">
                                          <span className="font-mono font-black text-gray-900 text-sm">Rp {item.price.toLocaleString()}</span>
                                          <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold text-gray-400">
                                             <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">MASTER</span>
                                             <span>Rp {item.basePrice?.toLocaleString()}</span>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="py-6">
                                       <div className="flex gap-1.5">
                                          {[
                                            { label: 'F', name: 'Front View' },
                                            { label: 'B', name: 'Back View' },
                                            { label: 'L', name: 'Left View' },
                                            { label: 'R', name: 'Right View' }
                                          ].map(side => (
                                             <React.Fragment key={side.label}>
                                                <Tooltip>
                                                  <TooltipTrigger render={
                                                    <div className="w-8 h-8 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-indigo-600 text-[10px] font-black cursor-help hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                                                       {side.label}
                                                    </div>
                                                  } />
                                                  <TooltipContent className="bg-gray-900 text-white border-none rounded-lg px-3 py-1.5 shadow-xl">
                                                    <p className="text-[10px] font-bold uppercase tracking-widest">{side.name}</p>
                                                  </TooltipContent>
                                                </Tooltip>
                                             </React.Fragment>
                                          ))}
                                          <div className="ml-2 p-1 bg-white border border-gray-100 text-indigo-600 rounded-lg flex items-center gap-1 px-3 cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
                                             <Camera className="w-3 h-3" />
                                             <span className="text-[9px] font-black uppercase">View</span>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="py-6 pr-8 text-right">
                                       <div className="flex flex-col items-end gap-2">
                                          <Badge className={cn(
                                            "rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest border flex items-center gap-1",
                                            item.syncStatus === 'Synced' 
                                              ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                              : "bg-amber-50 text-amber-600 border-amber-100"
                                          )}>
                                             {item.syncStatus === 'Synced' ? <CheckCircle2 className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
                                             {item.syncStatus || 'Synced'}
                                          </Badge>
                                          <div className="flex flex-col items-end">
                                             <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest opacity-60">Last Sync</span>
                                             <span className="text-[10px] font-black text-indigo-600">{new Date(item.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                          </div>
                                       </div>
                                    </td>
                                 </tr>
                              ))
                           )}
                        </tbody>
                     </table>
                  </div>
               </CardContent>
            </Card>
         </div>
      )}

      {/* Health Indicator Banner */}
      <div className="max-w-7xl mx-auto w-full">
         <Card className="rounded-[40px] border border-indigo-100 shadow-sm bg-white p-10 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-2/3 h-full bg-indigo-50/30 blur-[100px] rounded-full -mr-32 -mt-32 transition-colors group-hover:bg-indigo-100/30 duration-1000" />
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
               <div className="space-y-4 max-w-xl">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center">
                        <MonitorCheck className="w-5 h-5 text-indigo-600" />
                     </div>
                     <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Network Integrity Status</span>
                  </div>
                  <h3 className="text-3xl font-black tracking-tight text-gray-900 leading-none">Stock Integrity Score: <span className="text-indigo-600 italic">99.2%</span></h3>
                  <p className="text-gray-500 text-sm font-medium leading-relaxed">
                     Percentage of stock confirmed with photo evidence across the network. Global consistency is currently holding significantly above operational thresholds.
                  </p>
               </div>
               <div className="flex gap-12">
                  <div className="flex flex-col items-start md:items-center">
                     <span className="text-6xl font-black tracking-tighter text-indigo-600">34</span>
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Active Units</span>
                  </div>
                  <div className="flex flex-col items-start md:items-center">
                     <span className="text-6xl font-black tracking-tighter text-emerald-500">0</span>
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Discrepancies</span>
                  </div>
               </div>
            </div>
         </Card>
      </div>
    </div>
  );
}

