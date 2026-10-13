import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    language: { type: String, enum: ['en', 'ur', 'roman_ur'], default: 'en' },
    toolCalls: [
      {
        toolName: String,
        toolInput: mongoose.Schema.Types.Mixed,
        toolResult: mongoose.Schema.Types.Mixed,
      },
    ],
    feedback: { type: String, enum: ['up', 'down', 'none'], default: 'none' },
  },
  { timestamps: true }
);

MessageSchema.index({ conversation: 1, createdAt: 1 });

export default mongoose.model('Message', MessageSchema);
