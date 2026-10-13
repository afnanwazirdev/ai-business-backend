import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['low_stock', 'new_order', 'order_returned', 'system'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    link: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

NotificationSchema.index({ seller: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', NotificationSchema);
