import { Request, Response } from 'express';
import { validateWithYolo } from '../services/yoloService';
import { matchDetectionToProduct, getAllProductsForScanning } from '../services/productDetectionService';
import os from 'os';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export async function detectProduct(req: Request, res: Response) {
  let tempFilePath: string | null = null;

  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ status: 'error', error: 'Tidak ada gambar yang diunggah.' });
    }

    // Write buffer to OS temp directory (not uploads/)
    const tempName = `scan_${crypto.randomBytes(8).toString('hex')}.jpg`;
    tempFilePath = path.join(os.tmpdir(), tempName);
    fs.writeFileSync(tempFilePath, req.file.buffer);

    const yoloResult = await validateWithYolo([{ angle: 'scan', path: tempFilePath }]);

    if (!yoloResult.ok) {
      return res.status(500).json({
        status: 'error',
        error: 'Validasi YOLO gagal: ' + yoloResult.error,
      });
    }

    const result = yoloResult.results[0];

    return res.json({
      status: 'success',
      detected: result?.detected ?? false,
      confidence: result?.confidence ?? 0,
      label: result?.class ?? null,
      all_detections: result?.all_detections ?? [],
      simulation: false,
    });
  } catch (err: any) {
    console.error('[detectProduct] Error:', err);
    return res.status(500).json({ status: 'error', error: err.message });
  } finally {
    // Always delete the temp file, even if an error occurred
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (_) {}
    }
  }
}

/**
 * POST /api/detect/scan-match
 * Runs YOLO detection AND immediately matches against master_catalog in one call.
 * Returns: { detected, confidence, label, all_detections, matchedProduct }
 */
export async function scanAndMatch(req: Request, res: Response) {
  let tempFilePath: string | null = null;

  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ status: 'error', error: 'Tidak ada gambar yang diunggah.' });
    }

    const tempName = `scanmatch_${crypto.randomBytes(8).toString('hex')}.jpg`;
    tempFilePath = path.join(os.tmpdir(), tempName);
    fs.writeFileSync(tempFilePath, req.file.buffer);

    // Run YOLO detection
    const yoloResult = await validateWithYolo([{ angle: 'scan', path: tempFilePath }]);

    if (!yoloResult.ok) {
      return res.status(500).json({ status: 'error', error: 'YOLO gagal: ' + yoloResult.error });
    }

    const det = yoloResult.results[0];
    let matchedProduct: any = null;

    // FOCUS: Only match YOLO detection to products in database
    if (det?.detected && det.class && det.confidence >= 0.5) {
      matchedProduct = await matchDetectionToProduct(
        det.class,
        det.confidence,
        det.all_detections ?? []
      );
    }

    // If still no match, return available products for frontend similarity matching
    const availableProducts = matchedProduct ? null : await getAllProductsForScanning();

    return res.json({
      status: 'success',
      detected: det?.detected ?? false,
      confidence: det?.confidence ?? 0,
      label: det?.class ?? null,
      all_detections: det?.all_detections ?? [],
      matchedProduct: matchedProduct || null,
      availableProducts: availableProducts || [], // For frontend image similarity
      simulation: false,
    });
  } catch (err: any) {
    console.error('[scanAndMatch] Error:', err);
    return res.status(500).json({ status: 'error', error: err.message });
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch (_) {}
    }
  }
}
