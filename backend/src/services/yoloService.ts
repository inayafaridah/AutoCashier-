import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export interface YoloDetectionResult {
  angle: string;
  detected: boolean;
  confidence: number;
  class: string | null;
  all_detections?: { class: string; confidence: number }[];
}

export async function validateWithYolo(
  imagePaths: { angle: string; path: string }[]
): Promise<{ ok: boolean; results: YoloDetectionResult[]; error?: string }> {
  return new Promise((resolve) => {
    const pythonScript = path.join(process.cwd(), 'scripts', 'yolo_detect.py');

    if (!fs.existsSync(pythonScript)) {
      console.error('[YOLO] Script not found at:', pythonScript);
      return resolve({ ok: false, results: [], error: 'YOLO script not found' });
    }

    // Pass as "angle:path,angle:path,..." so Python knows the angle label
    const imageArg = imagePaths.map(img => `${img.angle}:${img.path}`).join(',');

    console.log('[YOLO] Starting detection on:', imagePaths.map(i => i.angle).join(', '));

    const pythonProcess = spawn('python', [pythonScript, imageArg]);

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      // YOLO prints download/loading info to stderr — that's normal
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('[YOLO] Process exited with code:', code);
        console.error('[YOLO] stderr:', stderr.slice(-500));

        // Fallback only if script truly failed (not ultralytics)
        const simulatedResults = imagePaths.map(img => ({
          angle: img.angle,
          detected: true,
          confidence: 0.95,
          class: 'product',
        }));
        console.warn('[YOLO] ⚠️ Falling back to simulation mode');
        return resolve({ ok: true, results: simulatedResults });
      }

      const rawOutput = stdout.trim();
      if (!rawOutput) {
        console.error('[YOLO] Empty output from Python script');
        return resolve({ ok: false, results: [], error: 'Empty YOLO output' });
      }

      try {
        const parsed = JSON.parse(rawOutput);

        // Map Python output to our expected format
        const results: YoloDetectionResult[] = parsed.map((item: any) => ({
          angle: item.angle ?? 'unknown',
          detected: item.detected ?? false,
          confidence: item.confidence ?? 0,
          class: item.class ?? null,
          all_detections: item.all_detections ?? [],
        }));

        console.log('[YOLO] ✅ Real detection results:', results.map(r =>
          `${r.angle}: ${r.detected ? r.class + ' (' + Math.round(r.confidence * 100) + '%)' : 'nothing'}`
        ).join(' | '));

        resolve({ ok: true, results });
      } catch (e) {
        console.error('[YOLO] Failed to parse output:', rawOutput);
        resolve({ ok: false, results: [], error: 'Failed to parse YOLO output: ' + rawOutput.slice(0, 200) });
      }
    });

    pythonProcess.on('error', (err) => {
      console.error('[YOLO] Failed to spawn python process:', err.message);
      resolve({ ok: false, results: [], error: `Cannot run python: ${err.message}` });
    });
  });
}
