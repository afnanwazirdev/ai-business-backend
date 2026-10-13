import express from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  bulkUpdateStatus,
} from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getOrders).post(createOrder);
router.route('/bulk-status').post(bulkUpdateStatus);
router.route('/:id').get(getOrderById);
router.route('/:id/status').patch(updateOrderStatus);

export default router;
