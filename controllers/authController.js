import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { mockUser } from '../utils/mockStore.js';

// Helper to send token response with httpOnly cookie
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken ? user.getSignedJwtToken() : jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || 'karobar_super_secret_jwt_key_2026_pakistan',
    { expiresIn: '7d' }
  );

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    user: userObj,
  });
};

// @desc    Register new seller
// @route   POST /api/auth/register
export const register = async (req, res, next) => {
  const { name, email, password, storeName, phone, city, businessType } = req.body;

  if (!name || !email || !password || !storeName || !phone) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields (Name, Email, Store Name, Phone, Password).',
    });
  }

  if (mongoose.connection.readyState !== 1) {
    const newUser = {
      _id: `user-${Date.now()}`,
      name,
      email,
      storeName,
      phone,
      city: city || 'Karachi',
      businessType: businessType || 'clothing',
      subscription: { plan: 'growth', status: 'active' },
    };
    return sendTokenResponse(newUser, 201, res);
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      storeName,
      phone,
      city: city || 'Karachi',
      businessType: businessType || 'clothing',
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login seller
// @route   POST /api/auth/login
export const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password.',
    });
  }

  if (mongoose.connection.readyState !== 1) {
    return sendTokenResponse(mockUser, 200, res);
  }

  try {
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Log seller out / clear cookie
// @route   POST /api/auth/logout
export const logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

// @desc    Get currently logged-in seller
// @route   GET /api/auth/me
export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

// @desc    Update seller profile & couriers
// @route   PUT /api/auth/profile
export const updateProfile = async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    Object.assign(mockUser, req.body);
    return res.status(200).json({
      success: true,
      user: mockUser,
    });
  }

  try {
    const fieldsToUpdate = {
      name: req.body.name,
      storeName: req.body.storeName,
      phone: req.body.phone,
      city: req.body.city,
      businessType: req.body.businessType,
      courierSettings: req.body.courierSettings,
    };

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: fieldsToUpdate },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
