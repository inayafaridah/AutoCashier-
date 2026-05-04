import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, Camera, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddProductForm, ProductFormData } from '@/components/AddProductForm';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { fetchBackend } from '@/lib/api';

export default function AddProductPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: ProductFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Prepare FormData untuk upload dengan backend
      const uploadFormData = new FormData();
      uploadFormData.append('name', formData.name);
      uploadFormData.append('category', formData.category);
      uploadFormData.append('basePrice', formData.basePrice.toString());
      uploadFormData.append('stock', formData.stock.toString());
      uploadFormData.append('description', formData.description);

      // Append images
      if (formData.images.front.file) {
        uploadFormData.append('imageFront', formData.images.front.file);
      }
      if (formData.images.back.file) {
        uploadFormData.append('imageBack', formData.images.back.file);
      }
      if (formData.images.left.file) {
        uploadFormData.append('imageLeft', formData.images.left.file);
      }
      if (formData.images.right.file) {
        uploadFormData.append('imageRight', formData.images.right.file);
      }

      // Send ke backend untuk YOLO validation
      const res = await fetchBackend('createProduct', uploadFormData);

      if (res.status === 'success') {
        toast.success('✅ Produk berhasil ditambahkan dengan validasi YOLO!');
        
        setTimeout(() => {
          navigate('/master-products');
        }, 1500);
      } else {
        throw new Error(res.error || res.message || `Gagal menambah produk`);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Terjadi kesalahan saat menambah produk';
      setError(errorMsg);
      toast.error(`❌ Error: ${errorMsg}`);
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/master-products');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen -m-6 bg-[#FDFDFD] p-4 font-sans lg:p-8"
    >
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Modern Header */}
        <div className="flex items-center justify-between px-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                <PlusIcon className="h-4 w-4" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900">New Product Entry</h1>
            </div>
            <p className="text-sm font-medium text-gray-500">Capture visuals and input catalog details in one flow.</p>
          </div>
          
          <Button
            onClick={handleBack}
            variant="outline"
            className="h-10 rounded-xl border-gray-100 bg-white px-4 text-xs font-bold text-gray-600 shadow-sm transition-all hover:bg-gray-50"
          >
            <ArrowLeft className="mr-2 h-3.5 w-3.5" />
            Back to Catalog
          </Button>
        </div>

        {error && (
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 backdrop-blur-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <XCircleIcon className="h-4 w-4" />
              </div>
              <p className="text-sm font-bold text-rose-700">{error}</p>
            </div>
          </motion.div>
        )}

        {/* The Form Component with Split Layout */}
        <AddProductForm onSubmit={handleSubmit} loading={isLoading} />

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-950/40 via-purple-950/40 to-black/40 backdrop-blur-xl"
          >
            {/* Animated background orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.2, 0.3] }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"
              />
              <motion.div
                animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.3, 0.2] }}
                transition={{ repeat: Infinity, duration: 5, delay: 0.5 }}
                className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"
              />
            </div>

            {/* Main card */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              className="relative text-center space-y-6 p-8 bg-gradient-to-br from-white/95 to-white/90 rounded-3xl shadow-2xl border border-white/60 backdrop-blur-md max-w-md"
            >
              {/* Animated loader circle */}
              <div className="relative mx-auto h-24 w-24">
                {/* Outer rotating ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 border-r-indigo-400"
                />

                {/* Middle pulsing ring */}
                <motion.div
                  animate={{ scale: [0.8, 1.1, 0.8] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-2 rounded-full border-2 border-purple-500/40"
                />

                {/* Inner icon */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Sparkles className="h-10 w-10 text-indigo-600" />
                </motion.div>
              </div>

              {/* Text content */}
              <div className="space-y-2">
                <h3 className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Processing Product
                </h3>
                <p className="text-sm font-medium text-gray-600">
                  Optimizing images and validating with YOLO v8...
                </p>
              </div>

              {/* Progress steps */}
              <div className="space-y-2 pt-2">
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="flex items-center gap-2 text-xs text-gray-600"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="h-2 w-2 rounded-full bg-indigo-500"
                  />
                  <span>Analyzing images</span>
                </motion.div>

                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.3 }}
                  className="flex items-center gap-2 text-xs text-gray-600"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.3 }}
                    className="h-2 w-2 rounded-full bg-purple-500"
                  />
                  <span>Running AI validation</span>
                </motion.div>

                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.6 }}
                  className="flex items-center gap-2 text-xs text-gray-600"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.6 }}
                    className="h-2 w-2 rounded-full bg-pink-500"
                  />
                  <span>Saving to catalog</span>
                </motion.div>
              </div>

              {/* Subtle progress bar */}
              <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden mt-4">
                <motion.div
                  animate={{ x: ['0%', '100%'] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                  className="h-full w-1/3 bg-gradient-to-r from-indigo-500 via-purple-500 to-transparent rounded-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function PlusIcon(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function XCircleIcon(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
