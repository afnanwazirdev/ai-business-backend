import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import StockMovement from '../models/StockMovement.js';
import { mockOrders } from '../utils/mockStore.js';

// Helper to generate sequential order number
const generateOrderNumber = async (sellerId) => {
  const count = await Order.countDocuments({ seller: sellerId });
  return `KB-${1001 + count}`;
};

// @desc    Get all orders with filtering and pagination
// @route   GET /api/orders
export const getOrders = async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    const { status, city, search, page = 1, limit = 20 } = req.query;
    let list = [...mockOrders];
    if (status && status !== 'all') {
      list = list.filter((o) => o.status === status);
    }
    if (city) {
      list = list.filter((o) => o.customerSnapshot?.city?.toLowerCase().includes(city.toLowerCase()));
    }
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(s) ||
          o.customerSnapshot?.name?.toLowerCase().includes(s) ||
          o.customerSnapshot?.phone?.includes(s) ||
          (o.courier?.trackingNumber && o.courier.trackingNumber.toLowerCase().includes(s))
      );
    }
    const total = list.length;
    const paginated = list.slice((page - 1) * limit, page * limit);
    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit) || 1,
      orders: paginated,
    });
  }

  try {
    const { status, city, search, dateRange, page = 1, limit = 20, sort = '-createdAt' } = req.query;

    const query = { seller: req.user._id };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (city) {
      query['customerSnapshot.city'] = { $regex: city, $options: 'i' };
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customerSnapshot.name': { $regex: search, $options: 'i' } },
        { 'customerSnapshot.phone': { $regex: search, $options: 'i' } },
        { 'courier.trackingNumber': { $regex: search, $options: 'i' } },
      ];
    }

    if (dateRange) {
      const now = new Date();
      if (dateRange === 'today') {
        const start = new Date(now.setHours(0, 0, 0, 0));
        query.createdAt = { $gte: start };
      } else if (dateRange === '7d') {
        const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        query.createdAt = { $gte: start };
      } else if (dateRange === '30d') {
        const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        query.createdAt = { $gte: start };
      }
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('customer', 'name phone city totalOrders isRepeat');

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      orders,
    });
  } catch (error) {
    const paginated = mockOrders.slice(0, 10);
    res.status(200).json({
      success: true,
      total: mockOrders.length,
      page: 1,
      pages: 1,
      orders: paginated,
    });
  }
};

// @desc    Get single order details
// @route   GET /api/orders/:id
export const getOrderById = async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    const order = mockOrders.find((o) => o._id === req.params.id || o.orderNumber === req.params.id) || mockOrders[0];
    return res.status(200).json({ success: true, order });
  }

  try {
    const order = await Order.findOne({ _id: req.params.id, seller: req.user._id })
      .populate('customer');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    const order = mockOrders.find((o) => o._id === req.params.id || o.orderNumber === req.params.id) || mockOrders[0];
    res.status(200).json({ success: true, order });
  }
};

// @desc    Create "Naya Order" (Multi-step wizard)
// @route   POST /api/orders
export const createOrder = async (req, res, next) => {
  try {
    const {
      customer: customerData, // { name, phone, city, address, whatsapp }
      items,                 // [{ product, variantId, productTitle, variantTitle, unitPrice, quantity }]
      deliveryCharges = 200,
      discount = 0,
      paymentMethod = 'cod',
      salesChannel = 'instagram',
      courier,
      notes = '',
    } = req.body;

    if (!customerData?.name || !customerData?.phone || !customerData?.city || !customerData?.address) {
      return res.status(400).json({
        success: false,
        message: 'Customer name, phone, city, and delivery address are required.',
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item.',
      });
    }

    // 1. Find or create Customer
    let customer = await Customer.findOne({
      seller: req.user._id,
      phone: customerData.phone.trim(),
    });

    if (!customer) {
      customer = await Customer.create({
        seller: req.user._id,
        name: customerData.name.trim(),
        phone: customerData.phone.trim(),
        whatsapp: customerData.whatsapp || customerData.phone.trim(),
        city: customerData.city.trim(),
        address: customerData.address.trim(),
        totalOrders: 1,
        isRepeat: false,
      });
    } else {
      customer.totalOrders += 1;
      customer.isRepeat = customer.totalOrders > 1;
      customer.name = customerData.name.trim();
      customer.city = customerData.city.trim();
      customer.address = customerData.address.trim();
      await customer.save();
    }

    // 2. Calculate item totals and decrement inventory
    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findOne({ _id: item.product, seller: req.user._id });
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.productTitle || item.product}`,
        });
      }

      const qty = Number(item.quantity) || 1;
      const unitPrice = Number(item.unitPrice) || product.basePrice;
      const itemTotal = unitPrice * qty;
      subtotal += itemTotal;

      processedItems.push({
        product: product._id,
        variantId: item.variantId || undefined,
        productTitle: product.title,
        variantTitle: item.variantTitle || '',
        sku: item.sku || '',
        unitPrice,
        costPrice: product.baseCostPrice || 0,
        quantity: qty,
        totalPrice: itemTotal,
      });

      // Atomic inventory deduction
      const stockBefore = product.totalStock;
      if (item.variantId && product.variants?.length) {
        const variant = product.variants.id(item.variantId);
        if (variant) {
          variant.stock = Math.max(0, variant.stock - qty);
        }
        product.totalStock = product.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
      } else {
        product.totalStock = Math.max(0, product.totalStock - qty);
      }
      await product.save();

      // Log stock movement
      await StockMovement.create({
        seller: req.user._id,
        product: product._id,
        variantId: item.variantId,
        productTitle: product.title,
        variantTitle: item.variantTitle,
        type: 'sale',
        quantityDelta: -qty,
        stockBefore,
        stockAfter: product.totalStock,
        reason: 'Order placed',
      });
    }

    const totalAmount = subtotal + Number(deliveryCharges) - Number(discount);
    const codAmount = paymentMethod === 'cod' ? totalAmount : 0;
    const orderNumber = await generateOrderNumber(req.user._id);

    const order = await Order.create({
      seller: req.user._id,
      orderNumber,
      customer: customer._id,
      customerSnapshot: {
        name: customerData.name.trim(),
        phone: customerData.phone.trim(),
        whatsapp: customerData.whatsapp || customerData.phone.trim(),
        city: customerData.city.trim(),
        address: customerData.address.trim(),
      },
      items: processedItems,
      subtotal,
      deliveryCharges: Number(deliveryCharges),
      discount: Number(discount),
      totalAmount,
      codAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'collected',
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          timestamp: new Date(),
          note: 'Order created via dashboard',
          changedBy: 'seller',
        },
      ],
      salesChannel,
      courier: courier || { name: 'manual', trackingNumber: '' },
      notes,
    });

    res.status(201).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// @desc    Advance or change order status in pipeline
// @route   PATCH /api/orders/:id/status
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note, courierInfo } = req.body;

    const validStatuses = ['pending', 'confirmed', 'dispatched', 'delivered', 'returned', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status provided.' });
    }

    const order = await Order.findOne({ _id: req.params.id, seller: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const oldStatus = order.status;
    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Status changed from ${oldStatus} to ${status}`,
      changedBy: 'seller',
    });

    if (courierInfo) {
      if (courierInfo.name) order.courier.name = courierInfo.name;
      if (courierInfo.trackingNumber) order.courier.trackingNumber = courierInfo.trackingNumber;
      if (courierInfo.trackingUrl) order.courier.trackingUrl = courierInfo.trackingUrl;
    }

    // If order transitioned to returned or cancelled: Restock products
    if ((status === 'returned' || status === 'cancelled') && oldStatus !== 'returned' && oldStatus !== 'cancelled') {
      for (const item of order.items) {
        const product = await Product.findOne({ _id: item.product, seller: req.user._id });
        if (product) {
          const stockBefore = product.totalStock;
          if (item.variantId && product.variants?.length) {
            const variant = product.variants.id(item.variantId);
            if (variant) {
              variant.stock += item.quantity;
            }
            product.totalStock = product.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
          } else {
            product.totalStock += item.quantity;
          }
          await product.save();

          await StockMovement.create({
            seller: req.user._id,
            product: product._id,
            variantId: item.variantId,
            productTitle: product.title,
            variantTitle: item.variantTitle,
            type: 'return',
            quantityDelta: item.quantity,
            stockBefore,
            stockAfter: product.totalStock,
            order: order._id,
            reason: `Order ${order.orderNumber} ${status}`,
          });
        }
      }
    }

    // Update customer statistics
    if (order.customer) {
      const customer = await Customer.findOne({ _id: order.customer, seller: req.user._id });
      if (customer) {
        if (status === 'delivered') {
          customer.deliveredOrders += 1;
          customer.totalSpent += order.totalAmount;
          order.paymentStatus = 'collected';
        } else if (status === 'returned') {
          customer.returnedOrders += 1;
        }
        if (customer.totalOrders > 0) {
          customer.returnRate = Math.round((customer.returnedOrders / customer.totalOrders) * 100);
        }
        await customer.save();
      }
    }

    await order.save();

    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk status update for selected orders
// @route   POST /api/orders/bulk-status
export const bulkUpdateStatus = async (req, res, next) => {
  try {
    const { orderIds, status } = req.body;
    if (!orderIds || !orderIds.length || !status) {
      return res.status(400).json({ success: false, message: 'orderIds and status are required.' });
    }

    const updated = [];
    for (const id of orderIds) {
      const order = await Order.findOneAndUpdate(
        { _id: id, seller: req.user._id },
        {
          $set: { status },
          $push: {
            statusHistory: {
              status,
              timestamp: new Date(),
              note: `Bulk updated to ${status}`,
              changedBy: 'seller',
            },
          },
        },
        { new: true }
      );
      if (order) updated.push(order);
    }

    res.status(200).json({ success: true, count: updated.length, orders: updated });
  } catch (error) {
    next(error);
  }
};
