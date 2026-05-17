import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {Card, CardContent, CardHeader} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {
  Search, 
  Filter, 
  Plus, 
  Package, 
  MoreVertical, 
  ArrowUpDown, 
  AlertCircle, 
  DollarSign, 
  Trash2, 
  Edit2, 
  Loader2, 
  MapPin,
  Camera,
  Upload,
  Image as ImageIcon,
  FileDown,
  Check,
  ChevronsUpDown,
  Sparkles
} from 'lucide-react';
import {useLocation} from '@/context/LocationContext';
import {useAuth} from '@/context/AuthContext';
import {fetchBackend, MOCK_LOCATIONS, BACKEND_URL} from '@/lib/api';
import {cn} from '@/lib/utils';

import {Badge} from '@/components/ui/badge';
import {motion} from 'motion/react';
import {Tabs, TabsList, TabsTrigger} from '@/components/ui/tabs';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from "sonner";

export default function InventoryPage() {
  const navigate = useNavigate();
  const {currentLocation, allBranches} = useLocation();
  const {user} = useAuth();
  const [inventory, setInventory] = useState<any[]>([]);
  const [masterCatalog, setMasterCatalog] = useState<any[]>([]);
  const [entryType, setEntryType] = useState<'master' | 'local'>('master');
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [comboboxSearch, setComboboxSearch] = useState('');
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [uploadMode, setUploadMode] = useState<'file' | 'camera'>('file');
  const [form, setForm] = useState({ 
    catalogId: '',
    name: '', 
    category: '', 
    stock: '' as any, 
    price: '' as any, 
    location_id: '',
    photos: { front: '', back: '', right: '', left: '' }
  });

  const isSuperAdmin = user?.role === 'super_admin';

  const loadData = async () => {
    setLoading(true);
    const [invRes, catRes] = await Promise.all([
      fetchBackend('getInventory', { location_id: currentLocation }),
      fetchBackend('getMasterCatalog')
    ]);
    
    if (invRes.status === 'success') setInventory(invRes.data || []);
    if (catRes.status === 'success') setMasterCatalog(catRes.data || []);
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentLocation]);

  const handleCatalogSelect = (id: string, name?: string) => {
    if (id === 'custom') {
      setForm({
        ...form,
        catalogId: 'local-custom',
        name: name || comboboxSearch,
        category: 'Local Product',
        price: '' as any,
        stock: '' as any
      });
      setComboboxOpen(false);
      return;
    }

    const item = masterCatalog.find(c => c.id === id);
    if (item) {
      setForm({
        ...form,
        catalogId: id,
        name: item.name,
        category: item.category,
        price: item.basePrice,
        stock: '' as any
      });
      setComboboxOpen(false);
    }
  };

  const handleExportPDF = () => {
    const reportType = isSuperAdmin ? "Enterprise National Revenue" : "Branch Daily Sales Log";
    alert(`Generating ${reportType}... Report focus: ${isSuperAdmin ? 'Branch Comparison' : 'Stock Replenishment Needs'}`);
  };

  const handleAdd = async () => {
    const loc = isSuperAdmin ? form.location_id : (currentLocation === 'ALL' ? 'BR-001' : currentLocation);
    if (!loc || !form.catalogId) {
       toast.error("Please select a product and branch");
       return;
    }
    
    if (form.stock === '' || form.price === '') {
       toast.error("Stock level and unit selling price are mandatory");
       return;
    }

    if (entryType === 'local' && !form.category) {
       toast.error("Product category is required for local registry");
       return;
    }

    // Check photos
    const hasAllPhotos = Object.values(form.photos).every(p => p !== '');
    if (!hasAllPhotos) {
       toast.error("Mandatory 4-sided photos required for physical validation");
       return;
    }

    const res = await fetchBackend('addInventory', { ...form, location_id: loc });
    if (res.status === 'success') {
      toast.success("Stock recorded successfully");
      loadData();
      setForm({ 
        catalogId: '', 
        name: '', 
        category: '', 
        stock: '' as any, 
        price: '' as any, 
        location_id: '', 
        photos: { front: '', back: '', right: '', left: '' } 
      });
    }
  };

  const handleEdit = async () => {
    const isAllView = currentLocation === 'ALL';
    try {
      let res;
      if (isAllView) {
        const fetchRes = await fetch(`${BACKEND_URL}/api/products/${currentItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name.trim(),
            price: Number(form.price),
            stock: Number(form.stock),
          }),
        });
        const data = await fetchRes.json();
        res = { status: fetchRes.ok && data.status === 'success' ? 'success' : 'error', message: data.error };
      } else {
        res = await fetchBackend('updateInventory', { ...currentItem, ...form });
      }

      if (res.status === 'success') {
        toast.success("Catalog updated successfully");
        setIsEditOpen(false);
        loadData();
      } else {
        toast.error(res.message || res.error || "Failed to update catalog");
      }
    } catch (err: any) {
      toast.error(err.message || "Network error");
    }
  };

  const confirmDelete = (item: any) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    setIsDeleting(true);
    const isAllView = currentLocation === 'ALL';

    try {
      let res;
      if (isAllView) {
        // Delete from master catalog (+ Supabase Storage)
        res = await fetchBackend('deleteProduct', { id: itemToDelete.id });
      } else {
        // Delete from branch inventory only
        res = await fetchBackend('deleteInventory', { id: itemToDelete.id, location_id: currentLocation });
      }

      if (res.status === 'success') {
        toast.success(`✅ "${itemToDelete.name}" berhasil dihapus`);
        loadData();
      } else {
        toast.error(`❌ Gagal menghapus: ${res.error || res.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      toast.error(`❌ Error: ${err.message}`);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const openEdit = (item: any) => {
    setCurrentItem(item);
    setForm({ 
      catalogId: item.catalogId || item.id || '',
      name: item.name, 
      category: item.category, 
      stock: item.stock, 
      price: item.price, 
      location_id: item.location_id || item.branch_id || '',
      photos: item.photos || { front: '', back: '', right: '', left: '' }
    });
    setIsEditOpen(true);
  };

  const filteredCatalog = masterCatalog.filter(item => 
    item.name.toLowerCase().includes(comboboxSearch.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Inventory Control</h2>
          <p className="text-gray-500 font-medium tracking-tight">Managing resources for <span className="text-indigo-600 font-bold">{currentLocation}</span></p>
        </div>
        <div className="flex gap-3">
           <Button 
            variant="outline"
            className="h-12 px-6 rounded-2xl font-bold border-gray-200"
            onClick={handleExportPDF}
           >
             <FileDown className="w-4 h-4 mr-2" /> PDF Export
           </Button>
           <Button 
            className="bg-indigo-600 hover:bg-indigo-700 h-12 px-6 rounded-2xl shadow-xl shadow-indigo-600/20 font-bold border-none"
            onClick={() => navigate('/inventory/add')}
           >
             <Plus className="w-4 h-4 mr-2" /> Inventory Intake
           </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-24">
           <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-[32px] border-none shadow-sm bg-indigo-600 text-white overflow-hidden relative">
              <CardContent className="p-8">
                <h4 className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Assets</h4>
                <div className="text-4xl font-black tracking-tighter font-mono">
                  Rp {(inventory || []).reduce((acc, curr) => acc + ((curr.price || 0) * (curr.stock || 0)), 0).toLocaleString()}
                </div>
                <p className="text-white/40 text-[10px] font-bold mt-2 uppercase tracking-widest">Calculated current value</p>
                <div className="absolute top-4 right-4 p-2 bg-white/10 rounded-xl">
                   <DollarSign className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden">
              <CardContent className="p-8">
                <h4 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Low Stock Alerts</h4>
                <div className="text-4xl font-black tracking-tighter font-mono text-rose-500">
                  {(inventory || []).filter(i => (i.stock || 0) < 20).length} Items
                </div>
                <p className="text-gray-400 text-[10px] font-bold mt-2 uppercase tracking-widest">Requires attention</p>
                <div className="absolute top-4 right-4 p-2 bg-rose-50 rounded-xl">
                   <AlertCircle className="w-5 h-5 text-rose-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden">
              <CardContent className="p-8">
                <h4 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">SKU Count</h4>
                <div className="text-4xl font-black tracking-tighter font-mono text-gray-900">{(inventory || []).length}</div>
                <p className="text-gray-400 text-[10px] font-bold mt-2 uppercase tracking-widest">Total unique products</p>
                <div className="absolute top-4 right-4 p-2 bg-gray-50 rounded-xl">
                   <Package className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-[40px] border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="p-8 pb-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      placeholder="Search catalog..." 
                      className="pl-12 h-12 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20"
                    />
                 </div>
                 <Button variant="ghost" size="icon" className="rounded-xl hover:bg-gray-50"><Filter className="w-4 h-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                           <th className="pb-4 pl-2">Product Name</th>
                           <th className="pb-4">Category</th>
                           <th className="pb-4">Stock</th>
                           <th className="pb-4">Price</th>
                           <th className="pb-4">Status</th>
                           <th className="pb-4 text-right pr-2">Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                        {(inventory || []).map((item) => (
                           <tr key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                              <td className="py-5 pl-2">
                                 <div className="flex items-center gap-4">
                                    {item.image_url ? (
                                      <img 
                                        src={`${BACKEND_URL}${item.image_url}`} 
                                        alt={item.name} 
                                        className="w-10 h-10 rounded-xl object-cover border border-gray-100 bg-white shadow-sm"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center font-bold text-indigo-600 text-xs">
                                         {item.name.substring(0, 1).toUpperCase()}
                                      </div>
                                    )}
                                    <span className="font-bold text-gray-900 tracking-tight">{item.name}</span>
                                 </div>
                              </td>
                              <td className="py-5">
                                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.category}</span>
                              </td>
                              <td className="py-5 font-mono font-bold">
                                 <span className={cn(
                                   "px-3 py-1.5 rounded-lg flex items-center gap-2 w-fit",
                                   item.stock < 20 ? "bg-rose-50 text-rose-600 border border-rose-100" : "text-gray-600"
                                 )}>
                                   {item.stock < 20 && <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />}
                                   {item.stock} Units
                                 </span>
                              </td>
                              <td className="py-5 font-mono font-bold text-indigo-600">Rp {(item.price ?? 0).toLocaleString()}</td>
                              <td className="py-5">
                                 <Badge 
                                   className={cn(
                                      "rounded-full text-[10px] font-black uppercase tracking-wider px-3 py-1 border-none",
                                      item.stock < 20
                                        ? "bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-600/20" 
                                        : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/10"
                                   )}
                                 >
                                    {item.stock < 20 ? 'REPLENISH' : 'OPTIMAL'}
                                 </Badge>
                              </td>
                              <td className="py-5 text-right pr-2">
                                 <div className="flex items-center justify-end gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)} className="rounded-xl h-8 w-8 text-indigo-600 hover:bg-indigo-50">
                                       <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => confirmDelete(item)} className="rounded-xl h-8 w-8 text-rose-600 hover:bg-rose-50">
                                       <Trash2 className="w-4 h-4" />
                                    </Button>
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="rounded-[32px]">
          <DialogHeader>
            <DialogTitle>Modify Stock Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stock Count</Label>
                <Input type="number" value={form.stock} onChange={e => setForm({...form, stock: parseInt(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Unit Price</Label>
                <Input type="number" value={form.price} onChange={e => setForm({...form, price: parseInt(e.target.value)})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} className="bg-indigo-600">Apply Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stunning Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-[32px] sm:max-w-md p-0 overflow-hidden border-none shadow-[0_20px_60px_-15px_rgba(225,29,72,0.3)]">
          <div className="bg-gradient-to-br from-rose-500 to-rose-700 p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
               <Trash2 className="w-48 h-48 -rotate-12 translate-x-8 -translate-y-12" />
            </div>
            <div className="relative z-10">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-xl border border-white/30 shadow-2xl">
                <Trash2 className="w-12 h-12 text-white drop-shadow-md" />
              </div>
              <DialogTitle className="text-3xl font-black text-white tracking-tight mb-3 drop-shadow-md">
                Hapus {currentLocation === 'ALL' ? 'Produk' : 'Stok'}?
              </DialogTitle>
              <DialogDescription className="text-rose-50 font-medium text-base px-2">
                {currentLocation === 'ALL' 
                  ? `Kamu akan menghapus "${itemToDelete?.name}" secara permanen dari katalog master dan sistem penyimpanan.`
                  : `Apakah kamu yakin ingin menghapus "${itemToDelete?.name}" dari stok cabang ini?`}
              </DialogDescription>
            </div>
          </div>
          
          <div className="p-8 bg-white">
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={() => setDeleteDialogOpen(false)}
                className="flex-1 h-14 rounded-2xl border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                disabled={isDeleting}
              >
                Batal
              </Button>
              <Button 
                onClick={handleDelete} 
                disabled={isDeleting}
                className="flex-1 h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xl shadow-rose-600/20 transition-all hover:scale-[1.02]"
              >
                {isDeleting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Menghapus...
                  </div>
                ) : (
                   'Ya, Hapus'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
