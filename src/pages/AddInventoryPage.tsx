import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Plus, Loader2, Upload, Trash2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { BACKEND_URL } from '@/lib/api';

const CATEGORIES = ['Coffee', 'Pastry', 'Cake', 'Beverage', 'Sandwich', 'Snack', 'Other'];

type AngleKey = 'front' | 'back' | 'left' | 'right';

const ANGLES: { key: AngleKey; label: string; fieldName: string }[] = [
  { key: 'front', label: 'Depan', fieldName: 'imageFront' },
  { key: 'back', label: 'Belakang', fieldName: 'imageBack' },
  { key: 'left', label: 'Kiri', fieldName: 'imageLeft' },
  { key: 'right', label: 'Kanan', fieldName: 'imageRight' },
];

export default function AddInventoryPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    price: '',
    stock: '',
    ai_label: '',
    category: '',
  });

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

  const handleImageSelect = (angle: AngleKey, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFiles(prev => ({ ...prev, [angle]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => ({ ...prev, [angle]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (angle: AngleKey) => {
    setImageFiles(prev => ({ ...prev, [angle]: null }));
    setImagePreviews(prev => ({ ...prev, [angle]: null }));
    const ref = fileInputRefs[angle];
    if (ref.current) ref.current.value = '';
  };

  const uploadedCount = Object.values(imageFiles).filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);

      if (!formData.name || !formData.price) {
        throw new Error('Nama dan Harga wajib diisi');
      }

      const uploadFormData = new FormData();
      if (formData.sku) uploadFormData.append('sku', formData.sku);
      uploadFormData.append('name', formData.name);
      uploadFormData.append('price', formData.price);
      uploadFormData.append('stock', formData.stock || '0');
      if (formData.ai_label) uploadFormData.append('ai_label', formData.ai_label);
      if (formData.category) uploadFormData.append('category', formData.category);

      // Append all 4 angle images
      for (const angle of ANGLES) {
        const file = imageFiles[angle.key];
        if (file) {
          uploadFormData.append(angle.fieldName, file);
        }
      }

      const response = await fetch(`${BACKEND_URL}/api/products`, {
        method: 'POST',
        body: uploadFormData,
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        toast.success('✅ Produk berhasil ditambahkan!');
        setTimeout(() => navigate('/inventory'), 1500);
      } else {
        throw new Error(result.error || 'Gagal menambah produk');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Terjadi kesalahan saat menambah produk';
      setError(errorMsg);
      toast.error(`❌ Error: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen -m-6 bg-[#F8FAFC] p-6 lg:p-10 font-sans"
    >
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/20">
              <Plus className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900">Tambah Produk Baru</h1>
              <p className="text-sm font-medium text-gray-500 mt-1">Isi semua kolom sesuai tabel Supabase.</p>
            </div>
          </div>
          
          <Button
            onClick={() => navigate('/inventory')}
            variant="outline"
            className="h-10 rounded-xl border-gray-200 bg-white px-4 font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-600">
            {error}
          </div>
        )}

        <Card className="overflow-hidden rounded-[32px] border-none bg-white shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Section: Product Info */}
            <div className="space-y-2">
              <h3 className="text-lg font-black text-gray-900">Informasi Produk</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Kolom tabel products</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* SKU */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">SKU</Label>
                <Input
                  placeholder="Otomatis jika dikosongkan"
                  value={formData.sku}
                  onChange={e => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  className="h-12 rounded-2xl bg-gray-50/50 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Name *</Label>
                <Input
                  placeholder="Misal: Kopi Susu Aren"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="h-12 rounded-2xl bg-gray-50/50 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  required
                />
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Price (Rp) *</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.price}
                  onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="h-12 rounded-2xl bg-gray-50/50 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  required
                />
              </div>

              {/* Stock */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Stock</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.stock}
                  onChange={e => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                  className="h-12 rounded-2xl bg-gray-50/50 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Label (ai_label) */}
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Label</Label>
                <Input
                  placeholder="Misal: kopi_susu_aren"
                  value={formData.ai_label}
                  onChange={e => setFormData(prev => ({ ...prev, ai_label: e.target.value }))}
                  className="h-12 rounded-2xl bg-gray-50/50 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Category */}
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category</Label>
                <Select value={formData.category} onValueChange={val => setFormData(prev => ({ ...prev, category: val }))}>
                  <SelectTrigger className="h-12 rounded-2xl bg-gray-50/50 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-100">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat} className="font-semibold">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Section: Product Images (4 angles) */}
            <div className="pt-6 border-t border-gray-100 space-y-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                    <Camera className="h-5 w-5 text-indigo-600" />
                    Foto Produk — 4 Sudut
                  </h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Tabel product_images (id, product_id, angle, storage_path, filename, uploaded_at)
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2">
                  <div className={`h-2 w-2 rounded-full ${uploadedCount === 4 ? 'bg-emerald-500' : uploadedCount > 0 ? 'bg-amber-500' : 'bg-gray-300'}`} />
                  <span className="text-xs font-black text-indigo-600">{uploadedCount}/4 Foto</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {ANGLES.map(({ key, label }) => (
                  <div key={key} className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 text-center block">
                      {label}
                    </Label>
                    <div
                      onClick={() => !imagePreviews[key] && fileInputRefs[key].current?.click()}
                      className={`relative aspect-square overflow-hidden rounded-2xl border-2 transition-all ${
                        imagePreviews[key]
                          ? 'border-indigo-600 shadow-lg shadow-indigo-600/10'
                          : 'border-dashed border-gray-200 bg-gray-50 hover:bg-indigo-50/50 hover:border-indigo-300 cursor-pointer'
                      }`}
                    >
                      {imagePreviews[key] ? (
                        <>
                          <img src={imagePreviews[key]!} alt={`${label} preview`} className="h-full w-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200">
                            <Button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveImage(key);
                              }}
                              size="icon"
                              variant="destructive"
                              className="h-9 w-9 rounded-full shadow-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          {/* Angle badge */}
                          <div className="absolute bottom-2 left-2 rounded-lg bg-indigo-600 px-2 py-0.5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-white">{key}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center text-gray-400 gap-2 p-3">
                          <Upload className="h-6 w-6" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-center leading-tight">{label}</span>
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

              <p className="text-xs font-medium text-gray-400 text-center pt-1">
                Upload foto dari 4 sudut pandang. Format: JPG, PNG. Maks: 5MB per foto.
              </p>
            </div>

            {/* Info note */}
            <div className="rounded-2xl bg-indigo-50/50 border border-indigo-100 p-4">
              <p className="text-xs font-semibold text-indigo-600">
                💡 Kolom <strong>id</strong>, <strong>created_at</strong>, <strong>branch_prices</strong>, dan <strong>uploaded_at</strong> akan diisi otomatis oleh sistem. Foto depan akan digunakan sebagai <strong>image_url</strong> utama produk.
              </p>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="h-14 w-full rounded-2xl bg-indigo-600 text-sm font-black text-white shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-70 transition-all"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Package className="h-5 w-5 mr-2" />
                )}
                {isLoading ? 'Menyimpan...' : 'Simpan Produk'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </motion.div>
  );
}
