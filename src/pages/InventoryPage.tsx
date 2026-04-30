import {useState, useEffect} from 'react';
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
import {fetchBackend, MOCK_LOCATIONS} from '@/lib/api';
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
  const {currentLocation} = useLocation();
  const {user} = useAuth();
  const [inventory, setInventory] = useState<any[]>([]);
  const [masterCatalog, setMasterCatalog] = useState<any[]>([]);
  const [entryType, setEntryType] = useState<'master' | 'local'>('master');
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
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
    
    if (invRes.status === 'success') setInventory(invRes.data);
    if (catRes.status === 'success') setMasterCatalog(catRes.data);
    
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
      setIsAddOpen(false);
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
    const res = await fetchBackend('updateInventory', { ...currentItem, ...form });
    if (res.status === 'success') {
      toast.success("Catalog updated successfully");
      setIsEditOpen(false);
      loadData();
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetchBackend('deleteInventory', { id });
    if (res.status === 'success') {
       toast.info("Item removed from inventory");
       loadData();
    }
  };

  const openEdit = (item: any) => {
    setCurrentItem(item);
    setForm({ 
      catalogId: item.catalogId || '',
      name: item.name, 
      category: item.category, 
      stock: item.stock, 
      price: item.price, 
      location_id: item.location_id,
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
           <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger render={<Button className="bg-indigo-600 hover:bg-indigo-700 h-12 px-6 rounded-2xl shadow-xl shadow-indigo-600/20 font-bold border-none" />}>
                <Plus className="w-4 h-4 mr-2" /> Inventory Intake
              </DialogTrigger>
              <DialogContent className="rounded-[40px] sm:max-w-[700px] p-0 overflow-hidden border-none shadow-2xl">
                <ScrollArea className="max-h-[95vh]">
                  <div className="p-10 space-y-8">
                    <DialogHeader>
                      <div className="flex items-center gap-2 mb-2">
                         <Sparkles className="w-4 h-4 text-indigo-600" />
                         <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Operational Intake</span>
                      </div>
                      <DialogTitle className="text-3xl font-black tracking-tighter">Internal Stock Entry</DialogTitle>
                      <DialogDescription className="font-medium text-gray-500">
                        {entryType === 'master' 
                          ? 'Select standardized assets from the regional master catalog.' 
                          : 'Register a branch-specific item not found in the global registry.'}
                      </DialogDescription>
                    </DialogHeader>

                    {/* Dual-Option Header (Segmented Control) */}
                    <div className="flex p-1.5 bg-gray-100 rounded-2xl w-full max-w-md mx-auto">
                      <button 
                        onClick={() => {
                          setEntryType('master');
                          setForm({ ...form, catalogId: '', name: '', category: '', price: '' as any, stock: '' as any });
                        }}
                        className={cn(
                          "flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                          entryType === 'master' ? "bg-white text-indigo-600 shadow-xl scale-[1.02]" : "text-gray-400 hover:text-gray-500"
                        )}
                      >
                        From Master Catalog
                      </button>
                      <button 
                        onClick={() => {
                          setEntryType('local');
                          setForm({ ...form, catalogId: 'local-custom', name: '', category: '', price: '' as any, stock: '' as any });
                        }}
                        className={cn(
                          "flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                          entryType === 'local' ? "bg-white text-indigo-600 shadow-xl scale-[1.02]" : "text-gray-400 hover:text-gray-500"
                        )}
                      >
                        Add Local Product
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="space-y-4">
                          {entryType === 'master' ? (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 pl-1">Search Master Catalog</Label>
                                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                                  <PopoverTrigger 
                                    render={
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={comboboxOpen}
                                        className="w-full justify-between rounded-2xl h-14 bg-gray-200/50 border-none px-4 font-bold text-left hover:bg-gray-200 transition-all focus:ring-2 focus:ring-indigo-600"
                                      />
                                    }
                                  >
                                      <div className="flex items-center gap-2">
                                        {form.name ? form.name : "Choose Global Product..."}
                                      </div>
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[300px] p-0 rounded-2xl border-none shadow-2xl overflow-hidden" align="start">
                                    <Command className="border-none">
                                      <CommandInput 
                                        placeholder="Filter regional catalog..." 
                                        value={comboboxSearch}
                                        onValueChange={setComboboxSearch}
                                        className="border-none focus:ring-0 text-sm font-bold h-12"
                                      />
                                      <CommandList className="max-h-[300px] overflow-y-auto">
                                        <CommandEmpty className="p-8 text-center">
                                           <p className="text-xs font-bold text-gray-400 italic">No matching global assets found.</p>
                                        </CommandEmpty>
                                        <CommandGroup className="p-2">
                                          {masterCatalog.map((cat) => (
                                            <CommandItem
                                              key={cat.id}
                                              value={cat.name}
                                              onSelect={() => handleCatalogSelect(cat.id)}
                                              className="rounded-xl p-3 cursor-pointer hover:bg-gray-50 aria-selected:bg-indigo-50 aria-selected:text-indigo-600 transition-colors"
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-4 w-4",
                                                  form.catalogId === cat.id ? "opacity-100" : "opacity-0"
                                                )}
                                              />
                                              <div className="flex flex-col">
                                                <span className="font-bold text-xs">{cat.name}</span>
                                                <span className="text-[9px] uppercase tracking-widest opacity-50">{cat.category}</span>
                                              </div>
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              </div>
                              
                              <div className={cn("grid grid-cols-2 gap-4 transition-opacity", form.catalogId ? "opacity-100" : "opacity-50 cursor-not-allowed")}>
                                <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 pl-1">Incoming Stock Level</Label>
                                  <Input 
                                    type="number" 
                                    className="rounded-2xl h-14 bg-gray-50 border-none px-4 font-bold focus:ring-2 focus:ring-indigo-600" 
                                    placeholder="Enter quantity"
                                    value={form.stock}
                                    onChange={e => setForm({...form, stock: e.target.value})}
                                    disabled={!form.catalogId}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 pl-1">Unit Selling Price (Rp)</Label>
                                  <Input 
                                    type="number" 
                                    className="rounded-2xl h-14 bg-gray-50 border-none px-4 font-bold focus:ring-2 focus:ring-indigo-600" 
                                    placeholder="Enter price (Rp)"
                                    value={form.price}
                                    onChange={e => setForm({...form, price: e.target.value})}
                                    disabled={!form.catalogId}
                                  />
                                </div>
                              </div>
                              {form.catalogId && (
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest italic px-1">
                                  Branch-specific pricing will override global suggested rates for this location.
                                </p>
                              )}
                            </div>
                          ) : (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="space-y-4"
                            >
                               <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 pl-1">Product Name</Label>
                                  <Input 
                                    className="rounded-2xl h-14 bg-orange-50/30 border-orange-100 border-2 px-4 font-bold focus:ring-orange-200" 
                                    placeholder="Enter item name..."
                                    value={form.name}
                                    onChange={e => setForm({...form, name: e.target.value})}
                                  />
                               </div>
                               <div className="space-y-2">
                                 <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-1">Category</Label>
                                 <Input 
                                   className="rounded-xl h-12 bg-gray-50 border-none font-bold" 
                                   placeholder="e.g. Pastry, Supplies, Utility"
                                   value={form.category}
                                   onChange={e => setForm({...form, category: e.target.value})}
                                 />
                               </div>
                               <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 pl-1">Incoming Stock</Label>
                                    <Input 
                                      type="number"
                                      className="rounded-xl h-12 bg-gray-50 border-none font-bold focus:ring-2 focus:ring-indigo-600" 
                                      placeholder="0"
                                      value={form.stock}
                                      onChange={e => setForm({...form, stock: e.target.value})}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 pl-1">Unit Selling Price</Label>
                                    <Input 
                                      type="number"
                                      className="rounded-xl h-12 bg-gray-50 border-none font-bold focus:ring-2 focus:ring-indigo-600" 
                                      placeholder="Rp 0"
                                      value={form.price}
                                      onChange={e => setForm({...form, price: e.target.value})}
                                    />
                                  </div>
                               </div>
                               <div className="flex flex-col gap-1.5 pl-1">
                                  <p className="text-[9px] text-orange-700 font-bold leading-relaxed uppercase tracking-widest">
                                    Note: Local products are only visible to this branch and will be marked for audit by neural oversight.
                                  </p>
                                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest italic leading-none">
                                    Branch-specific pricing will override global suggestions.
                                  </p>
                               </div>
                            </motion.div>
                          )}
                        </div>

                        {isSuperAdmin && (
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-1">Target Branch</Label>
                            <Select value={form.location_id} onValueChange={(v) => setForm({...form, location_id: v})}>
                              <SelectTrigger className="rounded-2xl h-12 bg-gray-50 border-none px-4">
                                <SelectValue placeholder="Select Branch" />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl border-none shadow-2xl">
                                {MOCK_LOCATIONS.filter(l => l.id !== 'ALL').map(loc => (
                                  <SelectItem key={loc.id} value={loc.id} className="rounded-xl">{loc.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Visual Verification (4-Sided)</Label>
                          <Tabs value={uploadMode} onValueChange={(v: any) => setUploadMode(v)} className="w-auto">
                            <TabsList className="bg-gray-100 p-1 rounded-xl h-9">
                              <TabsTrigger value="file" className="rounded-lg text-[10px] uppercase font-bold"><Upload className="w-3 h-3 mr-1" /> File</TabsTrigger>
                              <TabsTrigger value="camera" className="rounded-lg text-[10px] uppercase font-bold"><Camera className="w-3 h-3 mr-1" /> Cam</TabsTrigger>
                            </TabsList>
                          </Tabs>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {['front', 'back', 'right', 'left'].map((side) => (
                            <div 
                              key={side}
                              className="aspect-[4/3] bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-200 transition-all group overflow-hidden relative"
                            >
                              {form.photos[side as keyof typeof form.photos] ? (
                                <div className="absolute inset-0 bg-emerald-500/10 flex flex-col items-center justify-center p-4 text-center">
                                   <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-2">
                                      <Check className="w-4 h-4" />
                                   </div>
                                   <span className="text-[10px] font-black uppercase text-emerald-600">{side} CAPTURED</span>
                                </div>
                              ) : (
                                <>
                                  <div className="p-3 bg-white rounded-xl shadow-sm text-gray-400 group-hover:text-indigo-600 transition-colors">
                                    {uploadMode === 'camera' ? <Camera className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                                  </div>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{side} View</span>
                                </>
                              )}
                              <input 
                                type="file" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                onChange={() => setForm({...form, photos: {...form.photos, [side]: 'captured'}})}
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium italic">Requirement: Clear visibility of labels and dimensions.</p>
                      </div>
                    </div>

                    <DialogFooter className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                      <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-2xl h-12 px-8 font-bold text-gray-400 hover:text-gray-600">DISCARD</Button>
                      <Button onClick={handleAdd} className="flex-1 bg-indigo-600 h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-600/30">
                        {form.catalogId === 'local-custom' ? 'REGISTER & AUTHORIZE' : 'AUTHORIZE ENTRY'}
                      </Button>
                    </DialogFooter>
                  </div>
                </ScrollArea>
              </DialogContent>
           </Dialog>
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
                  Rp {inventory.reduce((acc, curr) => acc + (curr.price * curr.stock), 0).toLocaleString()}
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
                  {inventory.filter(i => i.stock < 20).length} Items
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
                <div className="text-4xl font-black tracking-tighter font-mono text-gray-900">{inventory.length}</div>
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
                        {inventory.map((item) => (
                           <tr key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                              <td className="py-5 pl-2">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center font-bold text-indigo-600 text-xs">
                                       {item.name.substring(0, 1)}
                                    </div>
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
                              <td className="py-5 font-mono font-bold text-indigo-600">Rp {item.price.toLocaleString()}</td>
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
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="rounded-xl h-8 w-8 text-rose-600 hover:bg-rose-50">
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
    </div>
  );
}
