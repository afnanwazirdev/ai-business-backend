import express from 'express';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

// GET /api/notifications
router.get('/', async (req, res, next) => {
  try {
    const notifications = await Notification.find({ seller: req.user._id })
      .sort('-createdAt')
      .limit(20);
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, seller: req.user._id },
      { $set: { read: true } },
      { new: true }
    );
    res.status(200).json({ success: true, notification });
  } catch (error) {
    next(error);
  }
});

export default router;
