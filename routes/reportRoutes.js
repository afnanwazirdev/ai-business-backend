import express from 'express';
import { getDashboardStats, getCityAnalytics, exportOrdersCsv } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/cities', getCityAnalytics);
router.get('/export', exportOrdersCsv);

export default router;
