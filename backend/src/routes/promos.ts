import { Router } from 'express';
import { 
  listPromos, 
  createPromoController, 
  deletePromoController 
} from '../controllers/promoController';

const router = Router();

router.get('/', listPromos);
router.post('/', createPromoController);
router.delete('/:id', deletePromoController);

export default router;
