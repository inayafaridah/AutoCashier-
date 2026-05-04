import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  BadgeCheck,
  Camera,
  CameraOff,
  FlaskConical,
  Loader2,
  Package,
  ScanSearch,
  ShieldCheck,
  ShieldX,
  Sparkles,
  Tag,
  Zap,
  Pause,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BACKEND_URL } from '@/lib/api';

interface DetectionResult {
  detected: boolean;
  confidence: number;
  label: string | null;
  simulation: boolean;
  all_detections?: { class: string; confidence: number }[];
}

interface ProductSummary {
  id: string;
  name?: string | null;
  ai_label?: string | null;
  category?: string | null;
  image_url?: string | null;
  sku?: string | null;
  price?: number | null;
  stock?: number | null;
}

const SCAN_INTERVAL_MS = 1500;
const DETECT_BOX_RATIO = 0.72; // fraction of video HEIGHT for the square scan box
const PRODUCT_CACHE_TTL_MS = 60_000;

const normalizeLabel = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

export default function LiveDetectionPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasOverlayRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectingRef = useRef(false);
  const productsCacheRef = useRef<ProductSummary[] | null>(null);
  const productsFetchedAtRef = useRef(0);
  const productsFetchPromiseRef = useRef<Promise<ProductSummary[] | null> | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [matchedProduct, setMatchedProduct] = useState<ProductSummary | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [fps, setFps] = useState<number | null>(null);
  const lastScanRef = useRef<number>(0);

  // ------ Camera ------
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
    } catch (err: any) {
      setCameraError(err.message || 'Tidak dapat mengakses kamera.');
    }
  }, []);

  // ------ Fetch matching product from backend ------
  const ensureProductsCache = useCallback(async () => {
    const now = Date.now();
    if (productsCacheRef.current && now - productsFetchedAtRef.current < PRODUCT_CACHE_TTL_MS) {
      return productsCacheRef.current;
    }

    if (productsFetchPromiseRef.current) {
      return productsFetchPromiseRef.current;
    }

    productsFetchPromiseRef.current = (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/products`);
        const data = await res.json();
        if (res.ok && data.status === 'success' && Array.isArray(data.data)) {
          productsCacheRef.current = data.data;
          productsFetchedAtRef.current = Date.now();
          return data.data;
        }
      } catch (_) {}
      return productsCacheRef.current;
    })();

    const result = await productsFetchPromiseRef.current;
    productsFetchPromiseRef.current = null;
    return result;
  }, []);

  const fetchMatchingProduct = useCallback(async (label: string) => {
    const normalizedLabel = normalizeLabel(label);
    if (!normalizedLabel) {
      setMatchedProduct(null);
      return;
    }

    try {
      const products = await ensureProductsCache();
      if (!Array.isArray(products)) {
        setMatchedProduct(null);
        return;
      }

      const found = products.find((p) => {
        const aiLabel = p.ai_label ? normalizeLabel(p.ai_label) : '';
        const name = p.name ? normalizeLabel(p.name) : '';
        return (aiLabel && aiLabel === normalizedLabel) || (name && name.includes(normalizedLabel));
      });
      setMatchedProduct(found ?? null);
    } catch (_) {}
  }, [ensureProductsCache]);

  // ------ Crop frame to detection box, then send to YOLO ------
  const runDetection = useCallback(async () => {
    if (!videoRef.current || !cameraReady || detectingRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0) return;

    detectingRef.current = true;
    setDetecting(true);
    const t0 = performance.now();

    try {
      // Calculate the square crop box centered in the video frame
      // Box is DETECT_BOX_RATIO of video HEIGHT (to match the UI which is height-based)
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const boxSize = Math.floor(vh * DETECT_BOX_RATIO);
      const bx = Math.floor((vw - boxSize) / 2);
      const by = Math.floor((vh - boxSize) / 2);

      const canvas = captureCanvasRef.current ?? document.createElement('canvas');
      captureCanvasRef.current = canvas;
      canvas.width = boxSize;
      canvas.height = boxSize;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, bx, by, boxSize, boxSize, 0, 0, boxSize, boxSize);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.82);
      });

      if (!blob) return;

      const form = new FormData();
      form.append('image', blob, 'frame.jpg');
      const res = await fetch(`${BACKEND_URL}/api/detect`, { method: 'POST', body: form });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        const det = data as DetectionResult;
        setScanCount(c => c + 1);
        setResult(det);

        // If detected, try to match with DB
        if (det.detected && det.label) {
          fetchMatchingProduct(det.label);
        } else {
          setMatchedProduct(null);
        }

        const elapsed = performance.now() - t0;
        setFps(Math.round(1000 / elapsed));
        lastScanRef.current = Date.now();
      }
    } catch (_) {
    } finally {
      detectingRef.current = false;
      setDetecting(false);
    }
  }, [cameraReady, fetchMatchingProduct]);

  // ------ Auto-scan interval (continuous) ------
  useEffect(() => {
    if (scanning && cameraReady) {
      intervalRef.current = setInterval(runDetection, SCAN_INTERVAL_MS);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [scanning, cameraReady, runDetection]);

  useEffect(() => {
    ensureProductsCache();
  }, [ensureProductsCache]);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const confidencePct = Math.round((result?.confidence ?? 0) * 100);
  const isDetected = result?.detected === true;

  return (
    <div className="min-h-screen -m-6 bg-[#0F172A] p-4 font-sans lg:p-6">
      <div className="mx-auto max-w-7xl space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
                <FlaskConical className="h-4 w-4" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white">Live Detection</h1>
              {/* Live indicator */}
              <div className="flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-500/30 px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-red-400">LIVE</span>
              </div>
            </div>
            <p className="text-xs font-medium text-white/40 pl-12">
              Arahkan produk ke dalam kotak — deteksi YOLO berjalan terus secara otomatis
            </p>
          </div>

          {/* Stats */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-2 text-center">
              <div className="text-xs font-black text-white/40 uppercase tracking-widest">Scan</div>
              <div className="text-lg font-black text-white">{scanCount}</div>
            </div>
            {fps !== null && (
              <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-2 text-center">
                <div className="text-xs font-black text-white/40 uppercase tracking-widest">~FPS</div>
                <div className="text-lg font-black text-indigo-400">{fps}</div>
              </div>
            )}
            <Button
              onClick={() => setScanning(s => !s)}
              className={`h-11 rounded-2xl px-5 font-black text-xs uppercase tracking-widest transition-all ${
                scanning
                  ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {scanning ? <><Pause className="mr-2 h-4 w-4" />Pause</> : <><Play className="mr-2 h-4 w-4" />Resume</>}
            </Button>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid gap-5 lg:grid-cols-[1fr_380px]">

          {/* LEFT: Camera Viewport */}
          <div className="relative overflow-hidden rounded-[28px] bg-black shadow-[0_0_60px_rgba(99,102,241,0.15)]"
            ref={containerRef}
            style={{ aspectRatio: '16/9' }}
          >
            {cameraError ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-white/40">
                <CameraOff className="h-16 w-16" />
                <p className="text-sm font-bold">{cameraError}</p>
                <Button onClick={startCamera} className="rounded-2xl bg-indigo-600 text-white text-xs font-bold">
                  Coba Lagi
                </Button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />


                {/* Detection Box Overlay */}
                {cameraReady && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    {/* The detection box — box-shadow creates rectangular dark mask outside */}
                    <div
                      className="relative rounded-2xl"
                      style={{
                        height: `${DETECT_BOX_RATIO * 100}%`,
                        aspectRatio: '1 / 1',
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.50)',
                      }}
                    >
                      {/* Animated border */}
                      <div className={`absolute inset-0 rounded-2xl border-2 transition-colors duration-500 ${
                        detecting
                          ? 'border-indigo-400'
                          : isDetected
                          ? 'border-emerald-400'
                          : 'border-white/40'
                      }`} />

                      {/* Corner accents */}
                      {[
                        'top-0 left-0 border-l-[3px] border-t-[3px] rounded-tl-2xl',
                        'top-0 right-0 border-r-[3px] border-t-[3px] rounded-tr-2xl',
                        'bottom-0 left-0 border-l-[3px] border-b-[3px] rounded-bl-2xl',
                        'bottom-0 right-0 border-r-[3px] border-b-[3px] rounded-br-2xl',
                      ].map((cls, i) => (
                        <div key={i} className={`absolute h-8 w-8 transition-colors duration-500 ${cls} ${
                          isDetected ? 'border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]' :
                          detecting ? 'border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.6)]' :
                          'border-white/70'
                        }`} />
                      ))}

                      {/* Scanning line */}
                      {scanning && !isDetected && (
                        <motion.div
                          animate={{ y: ['5%', '90%', '5%'] }}
                          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                          className="absolute left-4 right-4 h-[2px] bg-indigo-400/70"
                        />
                      )}

                      {/* Detected glow effect */}
                      {isDetected && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0.2, 0.5, 0.2] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="absolute inset-0 rounded-2xl bg-emerald-400/10"
                        />
                      )}

                      {/* Label tag inside box bottom */}
                      <AnimatePresence>
                        {result && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className={`absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-black backdrop-blur-md whitespace-nowrap ${
                              isDetected
                                ? 'bg-emerald-500/80 text-white'
                                : 'bg-black/60 text-white/70'
                            }`}
                          >
                            {isDetected ? (
                              <><ShieldCheck className="h-3.5 w-3.5" />{result.label ?? 'detected'} · {confidencePct}%</>
                            ) : (
                              <><ScanSearch className="h-3.5 w-3.5 animate-pulse" />Mendeteksi...</>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {/* Top-left: scan status */}
                <div className="absolute left-4 top-4 flex items-center gap-2">
                  {detecting ? (
                    <div className="flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-indigo-300">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Scanning #{scanCount}
                    </div>
                  ) : scanning ? (
                    <div className="flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-white/60">
                      <Zap className="h-3 w-3 text-indigo-400" />
                      Auto Scan
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-white/40">
                      <Pause className="h-3 w-3" />
                      Paused
                    </div>
                  )}
                </div>

                {/* Mobile controls bottom */}
                <div className="absolute bottom-4 right-4 lg:hidden">
                  <Button
                    onClick={() => setScanning(s => !s)}
                    size="sm"
                    className="rounded-2xl bg-black/50 backdrop-blur-md border border-white/20 text-white text-xs font-bold"
                  >
                    {scanning ? 'Pause' : 'Resume'}
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* RIGHT: Result Panel */}
          <div className="space-y-4">

            {/* Status card — always visible */}
            <Card className="overflow-hidden rounded-[28px] border-none bg-white/5 backdrop-blur-md border border-white/10">
              <AnimatePresence mode="wait">
                {!result ? (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center gap-4 p-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/5 text-white/20">
                      <ScanSearch className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="font-black text-white text-base">Menunggu Deteksi</p>
                      <p className="text-xs text-white/30 mt-1">Arahkan produk ke dalam kotak merah</p>
                    </div>
                    <div className="w-full grid grid-cols-3 gap-2">
                      {['Arahkan', 'Scan', 'Lihat Detail'].map((s, i) => (
                        <div key={s} className="rounded-2xl bg-white/5 p-3 text-center border border-white/10">
                          <div className="text-lg font-black text-indigo-400">{i + 1}</div>
                          <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mt-1">{s}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Gradient header */}
                    <div className={`p-5 transition-all duration-500 ${
                      isDetected
                        ? 'bg-gradient-to-br from-emerald-600 to-emerald-700'
                        : 'bg-gradient-to-br from-slate-700 to-slate-800'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white transition-all ${
                          isDetected ? 'bg-white/20' : 'bg-white/10'
                        }`}>
                          {isDetected ? <ShieldCheck className="h-6 w-6" /> : <ShieldX className="h-6 w-6" />}
                        </div>
                        <div>
                          <h3 className="font-black text-white text-base leading-tight">
                            {isDetected ? 'Produk Terdeteksi!' : 'Tidak Terdeteksi'}
                          </h3>
                          <p className="text-xs text-white/60 mt-0.5">
                            {isDetected ? `Label: ${result.label}` : 'Pastikan produk berada dalam kotak'}
                          </p>
                        </div>
                        <div className="ml-auto text-right">
                          <div className={`text-2xl font-black ${
                            confidencePct > 70 ? 'text-white' : confidencePct > 40 ? 'text-yellow-300' : 'text-white/50'
                          }`}>{confidencePct}%</div>
                          <div className="text-[10px] text-white/40 uppercase tracking-widest">conf</div>
                        </div>
                      </div>
                      {/* Confidence bar */}
                      <div className="mt-4 h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
                        <motion.div
                          animate={{ width: `${confidencePct}%` }}
                          transition={{ duration: 0.4 }}
                          className="h-full rounded-full bg-white"
                        />
                      </div>
                    </div>

                    {/* All detections */}
                    {result.all_detections && result.all_detections.length > 0 && (
                      <div className="px-5 py-4 border-t border-white/10">
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">
                          Semua Objek dalam Frame
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {result.all_detections.map((det, i) => (
                            <div key={i} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${
                              i === 0
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white/10 border border-white/10 text-white/60'
                            }`}>
                              <span className="capitalize">{det.class}</span>
                              <span className="opacity-60">{Math.round(det.confidence * 100)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* Matched Product Card */}
            <AnimatePresence mode="wait">
              {matchedProduct && (
                <motion.div
                  key={matchedProduct.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                >
                  <Card className="overflow-hidden rounded-[28px] border-none bg-white/5 backdrop-blur-md border border-white/10">
                    <div className="border-b border-white/10 px-5 py-4">
                      <div className="inline-flex items-center gap-2 rounded-full bg-indigo-600/30 border border-indigo-500/30 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-300">
                        <Sparkles className="h-3 w-3" />
                        Produk Ditemukan di Database
                      </div>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="flex items-center gap-4">
                        {matchedProduct.image_url ? (
                          <img
                            src={`${BACKEND_URL}${matchedProduct.image_url}`}
                            alt={matchedProduct.name}
                            className="h-16 w-16 rounded-2xl object-cover border border-white/10"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400">
                            <Package className="h-7 w-7" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-black text-white text-lg leading-tight">{matchedProduct.name}</h4>
                          <Badge className="mt-1.5 rounded-full border border-indigo-500/30 bg-indigo-600/20 text-indigo-300 text-[10px] font-black uppercase tracking-widest">
                            {matchedProduct.category ?? 'No Category'}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'SKU', value: matchedProduct.sku, mono: true },
                          { label: 'Harga', value: formatCurrency(matchedProduct.price), mono: false, accent: true },
                          { label: 'Stok', value: `${matchedProduct.stock ?? 0} pcs`, mono: false },
                          { label: 'AI Label', value: matchedProduct.ai_label ?? '—', mono: false },
                        ].map(({ label, value, mono, accent }) => (
                          <div key={label} className="rounded-2xl bg-white/5 border border-white/10 p-3">
                            <div className="text-[10px] font-black uppercase tracking-widest text-white/30">{label}</div>
                            <div className={`mt-1 text-sm font-black ${mono ? 'font-mono text-white/70' : accent ? 'text-indigo-400' : 'text-white'}`}>
                              {value}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-600/10 p-3">
                        <BadgeCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-xs font-bold text-emerald-400">Produk terverifikasi dalam database</span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {result?.detected && !matchedProduct && (
                <motion.div
                  key="notfound"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Card className="rounded-[28px] border-none bg-white/5 border border-white/10 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-600/20 text-orange-400">
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">Tidak ada di database</p>
                        <p className="text-xs font-medium text-white/40 mt-0.5">
                          Label "<span className="text-indigo-400 capitalize">{result.label}</span>" belum terdaftar
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Simulation notice */}
            {result?.simulation && (
              <div className="flex items-center gap-2 rounded-2xl border border-orange-500/30 bg-orange-600/10 px-4 py-3 text-xs font-bold text-orange-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                Mode Simulasi — instal <code className="mx-1 text-orange-300">pip install ultralytics</code> untuk deteksi nyata
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
