import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Plus, Loader2, Upload, Trash2, Camera, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card } from '@/shared/components/ui/card';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { BACKEND_URL } from '@/shared/lib/api';

type AngleKey = 'front' | 'back' | 'left' | 'right';

const ANGLES: { key: AngleKey; label: string; fieldName: string }[] = [
  { key: 'front', label: 'Depan', fieldName: 'imageFront' },
  { key: 'back', label: 'Belakang', fieldName: 'imageBack' },
  { key: 'left', label: 'Kiri', fieldName: 'imageLeft' },
  { key: 'right', label: 'Kanan', fieldName: 'imageRight' },
];

export default function AddProductPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
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

  // Camera states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeCameraAngle, setActiveCameraAngle] = useState<AngleKey | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
    }
  };

  const handleRemoveImage = (angle: AngleKey) => {
    setImageFiles(prev => ({ ...prev, [angle]: null }));
    setImagePreviews(prev => ({ ...prev, [angle]: null }));
    const ref = fileInputRefs[angle];
    if (ref.current) ref.current.value = '';
  };

  const uploadedCount = Object.values(imageFiles).filter(Boolean).length;

  const autoLabel = useMemo(() => {
    if (!formData.name) return '';
    return formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }, [formData.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);

      if (!formData.name || !formData.price) {
        throw new Error('Nama dan Harga wajib diisi');
      }

      if (uploadedCount < 4) {
        throw new Error('Mohon lengkapi ke-4 foto sudut produk (Depan, Belakang, Kiri, Kanan)');
      }

      const uploadFormData = new FormData();
      uploadFormData.append('name', formData.name);
      const rawPrice = formData.price.replace(/\./g, '');
      uploadFormData.append('price', rawPrice);
      uploadFormData.append('ai_label', autoLabel);
      uploadFormData.append('stock', '0'); // Default stock

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
    <>
      {/* Camera Modal */}
      <AnimatePresence>
        {isCameraOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b p-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Ambil Foto {ANGLES.find(a => a.key === activeCameraAngle)?.label}
                </h3>
                <Button type="button" variant="ghost" size="icon" onClick={closeCamera} className="rounded-full">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="relative bg-black aspect-[4/3] flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
              </div>
              <div className="p-6 flex justify-center bg-gray-50">
                <Button 
                  type="button"
                  onClick={takePhoto} 
                  className="h-16 w-16 rounded-full bg-indigo-600 hover:bg-indigo-700 p-0 shadow-[0_0_0_4px_rgba(79,70,229,0.2)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                >
                  <Camera className="h-7 w-7 text-white" />
                </Button>
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen -m-6 bg-[#F8FAFC] p-6 lg:p-10 font-sans"
      >
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/20">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900">Registrasi Produk</h1>
              <p className="text-sm font-medium text-gray-500 mt-1">Masukkan nama, harga, dan 4 foto produk Anda.</p>
            </div>
          </div>
          
          <Button
            onClick={() => navigate('/master-products')}
            variant="outline"
            className="h-10 rounded-xl border-gray-200 bg-white px-4 font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-600 shadow-sm flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </div>
              {error}
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="overflow-hidden rounded-[32px] border-none bg-white shadow-[0_8px_40px_rgba(0,0,0,0.06)] p-8">
            <div className="space-y-2 mb-8">
              <h3 className="text-lg font-black text-gray-900">Informasi Dasar</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Detail Utama</p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nama Produk *</Label>
                <Input
                  placeholder="Misal: Kopi Susu Aren"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="h-14 rounded-2xl bg-gray-50/50 font-bold text-base focus:bg-white focus:ring-2 focus:ring-indigo-100 border-gray-200 shadow-sm transition-all"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Harga (Rp) *</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={formData.price}
                  onChange={e => {
                    const rawValue = e.target.value.replace(/[^0-9]/g, '');
                    const formatted = rawValue ? parseInt(rawValue, 10).toLocaleString('id-ID').replace(/,/g, '.') : '';
                    setFormData(prev => ({ ...prev, price: formatted }));
                  }}
                  className="h-14 rounded-2xl bg-gray-50/50 font-bold text-base focus:bg-white focus:ring-2 focus:ring-indigo-100 border-gray-200 shadow-sm transition-all"
                  required
                />
              </div>
            </div>

            {autoLabel && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex items-center gap-3 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70">AI Label Terbuat Otomatis</p>
                  <p className="text-sm font-bold text-emerald-700 font-mono">{autoLabel}</p>
                </div>
              </motion.div>
            )}
          </Card>

          <Card className="overflow-hidden rounded-[32px] border-none bg-white shadow-[0_8px_40px_rgba(0,0,0,0.06)] p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="space-y-2">
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Camera className="h-5 w-5 text-indigo-600" />
                  Foto 4 Sudut (Wajib)
                </h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Untuk identifikasi AI Yolo-Vision
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-100 px-4 py-2">
                <div className={`h-2.5 w-2.5 rounded-full shadow-sm ${uploadedCount === 4 ? 'bg-emerald-500 shadow-emerald-500/50' : uploadedCount > 0 ? 'bg-amber-500 shadow-amber-500/50' : 'bg-gray-300'}`} />
                <span className="text-xs font-black text-indigo-600">{uploadedCount}/4 Foto Lengkap</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {ANGLES.map(({ key, label }) => (
                <div key={key} className="space-y-3">
                  <div
                    className={`relative aspect-square overflow-hidden rounded-[24px] border-2 transition-all group ${
                      imagePreviews[key]
                        ? 'border-indigo-600 shadow-xl shadow-indigo-600/10'
                        : 'border-dashed border-gray-200 bg-gray-50 hover:bg-indigo-50/50 hover:border-indigo-300 cursor-pointer'
                    }`}
                    onClick={() => {
                      if (!imagePreviews[key]) fileInputRefs[key].current?.click();
                    }}
                  >
                    {imagePreviews[key] ? (
                      <>
                        <img src={imagePreviews[key]!} alt={`${label} preview`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]">
                          <Button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(key);
                            }}
                            size="icon"
                            variant="destructive"
                            className="h-12 w-12 rounded-full shadow-xl"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                        {/* Angle badge */}
                        <div className="absolute top-3 left-3 rounded-lg bg-indigo-600/90 backdrop-blur-md px-3 py-1.5 shadow-sm border border-indigo-400/30">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white">{label}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center text-gray-400 gap-3 p-4 relative">
                        <span className="text-xs font-black uppercase tracking-widest text-center leading-tight">{label}</span>
                        
                        <div className="flex gap-3 mt-4">
                          <Button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); fileInputRefs[key].current?.click(); }}
                            variant="outline"
                            size="icon"
                            className="h-12 w-12 rounded-2xl border-gray-200 bg-white shadow-sm hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200 transition-all hover:scale-105 hover:-rotate-6"
                            title="Upload File"
                          >
                            <Upload className="h-5 w-5" />
                          </Button>
                          
                          <Button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); openCamera(key); }}
                            variant="outline"
                            size="icon"
                            className="h-12 w-12 rounded-2xl border-gray-200 bg-white shadow-sm hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all hover:scale-105 hover:rotate-6"
                            title="Buka Kamera"
                          >
                            <Camera className="h-5 w-5" />
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
            
            <div className="mt-8 rounded-2xl bg-indigo-50/50 border border-indigo-100 p-5 flex gap-4 items-start">
               <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm text-indigo-600 border border-indigo-100">
                 <Package className="w-5 h-5" />
               </div>
               <div>
                  <h4 className="text-sm font-black text-indigo-900 mb-1">Panduan Foto</h4>
                  <p className="text-xs font-semibold text-indigo-700/80 leading-relaxed">
                    Pastikan produk difoto dalam kondisi terang tanpa objek lain di sekitarnya. 
                    Keempat sudut (Depan, Belakang, Kiri, Kanan) wajib diisi agar sistem AI dapat mengenali produk dengan akurat saat checkout.
                  </p>
               </div>
            </div>
          </Card>

          <div className="pt-4 pb-12">
            <Button
              type="submit"
              disabled={isLoading || !formData.name || !formData.price || uploadedCount < 4}
              className="h-16 w-full rounded-2xl bg-indigo-600 text-base font-black text-white shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-60 transition-all"
            >
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin mr-3" />
              ) : (
                <Plus className="h-6 w-6 mr-3" />
              )}
              {isLoading ? 'Menyimpan & Mengunggah 4 Foto...' : 'Simpan Produk Baru'}
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
    </>
  );
}
