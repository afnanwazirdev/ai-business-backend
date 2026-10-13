import express from 'express';
import { getCustomers, getCustomerById, updateCustomer } from '../controllers/customerController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getCustomers);
router.route('/:id').get(getCustomerById).put(updateCustomer);

export default router;
