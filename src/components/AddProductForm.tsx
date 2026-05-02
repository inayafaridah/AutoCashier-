import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  Camera,
  CheckCircle2,
  ImageUp,
  Package,
  RefreshCw,
  ScanSearch,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  Wand2,
  X,
  FolderOpen,
} from 'lucide-react';
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
import { motion, AnimatePresence } from 'motion/react';

interface ImageData {
  file: File | null;
  preview: string;
  validated: boolean;
  validationError: string | null;
}

export interface ProductFormData {
  name: string;
  category: string;
  basePrice: number;
  stock: number;
  description: string;
  images: {
    left: ImageData;
    right: ImageData;
    front: ImageData;
    back: ImageData;
  };
}

interface AddProductFormProps {
  onSubmit: (data: ProductFormData) => void;
  loading?: boolean;
}

const CATEGORIES = ['Coffee', 'Pastry', 'Cake', 'Beverage', 'Sandwich', 'Other'];

const emptyImage = (): ImageData => ({
  file: null,
  preview: '',
  validated: false,
  validationError: null,
});

export function AddProductForm({ onSubmit, loading = false }: AddProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category: '',
    basePrice: 0,
    description: '',
    images: {
      left: emptyImage(),
      right: emptyImage(),
      front: emptyImage(),
      back: emptyImage(),
    },
  });
  
  const [activeAngle, setActiveAngle] = useState<'left' | 'right' | 'front' | 'back'>('front');
  const [inputMode, setInputMode] = useState<'camera' | 'upload'>('camera');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (inputMode === 'camera' && cameraActive) {
      startCamera();
    } else {
      stopCamera();
      setCameraActive(false);
    }
    return () => stopCamera();
  }, [cameraActive, inputMode]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setCameraError(err.message || 'Could not access camera');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  };

  const handleImageSelect = (angle: 'left' | 'right' | 'front' | 'back', file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        images: {
          ...prev.images,
          [angle]: {
            file,
            preview: reader.result as string,
            validated: false,
            validationError: null
          }
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `${activeAngle}.jpg`, { type: 'image/jpeg' });
          handleImageSelect(activeAngle, file);
          setCameraActive(false);
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const handleRemoveImage = (angle: 'left' | 'right' | 'front' | 'back') => {
    setFormData(prev => ({
      ...prev,
      images: { ...prev.images, [angle]: emptyImage() }
    }));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleImageSelect(activeAngle, file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageSelect(activeAngle, file);
    // reset so same file can be re-selected
    e.target.value = '';
  };

  const allImagesReady = formData.images.left.file && formData.images.right.file && formData.images.front.file && formData.images.back.file;
  const isFormValid = formData.name && formData.category && formData.basePrice > 0 && allImagesReady;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      {/* LEFT COLUMN: Visual Station */}
      <div className="space-y-6">
        <Card className="overflow-hidden rounded-[32px] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-600">
                  <Camera className="h-3 w-3" />
                  Visual Station
                </div>
                <h3 className="text-xl font-black text-gray-900">Product Photography</h3>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Mode toggle */}
                <div className="flex rounded-2xl bg-gray-100 p-1">
                  <button
                    type="button"
                    onClick={() => setInputMode('camera')}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all ${
                      inputMode === 'camera'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <Camera className="h-3 w-3" />
                    Kamera
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('upload')}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all ${
                      inputMode === 'upload'
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <FolderOpen className="h-3 w-3" />
                    Upload
                  </button>
                </div>

                {/* Angle selectors */}
                <div className="flex gap-2">
                  {(['front', 'back', 'left', 'right'] as const).map((angle) => (
                    <button
                      key={angle}
                      type="button"
                      onClick={() => setActiveAngle(angle)}
                      className={`relative flex h-14 w-14 items-center justify-center rounded-2xl border-2 transition-all ${
                        activeAngle === angle 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                          : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase">{angle}</span>
                      {formData.images[angle].preview && (
                        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                          <CheckCircle2 className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInput}
            />

            <div className="group relative aspect-[4/3] overflow-hidden rounded-[28px] bg-gray-900 shadow-inner">
              {/* ── CAMERA MODE ── */}
              {inputMode === 'camera' && (
                <>
                  {cameraActive ? (
                    <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                  ) : formData.images[activeAngle].preview ? (
                    <img src={formData.images[activeAngle].preview} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center space-y-4 text-white/40">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-white/20">
                        <Camera className="h-8 w-8" />
                      </div>
                      <p className="text-sm font-bold uppercase tracking-widest">Select {activeAngle} angle to capture</p>
                      {cameraError && (
                        <p className="px-6 text-center text-xs font-medium text-rose-400">{cameraError}</p>
                      )}
                    </div>
                  )}

                  {/* Viewfinder Overlays */}
                  <div className="pointer-events-none absolute inset-0 border-[24px] border-black/5" />
                  <div className="absolute inset-8 border border-white/20" />

                  {/* Camera Controls Overlay */}
                  <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-4">
                    {cameraActive ? (
                      <>
                        <Button type="button" onClick={() => setCameraActive(false)} variant="outline"
                          className="h-14 w-14 rounded-full border-white/20 bg-black/40 text-white backdrop-blur-md hover:bg-black/60">
                          <X className="h-6 w-6" />
                        </Button>
                        <button type="button" onClick={capturePhoto}
                          className="group flex h-20 w-20 items-center justify-center rounded-full bg-white p-1 shadow-2xl transition-transform active:scale-90">
                          <div className="h-full w-full rounded-full border-4 border-gray-100 bg-white group-hover:bg-gray-50" />
                        </button>
                        <div className="h-14 w-14" />
                      </>
                    ) : (
                      <Button type="button" onClick={() => setCameraActive(true)}
                        className="h-16 rounded-full bg-indigo-600 px-8 font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-600/30 hover:bg-indigo-700">
                        <Camera className="mr-3 h-5 w-5" />
                        Open Camera
                      </Button>
                    )}
                  </div>

                  {/* Remove image button */}
                  {!cameraActive && formData.images[activeAngle].preview && (
                    <div className="absolute right-6 top-6 flex flex-col gap-2">
                      <Button type="button" onClick={() => handleRemoveImage(activeAngle)} size="icon"
                        className="h-12 w-12 rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-500/20 hover:bg-rose-600">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* ── UPLOAD MODE ── */}
              {inputMode === 'upload' && (
                <>
                  {formData.images[activeAngle].preview ? (
                    <>
                      <img src={formData.images[activeAngle].preview} alt="Preview" className="h-full w-full object-cover" />
                      <div className="absolute right-6 top-6 flex gap-2">
                        <Button type="button" onClick={() => fileInputRef.current?.click()} size="icon"
                          className="h-12 w-12 rounded-2xl bg-indigo-500 text-white shadow-lg hover:bg-indigo-600">
                          <Upload className="h-5 w-5" />
                        </Button>
                        <Button type="button" onClick={() => handleRemoveImage(activeAngle)} size="icon"
                          className="h-12 w-12 rounded-2xl bg-rose-500 text-white shadow-lg hover:bg-rose-600">
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex h-full w-full cursor-pointer flex-col items-center justify-center gap-5 transition-colors ${
                        isDragging ? 'bg-indigo-900/60' : 'bg-gray-900 hover:bg-gray-800'
                      }`}
                    >
                      <div className={`flex h-24 w-24 items-center justify-center rounded-3xl border-2 border-dashed transition-colors ${
                        isDragging ? 'border-indigo-400 bg-indigo-600/20' : 'border-white/20'
                      }`}>
                        <FolderOpen className={`h-10 w-10 transition-colors ${
                          isDragging ? 'text-indigo-400' : 'text-white/40'
                        }`} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-black uppercase tracking-widest text-white/70">
                          {isDragging ? 'Lepaskan untuk upload' : `Upload foto ${activeAngle}`}
                        </p>
                        <p className="mt-1 text-xs font-medium text-white/30">
                          Klik atau drag & drop · JPG, PNG, WebP · Max 5MB
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Captured Strip */}
            <div className="mt-6 grid grid-cols-4 gap-4">
              {(['front', 'back', 'left', 'right'] as const).map((angle) => (
                <div 
                  key={angle}
                  className={`group relative aspect-video overflow-hidden rounded-2xl border-2 transition-all cursor-pointer ${
                    activeAngle === angle ? 'border-indigo-600 ring-4 ring-indigo-50' : 'border-gray-100 hover:border-gray-200'
                  }`}
                  onClick={() => setActiveAngle(angle)}
                >
                  {formData.images[angle].preview ? (
                    <img src={formData.images[angle].preview} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-50 text-gray-300">
                      <Camera className="h-5 w-5" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-black/40 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-white backdrop-blur-sm">
                    {angle} View
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Validation Status */}
        <div className="rounded-3xl border border-indigo-50 bg-indigo-50/30 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                <ScanSearch className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">AI Validation Status</h4>
                <p className="text-xs font-medium text-gray-500">Ready for YOLO v8 visual check</p>
              </div>
            </div>
            <div className="flex gap-2">
              {[0, 1, 2, 3].map(i => (
                <div 
                  key={i} 
                  className={`h-2.5 w-6 rounded-full transition-all ${
                    Object.values(formData.images).filter(img => img.file).length > i 
                      ? 'bg-emerald-500' 
                      : 'bg-gray-200'
                  }`} 
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Product Details */}
      <div className="space-y-6">
        <Card className="rounded-[32px] border-none bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="mb-8 space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-gray-500">
              <Package className="h-3 w-3" />
              Catalog Data
            </div>
            <h3 className="text-2xl font-black text-gray-900">Product Details</h3>
          </div>

          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Product Name</Label>
              <div className="relative">
                <Input
                  id="name"
                  placeholder="e.g. Signature Latte"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 px-4 font-bold shadow-sm focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Wand2 className="h-4 w-4 text-indigo-400 opacity-0 group-hover:opacity-100" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                >
                  <SelectTrigger className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 px-4 font-bold shadow-sm focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat} className="font-bold">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Base Price (IDR)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0"
                  value={formData.basePrice || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, basePrice: Number(e.target.value) }))}
                  className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 px-4 font-bold shadow-sm focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all"
                />
              </div>
            </div>



            <div className="space-y-2">
              <Label htmlFor="desc" className="text-[10px] font-black uppercase tracking-widest text-gray-400">Description</Label>
              <textarea
                id="desc"
                rows={4}
                placeholder="Brief description for internal records..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-2xl border-gray-100 bg-gray-50/50 p-4 font-medium shadow-sm focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all outline-none resize-none"
              />
            </div>

            <div className="pt-4">
              <Button
                type="button"
                disabled={!isFormValid || loading}
                onClick={() => onSubmit(formData)}
                className="h-16 w-full rounded-3xl bg-indigo-600 text-sm font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
              >
                {loading ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <BadgeCheck className="mr-3 h-5 w-5" />
                    Submit Product
                  </>
                )}
              </Button>
              <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                All fields and 3 photos are mandatory
              </p>
            </div>
          </form>
        </Card>

        {/* Requirements Card */}
        <div className="rounded-[32px] border border-orange-100 bg-orange-50/30 p-6">
          <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-orange-600">
            <AlertCircle className="h-3 w-3" />
            System Requirements
          </h4>
          <ul className="mt-3 space-y-2 text-xs font-bold leading-relaxed text-orange-800/70">
            <li>• Ensure product is centered in the viewfinder.</li>
            <li>• Use neutral lighting for best YOLO accuracy.</li>
            <li>• Captured images should be under 5MB each.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
