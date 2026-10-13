import mongoose from 'mongoose';

const VariantSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // e.g. "Black / M" or "Standard"
    sku: { type: String, trim: true, default: '' },
    price: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, default: 0, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    options: {
      size: String,
      color: String,
      material: String,
    },
  },
  { _id: true }
);

const ProductSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'General', trim: true, index: true },
    images: [{ type: String }],
    basePrice: { type: Number, required: true, min: 0 },
    baseCostPrice: { type: Number, default: 0, min: 0 },
    totalStock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    hasVariants: { type: Boolean, default: false },
    variants: [VariantSchema],
    status: { type: String, enum: ['active', 'draft', 'archived'], default: 'active', index: true },
  },
  { timestamps: true }
);

ProductSchema.index({ seller: 1, status: 1 });
ProductSchema.index({ seller: 1, totalStock: 1 });

export default mongoose.model('Product', ProductSchema);
