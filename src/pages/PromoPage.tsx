import {useState, useEffect} from 'react';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Plus, Tag, MapPin, Trash2, Edit3, CircleCheck, Sparkles, Image as ImageIcon, Upload, Percent, Banknote, Loader2} from 'lucide-react';
import {useAuth} from '@/context/AuthContext';
import {useLocation} from '@/context/LocationContext';
import {fetchBackend, MOCK_LOCATIONS} from '@/lib/api';
import {cn} from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function PromoPage() {
  const {currentLocation, locationName} = useLocation();
  const {user} = useAuth();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [targetType, setTargetType] = useState('ALL');
  const [discountType, setDiscountType] = useState('PERCENTAGE');
  const [form, setForm] = useState({ title: '', code: '', discount: '', scope: 'ALL', image: '' });
  
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isSuperAdmin = user?.role === 'super_admin';

  const loadPromos = async () => {
    setLoading(true);
    try {
      const res = await fetchBackend('getPromos');
      if (res.status === 'success') {
        setPromos(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromos();
  }, []);

  const filteredPromos = isSuperAdmin 
    ? promos 
    : promos.filter(p => p.scope === 'ALL' || p.scope === currentLocation);

  const handleAdd = async () => {
    const scope = isSuperAdmin ? (targetType === 'ALL' ? 'ALL' : form.scope) : (currentLocation === 'ALL' ? 'ALL' : currentLocation);
    
    if (!form.title || !form.code || !form.discount) {
      toast.error("Wajib isi Nama, Kode, dan Nilai diskon.");
      return;
    }

    try {
      const res = await fetchBackend('createPromo', {
        title: form.title,
        code: form.code,
        discount_value: Number(form.discount),
        discount_type: discountType === 'PERCENTAGE' ? 'Percentage' : 'Fixed',
        scope: scope,
        image_url: form.image
      });

      if (res.status === 'success') {
        toast.success("Campaign launched successfully!");
        setIsAddOpen(false);
        setForm({ title: '', code: '', discount: '', scope: 'ALL', image: '' });
        loadPromos();
      } else {
        toast.error(res.error || "Gagal membuat promo.");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetchBackend('deletePromo', { id });
      if (res.status === 'success') {
        toast.info("Campaign terminated");
        loadPromos();
      }
    } catch (err) {
      toast.error("Gagal menghapus promo");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
         <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
         <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Loading Campaigns...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tighter uppercase">Campaign Manager</h2>
          <p className="text-gray-500 font-medium tracking-tight">
            {isSuperAdmin ? 'Enterprise-wide promotion engine and voucher deployment.' : `Voucher & promotion engine status for ${locationName}`}
          </p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={<Button className="bg-indigo-600 hover:bg-indigo-700 h-14 px-8 rounded-2xl shadow-xl shadow-indigo-600/20 font-black uppercase tracking-widest text-xs border-none transition-all hover:scale-[1.02]" />}>
            <Plus className="w-5 h-5 mr-3" /> Launch Campaign
          </DialogTrigger>
          <DialogContent className="rounded-[40px] sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl">
            <div className="bg-[#0F172A] p-8 text-white relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 blur-3xl rounded-full" />
               <DialogHeader>
                  <DialogTitle className="text-2xl font-black tracking-tighter uppercase">New Campaign Deployment</DialogTitle>
                  <DialogDescription className="font-medium text-white/40">Configure global or branch-specific discount rules.</DialogDescription>
               </DialogHeader>
            </div>
            
            <div className="p-8 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Campaign Name</Label>
                     <Input placeholder="e.g. Summer Special" className="rounded-2xl h-12 bg-gray-50 border-none px-4 font-bold focus:ring-4 focus:ring-indigo-100 transition-all font-sans" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Voucher Code</Label>
                     <Input placeholder="SUMMER24" className="rounded-2xl h-12 bg-gray-50 border-none px-4 font-bold uppercase focus:ring-4 focus:ring-indigo-100 transition-all font-mono" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Discount Type</Label>
                     <div className="grid grid-cols-2 gap-2 p-1 bg-gray-50 rounded-2xl">
                        <button 
                           onClick={() => setDiscountType('PERCENTAGE')}
                           className={cn(
                             "flex items-center justify-center gap-2 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                             discountType === 'PERCENTAGE' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                           )}
                        >
                           <Percent className="w-3 h-3" /> Percent
                        </button>
                        <button 
                           onClick={() => setDiscountType('FIXED')}
                           className={cn(
                             "flex items-center justify-center gap-2 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                             discountType === 'FIXED' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                           )}
                        >
                           <Banknote className="w-3 h-3" /> Fixed
                        </button>
                     </div>
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                        {discountType === 'PERCENTAGE' ? 'Discount Percentage (%)' : 'Amount (IDR)'}
                     </Label>
                     <Input 
                        type="number"
                        placeholder={discountType === 'PERCENTAGE' ? "20" : "15000"} 
                        className="rounded-2xl h-12 bg-gray-50 border-none px-4 font-bold focus:ring-4 focus:ring-indigo-100 transition-all" 
                        value={form.discount} 
                        onChange={e => setForm({...form, discount: e.target.value})} 
                     />
                  </div>
               </div>

               {isSuperAdmin && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Promo Target</Label>
                        <Select value={targetType} onValueChange={setTargetType}>
                           <SelectTrigger className="rounded-2xl h-12 bg-gray-50 border-none font-bold focus:ring-4 focus:ring-indigo-100 ring-offset-0">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent className="rounded-2xl border-none shadow-2xl p-2 font-sans">
                              <SelectItem value="ALL" className="rounded-xl p-3 focus:bg-indigo-50 cursor-pointer text-xs font-bold font-sans">All Branches</SelectItem>
                              <SelectItem value="SPECIFIC" className="rounded-xl p-3 focus:bg-indigo-50 cursor-pointer text-xs font-bold font-sans">Specific Branch</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>
                     {targetType === 'SPECIFIC' && (
                        <div className="space-y-2 animate-in slide-in-from-left-2 duration-300">
                           <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Select Branch</Label>
                           <Select value={form.scope} onValueChange={(v) => setForm({...form, scope: v})}>
                              <SelectTrigger className="rounded-2xl h-12 bg-gray-50 border-none font-bold focus:ring-4 focus:ring-indigo-100 ring-offset-0">
                                 <SelectValue placeholder="Target Branch" />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl border-none shadow-2xl p-2 font-sans">
                                 {MOCK_LOCATIONS.filter(l => l.id !== 'ALL').map(loc => (
                                    <SelectItem key={loc.id} value={loc.id} className="rounded-xl p-3 focus:bg-indigo-50 cursor-pointer text-xs font-bold font-sans">{loc.name}</SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                        </div>
                     )}
                  </div>
               )}

               <div className="space-y-2 font-sans">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 font-sans">Upload Promo Image/Banner</Label>
                  <div className="border-2 border-dashed border-gray-100 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 bg-gray-50 hover:bg-indigo-50/50 transition-all cursor-pointer group">
                     <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-gray-400 group-hover:text-indigo-600 transition-colors">
                        <Upload className="w-5 h-5" />
                     </div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-indigo-600">Click or drag banner image</p>
                  </div>
               </div>
            </div>

            <DialogFooter className="p-8 bg-gray-50 flex items-center justify-between sm:justify-between border-t border-gray-100">
               <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 h-12 px-6">Cancel</Button>
               <Button onClick={handleAdd} className="bg-indigo-600 h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-600/20 text-white border-none transition-all active:scale-95">Activate Campaign</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredPromos.map((promo) => (
                <Card key={promo.id} className="rounded-[40px] border-none shadow-2xl shadow-indigo-600/5 bg-white overflow-hidden group hover:shadow-indigo-100 transition-all duration-500">
                  <div className="aspect-[16/9] relative overflow-hidden">
                     <img 
                        src={promo.image_url || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=60'} 
                        alt={promo.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                     <div className="absolute top-4 left-4">
                        <span className={cn(
                          "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/20",
                          promo.status === 'Active' ? "bg-emerald-500/80 text-white shadow-lg shadow-emerald-500/20" : 
                          promo.status === 'Scheduled' ? "bg-indigo-500/80 text-white shadow-lg shadow-indigo-500/20" : "bg-gray-500/80 text-white"
                        )}>
                          {promo.status}
                        </span>
                     </div>
                     <div className="absolute bottom-4 left-6 right-6">
                        <h3 className="text-white font-black text-2xl tracking-tighter leading-tight drop-shadow-md">{promo.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                           <MapPin className="w-3 h-3 text-white/60" />
                           <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                              Scope: {promo.scope === 'ALL' ? 'Global Network' : promo.scope}
                           </span>
                        </div>
                     </div>
                  </div>
                  <CardContent className="p-8 space-y-6">
                     <div className="flex items-end justify-between">
                        <div className="space-y-1">
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Voucher Code</span>
                           <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-lg tracking-wider">{promo.code}</span>
                           </div>
                        </div>
                        <div className="text-right">
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Discount Value</span>
                           <span className="font-black text-3xl tracking-tighter text-gray-900">
                              {promo.discount_type === 'Percentage' ? `${promo.discount_value}%` : `Rp ${Number(promo.discount_value).toLocaleString()}`}
                           </span>
                        </div>
                     </div>
                     
                     <div className="flex gap-3 pt-2 border-t border-gray-50">
                        <Button variant="secondary" className="flex-1 h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-gray-50 hover:bg-gray-100 border-none transition-all">
                           <Edit3 className="w-4 h-4 mr-2" /> Edit
                        </Button>
                        <Button variant="ghost" onClick={() => handleDelete(promo.id)} className="h-12 px-6 rounded-2xl text-rose-500 hover:bg-rose-50 border-none transition-all">
                           <Trash2 className="w-4 h-4" />
                        </Button>
                     </div>
                  </CardContent>
                </Card>
              ))}
           </div>
        </div>

        <div className="space-y-6">
           <Card className="rounded-[40px] border-none shadow-2xl shadow-indigo-600/5 bg-white p-8 group">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-14 h-14 bg-indigo-50 rounded-2xl text-indigo-600 flex items-center justify-center transition-transform group-hover:rotate-12">
                    <Sparkles className="w-7 h-7" />
                 </div>
                 <div>
                    <h3 className="font-black text-gray-900 tracking-tighter text-2xl uppercase">Insights</h3>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Global Analytics</p>
                 </div>
              </div>

              <div className="space-y-8">
                 <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Redemption</span>
                       <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center">
                          <CircleCheck className="w-4 h-4 text-emerald-500" />
                       </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                       <span className="font-mono font-black text-gray-900 text-4xl">1,204</span>
                       <span className="text-emerald-500 text-[10px] font-bold">+12% WoW</span>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                       <span>Campaign Reach</span>
                       <span className="text-indigo-600">75% Effectiveness</span>
                    </div>
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-600 w-3/4 rounded-full shadow-lg shadow-indigo-600/20" />
                    </div>
                 </div>

                 <div className="p-8 bg-indigo-600 rounded-[40px] text-white relative overflow-hidden shadow-2xl shadow-indigo-600/30">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full" />
                    <h4 className="font-black text-lg tracking-tight mb-3 flex items-center gap-2">
                       <Sparkles className="w-5 h-5" /> Power Tip
                    </h4>
                    <p className="text-indigo-50 text-xs font-medium leading-relaxed mb-4">
                       Dynamic discount allocation at specific locations can increase CTR by up to 40%. Our AI predicts high conversion for weekend flash sales in urban branch clusters.
                    </p>
                    <Button variant="secondary" className="w-full bg-white/10 hover:bg-white/20 border-white/20 text-white h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                       View Analysis
                    </Button>
                    <div className="absolute -bottom-6 -right-6 opacity-10">
                       <Tag className="w-24 h-24 transform rotate-45" />
                    </div>
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
