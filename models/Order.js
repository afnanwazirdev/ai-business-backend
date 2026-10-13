import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId },
    productTitle: { type: String, required: true },
    variantTitle: { type: String, default: '' },
    sku: { type: String, default: '' },
    unitPrice: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, default: 0 },
    quantity: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const StatusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String, default: '' },
    changedBy: { type: String, default: 'seller' }, // 'seller', 'system', 'courier'
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderNumber: { type: String, required: true }, // e.g. "KB-1042"
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    customerSnapshot: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      whatsapp: { type: String, default: '' },
      city: { type: String, required: true },
      address: { type: String, required: true },
    },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    deliveryCharges: { type: Number, default: 200, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    codAmount: { type: Number, required: true, min: 0 }, // Amount to collect at doorstep
    paymentMethod: {
      type: String,
      enum: ['cod', 'bank_transfer', 'easypaisa', 'jazzcash', 'paid'],
      default: 'cod',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'collected', 'refunded'],
      default: 'pending',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'dispatched', 'delivered', 'returned', 'cancelled'],
      default: 'pending',
      index: true,
    },
    statusHistory: [StatusHistorySchema],
    salesChannel: {
      type: String,
      enum: ['instagram', 'facebook', 'whatsapp', 'daraz', 'website', 'other'],
      default: 'instagram',
    },
    courier: {
      name: {
        type: String,
        enum: ['manual', 'tcs', 'leopards', 'postex', 'trax'],
        default: 'manual',
      },
      trackingNumber: { type: String, default: '' },
      trackingUrl: { type: String, default: '' },
      bookingDate: Date,
      dispatchDate: Date,
      deliveryDate: Date,
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

OrderSchema.index({ seller: 1, orderNumber: 1 });
OrderSchema.index({ seller: 1, status: 1, createdAt: -1 });
OrderSchema.index({ seller: 1, createdAt: -1 });

export default mongoose.model('Order', OrderSchema);
