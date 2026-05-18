import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Plus, Loader2, Upload, Trash2, Camera, X, Check, Search, AlertTriangle, Layers, HelpCircle, BadgeCheck } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { BACKEND_URL } from '@/shared/lib/api';
import { cn } from '@/shared/lib/utils';

const CATEGORIES = ['Coffee', 'Pastry', 'Cake', 'Beverage', 'Sandwich', 'Snack', 'Other'];

type AngleKey = 'front' | 'back' | 'left' | 'right';

const ANGLES: { key: AngleKey; label: string; fieldName: string }[] = [
  { key: 'front', label: 'Depan', fieldName: 'imageFront' },
  { key: 'back', label: 'Belakang', fieldName: 'imageBack' },
  { key: 'left', label: 'Kiri', fieldName: 'imageLeft' },
  { key: 'right', label: 'Kanan', fieldName: 'imageRight' },
];

function getToken(): string {
  try {
    const raw = localStorage.getItem('autocashier_user');
    if (raw) return JSON.parse(raw)?.token || '';
  } catch { /* */ }
  return '';
}

function authHeaders() {
  const token = getToken();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

export default function AddInventoryPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'master' | 'request'>('master');
  const [isSaving, setIsSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Data States
  const [masterCatalog, setMasterCatalog] = useState<any[]>([]);
  const [branchInventory, setBranchInventory] = useState<any[]>([]);
  const [selectedMasterId, setSelectedMasterId] = useState<string>('');
  const [masterSearch, setMasterSearch] = useState<string>('');

  // Form states for linking Master Product
  const [linkForm, setLinkForm] = useState({
    stock: '0',
    price: '',
  });

  // Form states for submitting new Product Request
  const [requestForm, setRequestForm] = useState({
    name: '',
    price: '',
    category: '',
    sku: '',
    unit: 'pcs',
    description: '',
  });

  // Image files states for requests
  const [imageFiles, setImageFiles] = useState<Record<AngleKey, File | null>>({
    front: null,
    back: null,
    left: null,
    right: null,
  });

  const [imagePreviews, setImagePreviews] = useState<Record<AngleKey, string | null>>({
    front: null,
    back: null,
    left: null,
    right: null,
  });

  const fileInputRefs = {
    front: useRef<HTMLInputElement>(null),
    back: useRef<HTMLInputElement>(null),
    left: useRef<HTMLInputElement>(null),
    right: useRef<HTMLInputElement>(null),
  };

  // Camera states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeCameraAngle, setActiveCameraAngle] = useState<AngleKey | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Fetch data
  const loadData = async () => {
    try {
      setLoadingData(true);
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Fetch master catalog
      const masterRes = await fetch(`${BACKEND_URL}/api/products`, { headers });
      const masterJson = await masterRes.json();

      // 2. Fetch branch inventory
      const branchRes = await fetch(`${BACKEND_URL}/api/inventory`, { headers });
      const branchJson = await branchRes.json();

      if (masterRes.ok && masterJson.data) {
        setMasterCatalog(masterJson.data);
      }
      if (branchRes.ok && branchJson.data) {
        setBranchInventory(branchJson.data);
      }
    } catch (err: any) {
      toast.error('Gagal mengambil data katalog: ' + err.message);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Camera actions
  const openCamera = async (angle: AngleKey) => {
    setActiveCameraAngle(angle);
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
    } catch (err) {
      toast.error('Gagal membuka kamera: ' + (err as Error).message);
      setIsCameraOpen(false);
      setActiveCameraAngle(null);
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
    setActiveCameraAngle(null);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current && activeCameraAngle) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `camera_${activeCameraAngle}.jpg`, { type: 'image/jpeg' });
            setImageFiles(prev => ({ ...prev, [activeCameraAngle]: file }));
            setImagePreviews(prev => ({ ...prev, [activeCameraAngle]: URL.createObjectURL(blob) }));
            closeCamera();
            toast.success(`Foto ${activeCameraAngle} berhasil diambil!`);
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  const handleImageSelect = (angle: AngleKey, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFiles(prev => ({ ...prev, [angle]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => ({ ...prev, [angle]: reader.result as string }));
      };
      reader.readAsDataURL(file);
      toast.success(`Foto ${angle} berhasil diupload!`);
    }
  };

  const handleRemoveImage = (angle: AngleKey) => {
    setImageFiles(prev => ({ ...prev, [angle]: null }));
    setImagePreviews(prev => ({ ...prev, [angle]: null }));
    const ref = fileInputRefs[angle];
    if (ref.current) ref.current.value = '';
  };

  const uploadedCount = Object.values(imageFiles).filter(Boolean).length;

  // Action 1: Add a product from Master Catalog to Branch Inventory
  const handleLinkCatalogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMasterId) return;

    try {
      setIsSaving(true);
      const selectedProduct = masterCatalog.find(p => p.id === selectedMasterId);
      const costPrice = linkForm.price ? Number(linkForm.price) : selectedProduct?.price || 0;

      const response = await fetch(`${BACKEND_URL}/api/inventory`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          product_id: selectedMasterId,
          stock: Number(linkForm.stock) || 0,
          cost_price: costPrice,
          _link_existing: true,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        toast.success(`✅ Berhasil menambahkan "${selectedProduct?.name}" ke toko Anda!`);
        setTimeout(() => navigate('/inventory'), 1000);
      } else {
        throw new Error(result.message || 'Gagal menghubungkan produk');
      }
    } catch (err: any) {
      toast.error('❌ Gagal: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Action 2: Submit a custom product request to Super Admin
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadedCount < 4) {
      toast.error('⚠️ Silakan lengkapi foto dari 4 sudut produk terlebih dahulu!');
      return;
    }

    try {
      setIsSaving(true);
      const uploadFormData = new FormData();
      uploadFormData.append('name', requestForm.name);
      uploadFormData.append('price', requestForm.price);
      uploadFormData.append('category', requestForm.category || 'Uncategorized');
      if (requestForm.sku) uploadFormData.append('sku', requestForm.sku);
      uploadFormData.append('unit', requestForm.unit || 'pcs');
      uploadFormData.append('description', requestForm.description);

      // Append all 4 angle images
      for (const angle of ANGLES) {
        const file = imageFiles[angle.key];
        if (file) {
          uploadFormData.append(angle.fieldName, file);
        }
      }

      const response = await fetch(`${BACKEND_URL}/api/product-requests`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
        body: uploadFormData,
      });

      const result = await response.json();
      if (response.ok) {
        toast.success('🚀 Pengajuan produk baru berhasil dikirim ke Super Admin!');
        setTimeout(() => navigate('/inventory'), 1200);
      } else {
        throw new Error(result.message || 'Gagal mengirim pengajuan');
      }
    } catch (err: any) {
      toast.error('❌ Gagal: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter master catalog to show only products not already in branch inventory
  const filteredMasterCatalog = useMemo(() => {
    const branchProductIds = branchInventory.map(item => item.id);
    let list = masterCatalog.filter(p => !branchProductIds.includes(p.id));

    if (masterSearch.trim()) {
      const keyword = masterSearch.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(keyword) ||
        (p.sku && p.sku.toLowerCase().includes(keyword)) ||
        (p.category && p.category.toLowerCase().includes(keyword))
      );
    }
    return list;
  }, [masterCatalog, branchInventory, masterSearch]);

  const selectedProductDetails = useMemo(() => {
    return masterCatalog.find(p => p.id === selectedMasterId) || null;
  }, [masterCatalog, selectedMasterId]);

  return (
    <>
      {/* Camera Fullscreen Overlay */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-lg overflow-hidden rounded-[32px] bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  Ambil Foto {ANGLES.find(a => a.key === activeCameraAngle)?.label}
                </h3>
                <p className="text-xs text-gray-400 font-bold mt-0.5">Posisikan produk tepat di tengah kamera</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={closeCamera} className="rounded-xl h-10 w-10 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="relative bg-black aspect-[4/3] flex items-center justify-center overflow-hidden">
              <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
            </div>
            <div className="p-6 flex justify-center bg-gray-50 border-t border-gray-100">
              <Button
                type="button"
                onClick={takePhoto}
                className="h-16 w-16 rounded-full bg-indigo-600 hover:bg-indigo-700 p-0 shadow-lg shadow-indigo-600/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all border-none"
              >
                <Camera className="h-7 w-7 text-white" />
              </Button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </motion.div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen -m-6 bg-[#F8FAFC] p-6 lg:p-10 font-sans"
      >
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/20">
                <Plus className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-gray-900">Tambah Produk Cabang</h1>
                <p className="text-sm font-medium text-gray-500 mt-0.5">Ambil produk dari master catalog atau ajukan baru ke Super Admin</p>
              </div>
            </div>

            <Button
              onClick={() => navigate('/inventory')}
              variant="outline"
              className="h-11 rounded-xl border-gray-200 bg-white px-5 font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali Ke Stok
            </Button>
          </div>

          {/* Dual Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full space-y-6">
            <TabsList className="bg-gray-100 p-1.5 rounded-2xl w-fit flex gap-1 h-fit shadow-sm border border-gray-200/20">
              <TabsTrigger value="master" className="rounded-xl px-6 py-3 font-black text-xs uppercase tracking-wider transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
                <Layers className="w-4 h-4 mr-2" />
                Ambil dari Katalog Master
              </TabsTrigger>
              <TabsTrigger value="request" className="rounded-xl px-6 py-3 font-black text-xs uppercase tracking-wider transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
                <HelpCircle className="w-4 h-4 mr-2" />
                Ajukan Produk Baru
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Master Catalog Selection */}
            <TabsContent value="master" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                
                {/* Left Column: List of Master Products */}
                <div className="lg:col-span-3 space-y-4">
                  <Card className="rounded-[28px] border border-gray-100 shadow-sm bg-white overflow-hidden">
                    <div className="p-5 border-b border-gray-50">
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Cari nama produk, SKU, kategori..."
                          value={masterSearch}
                          onChange={e => setMasterSearch(e.target.value)}
                          className="pl-10 h-11 bg-gray-50/50 border-gray-200 rounded-xl text-sm font-medium focus:bg-white transition-all shadow-none"
                        />
                      </div>
                    </div>

                    <div className="p-2 max-h-[500px] overflow-y-auto divide-y divide-gray-50">
                      {loadingData ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sinkronisasi Katalog Master...</p>
                        </div>
                      ) : filteredMasterCatalog.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 mb-3 border border-gray-100">
                            <Package className="w-7 h-7" />
                          </div>
                          <h4 className="font-bold text-gray-900 text-sm">Tidak ada produk tersedia</h4>
                          <p className="text-gray-400 text-xs mt-1 max-w-xs leading-relaxed">
                            Seluruh produk katalog master telah dimasukkan ke toko Anda, atau tidak ada yang cocok dengan kata kunci.
                          </p>
                        </div>
                      ) : (
                        filteredMasterCatalog.map((product) => (
                          <div
                            key={product.id}
                            onClick={() => {
                              setSelectedMasterId(product.id);
                              setLinkForm(prev => ({
                                ...prev,
                                price: String(product.price || ''),
                              }));
                            }}
                            className={cn(
                              "p-4 rounded-2xl cursor-pointer flex items-center justify-between transition-all gap-4",
                              selectedMasterId === product.id
                                ? "bg-indigo-50/60 border border-indigo-100 shadow-sm"
                                : "hover:bg-gray-50/50 border border-transparent"
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-11 h-11 rounded-xl object-cover border border-gray-200 shadow-sm bg-white"
                                />
                              ) : (
                                <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center font-bold text-indigo-600 text-sm">
                                  {product.name.substring(0, 1).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-bold text-gray-900 truncate text-sm">{product.name}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                  {product.category || 'Uncategorized'} • SKU: {product.sku || '-'}
                                </p>
                              </div>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <p className="font-mono font-black text-gray-900 text-sm">Rp {product.price.toLocaleString()}</p>
                              {product.ai_label && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-emerald-600 mt-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                  <BadgeCheck className="w-3 h-3" />
                                  YOLO
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </div>

                {/* Right Column: Inventory Addition Config */}
                <div className="lg:col-span-2">
                  <Card className="rounded-[28px] border border-gray-100 shadow-md bg-white overflow-hidden sticky top-6">
                    <div className="p-6 bg-gradient-to-br from-indigo-50/40 to-indigo-100/10 border-b border-gray-100">
                      <h3 className="text-sm font-black text-indigo-950 uppercase tracking-widest">Pengaturan Stok Cabang</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Input stok awal dan harga khusus toko Anda</p>
                    </div>

                    <form onSubmit={handleLinkCatalogSubmit} className="p-6 space-y-5">
                      {selectedProductDetails ? (
                        <div className="space-y-4">
                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/50 flex items-center gap-3">
                            {selectedProductDetails.image_url && (
                              <img src={selectedProductDetails.image_url} className="w-10 h-10 object-cover rounded-lg border bg-white" alt="" />
                            )}
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Produk Terpilih</p>
                              <h5 className="font-bold text-gray-900 text-sm truncate">{selectedProductDetails.name}</h5>
                            </div>
                          </div>

                          {/* Stock Field */}
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Stok Awal</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={linkForm.stock}
                              onChange={e => setLinkForm(prev => ({ ...prev, stock: e.target.value }))}
                              className="h-11 rounded-xl bg-gray-50/50 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-100/60 border-gray-200"
                              required
                            />
                          </div>

                          {/* Branch Custom Price Field */}
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center justify-between">
                              <span>Harga Khusus Cabang (Rp)</span>
                              <span className="text-[9px] text-gray-400 lowercase font-medium">Bawaan master jika kosong</span>
                            </Label>
                            <Input
                              type="number"
                              placeholder={`Bawaan Master: Rp ${selectedProductDetails.price.toLocaleString()}`}
                              value={linkForm.price}
                              onChange={e => setLinkForm(prev => ({ ...prev, price: e.target.value }))}
                              className="h-11 rounded-xl bg-gray-50/50 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-100/60 border-gray-200"
                            />
                          </div>

                          <Button
                            type="submit"
                            disabled={isSaving}
                            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/10 font-bold gap-2 text-xs uppercase tracking-wider border-none mt-4 transition-all"
                          >
                            {isSaving ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Check className="w-4.5 h-4.5" />}
                            {isSaving ? 'Menghubungkan...' : 'Tambahkan ke Toko'}
                          </Button>
                        </div>
                      ) : (
                        <div className="py-12 text-center text-gray-400 space-y-3">
                          <Package className="w-12 h-12 mx-auto text-gray-300 stroke-[1.5]" />
                          <div className="px-4">
                            <p className="font-bold text-gray-800 text-sm">Pilih produk master dahulu</p>
                            <p className="text-xs text-gray-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
                              Silakan klik salah satu produk di daftar sebelah kiri untuk memproses stok cabang.
                            </p>
                          </div>
                        </div>
                      )}
                    </form>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: Custom Product Request Form */}
            <TabsContent value="request">
              <Card className="overflow-hidden rounded-[32px] border border-gray-100 bg-white shadow-[0_8px_40px_rgba(0,0,0,0.04)]">
                
                {/* Warning Banner */}
                <div className="p-5 bg-amber-50 border-b border-amber-100/60 flex gap-3.5 items-start">
                  <AlertTriangle className="w-5.5 h-5.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-amber-900 text-xs uppercase tracking-wider">Pemberitahuan Validasi Pengajuan</h5>
                    <p className="text-[11px] text-amber-800 leading-relaxed font-semibold mt-1">
                      Gunakan menu ini **HANYA jika produk tidak tersedia di Katalog Master**. Pengajuan Anda membutuhkan review dan **approval dari Super Admin** serta pendaftaran citra 3D/4-Sudut sebelum produk dapat dideteksi oleh Vision AI kasir.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleRequestSubmit} className="p-8 space-y-8">
                  {/* Form Grid */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-black text-gray-900">Form Pengajuan SKU Baru</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Lengkapi parameter produk baru</p>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nama Produk *</Label>
                      <Input
                        placeholder="Misal: Kopi Pandan Gula Aren"
                        value={requestForm.name}
                        onChange={e => setRequestForm(prev => ({ ...prev, name: e.target.value }))}
                        className="h-12 rounded-2xl bg-gray-50/50 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-100"
                        required
                      />
                    </div>

                    {/* Price */}
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Harga Jual yang Diajukan (Rp) *</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={requestForm.price}
                        onChange={e => setRequestForm(prev => ({ ...prev, price: e.target.value }))}
                        className="h-12 rounded-2xl bg-gray-50/50 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-100"
                        required
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Kategori</Label>
                      <Input
                        placeholder="Misal: Beverage"
                        value={requestForm.category}
                        onChange={e => setRequestForm(prev => ({ ...prev, category: e.target.value }))}
                        className="h-12 rounded-2xl bg-gray-50/50 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    {/* SKU (Optional) */}
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">SKU (Opsional)</Label>
                      <Input
                        placeholder="Misal: PROD-KPA-01 (Otomatis jika kosong)"
                        value={requestForm.sku}
                        onChange={e => setRequestForm(prev => ({ ...prev, sku: e.target.value }))}
                        className="h-12 rounded-2xl bg-gray-50/50 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    {/* Unit */}
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Satuan</Label>
                      <Input
                        placeholder="pcs / cup / botol"
                        value={requestForm.unit}
                        onChange={e => setRequestForm(prev => ({ ...prev, unit: e.target.value }))}
                        className="h-12 rounded-2xl bg-gray-50/50 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    {/* Description/Reason */}
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Alasan Kebutuhan Pengajuan *</Label>
                      <Input
                        placeholder="Misal: Menu seasonal khusus ramadhan..."
                        value={requestForm.description}
                        onChange={e => setRequestForm(prev => ({ ...prev, description: e.target.value }))}
                        className="h-12 rounded-2xl bg-gray-50/50 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-100"
                        required
                      />
                    </div>
                  </div>

                  {/* Camera Upload Section */}
                  <div className="pt-6 border-t border-gray-100 space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                          <Camera className="h-5 w-5 text-indigo-600" />
                          Foto Produk — 4 Sudut Pandang (Wajib)
                        </h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                          Citra ini akan disinkronkan ke kecerdasan buatan YOLO-World & DINOv2
                        </p>
                      </div>
                      <div className="flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 border border-indigo-100/30">
                        <div className={`h-2 w-2 rounded-full ${uploadedCount === 4 ? 'bg-emerald-500 animate-pulse' : uploadedCount > 0 ? 'bg-amber-500' : 'bg-gray-300'}`} />
                        <span className="text-xs font-black text-indigo-600">{uploadedCount}/4 Terisi</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {ANGLES.map(({ key, label }) => (
                        <div key={key} className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 text-center block">
                            {label}
                          </Label>
                          <div
                            className={cn(
                              "relative aspect-square overflow-hidden rounded-2xl border-2 transition-all group",
                              imagePreviews[key]
                                ? 'border-indigo-600 shadow-md shadow-indigo-600/5'
                                : 'border-dashed border-gray-200 bg-gray-50 hover:bg-indigo-50/50 hover:border-indigo-300'
                            )}
                          >
                            {imagePreviews[key] ? (
                              <>
                                <img src={imagePreviews[key]!} alt={`${label} preview`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-[1px]">
                                  <Button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveImage(key);
                                    }}
                                    size="icon"
                                    variant="destructive"
                                    className="h-9 w-9 rounded-full shadow-lg border-none"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="absolute bottom-2 left-2 rounded-lg bg-indigo-600 px-2.5 py-0.5 shadow-sm">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-white">{key}</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex h-full w-full flex-col items-center justify-center text-gray-400 gap-2.5 p-2 relative">
                                <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight absolute top-4">{label}</span>
                                
                                <div className="flex gap-2.5 mt-8">
                                  <Button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); fileInputRefs[key].current?.click(); }}
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9 rounded-xl border-gray-200 bg-white shadow-sm hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200 transition-all hover:scale-105"
                                    title="Upload File"
                                  >
                                    <Upload className="h-4 w-4" />
                                  </Button>
                                  
                                  <Button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); openCamera(key); }}
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9 rounded-xl border-gray-200 bg-white shadow-sm hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all hover:scale-105"
                                    title="Buka Kamera"
                                  >
                                    <Camera className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                          <input
                            type="file"
                            ref={fileInputRefs[key]}
                            accept="image/*"
                            onChange={(e) => handleImageSelect(key, e)}
                            className="hidden"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100 flex justify-end gap-3.5">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/inventory')}
                      className="rounded-xl px-6 h-12 font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSaving || uploadedCount < 4}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/10 font-bold gap-2 px-8 h-12 text-xs uppercase tracking-wider border-none"
                    >
                      {isSaving ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Check className="w-4.5 h-4.5" />}
                      {isSaving ? 'Mengirim Pengajuan...' : 'Kirim Pengajuan'}
                    </Button>
                  </div>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </>
  );
}
