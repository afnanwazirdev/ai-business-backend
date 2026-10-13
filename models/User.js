import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, minlength: 6, select: false },
    storeName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true }, // e.g. 03001234567
    city: { type: String, default: 'Karachi' },
    businessType: {
      type: String,
      enum: ['clothing', 'electronics', 'beauty', 'jewelry', 'shoes', 'general'],
      default: 'clothing',
    },
    logoUrl: { type: String, default: '' },
    currency: { type: String, default: 'PKR' },
    courierSettings: {
      tcs: { accountNo: { type: String, default: '' }, apiKey: { type: String, default: '' }, costCenter: { type: String, default: '' }, enabled: { type: Boolean, default: false } },
      leopards: { apiKey: { type: String, default: '' }, apiPassword: { type: String, default: '' }, enabled: { type: Boolean, default: false } },
      postex: { apiToken: { type: String, default: '' }, enabled: { type: Boolean, default: false } },
      trax: { apiKey: { type: String, default: '' }, pickupAddressId: { type: String, default: '' }, enabled: { type: Boolean, default: false } },
      defaultCourier: { type: String, enum: ['manual', 'tcs', 'leopards', 'postex', 'trax'], default: 'manual' },
    },
    subscription: {
      plan: { type: String, enum: ['starter', 'growth', 'scale'], default: 'starter' },
      status: { type: String, enum: ['active', 'past_due', 'trial'], default: 'trial' },
      expiresAt: { type: Date, default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
    },
    aiUsage: {
      tokensUsedThisMonth: { type: Number, default: 0 },
      monthlyLimit: { type: Number, default: 100000 },
    },
  },
  { timestamps: true }
);

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT Token
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id, storeName: this.storeName, email: this.email },
    process.env.JWT_SECRET || 'karobar_super_secret_jwt_key_2026_pakistan',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

export default mongoose.model('User', UserSchema);
