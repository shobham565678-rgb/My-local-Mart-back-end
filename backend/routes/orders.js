const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Store = require('../models/Store');
const { authenticateToken, requireUserType, requireStoreOwnership } = require('../middlewares/auth');

const router = express.Router();

// Create order from cart
router.post('/checkout', [
  authenticateToken,
  requireUserType('customer'),
  body('deliveryType').isIn(['pickup', 'delivery']).withMessage('Valid delivery type required'),
  body('deliveryAddress').optional().isObject().withMessage('Valid delivery address required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { deliveryType, deliveryAddress, notes } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name pricing images status inventory store');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Group items by store
    const storeGroups = {};
    cart.items.forEach(item => {
      const storeId = item.product.store.toString();
      if (!storeGroups[storeId]) {
        storeGroups[storeId] = [];
      }
      storeGroups[storeId].push(item);
    });

    const orders = [];

    // Create order for each store
    for (const [storeId, items] of Object.entries(storeGroups)) {
      const store = await Store.findById(storeId);
      if (!store || !store.isActive) {
        continue; // Skip inactive stores
      }

      // Validate all items are available
      const validItems = [];
      let subtotal = 0;

      for (const item of items) {
        const product = item.product;
        
        if (product.status !== 'active') {
          continue; // Skip inactive products
        }

        if (product.inventory.trackStock && product.inventory.stock < item.quantity) {
          continue; // Skip out of stock items
        }

        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        validItems.push({
          product: product._id,
          productSnapshot: {
            name: product.name,
            price: item.price,
            unit: product.pricing.unit,
            image: product.images[0]?.url || ''
          },
          quantity: item.quantity,
          price: item.price,
          total: itemTotal
        });
      }

      if (validItems.length === 0) {
        continue; // Skip if no valid items
      }

      // Calculate delivery fee
      let deliveryFee = 0;
      if (deliveryType === 'delivery') {
        deliveryFee = store.services.deliveryFee || 0;
      }

      // Calculate total
      const total = subtotal + deliveryFee;

      // Create order
      const order = new Order({
        customer: req.user._id,
        store: storeId,
        items: validItems,
        delivery: {
          type: deliveryType,
          address: deliveryAddress,
          fee: deliveryFee
        },
        pricing: {
          subtotal,
          deliveryFee,
          total
        },
        notes: {
          customer: notes
        }
      });

      await order.save();

      // Update product stock
      for (const item of validItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { 'inventory.stock': -item.quantity }
        });
      }

      // Update store stats
      await Store.findByIdAndUpdate(storeId, {
        $inc: { 
          'stats.totalOrders': 1,
          'stats.totalRevenue': total
        }
      });

      orders.push(order);
    }

    if (orders.length === 0) {
      return res.status(400).json({ message: 'No valid items to order' });
    }

    // Clear cart
    cart.clearCart();
    await cart.save();

    res.status(201).json({
      message: 'Orders created successfully',
      orders: orders.map(order => ({
        id: order._id,
        orderNumber: order.orderNumber,
        store: order.store,
        total: order.pricing.total,
        status: order.status
      }))
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// Get user's orders
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let query = { customer: req.user._id };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate('store', 'name address.city rating images.logo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalOrders: total,
        hasNext: skip + orders.length < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Failed to get orders' });
  }
});

// Get order details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'profile firstName lastName phone')
      .populate('store', 'name address contact rating')
      .populate('items.product', 'name pricing images');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user has access to this order
    if (order.customer._id.toString() !== req.user._id.toString() && 
        req.user.userType !== 'store_owner') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ order });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Failed to get order details' });
  }
});

// Update order status (store owners only)
router.patch('/:id/status', [
  authenticateToken,
  requireUserType('store_owner'),
  requireStoreOwnership,
  body('status').isIn(['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']).withMessage('Valid status required'),
  body('note').optional().isString().withMessage('Note must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, note } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order belongs to user's store
    const store = await Store.findOne({ owner: req.user._id });
    if (!store || order.store.toString() !== store._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    order.updateStatus(status, note);
    await order.save();

    res.json({
      message: 'Order status updated successfully',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        timeline: order.timeline
      }
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

// Cancel order (customers only)
router.patch('/:id/cancel', [
  authenticateToken,
  requireUserType('customer'),
  body('reason').optional().isString().withMessage('Reason must be a string')
], async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order belongs to user
    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if order can be cancelled
    if (['delivered', 'cancelled', 'refunded'].includes(order.status)) {
      return res.status(400).json({ message: 'Order cannot be cancelled' });
    }

    order.updateStatus('cancelled', reason || 'Cancelled by customer');
    await order.save();

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { 'inventory.stock': item.quantity }
      });
    }

    res.json({
      message: 'Order cancelled successfully',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status
      }
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Failed to cancel order' });
  }
});

// Add rating to order
router.post('/:id/rating', [
  authenticateToken,
  requireUserType('customer'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional().isString().withMessage('Review must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rating, review } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order belongs to user
    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if order is delivered
    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Can only rate delivered orders' });
    }

    // Check if already rated
    if (order.rating.value) {
      return res.status(400).json({ message: 'Order already rated' });
    }

    order.addRating(rating, review);
    await order.save();

    // Update store rating
    const store = await Store.findById(order.store);
    if (store) {
      const newRatingCount = store.rating.count + 1;
      const newAverageRating = ((store.rating.average * store.rating.count) + rating) / newRatingCount;
      
      await Store.findByIdAndUpdate(order.store, {
        'rating.average': Math.round(newAverageRating * 100) / 100,
        'rating.count': newRatingCount
      });
    }

    res.json({
      message: 'Rating added successfully',
      rating: order.rating
    });

  } catch (error) {
    console.error('Add rating error:', error);
    res.status(500).json({ message: 'Failed to add rating' });
  }
});

// Get store orders (store owners only)
router.get('/store/orders', [
  authenticateToken,
  requireUserType('store_owner'),
  requireStoreOwnership
], async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const store = await Store.findOne({ owner: req.user._id });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    let query = { store: store._id };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate('customer', 'profile firstName lastName phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalOrders: total,
        hasNext: skip + orders.length < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get store orders error:', error);
    res.status(500).json({ message: 'Failed to get store orders' });
  }
});

module.exports = router;



