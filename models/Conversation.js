import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'Nayi Guftagu' },
    totalTokens: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Conversation', ConversationSchema);
