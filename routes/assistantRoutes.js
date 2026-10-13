import express from 'express';
import {
  chatWithAssistant,
  getConversations,
  getConversationMessages,
  deleteConversation,
} from '../controllers/assistantController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', chatWithAssistant);
router.get('/conversations', getConversations);
router.get('/conversations/:id', getConversationMessages);
router.delete('/conversations/:id', deleteConversation);

export default router;
