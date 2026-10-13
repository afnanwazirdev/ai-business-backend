import mongoose from 'mongoose';
import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import { mockCustomers, mockOrders } from '../utils/mockStore.js';

// @desc    Get all customers with search and stats
// @route   GET /api/customers
export const getCustomers = async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    const { search, city, repeatOnly, page = 1, limit = 20 } = req.query;
    let list = [...mockCustomers];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(s) || c.phone.includes(s));
    }
    if (city) {
      list = list.filter((c) => c.city.toLowerCase().includes(city.toLowerCase()));
    }
    if (repeatOnly === 'true') {
      list = list.filter((c) => c.isRepeat);
    }
    return res.status(200).json({
      success: true,
      total: list.length,
      page: Number(page),
      pages: Math.ceil(list.length / limit) || 1,
      customers: list.slice((page - 1) * limit, page * limit),
    });
  }

  try {
    const { search, city, repeatOnly, page = 1, limit = 20, sort = '-totalSpent' } = req.query;

    const query = { seller: req.user._id };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }

    if (repeatOnly === 'true') {
      query.isRepeat = true;
    }

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      customers,
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      total: mockCustomers.length,
      page: 1,
      pages: 1,
      customers: mockCustomers,
    });
  }
};

// @desc    Get single customer profile and full order history
// @route   GET /api/customers/:id
export const getCustomerById = async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    const customer = mockCustomers.find((c) => c._id === req.params.id) || mockCustomers[0];
    const orders = mockOrders.filter((o) => o.customer === customer._id);
    return res.status(200).json({
      success: true,
      customer,
      orders,
    });
  }

  try {
    const customer = await Customer.findOne({ _id: req.params.id, seller: req.user._id });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const orders = await Order.find({ customer: customer._id, seller: req.user._id })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      customer,
      orders,
    });
  } catch (error) {
    const customer = mockCustomers.find((c) => c._id === req.params.id) || mockCustomers[0];
    const orders = mockOrders.filter((o) => o.customer === customer._id);
    res.status(200).json({
      success: true,
      customer,
      orders,
    });
  }
};

// @desc    Create new customer
// @route   POST /api/customers
export const createCustomer = async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    const newCust = {
      _id: `cust-${Date.now()}`,
      seller: req.user._id,
      ...req.body,
      totalOrders: 0,
      totalSpent: 0,
      isRepeat: false,
      returnCount: 0,
      createdAt: new Date().toISOString(),
    };
    mockCustomers.unshift(newCust);
    return res.status(201).json({ success: true, customer: newCust });
  }

  try {
    const { name, phone, whatsapp, city, address, notes } = req.body;

    const existing = await Customer.findOne({ seller: req.user._id, phone: phone.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Customer with this phone already exists.' });
    }

    const customer = await Customer.create({
      seller: req.user._id,
      name: name.trim(),
      phone: phone.trim(),
      whatsapp: (whatsapp || phone).trim(),
      city: city.trim(),
      address: address.trim(),
      notes: notes || '',
    });

    res.status(201).json({ success: true, customer });
  } catch (error) {
    next(error);
  }
};

// @desc    Update customer details
// @route   PUT /api/customers/:id
export const updateCustomer = async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    const customer = mockCustomers.find((c) => c._id === req.params.id) || mockCustomers[0];
    Object.assign(customer, req.body);
    return res.status(200).json({ success: true, customer });
  }

  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, seller: req.user._id },
      { $set: req.body },
      { new: true }
    );
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.status(200).json({ success: true, customer });
  } catch (error) {
    next(error);
  }
};
