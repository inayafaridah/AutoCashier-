import { Router } from 'express';
import * as aiController from '../controllers/aiController';

const router = Router();

router.post('/insight', aiController.getInsight);
router.post('/auto-analysis', aiController.getAutoAnalysis);

export default router;
