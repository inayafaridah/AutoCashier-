import {useState, useEffect} from 'react';
import {Card, CardContent, CardHeader} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Plus, Search, Package, Edit2, Trash2} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {fetchBackend} from '@/lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
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
import { motion, AnimatePresence } from 'motion/react';

export default function MasterProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    sku: `SKU-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
  });

  useEffect(() => {
    fetchBackend('getMasterCatalog').then(res => {
      if (res.status === 'success') setProducts(res.data);
      setLoading(false);
    });
  }, []);

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.category) return;
    
    // For demo purposes, we'll just add it to the local state
    const productToAdd = {
      id: newProduct.sku,
      name: newProduct.name,
      category: newProduct.category,
      sku: newProduct.sku,
      status: 'Global Active'
    };
    
    setProducts([productToAdd, ...products]);
    setIsAddModalOpen(false);
    toast.success('Product added successfully to master catalog');
    // Reset form
    setNewProduct({
      name: '',
      category: '',
      sku: `SKU-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
    });
  };

  const handleEditProduct = () => {
    if (!editingProduct.name || !editingProduct.category) return;
    
    setProducts(products.map(p => p.id === editingProduct.id ? editingProduct : p));
    setIsEditModalOpen(false);
    toast.success('Product updated successfully');
  };

  const handleDeleteProduct = () => {
    if (!productToDelete) return;
    
    setProducts(products.filter(p => p.id !== productToDelete.id));
    setIsDeleteModalOpen(false);
    toast.success('Product deleted from master catalog');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] -m-6 p-6 lg:p-10 space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-7xl mx-auto w-full">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Master Product List</h2>
          <p className="text-gray-500 font-medium tracking-tight">Manage the official product catalog for all enterprise branches.</p>
        </div>
        
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger render={<Button className="bg-indigo-600 hover:bg-indigo-700 h-14 px-8 rounded-2xl shadow-xl shadow-indigo-600/10 font-bold border-none text-white transition-all hover:scale-[1.02] active:scale-[0.98]" />}>
              <Plus className="w-5 h-5 mr-2" /> ADD NEW PRODUCT
          </DialogTrigger>
          <DialogContent className="rounded-[32px] sm:max-w-[480px] p-8 border-none shadow-2xl bg-white">
            <DialogHeader className="space-y-2">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-2">
                <Package className="w-6 h-6 text-indigo-600" />
              </div>
              <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">Add New Product</DialogTitle>
              <p className="text-sm text-gray-500">Register a new item into the central enterprise catalog.</p>
            </DialogHeader>
            <div className="grid gap-6 py-6 font-sans">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Name</label>
                <Input 
                  placeholder="e.g. Arabica Roast Blend" 
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  className="bg-gray-50 border-gray-100 rounded-2xl h-14 px-4 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all font-medium" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4 pb-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                  <Select onValueChange={(val: string) => setNewProduct({...newProduct, category: val})}>
                    <SelectTrigger className="bg-gray-50 border-gray-100 rounded-2xl h-14 px-4 font-medium transition-all focus:ring-4 focus:ring-indigo-100">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-100 rounded-2xl shadow-xl p-2">
                      <SelectItem value="Beverage" className="rounded-xl p-3 focus:bg-indigo-50 cursor-pointer">Beverage</SelectItem>
                      <SelectItem value="Food" className="rounded-xl p-3 focus:bg-indigo-50 cursor-pointer">Food</SelectItem>
                      <SelectItem value="Merchandise" className="rounded-xl p-3 focus:bg-indigo-50 cursor-pointer">Merchandise</SelectItem>
                      <SelectItem value="Raw Materials" className="rounded-xl p-3 focus:bg-indigo-50 cursor-pointer">Raw Materials</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">SKU Code</label>
                  <Input 
                    value={newProduct.sku}
                    readOnly
                    className="bg-gray-50/50 border-gray-100 rounded-2xl h-14 px-4 font-mono text-xs cursor-not-allowed opacity-60" 
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4 font-sans">
              <Button 
                variant="ghost" 
                onClick={() => setIsAddModalOpen(false)}
                className="h-14 rounded-2xl font-bold flex-1 text-gray-500 hover:bg-gray-50"
              >
                Discard
              </Button>
              <Button 
                onClick={handleAddProduct}
                className="bg-indigo-600 hover:bg-indigo-700 h-14 rounded-2xl font-bold flex-1 text-white shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02]"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-[40px] border border-gray-100 shadow-sm bg-white overflow-hidden max-w-7xl mx-auto w-full">
        <CardHeader className="p-8 pb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search master catalog..." className="pl-12 h-14 bg-[#F8F9FA] border-none rounded-2xl font-bold text-sm focus:ring-4 focus:ring-indigo-50 transition-all" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-[#F8F9FA]/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                       <th className="py-5 pl-8">Product Name</th>
                       <th className="py-5">Category</th>
                       <th className="py-5">Status</th>
                       <th className="py-5 text-right pr-8">Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    <AnimatePresence initial={false}>
                      {products.map((item) => (
                         <motion.tr 
                          key={item.id} 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="group hover:bg-[#F8F9FA]/50 transition-colors"
                         >
                            <td className="py-6 pl-8">
                               <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center shadow-sm group-hover:border-indigo-100 transition-colors">
                                     <Package className="w-6 h-6 text-indigo-600" />
                                  </div>
                                  <div className="flex flex-col">
                                     <span className="font-black text-gray-900 tracking-tight">{item.name}</span>
                                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">ID: {item.id}</span>
                                  </div>
                               </div>
                            </td>
                            <td className="py-6">
                               <Badge variant="outline" className="bg-gray-50 text-gray-500 border-none rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest">
                                 {item.category}
                               </Badge>
                            </td>
                            <td className="py-6">
                               <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest">
                                 Global Active
                               </Badge>
                            </td>
                            <td className="py-6 text-right pr-8">
                               <div className="flex items-center justify-end gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => {
                                      setEditingProduct({...item});
                                      setIsEditModalOpen(true);
                                    }}
                                    className="rounded-2xl h-10 w-10 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => {
                                      setProductToDelete(item);
                                      setIsDeleteModalOpen(true);
                                    }}
                                    className="rounded-2xl h-10 w-10 text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                               </div>
                            </td>
                         </motion.tr>
                      ))}
                    </AnimatePresence>
                 </tbody>
              </table>
           </div>
           
           </CardContent>
      </Card>

      {/* Edit Product Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="rounded-[32px] sm:max-w-[480px] p-8 border-none shadow-2xl bg-white">
          <DialogHeader className="space-y-2">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-2">
              <Edit2 className="w-6 h-6 text-indigo-600" />
            </div>
            <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">Edit Product</DialogTitle>
            <p className="text-sm text-gray-500">Modify the existing product details in the master catalog.</p>
          </DialogHeader>
          <div className="grid gap-6 py-6 font-sans">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Name</label>
              <Input 
                placeholder="Product Name" 
                value={editingProduct?.name || ''}
                onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                className="bg-gray-50 border-gray-100 rounded-2xl h-14 px-4 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all font-medium" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4 pb-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                <Select 
                  value={editingProduct?.category}
                  onValueChange={(val) => setEditingProduct({...editingProduct, category: val})}
                >
                  <SelectTrigger className="bg-gray-50 border-gray-100 rounded-2xl h-14 px-4 font-medium transition-all focus:ring-4 focus:ring-indigo-100">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-100 rounded-2xl shadow-xl p-2">
                    <SelectItem value="Beverage" className="rounded-xl p-3 focus:bg-indigo-50 cursor-pointer">Beverage</SelectItem>
                    <SelectItem value="Food" className="rounded-xl p-3 focus:bg-indigo-50 cursor-pointer">Food</SelectItem>
                    <SelectItem value="Merchandise" className="rounded-xl p-3 focus:bg-indigo-50 cursor-pointer">Merchandise</SelectItem>
                    <SelectItem value="Raw Materials" className="rounded-xl p-3 focus:bg-indigo-50 cursor-pointer">Raw Materials</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">SKU Code</label>
                <Input 
                  value={editingProduct?.sku || ''}
                  readOnly
                  className="bg-gray-50/50 border-gray-100 rounded-2xl h-14 px-4 font-mono text-xs cursor-not-allowed opacity-60" 
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4 font-sans">
            <Button 
              variant="ghost" 
              onClick={() => setIsEditModalOpen(false)}
              className="h-14 rounded-2xl font-bold flex-1 text-gray-500 hover:bg-gray-50"
            >
              Discard
            </Button>
            <Button 
              onClick={handleEditProduct}
              className="bg-indigo-600 hover:bg-indigo-700 h-14 rounded-2xl font-bold flex-1 text-white shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02]"
            >
              Update Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="rounded-[32px] sm:max-w-[420px] p-8 border-none shadow-2xl bg-white">
          <DialogHeader className="space-y-2">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mb-2">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">Confirm Deletion</DialogTitle>
            <p className="text-sm text-gray-500 leading-relaxed font-medium">Are you sure you want to delete <span className="font-black text-gray-900">{productToDelete?.name}</span> from the master catalog? This action cannot be undone.</p>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6 font-sans">
            <Button 
              variant="ghost" 
              onClick={() => setIsDeleteModalOpen(false)}
              className="h-14 rounded-2xl font-bold flex-1 text-gray-500 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteProduct}
              className="bg-rose-600 hover:bg-rose-700 h-14 rounded-2xl font-bold flex-1 text-white shadow-lg shadow-rose-100 transition-all hover:scale-[1.02]"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

