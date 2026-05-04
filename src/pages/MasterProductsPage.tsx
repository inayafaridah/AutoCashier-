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
      const res = await fetchBackend('updateProduct', {
        id: product.id,
        name: form.name.trim(),
        category: form.category.trim() || null,
        price: Number(form.price),
        stock: Number(form.stock),
        ai_label: form.ai_label.trim() || null,
      });

      if (res.status !== 'success') throw new Error(res.error || res.message || 'Gagal menyimpan');
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
              src={`${BACKEND_URL}${product.image_url}`}
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
                src={`${BACKEND_URL}${product.image_url}`}
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
      const res = await fetchBackend('getProducts');
      if (res.status === 'success') {
        setProducts(res.data as ProductRecord[]);
      } else {
        throw new Error(res.message || 'Gagal memuat produk');
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
      const res = await fetchBackend('deleteProduct', { id: deleteTarget.id });
      if (res.status === 'success') {
        setProducts(prev => prev.filter(p => p.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        alert('Gagal menghapus: ' + (res.error || res.message || 'Unknown error'));
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(79,70,229,0.08),_transparent_30%),linear-gradient(180deg,_#F8F9FA_0%,_#FFFFFF_100%)] -m-6 p-6 lg:p-10 space-y-8 font-sans">

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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-gray-900">Master Products</h1>
          </div>
          <p className="text-sm font-medium text-gray-500 ml-[52px]">
            Katalog produk tervalidasi YOLO AI — {stats.total} produk terdaftar
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={loadProducts}
            className="h-12 rounded-2xl border-gray-200 bg-white font-bold text-gray-600 hover:bg-gray-50 shadow-sm"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={() => navigate('/add-product')}
            className="h-12 rounded-2xl bg-indigo-600 font-bold text-white hover:bg-indigo-700 shadow-xl shadow-indigo-600/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Produk
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Produk', value: stats.total, color: 'indigo' },
          { label: 'Tervalidasi AI', value: stats.active, color: 'emerald' },
          { label: 'Belum Tervalidasi', value: stats.inactive, color: 'orange' },
        ].map(({ label, value, color }) => (
          <Card key={label} className="rounded-[28px] border-none bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-${color}-50`}>
                <Tag className={`h-5 w-5 text-${color}-600`} />
              </div>
              <div>
                <div className={`text-2xl font-black text-${color}-600`}>{value}</div>
                <div className="text-xs font-black uppercase tracking-widest text-gray-400">{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Card */}
      <Card className="overflow-hidden rounded-[32px] border-none bg-white shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
        <CardHeader className="border-b border-gray-100 px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari nama, SKU, kategori..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-12 rounded-2xl border-gray-200 bg-gray-50 pl-11 text-sm font-medium focus:border-indigo-300 focus:ring-indigo-200"
              />
            </div>
          </div>
        </CardHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 p-16">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
            <p className="text-sm font-semibold text-gray-500">Memuat data produk dari database...</p>
          </div>
        ) : error ? (
          <div className="p-8">
            <div className="rounded-[28px] border border-rose-100 bg-rose-50 p-6 text-rose-700">
              <div className="text-sm font-black uppercase tracking-[0.2em]">Gagal memuat data</div>
              <p className="mt-2 text-sm font-medium leading-6">{error}</p>
              <Button onClick={loadProducts} className="mt-4 rounded-2xl bg-rose-600 font-bold text-white hover:bg-rose-700">
                Coba Lagi
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-black uppercase tracking-[0.24em] text-gray-400">
                  <th className="px-8 py-5">Produk</th>
                  <th className="px-4 py-5">SKU</th>
                  <th className="px-4 py-5">Harga Jual</th>
                  <th className="px-4 py-5">Status AI</th>
                  <th className="px-4 py-5">Dibuat</th>
                  <th className="px-8 py-5 text-right">Aksi</th>
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
                        className="group hover:bg-gray-50/80"
                      >
                        {/* Product cell */}
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            {product.image_url ? (
                              <div className="relative h-14 w-14 flex-shrink-0">
                                <img
                                  src={`${BACKEND_URL}${product.image_url}`}
                                  alt={product.name ?? 'Produk'}
                                  className="h-14 w-14 rounded-2xl object-cover border border-gray-100 shadow-sm"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('hidden');
                                  }}
                                />
                                <div hidden className="absolute inset-0 flex items-center justify-center rounded-2xl border border-gray-100 bg-gray-50">
                                  <Package className="h-5 w-5 text-indigo-400" />
                                </div>
                              </div>
                            ) : (
                              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 shadow-sm">
                                <Package className="h-5 w-5 text-indigo-400" />
                              </div>
                            )}
                            <div className="space-y-1">
                              <div className="font-black tracking-tight text-gray-900">{product.name || '-'}</div>
                              <div className="text-xs font-medium text-gray-400">{product.category || 'No category'}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-5 font-mono text-xs font-semibold text-gray-500">{product.sku || '-'}</td>

                        <td className="px-4 py-5 font-bold text-gray-900">{formatCurrency(product.price)}</td>

                        <td className="px-4 py-5">
                          <Badge className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em] ${
                            product.ai_label
                              ? 'border border-emerald-100 bg-emerald-50 text-emerald-600'
                              : 'border border-orange-100 bg-orange-50 text-orange-600'
                          }`}>
                            {product.ai_label ?? 'Belum Tervalidasi'}
                          </Badge>
                        </td>

                        <td className="px-4 py-5 text-sm font-medium text-gray-500">
                          {product.created_at ? new Date(product.created_at).toLocaleDateString('id-ID') : '-'}
                        </td>

                        {/* Actions */}
                        <td className="px-8 py-5">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditProduct(product)}
                              className="h-9 rounded-xl px-3 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 font-bold text-xs"
                            >
                              <Pencil className="mr-1.5 h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(product)}
                              className="h-9 rounded-xl px-3 text-rose-500 hover:bg-rose-50 hover:text-rose-700 font-bold text-xs"
                            >
                              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                              Hapus
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <td colSpan={6} className="px-8 py-16 text-center">
                        <div className="mx-auto max-w-md space-y-3">
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-gray-100 text-gray-400">
                            <Package className="h-6 w-6" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-lg font-black text-gray-900">Belum ada data yang cocok</h3>
                            <p className="text-sm font-medium leading-6 text-gray-500">
                              Coba ubah kata kunci pencarian, atau tambahkan produk baru.
                            </p>
                          </div>
                          <Button
                            onClick={() => navigate('/add-product')}
                            className="rounded-2xl bg-indigo-600 font-bold text-white hover:bg-indigo-700"
                          >
                            Tambah Produk
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
  );
}
