import { Router } from 'express';
import { loginController, meController } from './auth.controller';
import { requireAuth } from '../../middleware/authMiddleware';

const router = Router();

router.post('/login', loginController);
router.get('/me', requireAuth, meController);

export default router;
