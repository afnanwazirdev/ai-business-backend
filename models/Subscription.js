import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    plan: { type: String, enum: ['starter', 'growth', 'scale'], default: 'starter' },
    billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    pricePKR: { type: Number, required: true },
    status: { type: String, enum: ['active', 'cancelled', 'expired'], default: 'active' },
    startDate: { type: Date, default: Date.now },
    renewalDate: { type: Date, required: true },
    features: {
      maxProducts: Number,
      maxOrdersPerMonth: Number,
      aiMessagesPerMonth: Number,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Subscription', SubscriptionSchema);
