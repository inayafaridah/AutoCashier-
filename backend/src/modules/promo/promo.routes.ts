import { Router } from 'express';
import { requireAuth } from '../../middleware/authMiddleware';
import { requireRole } from '../../middleware/rbacMiddleware';
import { getPromos, createPromo, updatePromo, deletePromo } from './promo.controller';

const router = Router();

// Apply Authentication to all routes in this module
router.use(requireAuth);

// Only allow Branch Admins (and superadmins) to access these routes
router.use(requireRole(['branch_admin', 'superadmin']));

router.get('/', getPromos);
router.post('/', createPromo);
router.put('/:id', updatePromo);
router.delete('/:id', deletePromo);

export default router;
