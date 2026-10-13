import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true }, // e.g. "03214567890"
    whatsapp: { type: String, trim: true, default: '' },
    email: { type: String, lowercase: true, trim: true, default: '' },
    city: { type: String, required: true, trim: true, index: true }, // e.g. "Lahore"
    address: { type: String, required: true, trim: true },
    totalOrders: { type: Number, default: 0 },
    deliveredOrders: { type: Number, default: 0 },
    returnedOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    isRepeat: { type: Boolean, default: false },
    returnRate: { type: Number, default: 0 }, // percentage
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

CustomerSchema.index({ seller: 1, phone: 1 });
CustomerSchema.index({ seller: 1, city: 1 });
CustomerSchema.index({ seller: 1, totalSpent: -1 });

export default mongoose.model('Customer', CustomerSchema);
