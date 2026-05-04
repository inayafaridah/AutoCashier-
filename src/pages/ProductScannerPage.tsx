import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CameraOff, Package, ScanSearch, CheckCircle2, XCircle, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BACKEND_URL } from '@/lib/api';

interface MatchedProduct {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  category: string | null;
  ai_label: string | null;
  image_url: string | null;
}

interface ScanResult {
  detected: boolean;
  confidence: number;
  label: string | null;
  all_detections: { class: string; confidence: number }[];
  matchedProduct: MatchedProduct | null;
}

const SCAN_INTERVAL = 1200;

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

export default function ProductScannerPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const busyRef = useRef(false);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  // Camera
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

  // Continuous detection — always running, no pause
  const runDetection = useCallback(async () => {
    if (!videoRef.current || !cameraReady || busyRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0) return;

    busyRef.current = true;
    setDetecting(true);

    const vw = video.videoWidth;
    const vh = video.videoHeight;

    // Capture full frame
    const canvas = document.createElement('canvas');
    canvas.width = vw;
    canvas.height = vh;
    canvas.getContext('2d')?.drawImage(video, 0, 0, vw, vh);

    canvas.toBlob(async (blob) => {
      if (!blob) { busyRef.current = false; setDetecting(false); return; }
      try {
        const form = new FormData();
        form.append('image', blob, 'frame.jpg');
        const res = await fetch(`${BACKEND_URL}/api/detect/scan-match`, { method: 'POST', body: form });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
          setResult({
            detected: data.detected,
            confidence: data.confidence,
            label: data.label,
            all_detections: data.all_detections ?? [],
            matchedProduct: data.matchedProduct ?? null,
          });
        }
      } catch (_) {}
      finally { busyRef.current = false; setDetecting(false); }
    }, 'image/jpeg', 0.75);
  }, [cameraReady]);

  // Auto-scan loop — always on
  useEffect(() => {
    if (cameraReady) {
      intervalRef.current = setInterval(runDetection, SCAN_INTERVAL);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [cameraReady, runDetection]);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const confPct = Math.round((result?.confidence ?? 0) * 100);
  const isDetected = result?.detected === true;
  const hasMatch = !!result?.matchedProduct;
  const mp = result?.matchedProduct;

  return (
    <div className="min-h-[calc(100vh-6rem)] -m-6 bg-black relative font-sans overflow-hidden">

      {/* Full-bleed camera */}
      {cameraError ? (
        <div className="flex h-full min-h-[80vh] flex-col items-center justify-center gap-4 text-white/40">
          <CameraOff className="h-20 w-20" />
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
            className="absolute inset-0 h-full w-full object-cover"
          />

          {/* Scanning indicator — subtle top bar */}
          {detecting && (
            <div className="absolute top-0 left-0 right-0 z-20">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, ease: 'linear' }}
                className="h-[3px] bg-indigo-500 origin-left"
              />
            </div>
          )}

          {/* Scan line sweep — constant */}
          {cameraReady && !hasMatch && (
            <motion.div
              animate={{ y: ['10vh', '80vh', '10vh'] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              className="absolute left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent z-10 pointer-events-none"
            />
          )}

          {/* Top-left: Status pill */}
          <div className="absolute top-4 left-4 z-30">
            <div className={`flex items-center gap-2 rounded-full backdrop-blur-xl px-4 py-2 text-xs font-black shadow-lg transition-all duration-500 ${
              hasMatch
                ? 'bg-emerald-500/80 text-white'
                : isDetected
                ? 'bg-amber-500/80 text-white'
                : 'bg-black/50 text-white/60'
            }`}>
              {hasMatch ? (
                <><CheckCircle2 className="h-3.5 w-3.5" />Produk Terdaftar Ditemukan</>
              ) : isDetected ? (
                <><XCircle className="h-3.5 w-3.5" />Tidak Ada Kecocokan di DB</>
              ) : detecting ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" />Memindai Database...</>
              ) : (
                <><ScanSearch className="h-3.5 w-3.5" />Arahkan Produk Terdaftar</>
              )}
            </div>
          </div>

          {/* Product overlay card — bottom of camera */}
          <AnimatePresence mode="wait">
            {hasMatch && mp && (
              <motion.div
                key={mp.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="absolute bottom-6 left-4 right-4 z-30 lg:left-auto lg:right-6 lg:w-[380px]"
              >
                <div className="rounded-[24px] bg-black/70 backdrop-blur-2xl border border-white/15 shadow-[0_8px_60px_rgba(0,0,0,0.6)] overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center gap-3 px-5 pt-5 pb-3">
                    {mp.image_url ? (
                      <img
                        src={`${BACKEND_URL}${mp.image_url}`}
                        alt={mp.name}
                        className="h-14 w-14 rounded-2xl object-cover border border-white/20 shadow-lg"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
                        <Package className="h-6 w-6" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-black text-base leading-tight truncate">{mp.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-full">
                          {mp.category ?? 'Uncategorized'}
                        </span>
                        <span className="text-[10px] font-mono text-white/40">{mp.sku}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-black text-emerald-400">{confPct}%</div>
                      <div className="text-[9px] text-white/30 uppercase tracking-widest">match</div>
                    </div>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-3 gap-[1px] bg-white/5 mx-4 mb-4 rounded-2xl overflow-hidden">
                    <div className="bg-black/40 p-3 text-center">
                      <div className="text-[9px] font-black uppercase tracking-widest text-white/30">Harga</div>
                      <div className="text-sm font-black text-indigo-400 mt-1">{fmtCurrency(mp.price)}</div>
                    </div>
                    <div className="bg-black/40 p-3 text-center">
                      <div className="text-[9px] font-black uppercase tracking-widest text-white/30">Stok</div>
                      <div className="text-sm font-black text-white mt-1">{mp.stock ?? 0} <span className="text-white/40 text-xs">pcs</span></div>
                    </div>
                    <div className="bg-black/40 p-3 text-center">
                      <div className="text-[9px] font-black uppercase tracking-widest text-white/30">AI Label</div>
                      <div className="text-sm font-black text-emerald-400 mt-1 capitalize truncate">{mp.ai_label ?? '—'}</div>
                    </div>
                  </div>

                  {/* Verified badge */}
                  <div className="mx-4 mb-4 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-600/10 px-4 py-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-xs font-bold text-emerald-400">Terverifikasi — produk siap digunakan</span>
                  </div>
                </div>
              </motion.div>
            )}

          {/* Unregistered product overlay */}
            {isDetected && !hasMatch && (
              <motion.div
                key="unregistered"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                className="absolute bottom-6 left-4 right-4 z-30 lg:left-auto lg:right-6 lg:w-[340px]"
              >
                <div className="rounded-[24px] bg-black/70 backdrop-blur-2xl border border-amber-500/30 shadow-[0_8px_40px_rgba(0,0,0,0.5)] p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 flex-shrink-0">
                      <XCircle className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white">Produk Tidak Terdaftar</p>
                      <p className="text-xs text-white/40 mt-1">
                        Terdeteksi sebagai: <span className="text-amber-400 capitalize font-bold">{result?.label}</span>
                      </p>
                      <p className="text-xs text-white/50 mt-2">
                        Scanner hanya mencocokkan produk yang terdaftar di Master Products.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Detected objects — top right chips */}
          <AnimatePresence>
            {result?.all_detections && result.all_detections.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute top-4 right-4 z-30 flex flex-wrap gap-1.5 max-w-[200px] justify-end"
              >
                {result.all_detections.slice(0, 5).map((det, i) => (
                  <div key={i} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black backdrop-blur-xl ${
                    i === 0
                      ? hasMatch ? 'bg-emerald-500/70 text-white' : 'bg-indigo-500/70 text-white'
                      : 'bg-black/50 text-white/60'
                  }`}>
                    <span className="capitalize">{det.class}</span>
                    <span className="opacity-60">{Math.round(det.confidence * 100)}%</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
