import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  BadgeCheck,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  Trash2,
  X,
  Save,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { fetchBackend, BACKEND_URL } from '@/lib/api';
import { cn } from '@/lib/utils';
// Matches actual DB schema: id, sku, name, price, stock, ai_label, category, image_url, created_at
type ProductRecord = {
  id: string;
  sku?: string;
  name?: string;
  price?: number | string | null;
  stock?: number | null;
  ai_label?: string | null;
  category?: string | null;
  image_url?: string | null;
  created_at?: string | null;
};

const formatCurrency = (value: number | string | null | undefined) => {
  const numericValue = typeof value === 'string' ? Number(value) : value ?? 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(Number(numericValue)) ? Number(numericValue) : 0);
};

const getImageUrl = (url: string | null | undefined) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${BACKEND_URL}${url}`;
};

// ─── Edit Modal ──────────────────────────────────────────────────────────────
function ProductEditModal({
  product,
  onClose,
  onSaved,
}: {
  product: ProductRecord;
  onClose: () => void;
  onSaved: (updated: ProductRecord) => void;
}) {
  const [form, setForm] = useState({
    name: product.name ?? '',
    category: product.category ?? '',
    price: String(product.price ?? ''),
    stock: String(product.stock ?? '0'),
    ai_label: product.ai_label ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          category: form.category.trim() || null,
          price: Number(form.price),
          stock: Number(form.stock),
          ai_label: form.ai_label.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') throw new Error(data.error || `HTTP ${res.status}`);
      onSaved({ ...product, ...form, price: Number(form.price), stock: Number(form.stock) });
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "h-11 rounded-2xl border-gray-200 bg-gray-50 px-4 text-sm font-medium focus:border-indigo-300 focus:ring-indigo-200 w-full";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/25">
              <Pencil className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-black text-gray-900 text-base">Edit Produk</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{product.sku}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-2xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Thumbnail */}
        {product.image_url && (
          <div className="relative h-36 bg-gray-50 overflow-hidden">
            <img
              src={getImageUrl(product.image_url)}
              alt={product.name ?? 'Produk'}
              className="h-full w-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent" />
          </div>
        )}

        {/* Form */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nama Produk *</label>
            <Input name="name" value={form.name} onChange={handleChange} placeholder="Nama produk" className={inputClass} />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Kategori</label>
            <Input name="category" value={form.category} onChange={handleChange} placeholder="Misal: Minuman, Snack..." className={inputClass} />
          </div>

          {/* Price + Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Harga (Rp) *</label>
              <Input name="price" type="number" min="0" value={form.price} onChange={handleChange} placeholder="0" className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Stok</label>
              <Input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} placeholder="0" className={inputClass} />
            </div>
          </div>

          {/* AI Label */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">AI Label (YOLO)</label>
            <Input name="ai_label" value={form.ai_label} onChange={handleChange} placeholder="Misal: bottle, cup, person..." className={inputClass} />
          </div>

          {/* Error */}
          {saveError && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3 text-xs font-bold text-rose-600">
              ❌ {saveError}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="flex-1 h-12 rounded-2xl border-gray-200 font-black text-gray-600 hover:bg-gray-50"
            >
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              className="flex-1 h-12 rounded-2xl bg-indigo-600 font-black text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 disabled:opacity-60"
            >
              {saving
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</>
                : <><Save className="mr-2 h-4 w-4" />Simpan</>}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteConfirmModal({
  product,
  onConfirm,
  onCancel,
  loading,
}: {
  product: ProductRecord;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-[28px] bg-white shadow-2xl"
      >
        <div className="p-6 space-y-5">
          {/* Icon */}
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <div>
            <h2 className="font-black text-gray-900 text-lg">Hapus Produk?</h2>
            <p className="text-sm font-medium text-gray-500 mt-1.5">
              Produk <span className="font-black text-gray-900">"{product.name}"</span> akan dihapus
              secara permanen dari database. Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3">
            {product.image_url ? (
              <img
                src={getImageUrl(product.image_url)}
                alt={product.name}
                className="h-12 w-12 rounded-xl object-cover border border-gray-200 flex-shrink-0"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-gray-200 flex-shrink-0">
                <Package className="h-5 w-5 text-gray-400" />
              </div>
            )}
            <div className="min-w-0">
              <div className="font-black text-gray-900 text-sm truncate">{product.name}</div>
              <div className="text-xs font-mono text-gray-400 truncate">{product.sku}</div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1 h-12 rounded-2xl border-gray-200 font-black text-gray-600 hover:bg-gray-50"
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 h-12 rounded-2xl bg-rose-600 font-black text-white hover:bg-rose-700 shadow-lg shadow-rose-600/20"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Menghapus...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Hapus
                </span>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MasterProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  // Modal state
  const [editProduct, setEditProduct] = useState<ProductRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleProductSaved = (updated: ProductRecord) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    setEditProduct(null);
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchBackend('getMasterCatalog');
      if (res.status === 'success') {
        setProducts(res.data as ProductRecord[]);
      } else {
        throw new Error(res.message || 'Gagal memuat master data');
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat master data dari database');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadProducts(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/products/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setProducts(prev => prev.filter(p => p.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        alert('Gagal menghapus: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Gagal menghapus produk: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return products;
    return products.filter((product) => {
      const haystack = [product.sku, product.name, product.category, product.ai_label]
        .filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(keyword);
    });
  }, [products, query]);

  const stats = useMemo(() => {
    const withLabel = products.filter((product) => product.ai_label != null).length;
    return { total: products.length, active: withLabel, inactive: Math.max(products.length - withLabel, 0) };
  }, [products]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] -m-6 relative font-sans overflow-x-hidden">
      {/* Banner Background */}
      <div className="absolute top-0 left-0 right-0 h-[380px] bg-white overflow-hidden border-b border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-50/50 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-50/50 blur-[100px] rounded-full -translate-x-1/4 translate-y-1/3" />
      </div>

      <div className="relative z-10 p-6 lg:p-10 space-y-8">
        {/* Modals */}
        <AnimatePresence>
          {editProduct && (
            <ProductEditModal
              product={editProduct}
              onClose={() => setEditProduct(null)}
              onSaved={handleProductSaved}
            />
          )}
          {deleteTarget && (
            <DeleteConfirmModal
              product={deleteTarget}
              onConfirm={handleDelete}
              onCancel={() => setDeleteTarget(null)}
              loading={deleting}
            />
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-6 pt-6">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-indigo-50 border border-indigo-100 shadow-sm">
                <Sparkles className="h-7 w-7 text-indigo-600" />
              </div>
              <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-gray-900">Katalog Sentral</h1>
            </div>
            <p className="text-sm font-medium text-gray-500 ml-[72px] max-w-xl leading-relaxed">
              Seluruh produk ritel Anda. Produk yang dilengkapi AI Label dapat terdeteksi otomatis oleh sistem YOLO Vision kasir.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={loadProducts}
              className="h-14 px-6 rounded-2xl border-gray-200 bg-white font-bold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
            >
              <RefreshCw className="mr-2 h-4 w-4 text-gray-400" />
              Sinkronisasi Ulang
            </Button>
            <Button
              onClick={() => navigate('/add-product')}
              className="h-14 px-6 rounded-2xl bg-indigo-600 font-black text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 hover:scale-105 transition-all duration-300 border-none"
            >
              <Plus className="mr-2 h-5 w-5" />
              Registrasi Produk Baru
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mt-10">
          {[
            { label: 'Total Registrasi', value: stats.total, color: 'indigo', icon: Package, glow: 'bg-indigo-500' },
            { label: 'Tervalidasi AI', value: stats.active, color: 'emerald', icon: BadgeCheck, glow: 'bg-emerald-500' },
            { label: 'Menunggu Validasi', value: stats.inactive, color: 'amber', icon: AlertTriangle, glow: 'bg-amber-500' },
          ].map(({ label, value, color, icon: Icon, glow }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <Card className="rounded-[32px] border-none bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden relative group h-full">
                <div className={cn("absolute -top-20 -right-20 w-48 h-48 rounded-full blur-[60px] opacity-10 transition-all duration-700 group-hover:scale-150 group-hover:opacity-30", glow)} />
                <CardContent className="flex items-center gap-5 p-8 relative z-10">
                  <div className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[24px] bg-${color}-50 text-${color}-600 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6 shadow-sm border border-${color}-100/50`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="text-4xl font-black tracking-tighter text-gray-900 font-mono mb-1 leading-none">{value}</div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{label}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Table Card */}
        <Card className="overflow-hidden rounded-[40px] border-none bg-white shadow-[0_8px_40px_rgba(0,0,0,0.04)] mt-4">
          <CardHeader className="border-b border-gray-100 p-6 sm:p-10 bg-gray-50/30">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="relative flex-1 w-full max-w-2xl">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  placeholder="Cari berdasarkan nama produk, SKU, kategori, atau label AI..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-16 rounded-[28px] border-gray-100 bg-white pl-14 pr-6 text-sm sm:text-base font-bold shadow-[0_8px_30px_rgba(0,0,0,0.04)] focus:ring-4 focus:ring-indigo-500/10 placeholder:text-gray-300 placeholder:font-medium transition-all"
                />
              </div>
            </div>
          </CardHeader>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-6 p-24">
              <div className="relative flex items-center justify-center">
                 <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
                 <Loader2 className="w-12 h-12 text-indigo-600 animate-spin relative z-10" />
              </div>
              <p className="text-sm font-black uppercase tracking-widest text-gray-400">Sinkronisasi Katalog Database...</p>
            </div>
          ) : error ? (
            <div className="p-10">
              <div className="rounded-[32px] border border-rose-100 bg-rose-50 p-8 text-rose-700 text-center max-w-lg mx-auto">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-rose-100">
                   <AlertTriangle className="h-8 w-8 text-rose-500" />
                </div>
                <div className="text-sm font-black uppercase tracking-[0.2em] mb-2">Sinkronisasi Gagal</div>
                <p className="text-sm font-medium leading-relaxed text-rose-600/80 mb-6">{error}</p>
                <Button onClick={loadProducts} className="h-12 px-8 rounded-2xl bg-rose-600 font-bold text-white hover:bg-rose-700 shadow-xl shadow-rose-600/20">
                  Coba Koneksi Ulang
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-gray-100 bg-white text-[10px] font-black uppercase tracking-[0.24em] text-gray-400">
                    <th className="px-10 py-6 text-gray-500">Produk</th>
                    <th className="px-6 py-6 text-gray-500">SKU</th>
                    <th className="px-6 py-6 text-gray-500">Harga Jual</th>
                    <th className="px-6 py-6 text-gray-500">Stok</th>
                    <th className="px-6 py-6 text-gray-500">Status AI</th>
                    <th className="px-10 py-6 text-right text-gray-500">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <AnimatePresence initial={false}>
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <motion.tr
                          key={product.id}
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -14 }}
                          className="group hover:bg-indigo-50/30 transition-colors border-b border-gray-50 last:border-0"
                        >
                          {/* Product cell */}
                          <td className="px-10 py-6">
                            <div className="flex items-center gap-5">
                              {product.image_url ? (
                                <div className="relative h-16 w-16 flex-shrink-0">
                                  <img
                                    src={getImageUrl(product.image_url)}
                                    alt={product.name ?? 'Produk'}
                                    className="h-16 w-16 rounded-[20px] object-cover border border-gray-200 shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:shadow-lg"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('hidden');
                                    }}
                                  />
                                  <div hidden className="absolute inset-0 flex items-center justify-center rounded-[20px] border border-gray-100 bg-gray-50">
                                    <Package className="h-6 w-6 text-indigo-400" />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[20px] border-2 border-dashed border-indigo-100 bg-indigo-50/50 shadow-sm transition-transform duration-500 group-hover:scale-110">
                                  <Package className="h-7 w-7 text-indigo-400" />
                                </div>
                              )}
                              <div className="space-y-1.5">
                                <div className="font-black tracking-tight text-gray-900 group-hover:text-indigo-600 transition-colors text-base">{product.name || '-'}</div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{product.category || 'Uncategorized'}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-6 font-mono text-xs font-bold text-gray-500">{product.sku || '-'}</td>

                          <td className="px-6 py-6">
                             <div className="flex flex-col">
                               <span className="font-black text-gray-900 tracking-tight text-base">{formatCurrency(product.price)}</span>
                               <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Active</span>
                             </div>
                          </td>

                          <td className="px-6 py-6">
                            <div className="flex items-center">
                              {(product.stock ?? 0) < 20 ? (
                                 <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 font-mono text-sm font-bold shadow-sm">
                                   <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                                   {product.stock ?? 0}
                                 </div>
                              ) : (
                                 <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 text-gray-600 border border-gray-200 font-mono text-sm font-bold">
                                   {product.stock ?? 0}
                                 </div>
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-6">
                            <Badge className={`rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${
                              product.ai_label
                                ? 'border border-emerald-200 bg-emerald-50 text-emerald-600'
                                : 'border border-amber-200 bg-amber-50 text-amber-600'
                            }`}>
                              {product.ai_label ? (
                                 <div className="flex items-center gap-1.5">
                                   <BadgeCheck className="w-3.5 h-3.5" />
                                   {product.ai_label}
                                 </div>
                              ) : (
                                 <div className="flex items-center gap-1.5">
                                   <AlertTriangle className="w-3.5 h-3.5" />
                                   Belum Ada
                                 </div>
                              )}
                            </Badge>
                          </td>

                          {/* Actions */}
                          <td className="px-10 py-6">
                            <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditProduct(product)}
                                className="h-10 rounded-xl px-4 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 font-bold text-xs transition-colors"
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteTarget(product)}
                                className="h-10 rounded-xl px-4 text-rose-500 hover:bg-rose-100 hover:text-rose-700 font-bold text-xs transition-colors"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Hapus
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <td colSpan={6} className="px-10 py-24 text-center">
                          <div className="mx-auto max-w-md space-y-4">
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-50 border border-gray-100 shadow-sm text-gray-400">
                              <Search className="h-8 w-8" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-xl font-black text-gray-900 tracking-tight">Belum ada data yang cocok</h3>
                              <p className="text-sm font-medium leading-relaxed text-gray-500">
                                Produk yang Anda cari tidak ditemukan dalam database Master. Coba ubah kata kunci pencarian atau daftarkan produk baru.
                              </p>
                            </div>
                            <Button
                              onClick={() => navigate('/add-product')}
                              className="h-12 mt-4 px-8 rounded-2xl bg-indigo-600 font-bold text-white hover:bg-indigo-700 shadow-xl shadow-indigo-600/20"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Registrasi Produk
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
