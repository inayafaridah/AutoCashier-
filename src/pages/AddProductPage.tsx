import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Plus, Loader2, Upload, Trash2, CheckCircle2 } from 'lucide-react';
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

const CATEGORIES = ['Coffee', 'Pastry', 'Cake', 'Beverage', 'Sandwich', 'Other'];

export default function AddProductPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    price: '',
    ai_label: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);

      if (!formData.name || !formData.category || !formData.price) {
        throw new Error('Please fill all required fields');
      }

      const uploadFormData = new FormData();
      uploadFormData.append('sku', formData.sku);
      uploadFormData.append('name', formData.name);
      uploadFormData.append('category', formData.category);
      uploadFormData.append('price', formData.price);
      uploadFormData.append('ai_label', formData.ai_label);

      if (imageFile) {
        uploadFormData.append('imageFront', imageFile);
      }

      const response = await fetch(`${BACKEND_URL}/api/products`, {
        method: 'POST',
        body: uploadFormData,
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        toast.success('✅ Produk berhasil ditambahkan!');
        setTimeout(() => navigate('/master-products'), 1500);
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
              <p className="text-sm font-medium text-gray-500 mt-1">Masukkan detail produk untuk katalog.</p>
            </div>
          </div>
          
          <Button
            onClick={() => navigate('/master-products')}
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
            <div className="space-y-2">
              <h3 className="text-lg font-black text-gray-900">Informasi Dasar</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Detail utama produk</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">SKU</Label>
                <Input
                  placeholder="Misal: PROD-KOP-1234 (opsional)"
                  value={formData.sku}
                  onChange={e => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  className="h-12 rounded-2xl bg-gray-50/50 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nama Produk *</Label>
                <Input
                  placeholder="Misal: Kopi Susu Aren"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="h-12 rounded-2xl bg-gray-50/50 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Harga (Rp) *</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.price}
                  onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="h-12 rounded-2xl bg-gray-50/50 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Label</Label>
                <Input
                  placeholder="Misal: kopi_susu_aren"
                  value={formData.ai_label}
                  onChange={e => setFormData(prev => ({ ...prev, ai_label: e.target.value }))}
                  className="h-12 rounded-2xl bg-gray-50/50 font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Kategori *</Label>
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

            <div className="pt-4 border-t border-gray-100 space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-gray-900">Foto Produk</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gambar utama untuk katalog</p>
              </div>

              <div className="flex items-start gap-6">
                <div 
                  onClick={() => !imagePreview && fileInputRef.current?.click()}
                  className={`relative flex h-32 w-32 shrink-0 overflow-hidden rounded-3xl border-2 transition-all ${
                    imagePreview 
                      ? 'border-indigo-600 shadow-md' 
                      : 'border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer'
                  }`}
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                        <Button 
                          type="button" 
                          onClick={handleRemoveImage}
                          size="icon" 
                          variant="destructive" 
                          className="h-8 w-8 rounded-full"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center text-gray-400 gap-2">
                      <Upload className="h-6 w-6" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Upload</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 space-y-2 pt-2">
                  <p className="text-sm font-medium text-gray-500">
                    Upload foto produk dengan resolusi yang jelas. Format yang didukung: JPG, PNG. Ukuran maksimal: 5MB.
                  </p>
                  <Button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline" 
                    className="rounded-xl font-bold"
                  >
                    Pilih File
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <div className="pt-8">
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
