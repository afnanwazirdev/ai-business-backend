import mongoose from 'mongoose';

const StockMovementSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    variantId: { type: mongoose.Schema.Types.ObjectId },
    productTitle: { type: String, required: true },
    variantTitle: { type: String, default: '' },
    type: {
      type: String,
      enum: ['sale', 'return', 'restock', 'damage', 'manual_adjustment'],
      required: true,
    },
    quantityDelta: { type: Number, required: true }, // Negative for sale, positive for restock/return
    stockBefore: { type: Number, required: true },
    stockAfter: { type: Number, required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    reason: { type: String, default: '' },
  },
  { timestamps: true }
);

StockMovementSchema.index({ seller: 1, product: 1, createdAt: -1 });

export default mongoose.model('StockMovement', StockMovementSchema);
