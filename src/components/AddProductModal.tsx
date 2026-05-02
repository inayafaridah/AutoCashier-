import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AddProductForm, ProductFormData } from './AddProductForm';
import { Loader2 } from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProductFormData) => Promise<void>;
}

export function AddProductModal({
  isOpen,
  onOpenChange,
  onSubmit,
}: AddProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (formData: ProductFormData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await onSubmit(formData);
      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Gagal menambah produk');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Produk Baru</DialogTitle>
          <DialogDescription>
            Masukkan informasi produk dan upload foto dari 3 sudut untuk validasi YOLO v8
          </DialogDescription>
        </DialogHeader>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 text-green-700">
            <div className="text-2xl">✓</div>
            <div>
              <p className="font-medium">Produk berhasil ditambahkan!</p>
              <p className="text-sm">Foto sedang divalidasi dengan YOLO v8...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 text-red-700">
            <div className="text-xl mt-0.5">⚠️</div>
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center backdrop-blur-sm z-50">
            <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="font-medium text-gray-900">Memproses foto dengan YOLO v8...</p>
              <p className="text-sm text-gray-500">Ini mungkin memakan waktu beberapa detik</p>
            </div>
          </div>
        )}

        <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
          <AddProductForm
            onSubmit={handleSubmit}
            loading={loading}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
