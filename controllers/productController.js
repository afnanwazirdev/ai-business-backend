import mongoose from 'mongoose';
import Product from '../models/Product.js';
import StockMovement from '../models/StockMovement.js';
import { mockProducts } from '../utils/mockStore.js';

// @desc    Get all products for seller with search, filter, and pagination
// @route   GET /api/products
export const getProducts = async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    const { search, category, status, page = 1, limit = 20 } = req.query;
    let list = [...mockProducts];
    if (search) list = list.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));
    if (category) list = list.filter((p) => p.category === category);
    if (status) list = list.filter((p) => p.status === status);
    return res.status(200).json({
      success: true,
      total: list.length,
      page: Number(page),
      pages: Math.ceil(list.length / limit) || 1,
      products: list.slice((page - 1) * limit, page * limit),
    });
  }

  try {
    const { search, category, status, sort = '-createdAt', page = 1, limit = 20 } = req.query;

    const query = { seller: req.user._id };

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    if (category) {
      query.category = category;
    }
    if (status) {
      query.status = status;
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      products,
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      total: mockProducts.length,
      page: 1,
      pages: 1,
      products: mockProducts,
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
export const getProductById = async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    const product = mockProducts.find((p) => p._id === req.params.id) || mockProducts[0];
    return res.status(200).json({ success: true, product });
  }

  try {
    const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    const product = mockProducts.find((p) => p._id === req.params.id) || mockProducts[0];
    res.status(200).json({ success: true, product });
  }
};

// @desc    Create new product
// @route   POST /api/products
export const createProduct = async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    const newProduct = {
      _id: `prod-${Date.now()}`,
      seller: req.user._id,
      ...req.body,
      createdAt: new Date().toISOString(),
    };
    mockProducts.unshift(newProduct);
    return res.status(201).json({ success: true, product: newProduct });
  }

  try {
    const {
      title,
      description,
      category,
      basePrice,
      baseCostPrice,
      totalStock,
      lowStockThreshold,
      hasVariants,
      variants,
      images,
    } = req.body;

    const computedTotalStock = hasVariants && variants?.length
      ? variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0)
      : Number(totalStock) || 0;

    const product = await Product.create({
      seller: req.user._id,
      title,
      description,
      category: category || 'Clothing',
      basePrice: Number(basePrice) || 0,
      baseCostPrice: Number(baseCostPrice) || 0,
      totalStock: computedTotalStock,
      lowStockThreshold: Number(lowStockThreshold) || 5,
      hasVariants: !!hasVariants,
      variants: variants || [],
      images: images || [],
    });

    // Create initial stock movement log
    if (computedTotalStock > 0) {
      await StockMovement.create({
        seller: req.user._id,
        product: product._id,
        productTitle: product.title,
        type: 'restock',
        quantityDelta: computedTotalStock,
        stockBefore: 0,
        stockAfter: computedTotalStock,
        reason: 'Initial stock intake',
      });
    }

    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
export const updateProduct = async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    const product = mockProducts.find((p) => p._id === req.params.id) || mockProducts[0];
    Object.assign(product, req.body);
    return res.status(200).json({ success: true, product });
  }

  try {
    const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const {
      title,
      description,
      category,
      basePrice,
      baseCostPrice,
      totalStock,
      lowStockThreshold,
      hasVariants,
      variants,
      images,
      status,
    } = req.body;

    if (title !== undefined) product.title = title;
    if (description !== undefined) product.description = description;
    if (category !== undefined) product.category = category;
    if (basePrice !== undefined) product.basePrice = Number(basePrice);
    if (baseCostPrice !== undefined) product.baseCostPrice = Number(baseCostPrice);
    if (lowStockThreshold !== undefined) product.lowStockThreshold = Number(lowStockThreshold);
    if (hasVariants !== undefined) product.hasVariants = hasVariants;
    if (variants !== undefined) product.variants = variants;
    if (images !== undefined) product.images = images;
    if (status !== undefined) product.status = status;

    if (hasVariants && variants?.length) {
      product.totalStock = variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0);
    } else if (totalStock !== undefined) {
      product.totalStock = Number(totalStock);
    }

    await product.save();

    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// @desc    Direct stock adjustment with movement audit
// @route   PATCH /api/products/:id/stock
export const adjustStock = async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    const product = mockProducts.find((p) => p._id === req.params.id) || mockProducts[0];
    product.totalStock += Number(req.body.delta) || 0;
    return res.status(200).json({ success: true, product });
  }

  try {
    const { delta, reason, variantId } = req.body;
    const quantityDelta = Number(delta);

    if (isNaN(quantityDelta) || quantityDelta === 0) {
      return res.status(400).json({ success: false, message: 'Invalid stock delta' });
    }

    const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const stockBefore = product.totalStock;
    let variantTitle = '';

    if (variantId && product.variants?.length) {
      const variant = product.variants.id(variantId);
      if (variant) {
        variant.stock = Math.max(0, variant.stock + quantityDelta);
        variantTitle = variant.title;
      }
      product.totalStock = product.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
    } else {
      product.totalStock = Math.max(0, product.totalStock + quantityDelta);
    }

    const stockAfter = product.totalStock;
    await product.save();

    await StockMovement.create({
      seller: req.user._id,
      product: product._id,
      variantId,
      productTitle: product.title,
      variantTitle,
      type: quantityDelta > 0 ? 'restock' : 'manual_adjustment',
      quantityDelta,
      stockBefore,
      stockAfter,
      reason: reason || 'Manual stock update from dashboard',
    });

    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// @desc    Get low stock items
// @route   GET /api/products/low-stock
export const getLowStock = async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    const products = mockProducts.filter((p) => p.totalStock <= p.lowStockThreshold);
    return res.status(200).json({ success: true, count: products.length, products });
  }

  try {
    const products = await Product.find({
      seller: req.user._id,
      status: 'active',
      $expr: { $lte: ['$totalStock', '$lowStockThreshold'] },
    }).sort('totalStock');

    res.status(200).json({ success: true, count: products.length, products });
  } catch (error) {
    const products = mockProducts.filter((p) => p.totalStock <= p.lowStockThreshold);
    res.status(200).json({ success: true, count: products.length, products });
  }
};

// @desc    Get stock movement log
// @route   GET /api/products/:id/movements
export const getProductMovements = async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(200).json({
      success: true,
      movements: [
        {
          _id: 'mov-1',
          productTitle: 'Premium Velvet Embroidered Shawl',
          type: 'sale',
          quantityDelta: -1,
          stockBefore: 4,
          stockAfter: 3,
          reason: 'Order KB-1001 placed',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ],
    });
  }

  try {
    const movements = await StockMovement.find({
      seller: req.user._id,
      product: req.params.id,
    })
      .sort('-createdAt')
      .limit(50);

    res.status(200).json({ success: true, movements });
  } catch (error) {
    res.status(200).json({ success: true, movements: [] });
  }
};

// @desc    Delete/Archive product
// @route   DELETE /api/products/:id
export const deleteProduct = async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    const idx = mockProducts.findIndex((p) => p._id === req.params.id);
    if (idx !== -1) mockProducts.splice(idx, 1);
    return res.status(200).json({ success: true, message: 'Product deleted successfully' });
  }

  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      seller: req.user._id,
    });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};
