import { Router } from 'express';
import multer from 'multer';
import { detectProduct, scanAndMatch } from '../controllers/detectionController';

const router = Router();

// Use memory storage — scan frames are NEVER written to disk permanently
const memUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Images only'));
  },
});

// POST /api/detect — process image in memory, never saved to uploads/
router.post('/', memUpload.single('image'), detectProduct);

// POST /api/detect/scan-match — detect + match against master catalog in one call
router.post('/scan-match', memUpload.single('image'), scanAndMatch);

export default router;
