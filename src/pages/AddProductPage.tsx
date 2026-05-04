import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, Camera, Loader2, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddProductForm, ProductFormData } from '@/components/AddProductForm';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { BACKEND_URL } from '@/lib/api';

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
      const response = await fetch(`${BACKEND_URL}/api/products`, {
        method: 'POST',
        body: uploadFormData,
      });

      let result;
      try {
        result = await response.json();
      } catch (e) {
        throw new Error(`Server returned status ${response.status} but no valid JSON.`);
      }

      if (response.ok && result.status === 'success') {
        toast.success('✅ Produk berhasil ditambahkan dengan validasi YOLO!');
        
        setTimeout(() => {
          navigate('/master-products');
        }, 1500);
      } else {
        throw new Error(result.error || result.message || `Gagal menambah produk (Status ${response.status})`);
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
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-2xl transition-all duration-700">
            {/* Ambient Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] animate-pulse" />
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse delay-1000" />
            </div>

            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative z-10 flex flex-col items-center max-w-md w-full px-8 text-center"
            >
              {/* Animated Icon Scanner */}
              <div className="relative mb-12">
                <div className="absolute inset-0 bg-indigo-500/30 rounded-[40px] blur-2xl animate-pulse" />
                <div className="relative w-32 h-32 bg-white rounded-[40px] shadow-2xl flex items-center justify-center overflow-hidden border border-white/50">
                  {/* Scanning Line Animation */}
                  <motion.div 
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent z-10 shadow-[0_0_15px_rgba(99,102,241,0.8)]"
                  />
                  <Sparkles className="h-12 w-12 text-indigo-600 relative z-0" />
                </div>
                
                {/* Orbital Rings */}
                <div className="absolute -inset-4 border border-indigo-500/20 rounded-[48px] animate-[spin_10s_linear_infinite]" />
                <div className="absolute -inset-8 border border-purple-500/10 rounded-[56px] animate-[spin_15s_linear_infinite_reverse]" />
              </div>

              {/* Progress Text */}
              <div className="space-y-4 mb-10">
                <motion.h3 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-3xl font-black text-white tracking-tight"
                >
                  Neural Processing
                </motion.h3>
                <div className="flex flex-col gap-2">
                  <p className="text-indigo-100/60 font-medium tracking-wide text-sm uppercase">YOLO v8 Vision Core Active</p>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 15, ease: "linear" }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                    />
                  </div>
                </div>
              </div>

              {/* Step Indicators */}
              <div className="w-full space-y-3 bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
                {[
                  { label: "Optimizing Perspectives", status: "complete" },
                  { label: "YOLO Object Detection", status: "active" },
                  { label: "Synthesizing AI Labels", status: "pending" },
                  { label: "Initializing Branch Sync", status: "pending" }
                ].map((step, idx) => (
                  <div key={idx} className="flex items-center gap-4 text-left">
                    {step.status === "complete" ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    ) : step.status === "active" ? (
                      <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-white/20" />
                    )}
                    <span className={`text-xs font-bold uppercase tracking-widest ${
                      step.status === "active" ? "text-white" : step.status === "complete" ? "text-emerald-400" : "text-white/30"
                    }`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
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
