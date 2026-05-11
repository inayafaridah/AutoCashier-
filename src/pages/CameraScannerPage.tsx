/**
 * CameraScannerPage.tsx
 * Real-time product scanning page using YOLO-World AI detection.
 * Captures frames from the webcam and sends them to the backend
 * for open-vocabulary product detection.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Detection {
  label: string;
  confidence: number;
  bbox: number[];
}

interface CartItem {
  label: string;
  name: string;
  price: number;
  qty: number;
}

export default function CameraScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  const [isStreaming, setIsStreaming] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [serviceStatus, setServiceStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [inferenceMs, setInferenceMs] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [autoScan, setAutoScan] = useState(false);

  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastDetectedRef = useRef<string>('');

  // Check YOLO-World service status
  useEffect(() => {
    checkServiceStatus();
  }, []);

  const checkServiceStatus = async () => {
    setServiceStatus('checking');
    try {
      const res = await fetch(`${API_BASE}/detect/status`);
      const data = await res.json();
      if (data.status === 'success' && data.yolo_world?.model_loaded) {
        setServiceStatus('online');
      } else if (data.status === 'offline') {
        setServiceStatus('offline');
      } else {
        setServiceStatus('online');
      }
    } catch {
      setServiceStatus('offline');
    }
  };

  // Start camera stream
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 640, height: 480 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
        setErrorMsg('');
      }
    } catch (err: any) {
      setErrorMsg('Gagal mengakses kamera: ' + err.message);
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setAutoScan(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  // Capture frame as base64
  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.7);
  }, []);

  // Draw detection boxes on overlay
  const drawDetections = useCallback((dets: Detection[]) => {
    const video = videoRef.current;
    const overlay = overlayCanvasRef.current;
    if (!video || !overlay) return;

    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    dets.forEach((det) => {
      const [x1, y1, x2, y2] = det.bbox;

      // Box
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 3;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

      // Label background
      const label = `${det.label} ${(det.confidence * 100).toFixed(0)}%`;
      ctx.font = 'bold 14px Inter, sans-serif';
      const textWidth = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(99, 102, 241, 0.85)';
      ctx.fillRect(x1, y1 - 24, textWidth + 12, 24);

      // Label text
      ctx.fillStyle = '#fff';
      ctx.fillText(label, x1 + 6, y1 - 7);
    });
  }, []);

  // Send frame for detection
  const detectFrame = useCallback(async () => {
    if (isDetecting) return;
    setIsDetecting(true);

    const frame = captureFrame();
    if (!frame) {
      setIsDetecting(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: frame, confidence: 0.2 }),
      });

      const data = await res.json();

      if (data.status === 'success') {
        setDetections(data.detections || []);
        setInferenceMs(data.inference_time_ms || 0);
        drawDetections(data.detections || []);

        // Add top detection to cart
        if (data.detections && data.detections.length > 0) {
          const top = data.detections[0];
          const detKey = top.label;

          if (detKey !== lastDetectedRef.current) {
            lastDetectedRef.current = detKey;
            addToCart(top.label);
          }
        }
      } else {
        setErrorMsg(data.error || 'Detection failed');
      }
    } catch (err: any) {
      setErrorMsg('Koneksi ke server gagal');
    } finally {
      setIsDetecting(false);
    }
  }, [isDetecting, captureFrame, drawDetections]);

  // Add product to cart
  const addToCart = (label: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.label === label);
      if (existing) {
        return prev.map((item) =>
          item.label === label ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          label,
          name: label.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          price: 0, // Will be looked up from Supabase
          qty: 1,
        },
      ];
    });
  };

  // Remove item from cart
  const removeFromCart = (label: string) => {
    setCart((prev) => prev.filter((item) => item.label !== label));
  };

  // Toggle auto-scan
  useEffect(() => {
    if (autoScan && isStreaming) {
      scanIntervalRef.current = setInterval(() => {
        detectFrame();
      }, 1500);
    } else if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, [autoScan, isStreaming, detectFrame]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          ← Kembali
        </button>
        <h1 style={styles.title}>🔍 AI Product Scanner</h1>
        <div style={styles.statusBadge}>
          <span
            style={{
              ...styles.statusDot,
              backgroundColor:
                serviceStatus === 'online'
                  ? '#10b981'
                  : serviceStatus === 'offline'
                  ? '#ef4444'
                  : '#f59e0b',
            }}
          />
          YOLO-World:{' '}
          {serviceStatus === 'online'
            ? 'Online'
            : serviceStatus === 'offline'
            ? 'Offline'
            : 'Checking...'}
        </div>
      </div>

      <div style={styles.content}>
        {/* Camera Section */}
        <div style={styles.cameraSection}>
          <div style={styles.videoContainer}>
            <video
              ref={videoRef}
              style={styles.video}
              playsInline
              muted
            />
            <canvas ref={overlayCanvasRef} style={styles.overlay} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {!isStreaming && (
              <div style={styles.placeholder}>
                <div style={{ fontSize: 64 }}>📷</div>
                <p>Klik "Mulai Kamera" untuk memulai scanning</p>
              </div>
            )}

            {isDetecting && (
              <div style={styles.scanningIndicator}>
                <div style={styles.spinner} />
                Detecting...
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={styles.controls}>
            {!isStreaming ? (
              <button style={styles.primaryBtn} onClick={startCamera}>
                📷 Mulai Kamera
              </button>
            ) : (
              <>
                <button style={styles.dangerBtn} onClick={stopCamera}>
                  ⏹ Stop
                </button>
                <button
                  style={styles.primaryBtn}
                  onClick={detectFrame}
                  disabled={isDetecting}
                >
                  {isDetecting ? '⏳ Scanning...' : '🔍 Scan Sekali'}
                </button>
                <button
                  style={{
                    ...styles.secondaryBtn,
                    ...(autoScan ? styles.activeBtn : {}),
                  }}
                  onClick={() => setAutoScan(!autoScan)}
                >
                  {autoScan ? '⏸ Stop Auto' : '▶ Auto Scan'}
                </button>
              </>
            )}
          </div>

          {/* Inference stats */}
          {inferenceMs > 0 && (
            <div style={styles.stats}>
              ⚡ Inference: {inferenceMs.toFixed(0)}ms | 🏷️ Detections:{' '}
              {detections.length}
            </div>
          )}

          {/* Error message */}
          {errorMsg && (
            <div style={styles.error}>
              ❌ {errorMsg}
              <button style={styles.dismissBtn} onClick={() => setErrorMsg('')}>
                ✕
              </button>
            </div>
          )}

          {/* Detection Results */}
          {detections.length > 0 && (
            <div style={styles.detectionList}>
              <h3 style={{ margin: '0 0 8px', color: '#e2e8f0' }}>
                Hasil Deteksi:
              </h3>
              {detections.map((det, idx) => (
                <div key={idx} style={styles.detectionItem}>
                  <span style={styles.detLabel}>{det.label}</span>
                  <div style={styles.confBar}>
                    <div
                      style={{
                        ...styles.confFill,
                        width: `${det.confidence * 100}%`,
                      }}
                    />
                  </div>
                  <span style={styles.confText}>
                    {(det.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Section */}
        <div style={styles.cartSection}>
          <h2 style={styles.cartTitle}>
            🛒 Keranjang ({totalItems} item)
          </h2>

          {cart.length === 0 ? (
            <div style={styles.emptyCart}>
              <div style={{ fontSize: 48 }}>🛒</div>
              <p>Belum ada produk terdeteksi</p>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>
                Arahkan kamera ke produk dan klik Scan
              </p>
            </div>
          ) : (
            <div style={styles.cartItems}>
              {cart.map((item) => (
                <div key={item.label} style={styles.cartItem}>
                  <div>
                    <div style={styles.cartItemName}>{item.name}</div>
                    <div style={styles.cartItemLabel}>{item.label}</div>
                  </div>
                  <div style={styles.cartItemRight}>
                    <span style={styles.qtyBadge}>×{item.qty}</span>
                    <button
                      style={styles.removeBtn}
                      onClick={() => removeFromCart(item.label)}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {cart.length > 0 && (
            <div style={styles.cartFooter}>
              <button
                style={styles.clearCartBtn}
                onClick={() => {
                  setCart([]);
                  lastDetectedRef.current = '';
                }}
              >
                🗑 Kosongkan
              </button>
              <button style={styles.checkoutBtn}>
                💳 Checkout ({totalItems})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
    color: '#e2e8f0',
    fontFamily: "'Inter', sans-serif",
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    background: 'rgba(15, 23, 42, 0.8)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
  },
  backBtn: {
    background: 'rgba(99, 102, 241, 0.15)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    color: '#a5b4fc',
    padding: '8px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: 800,
    background: 'linear-gradient(135deg, #a5b4fc, #818cf8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: '#94a3b8',
    padding: '6px 14px',
    borderRadius: 20,
    background: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid rgba(100, 116, 139, 0.2)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    display: 'inline-block',
  },
  content: {
    display: 'flex',
    gap: 24,
    padding: 24,
    maxWidth: 1400,
    margin: '0 auto',
  },
  cameraSection: {
    flex: 2,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },
  videoContainer: {
    position: 'relative' as const,
    width: '100%',
    aspectRatio: '4/3',
    borderRadius: 16,
    overflow: 'hidden',
    background: '#1e293b',
    border: '2px solid rgba(99, 102, 241, 0.3)',
    boxShadow: '0 0 40px rgba(99, 102, 241, 0.1)',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  overlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none' as const,
  },
  placeholder: {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
    gap: 12,
  },
  scanningIndicator: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 14px',
    borderRadius: 20,
    background: 'rgba(99, 102, 241, 0.85)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
  },
  spinner: {
    width: 14,
    height: 14,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  controls: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap' as const,
  },
  primaryBtn: {
    flex: 1,
    padding: '12px 20px',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    transition: 'all 0.2s',
    minWidth: 140,
  },
  secondaryBtn: {
    flex: 1,
    padding: '12px 20px',
    borderRadius: 12,
    border: '1px solid rgba(99, 102, 241, 0.4)',
    background: 'rgba(99, 102, 241, 0.1)',
    color: '#a5b4fc',
    fontWeight: 600,
    fontSize: 15,
    cursor: 'pointer',
    transition: 'all 0.2s',
    minWidth: 140,
  },
  activeBtn: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: 'none',
    color: '#fff',
  },
  dangerBtn: {
    padding: '12px 20px',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    minWidth: 100,
  },
  stats: {
    fontSize: 13,
    color: '#94a3b8',
    padding: '8px 16px',
    borderRadius: 8,
    background: 'rgba(30, 41, 59, 0.6)',
    textAlign: 'center' as const,
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    borderRadius: 8,
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#fca5a5',
    fontSize: 13,
  },
  dismissBtn: {
    background: 'none',
    border: 'none',
    color: '#fca5a5',
    cursor: 'pointer',
    fontSize: 16,
  },
  detectionList: {
    padding: 16,
    borderRadius: 12,
    background: 'rgba(30, 41, 59, 0.6)',
    border: '1px solid rgba(100, 116, 139, 0.15)',
  },
  detectionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 0',
    borderBottom: '1px solid rgba(100, 116, 139, 0.1)',
  },
  detLabel: {
    fontWeight: 600,
    fontSize: 14,
    color: '#c7d2fe',
    minWidth: 120,
  },
  confBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    background: 'rgba(99, 102, 241, 0.15)',
    overflow: 'hidden',
  },
  confFill: {
    height: '100%',
    borderRadius: 3,
    background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
    transition: 'width 0.3s ease',
  },
  confText: {
    fontSize: 13,
    color: '#94a3b8',
    minWidth: 50,
    textAlign: 'right' as const,
  },
  cartSection: {
    flex: 1,
    minWidth: 300,
    background: 'rgba(30, 41, 59, 0.6)',
    backdropFilter: 'blur(12px)',
    borderRadius: 16,
    border: '1px solid rgba(100, 116, 139, 0.15)',
    padding: 20,
    display: 'flex',
    flexDirection: 'column' as const,
    maxHeight: 'calc(100vh - 120px)',
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: 700,
    margin: '0 0 16px',
    color: '#e2e8f0',
  },
  emptyCart: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
    gap: 8,
    textAlign: 'center' as const,
    padding: 32,
  },
  cartItems: {
    flex: 1,
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  cartItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderRadius: 10,
    background: 'rgba(99, 102, 241, 0.08)',
    border: '1px solid rgba(99, 102, 241, 0.15)',
  },
  cartItemName: {
    fontWeight: 600,
    fontSize: 14,
    color: '#e2e8f0',
  },
  cartItemLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  cartItemRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  qtyBadge: {
    background: 'rgba(99, 102, 241, 0.2)',
    color: '#a5b4fc',
    padding: '4px 10px',
    borderRadius: 6,
    fontWeight: 700,
    fontSize: 13,
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 16,
    padding: 4,
  },
  cartFooter: {
    display: 'flex',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTop: '1px solid rgba(100, 116, 139, 0.15)',
  },
  clearCartBtn: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: 10,
    border: '1px solid rgba(239, 68, 68, 0.3)',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#fca5a5',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
  },
  checkoutBtn: {
    flex: 2,
    padding: '10px 16px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
  },
};
