import { Router } from 'express';
import { getOverview } from './overview.controller';

const router = Router();

// GET /api/overview?timeframe=weekly&year=2026&month=April&location_id=ALL
router.get('/', getOverview);

export default router;
