import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  FlaskConical,
  ImageUp,
  Loader2,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
  ShieldX,
  Sparkles,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BACKEND_URL } from '@/lib/api';

interface DetectionResult {
  detected: boolean;
  confidence: number;
  label: string | null;
  simulation: boolean;
}

export default function DetectionTestPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch (err: any) {
      setCameraError(err.message || 'Tidak dapat mengakses kamera.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const captured = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setFile(captured);
      setPreview(URL.createObjectURL(blob));
      setResult(null);
      stopCamera();
    }, 'image/jpeg', 0.92);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f?.type.startsWith('image/')) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setResult(null);
    }
  };

  const runDetection = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const form = new FormData();
      form.append('image', file);

      const res = await fetch(`${BACKEND_URL}/api/detect`, {
        method: 'POST',
        body: form,
      });

      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setResult(data as DetectionResult);
    } catch (err: any) {
      setError(err.message || 'Gagal menjalankan deteksi');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setFile(null);
    setResult(null);
    setError(null);
    stopCamera();
  };

  const confidencePct = Math.round((result?.confidence ?? 0) * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen -m-6 bg-[#FAFAFA] p-4 font-sans lg:p-8"
    >
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25">
                <FlaskConical className="h-4 w-4" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900">Detection Lab</h1>
            </div>
            <p className="text-sm font-medium text-gray-500">Uji deteksi produk menggunakan model YOLO v8 secara real-time.</p>
          </div>
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="h-10 rounded-xl border-gray-100 bg-white px-4 text-xs font-bold text-gray-600 shadow-sm hover:bg-gray-50"
          >
            <ArrowLeft className="mr-2 h-3.5 w-3.5" />
            Kembali
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* LEFT: Image Input */}
          <Card className="overflow-hidden rounded-[28px] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.05)]">
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                <Camera className="h-3 w-3" />
                Input Gambar
              </div>
              <h2 className="mt-2 text-lg font-black text-gray-900">Pilih atau Ambil Foto</h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Camera / Preview Viewport */}
              <div className="relative aspect-video overflow-hidden rounded-[20px] bg-gray-900">
                {cameraActive ? (
                  <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                ) : preview ? (
                  <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <div
                    className="flex h-full w-full flex-col items-center justify-center gap-3 text-white/40 border-2 border-dashed border-white/10"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <Upload className="h-10 w-10" />
                    <p className="text-xs font-bold uppercase tracking-widest">Drag & Drop gambar di sini</p>
                  </div>
                )}

                {/* Camera viewfinder overlay */}
                {cameraActive && (
                  <>
                    <div className="pointer-events-none absolute inset-6 border border-white/30 rounded-lg" />
                    <div className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 border-2 border-white/50" />
                  </>
                )}

                {/* Delete button when preview exists */}
                {preview && !cameraActive && (
                  <button
                    onClick={reset}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Camera error */}
              {cameraError && (
                <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 p-3 text-xs font-bold text-rose-600">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {cameraError}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                {cameraActive ? (
                  <>
                    <Button
                      type="button"
                      onClick={capturePhoto}
                      className="flex-1 h-12 rounded-2xl bg-indigo-600 font-bold text-white hover:bg-indigo-700"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Ambil Foto
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={stopCamera}
                      className="h-12 w-12 rounded-2xl border-gray-200"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      onClick={startCamera}
                      className="flex-1 h-12 rounded-2xl bg-indigo-600 font-bold text-white hover:bg-indigo-700"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Kamera
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 h-12 rounded-2xl border-gray-200 font-bold text-gray-700"
                    >
                      <ImageUp className="mr-2 h-4 w-4" />
                      Upload
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </>
                )}
              </div>

              {/* Detect Button */}
              {file && !cameraActive && (
                <Button
                  onClick={runDetection}
                  disabled={loading}
                  className="h-14 w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-600/20 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <ScanSearch className="mr-2 h-5 w-5" />
                  )}
                  {loading ? 'Mendeteksi...' : 'Jalankan Deteksi YOLO'}
                </Button>
              )}
            </div>
          </Card>

          {/* RIGHT: Result Panel */}
          <Card className="overflow-hidden rounded-[28px] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.05)]">
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-violet-600">
                <Sparkles className="h-3 w-3" />
                Hasil Deteksi
              </div>
              <h2 className="mt-2 text-lg font-black text-gray-900">YOLO v8 Output</h2>
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {/* Loading State */}
                {loading && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-16 gap-4"
                  >
                    <div className="relative h-20 w-20">
                      <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
                      <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ScanSearch className="h-7 w-7 text-indigo-600 animate-pulse" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="font-black text-gray-900">Menjalankan Model YOLO...</p>
                      <p className="text-sm text-gray-500 mt-1">Menganalisis gambar produk</p>
                    </div>
                  </motion.div>
                )}

                {/* Error State */}
                {error && !loading && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-2xl border border-rose-100 bg-rose-50 p-5"
                  >
                    <div className="flex items-center gap-3 text-rose-700">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      <p className="font-bold text-sm">{error}</p>
                    </div>
                  </motion.div>
                )}

                {/* Result State */}
                {result && !loading && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-5"
                  >
                    {/* Main Status */}
                    <div className={`rounded-[20px] p-6 text-center ${result.detected ? 'bg-emerald-50 border border-emerald-100' : 'bg-rose-50 border border-rose-100'}`}>
                      <div className="flex items-center justify-center mb-3">
                        {result.detected ? (
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                            <ShieldCheck className="h-8 w-8" />
                          </div>
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/30">
                            <ShieldX className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <h3 className={`text-2xl font-black ${result.detected ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {result.detected ? 'Produk Terdeteksi!' : 'Produk Tidak Terdeteksi'}
                      </h3>
                      <p className={`mt-1 text-sm font-medium ${result.detected ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {result.detected
                          ? 'Objek berhasil ditemukan dalam gambar'
                          : 'Coba foto ulang dengan pencahayaan lebih baik'}
                      </p>
                    </div>

                    {/* Detail Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-gray-50 p-4 space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Label AI</p>
                        <p className="text-lg font-black text-gray-900 capitalize">
                          {result.label ?? '—'}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-gray-50 p-4 space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Confidence</p>
                        <p className={`text-lg font-black ${confidencePct > 70 ? 'text-emerald-600' : confidencePct > 40 ? 'text-orange-500' : 'text-rose-600'}`}>
                          {confidencePct}%
                        </p>
                      </div>
                    </div>

                    {/* Confidence Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <span>Tingkat Keyakinan Model</span>
                        <span>{confidencePct}%</span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${confidencePct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className={`h-full rounded-full ${
                            confidencePct > 70 ? 'bg-emerald-500' : confidencePct > 40 ? 'bg-orange-400' : 'bg-rose-500'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Simulation Notice */}
                    {result.simulation && (
                      <div className="flex items-start gap-2 rounded-2xl border border-orange-100 bg-orange-50 p-3 text-xs text-orange-700">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span><strong>Mode Simulasi:</strong> Library YOLO Python belum diinstal. Instal <code>ultralytics</code> untuk deteksi nyata.</span>
                      </div>
                    )}

                    {/* Try Again */}
                    <Button
                      onClick={() => { setResult(null); setPreview(null); setFile(null); }}
                      variant="outline"
                      className="w-full h-11 rounded-2xl border-gray-200 font-bold text-gray-600 hover:bg-gray-50"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Coba Gambar Lain
                    </Button>
                  </motion.div>
                )}

                {/* Empty State */}
                {!result && !loading && !error && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-16 gap-4 text-center"
                  >
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-100 text-gray-300">
                      <Zap className="h-9 w-9" />
                    </div>
                    <div>
                      <p className="font-black text-gray-900">Siap Mendeteksi</p>
                      <p className="text-sm text-gray-400 mt-1">Upload atau ambil foto produk,<br />lalu tekan "Jalankan Deteksi YOLO"</p>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center w-full">
                      {['Upload Foto', 'Analisis YOLO', 'Lihat Hasil'].map((step, i) => (
                        <div key={step} className="rounded-2xl bg-gray-50 p-3">
                          <div className="text-lg font-black text-indigo-600">{i + 1}</div>
                          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">{step}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </div>

        {/* Info Bar */}
        <div className="rounded-[20px] border border-gray-100 bg-white p-4 flex flex-wrap items-center gap-6 text-xs font-bold text-gray-500 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Endpoint: <code className="text-indigo-600">POST /api/detect</code></span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Model: YOLOv8n (ultralytics)</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-400" />
            <span>Instalasi YOLO: <code>pip install ultralytics</code></span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
