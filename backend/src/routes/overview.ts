import { Router } from 'express';
import { getOverview } from '../controllers/overviewController';

const router = Router();

// GET /api/overview?timeframe=weekly&year=2026&month=April&location_id=ALL
router.get('/', getOverview);

export default router;
