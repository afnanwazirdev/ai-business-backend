import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import StockMovement from '../models/StockMovement.js';
import Notification from '../models/Notification.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/karobar_ai';

const seedData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[Seed] Connected to MongoDB database...');

    // Clear existing demo data
    await User.deleteMany({ email: 'demo@karobar.pk' });
    await User.deleteMany({ email: 'ayesha@karobar.pk' });

    // 1. Create Demo Seller
    const demoUser = await User.create({
      name: 'Ayesha Khan',
      email: 'ayesha@karobar.pk',
      password: 'password123',
      storeName: 'Ayesha Closet PK',
      phone: '03001234567',
      city: 'Karachi',
      businessType: 'clothing',
      courierSettings: {
        tcs: { accountNo: 'TCS-9921', enabled: true },
        leopards: { apiKey: 'LEO-SECRET-44', enabled: true },
        postex: { apiToken: 'POSTEX-TOKEN-11', enabled: true },
        trax: { apiKey: 'TRAX-88', enabled: true },
        defaultCourier: 'trax',
      },
      subscription: {
        plan: 'growth',
        status: 'active',
      },
    });
    console.log('[Seed] Created seller:', demoUser.email);

    const sellerId = demoUser._id;

    // Remove old data for this seller
    await Product.deleteMany({ seller: sellerId });
    await Customer.deleteMany({ seller: sellerId });
    await Order.deleteMany({ seller: sellerId });
    await StockMovement.deleteMany({ seller: sellerId });
    await Notification.deleteMany({ seller: sellerId });

    // 2. Create Products (Pakistani Apparel & Beauty)
    const productsData = [
      {
        title: 'Premium Velvet Embroidered Shawl',
        description: 'Luxury winter velvet shawl with tilla work and hand-finished borders.',
        category: 'Shawls',
        basePrice: 5800,
        baseCostPrice: 3200,
        totalStock: 3, // LOW STOCK TRIGGER (threshold 5)
        lowStockThreshold: 5,
        hasVariants: true,
        variants: [
          { title: 'Maroon', sku: 'VS-MRN', price: 5800, costPrice: 3200, stock: 1 },
          { title: 'Emerald Green', sku: 'VS-GRN', price: 5800, costPrice: 3200, stock: 2 },
        ],
      },
      {
        title: 'Oversized Fleece Winter Hoodie',
        description: '350 GSM heavyweight cotton fleece hoodie with kangaroo pocket.',
        category: 'Hoodies',
        basePrice: 3200,
        baseCostPrice: 1600,
        totalStock: 28,
        lowStockThreshold: 8,
        hasVariants: true,
        variants: [
          { title: 'Black / M', sku: 'HD-BLK-M', price: 3200, costPrice: 1600, stock: 10 },
          { title: 'Black / L', sku: 'HD-BLK-L', price: 3200, costPrice: 1600, stock: 8 },
          { title: 'Beige / M', sku: 'HD-BGE-M', price: 3200, costPrice: 1600, stock: 10 },
        ],
      },
      {
        title: 'Pure Organic Rose Water Mist (200ml)',
        description: 'Steam distilled Rosa Damascena organic toner from Choa Saidan Shah.',
        category: 'Skincare',
        basePrice: 1450,
        baseCostPrice: 650,
        totalStock: 42,
        lowStockThreshold: 10,
        hasVariants: false,
      },
      {
        title: 'Handmade Kashmiri Pashmina Stole',
        description: 'Ultra-soft hand-spun wool wrap with authentic Kashmiri sozni embroidery.',
        category: 'Shawls',
        basePrice: 8500,
        baseCostPrice: 4800,
        totalStock: 6,
        lowStockThreshold: 4,
        hasVariants: false,
      },
      {
        title: 'Niacinamide 10% + Zinc Glowing Serum (30ml)',
        description: 'Blemish control clarifying face serum formulated for Pakistani skin climate.',
        category: 'Skincare',
        basePrice: 1950,
        baseCostPrice: 800,
        totalStock: 19,
        lowStockThreshold: 6,
        hasVariants: false,
      },
      {
        title: 'Embroidered Lawn Kurti 2-Piece',
        description: 'Summer breathable digital printed lawn kurti with dyed cotton trousers.',
        category: 'Clothing',
        basePrice: 2850,
        baseCostPrice: 1400,
        totalStock: 2, // LOW STOCK
        lowStockThreshold: 5,
        hasVariants: true,
        variants: [
          { title: 'Teal / Small', sku: 'LK-TEL-S', price: 2850, costPrice: 1400, stock: 1 },
          { title: 'Teal / Medium', sku: 'LK-TEL-M', price: 2850, costPrice: 1400, stock: 1 },
        ],
      },
    ];

    const createdProducts = await Product.insertMany(
      productsData.map((p) => ({ ...p, seller: sellerId }))
    );
    console.log(`[Seed] Created ${createdProducts.length} products.`);

    // 3. Create Customers (Pakistani Cities)
    const customersData = [
      {
        name: 'Zainab Fatima',
        phone: '03218765432',
        city: 'Lahore',
        address: 'House 42, Block D, Model Town',
        totalOrders: 3,
        deliveredOrders: 3,
        returnedOrders: 0,
        totalSpent: 12450,
        isRepeat: true,
      },
      {
        name: 'Hamza Bilal',
        phone: '03009876543',
        city: 'Karachi',
        address: 'Flat 402, Al-Noor Heights, Gulshan-e-Iqbal Block 13-D',
        totalOrders: 2,
        deliveredOrders: 2,
        returnedOrders: 0,
        totalSpent: 6400,
        isRepeat: true,
      },
      {
        name: 'Maryam Siddiqui',
        phone: '03335551234',
        city: 'Islamabad',
        address: 'Street 18, Sector F-8/3',
        totalOrders: 1,
        deliveredOrders: 1,
        returnedOrders: 0,
        totalSpent: 5800,
        isRepeat: false,
      },
      {
        name: 'Usman Tariq',
        phone: '03452223344',
        city: 'Rawalpindi',
        address: 'House 112, Lane 4, Chaklala Scheme 3',
        totalOrders: 1,
        deliveredOrders: 0,
        returnedOrders: 1,
        totalSpent: 0,
        returnRate: 100,
        isRepeat: false,
      },
      {
        name: 'Hina Qureshi',
        phone: '03124445566',
        city: 'Faisalabad',
        address: 'Madina Town, Near Gate 2',
        totalOrders: 1,
        deliveredOrders: 1,
        returnedOrders: 0,
        totalSpent: 2850,
        isRepeat: false,
      },
      {
        name: 'Bilal Ahmed',
        phone: '03023334455',
        city: 'Multan',
        address: 'Gulgasht Colony, Street 7',
        totalOrders: 1,
        deliveredOrders: 0,
        returnedOrders: 0,
        totalSpent: 0,
        isRepeat: false,
      },
    ];

    const createdCustomers = await Customer.insertMany(
      customersData.map((c) => ({ ...c, seller: sellerId }))
    );
    console.log(`[Seed] Created ${createdCustomers.length} customers.`);

    // 4. Create Orders across the 5 pipeline stages
    const ordersData = [
      {
        orderNumber: 'KB-1001',
        customer: createdCustomers[0]._id,
        customerSnapshot: {
          name: createdCustomers[0].name,
          phone: createdCustomers[0].phone,
          city: createdCustomers[0].city,
          address: createdCustomers[0].address,
        },
        items: [
          {
            product: createdProducts[0]._id,
            productTitle: createdProducts[0].title,
            variantTitle: 'Maroon',
            unitPrice: 5800,
            quantity: 1,
            totalPrice: 5800,
          },
        ],
        subtotal: 5800,
        deliveryCharges: 250,
        totalAmount: 6050,
        codAmount: 6050,
        status: 'delivered',
        statusHistory: [
          { status: 'pending', timestamp: new Date(Date.now() - 5 * 86400000) },
          { status: 'confirmed', timestamp: new Date(Date.now() - 4 * 86400000) },
          { status: 'dispatched', timestamp: new Date(Date.now() - 3 * 86400000) },
          { status: 'delivered', timestamp: new Date(Date.now() - 1 * 86400000) },
        ],
        courier: { name: 'trax', trackingNumber: 'TRX-998822', dispatchDate: new Date() },
        salesChannel: 'instagram',
      },
      {
        orderNumber: 'KB-1002',
        customer: createdCustomers[1]._id,
        customerSnapshot: {
          name: createdCustomers[1].name,
          phone: createdCustomers[1].phone,
          city: createdCustomers[1].city,
          address: createdCustomers[1].address,
        },
        items: [
          {
            product: createdProducts[1]._id,
            productTitle: createdProducts[1].title,
            variantTitle: 'Black / M',
            unitPrice: 3200,
            quantity: 2,
            totalPrice: 6400,
          },
        ],
        subtotal: 6400,
        deliveryCharges: 200,
        totalAmount: 6600,
        codAmount: 6600,
        status: 'dispatched',
        statusHistory: [
          { status: 'pending', timestamp: new Date(Date.now() - 2 * 86400000) },
          { status: 'confirmed', timestamp: new Date(Date.now() - 1 * 86400000) },
          { status: 'dispatched', timestamp: new Date() },
        ],
        courier: { name: 'leopards', trackingNumber: 'LEO-774411', dispatchDate: new Date() },
        salesChannel: 'whatsapp',
      },
      {
        orderNumber: 'KB-1003',
        customer: createdCustomers[2]._id,
        customerSnapshot: {
          name: createdCustomers[2].name,
          phone: createdCustomers[2].phone,
          city: createdCustomers[2].city,
          address: createdCustomers[2].address,
        },
        items: [
          {
            product: createdProducts[2]._id,
            productTitle: createdProducts[2].title,
            unitPrice: 1450,
            quantity: 2,
            totalPrice: 2900,
          },
          {
            product: createdProducts[4]._id,
            productTitle: createdProducts[4].title,
            unitPrice: 1950,
            quantity: 1,
            totalPrice: 1950,
          },
        ],
        subtotal: 4850,
        deliveryCharges: 200,
        totalAmount: 5050,
        codAmount: 5050,
        status: 'confirmed',
        statusHistory: [
          { status: 'pending', timestamp: new Date(Date.now() - 1 * 86400000) },
          { status: 'confirmed', timestamp: new Date() },
        ],
        courier: { name: 'postex', trackingNumber: 'PTX-554422' },
        salesChannel: 'instagram',
      },
      {
        orderNumber: 'KB-1004',
        customer: createdCustomers[5]._id,
        customerSnapshot: {
          name: createdCustomers[5].name,
          phone: createdCustomers[5].phone,
          city: createdCustomers[5].city,
          address: createdCustomers[5].address,
        },
        items: [
          {
            product: createdProducts[5]._id,
            productTitle: createdProducts[5].title,
            variantTitle: 'Teal / Small',
            unitPrice: 2850,
            quantity: 1,
            totalPrice: 2850,
          },
        ],
        subtotal: 2850,
        deliveryCharges: 200,
        totalAmount: 3050,
        codAmount: 3050,
        status: 'pending',
        statusHistory: [
          { status: 'pending', timestamp: new Date() },
        ],
        courier: { name: 'manual' },
        salesChannel: 'daraz',
      },
      {
        orderNumber: 'KB-1005',
        customer: createdCustomers[3]._id,
        customerSnapshot: {
          name: createdCustomers[3].name,
          phone: createdCustomers[3].phone,
          city: createdCustomers[3].city,
          address: createdCustomers[3].address,
        },
        items: [
          {
            product: createdProducts[1]._id,
            productTitle: createdProducts[1].title,
            variantTitle: 'Black / L',
            unitPrice: 3200,
            quantity: 1,
            totalPrice: 3200,
          },
        ],
        subtotal: 3200,
        deliveryCharges: 200,
        totalAmount: 3400,
        codAmount: 3400,
        status: 'returned',
        statusHistory: [
          { status: 'pending', timestamp: new Date(Date.now() - 7 * 86400000) },
          { status: 'dispatched', timestamp: new Date(Date.now() - 5 * 86400000) },
          { status: 'returned', timestamp: new Date(Date.now() - 2 * 86400000), note: 'Customer not reachable on phone' },
        ],
        courier: { name: 'tcs', trackingNumber: 'TCS-112233' },
        salesChannel: 'facebook',
      },
    ];

    await Order.insertMany(ordersData.map((o) => ({ ...o, seller: sellerId })));
    console.log(`[Seed] Created ${ordersData.length} orders.`);

    // 5. Create Low Stock Alert Notifications
    await Notification.create([
      {
        seller: sellerId,
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: 'Premium Velvet Embroidered Shawl has only 3 pieces remaining.',
        link: '/products',
      },
      {
        seller: sellerId,
        type: 'new_order',
        title: 'Naya COD Order #KB-1004',
        message: 'Order received from Bilal Ahmed in Multan (Rs 3,050).',
        link: '/orders',
      },
    ]);
    console.log('[Seed] Created notifications.');

    console.log('[Seed] Database successfully seeded with Pakistani online seller data!');
    console.log('Login credentials:');
    console.log('Email: ayesha@karobar.pk');
    console.log('Password: password123');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seedData();
