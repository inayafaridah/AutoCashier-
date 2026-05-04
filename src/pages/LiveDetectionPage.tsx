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

interface ProductCacheEntry extends ProductSummary {
  normalized_ai_label?: string;
  normalized_name?: string;
}

const SCAN_INTERVAL_MS = 1500;
const DETECT_BOX_RATIO = 0.72; // fraction of video HEIGHT for the square scan box
const PRODUCT_CACHE_TTL_MS = 60_000;
const CAPTURE_JPEG_QUALITY = 0.82;

const normalizeLabel = (value: string) =>
  value
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

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
  const productsCacheRef = useRef<ProductCacheEntry[] | null>(null);
  const productsFetchedAtRef = useRef(0);
  const productsFetchPromiseRef = useRef<Promise<ProductCacheEntry[] | null> | null>(null);

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
          const normalizedData: ProductCacheEntry[] = data.data.map((product: ProductSummary) => ({
            ...product,
            normalized_ai_label: product.ai_label ? normalizeLabel(product.ai_label) : '',
            normalized_name: product.name ? normalizeLabel(product.name) : '',
          }));
          productsCacheRef.current = normalizedData;
          productsFetchedAtRef.current = Date.now();
          return normalizedData;
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('Failed to refresh product cache', err);
        }
      }
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

      const matchesNormalized = (candidate: string) => {
        if (!candidate) return false;
        if (candidate === normalizedLabel) return true;
        if (normalizedLabel.includes(' ')) {
          return candidate.includes(normalizedLabel);
        }
        const tokens = candidate.split(/\s+/).filter(Boolean);
        return tokens.includes(normalizedLabel);
      };

      const found = products.find((p) => {
        return matchesNormalized(p.normalized_ai_label ?? '') || matchesNormalized(p.normalized_name ?? '');
      });
      setMatchedProduct(found ?? null);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('Failed to match product label', err);
      }
    }
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

      if (!captureCanvasRef.current) {
        captureCanvasRef.current = document.createElement('canvas');
      }
      const canvas = captureCanvasRef.current;
      canvas.width = boxSize;
      canvas.height = boxSize;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context unavailable');
      }
      ctx.drawImage(video, bx, by, boxSize, boxSize, 0, 0, boxSize, boxSize);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', CAPTURE_JPEG_QUALITY);
      });

      if (!blob) {
        throw new Error('Failed to capture frame');
      }

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
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('Live detection failed', err);
      }
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
    <div className="relative h-[calc(100vh-2rem)] w-full overflow-hidden rounded-[32px] bg-[#0F172A] font-sans shadow-2xl">
      {/* Background Camera */}
      <div className="absolute inset-0 z-0">
        {cameraError ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 bg-slate-900 text-white/40">
            <CameraOff className="h-16 w-16" />
            <p className="text-sm font-bold">{cameraError}</p>
            <Button onClick={startCamera} className="rounded-2xl bg-indigo-600 text-white text-xs font-bold">
              Coba Lagi
            </Button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* Glass Overlay for Header & Controls */}
      <div className="absolute inset-x-0 top-0 z-20 p-6 pointer-events-none">
        <div className="flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/90 text-white shadow-lg shadow-indigo-600/30 backdrop-blur-md">
              <FlaskConical className="h-6 w-6" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Product Scanner</h1>
                <div className="flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-500/30 px-2.5 py-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-red-400">LIVE</span>
                </div>
              </div>
              <p className="text-[10px] font-medium text-white/60">
                YOLOv8 Engine Active • Continuous Monitoring
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 rounded-2xl bg-black/40 border border-white/10 px-4 py-2 backdrop-blur-md">
              <div className="text-right">
                <div className="text-[9px] font-black text-white/40 uppercase tracking-widest">Scans</div>
                <div className="text-sm font-black text-white">{scanCount}</div>
              </div>
              <div className="h-6 w-[1px] bg-white/10 mx-1" />
              <div className="text-right">
                <div className="text-[9px] font-black text-white/40 uppercase tracking-widest">FPS</div>
                <div className="text-sm font-black text-indigo-400">{fps ?? '--'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Center Detection UI */}
      {cameraReady && !cameraError && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div
            className="relative rounded-[2rem]"
            style={{
              height: `${DETECT_BOX_RATIO * 100}%`,
              aspectRatio: '1 / 1',
              boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.65)', // Darker mask
            }}
          >
            {/* Corner accents - More premium look */}
            {[
              'top-0 left-0 border-l-[4px] border-t-[4px] rounded-tl-[2rem]',
              'top-0 right-0 border-r-[4px] border-t-[4px] rounded-tr-[2rem]',
              'bottom-0 left-0 border-l-[4px] border-b-[4px] rounded-bl-[2rem]',
              'bottom-0 right-0 border-r-[4px] border-b-[4px] rounded-br-[2rem]',
            ].map((cls, i) => (
              <div key={i} className={`absolute h-12 w-12 transition-all duration-500 ${cls} ${
                isDetected ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.8)]' :
                detecting ? 'border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.8)]' :
                'border-white/50'
              }`} />
            ))}

            {/* Scanning line */}
            {scanning && !isDetected && (
              <motion.div
                animate={{ y: ['5%', '95%', '5%'] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
                className="absolute inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_15px_rgba(99,102,241,0.8)]"
              />
            )}

            {/* Detection Pulse */}
            {isDetected && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.02, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 rounded-[2rem] bg-emerald-400/20"
              />
            )}

            {/* Label Badge inside box */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 rounded-full px-6 py-2.5 text-xs font-black backdrop-blur-xl border whitespace-nowrap shadow-2xl ${
                    isDetected
                      ? 'bg-emerald-500/80 border-emerald-400/50 text-white'
                      : 'bg-black/60 border-white/10 text-white/70'
                  }`}
                >
                  {isDetected ? (
                    <><BadgeCheck className="h-4 w-4" />{result.label} • {confidencePct}% Match</>
                  ) : (
                    <><Loader2 className="h-4 w-4 animate-spin text-indigo-400" />Analyzing Environment...</>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Floating Results Panel */}
      <div className="absolute bottom-6 right-6 z-30 w-full max-w-[400px] space-y-4 pointer-events-none">
        <AnimatePresence mode="wait">
          {matchedProduct ? (
            <motion.div
              key={matchedProduct.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className="pointer-events-auto"
            >
              <Card className="overflow-hidden rounded-[32px] border-none bg-[#0F172A]/80 backdrop-blur-2xl border border-white/10 shadow-2xl">
                <div className="bg-gradient-to-r from-indigo-600/20 to-emerald-600/20 px-6 py-3 border-b border-white/5">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-300">
                    <Sparkles className="h-3 w-3" />
                    Verified Product Match
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      {matchedProduct.image_url ? (
                        <img
                          src={`${BACKEND_URL}${matchedProduct.image_url}`}
                          alt={matchedProduct.name ?? ''}
                          className="h-20 w-20 rounded-[20px] object-cover border border-white/10 shadow-xl"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-[20px] bg-indigo-600/20 text-indigo-400 border border-indigo-500/20">
                          <Package className="h-10 w-10" />
                        </div>
                      )}
                      <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white border-4 border-[#1e293b] shadow-lg">
                        <BadgeCheck className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-white text-xl leading-tight truncate">{matchedProduct.name}</h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge className="rounded-full border-none bg-white/10 text-white/60 text-[9px] font-bold uppercase px-2 py-0.5">
                          {matchedProduct.category ?? 'Uncategorized'}
                        </Badge>
                        <Badge className="rounded-full border-none bg-indigo-500/20 text-indigo-300 text-[9px] font-bold uppercase px-2 py-0.5">
                          {matchedProduct.sku}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                      <div className="text-[9px] font-black uppercase tracking-widest text-white/30">Price</div>
                      <div className="mt-1 text-lg font-black text-emerald-400">
                        {formatCurrency(matchedProduct.price ?? 0)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                      <div className="text-[9px] font-black uppercase tracking-widest text-white/30">Stock</div>
                      <div className="mt-1 text-lg font-black text-white">
                        {matchedProduct.stock ?? 0} <span className="text-[10px] text-white/40 font-bold uppercase ml-1">pcs</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-3 flex items-center justify-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                      Ready for Transaction
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : result?.detected ? (
            <motion.div
              key="unknown"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="pointer-events-auto"
            >
              <Card className="overflow-hidden rounded-[32px] border-none bg-orange-500/10 backdrop-blur-xl border border-orange-500/20 p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-orange-600/20 text-orange-400">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-base font-black text-white">Unknown Product</p>
                    <p className="text-xs font-medium text-white/50 mt-0.5">
                      Label "<span className="text-orange-300 font-bold capitalize">{result.label}</span>" is not registered in inventory.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Bottom status bar - Mobile & Info */}
      <div className="absolute bottom-6 left-6 z-30 pointer-events-none">
        <div className="flex items-center gap-3">
          {detecting && (
            <div className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-[10px] font-black text-white shadow-xl">
              <Loader2 className="h-3 w-3 animate-spin" />
              ENGINE SCANNING
            </div>
          )}
          {result?.simulation && (
            <div className="flex items-center gap-2 rounded-full bg-orange-600 px-4 py-2 text-[10px] font-black text-white shadow-xl">
              <AlertCircle className="h-3 w-3" />
              SIMULATION MODE
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
