import { Request, Response } from 'express';

const YOLO_WORLD_URL = process.env.YOLO_WORLD_URL || 'http://localhost:8765';

/**
 * @swagger
 * /api/detect:
 *   post:
 *     tags: [AI Detection]
 *     summary: Detect products using multi-model AI pipeline
 *     description: |
 *       Uses YOLO-World + DINOv2 + Grounding DINO pipeline for accurate product detection.
 *       - Stage 1: YOLO-World (zero-shot bounding box detection)
 *       - Stage 2: DINOv2 (visual similarity product identification)
 *       - Stage 3: Grounding DINO (fallback if YOLO-World finds nothing)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 description: Base64-encoded image
 *               confidence:
 *                 type: number
 *                 default: 0.15
 *               use_dinov2:
 *                 type: boolean
 *                 default: true
 *               use_fallback:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Detection results with product matches
 */
export async function detectProducts(req: Request, res: Response) {
  try {
    const { image, confidence, classes, use_dinov2, use_fallback } = req.body;

    if (!image) {
      return res.status(400).json({ status: 'error', error: 'No image provided' });
    }

    const response = await fetch(`${YOLO_WORLD_URL}/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, confidence, classes, use_dinov2, use_fallback }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[detectProducts] AI service error:', errText);
      return res.status(502).json({
        status: 'error',
        error: 'AI detection service unavailable',
        details: errText,
      });
    }

    const result = await response.json();
    return res.json(result);
  } catch (err: any) {
    console.error('[detectProducts] Error:', err.message);
    return res.status(502).json({
      status: 'error',
      error: `Cannot connect to AI service at ${YOLO_WORLD_URL}. Is it running?`,
      hint: 'Start: cd yolo_world_service && .\\start.bat',
    });
  }
}

/**
 * @swagger
 * /api/detect/register-product:
 *   post:
 *     tags: [AI Detection]
 *     summary: Register a product with reference photos for DINOv2 identification
 *     description: |
 *       Upload 1-5 reference photos of a product. DINOv2 will extract visual embeddings
 *       and use them to identify this specific product during detection.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, images]
 *             properties:
 *               name:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Base64-encoded reference photos (1-5)
 *               price:
 *                 type: number
 *               product_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Registration result
 */
export async function registerProduct(req: Request, res: Response) {
  try {
    const response = await fetch(`${YOLO_WORLD_URL}/register-product`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ status: 'error', error: errText });
    }

    return res.json(await response.json());
  } catch (err: any) {
    return res.status(502).json({
      status: 'error',
      error: `AI service not available: ${err.message}`,
    });
  }
}

/**
 * @swagger
 * /api/detect/registered-products:
 *   get:
 *     tags: [AI Detection]
 *     summary: List all products registered with DINOv2 embeddings
 *     responses:
 *       200:
 *         description: List of registered products
 */
export async function getRegisteredProducts(req: Request, res: Response) {
  try {
    const response = await fetch(`${YOLO_WORLD_URL}/registered-products`);
    return res.json(await response.json());
  } catch (err: any) {
    return res.json({ status: 'offline', products: [], total: 0 });
  }
}

/**
 * @swagger
 * /api/detect/sync-classes:
 *   post:
 *     tags: [AI Detection]
 *     summary: Sync product classes from Supabase to YOLO-World
 */
export async function syncClasses(req: Request, res: Response) {
  try {
    const response = await fetch(`${YOLO_WORLD_URL}/sync-supabase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return res.status(502).json({ status: 'error', error: 'Sync failed' });
    }

    return res.json(await response.json());
  } catch (err: any) {
    return res.status(502).json({
      status: 'error',
      error: `Cannot connect to AI service at ${YOLO_WORLD_URL}`,
    });
  }
}

/**
 * @swagger
 * /api/detect/status:
 *   get:
 *     tags: [AI Detection]
 *     summary: Check AI pipeline status (all 3 models)
 */
export async function getDetectionStatus(req: Request, res: Response) {
  try {
    const response = await fetch(`${YOLO_WORLD_URL}/health`);
    if (!response.ok) {
      return res.status(502).json({ status: 'error', error: 'Service unhealthy' });
    }

    const result = await response.json();
    return res.json({ status: 'success', yolo_world: result });
  } catch (err: any) {
    return res.json({
      status: 'offline',
      error: 'AI detection service is not running',
      hint: 'Start: cd yolo_world_service && .\\start.bat',
    });
  }
}
