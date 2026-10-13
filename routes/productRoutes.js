import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  getLowStock,
  getProductMovements,
} from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All routes protected and scoped by seller

router.route('/').get(getProducts).post(createProduct);
router.route('/low-stock').get(getLowStock);
router.route('/:id').get(getProductById).put(updateProduct).delete(deleteProduct);
router.route('/:id/stock').patch(adjustStock);
router.route('/:id/movements').get(getProductMovements);

export default router;
