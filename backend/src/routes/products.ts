import { Router } from 'express';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProductController,
  deleteProductController,
} from '../controllers/productController';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/', listProducts);
router.get('/:id', getProduct);

router.post(
  '/',
  upload.fields([
    { name: 'imageLeft', maxCount: 1 },
    { name: 'imageRight', maxCount: 1 },
    { name: 'imageFront', maxCount: 1 },
    { name: 'imageBack', maxCount: 1 },
  ]),
  createProduct
);

router.put('/:id', updateProductController);
router.delete('/:id', deleteProductController);

export default router;
