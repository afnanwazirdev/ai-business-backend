import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// POST /api/upload
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // In local dev without Cloudinary credentials configured, return a high quality placeholder/base64 data URI
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    res.status(200).json({
      success: true,
      url: base64Image,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
