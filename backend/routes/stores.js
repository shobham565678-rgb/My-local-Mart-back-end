const express = require('express');
const { body, validationResult } = require('express-validator');
const Store = require('../models/Store');
const { authenticateToken, requireUserType, requireVerified, requireStoreOwnership } = require('../middlewares/auth');
const cloudinary = require('cloudinary').v2;

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Get nearby stores
router.get('/nearby', [
  body('latitude').isFloat().withMessage('Valid latitude required'),
  body('longitude').isFloat().withMessage('Valid longitude required'),
  body('radius').optional().isInt({ min: 1, max: 50 }).withMessage('Radius must be between 1-50 km')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { latitude, longitude, radius = 10, category } = req.query;
    const maxDistance = radius * 1000; // Convert km to meters

    let query = {
      isActive: true,
      'address.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: maxDistance
        }
      }
    };

    if (category) {
      query.category = category;
    }

    const stores = await Store.find(query)
      .populate('owner', 'profile firstName lastName')
      .limit(20)
      .lean();

    // Add distance to each store
    const storesWithDistance = stores.map(store => {
      const distance = store.calculateDistance(parseFloat(latitude), parseFloat(longitude));
      return {
        ...store,
        distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
      };
    });

    res.json({ stores: storesWithDistance });

  } catch (error) {
    console.error('Get nearby stores error:', error);
    res.status(500).json({ message: 'Failed to get nearby stores' });
  }
});

// Search stores
router.get('/search', async (req, res) => {
  try {
    const { q, category, city } = req.query;
    let query = { isActive: true };

    if (q) {
      query.$text = { $search: q };
    }

    if (category) {
      query.category = category;
    }

    if (city) {
      query['address.city'] = new RegExp(city, 'i');
    }

    const stores = await Store.find(query)
      .populate('owner', 'profile firstName lastName')
      .limit(20);

    res.json({ stores });

  } catch (error) {
    console.error('Search stores error:', error);
    res.status(500).json({ message: 'Failed to search stores' });
  }
});

// Get store details
router.get('/:id', async (req, res) => {
  try {
    const store = await Store.findById(req.params.id)
      .populate('owner', 'profile firstName lastName phone')
      .populate('products', 'name pricing images status');

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    res.json({ store });

  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({ message: 'Failed to get store details' });
  }
});

// Create store (for store owners)
router.post('/', [
  authenticateToken,
  requireUserType('store_owner'),
  requireVerified,
  body('name').isLength({ min: 1 }).withMessage('Store name required'),
  body('category').isIn(['grocery', 'pharmacy', 'electronics', 'clothing', 'restaurant', 'general']).withMessage('Valid category required'),
  body('contact.phone').isMobilePhone().withMessage('Valid phone number required'),
  body('address.street').isLength({ min: 1 }).withMessage('Street address required'),
  body('address.city').isLength({ min: 1 }).withMessage('City required'),
  body('address.state').isLength({ min: 1 }).withMessage('State required'),
  body('address.pincode').isLength({ min: 6, max: 6 }).withMessage('Valid pincode required'),
  body('address.coordinates').isArray({ min: 2, max: 2 }).withMessage('Valid coordinates required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user already has a store
    const existingStore = await Store.findOne({ owner: req.user._id });
    if (existingStore) {
      return res.status(400).json({ message: 'User already has a store' });
    }

    const storeData = {
      ...req.body,
      owner: req.user._id
    };

    const store = new Store(storeData);
    await store.save();

    res.status(201).json({
      message: 'Store created successfully',
      store
    });

  } catch (error) {
    console.error('Create store error:', error);
    res.status(500).json({ message: 'Failed to create store' });
  }
});

// Update store details
router.put('/:id', [
  authenticateToken,
  requireUserType('store_owner'),
  requireVerified,
  requireStoreOwnership
], async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Check ownership
    if (store.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedStore = await Store.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Store updated successfully',
      store: updatedStore
    });

  } catch (error) {
    console.error('Update store error:', error);
    res.status(500).json({ message: 'Failed to update store' });
  }
});

// Upload store image
router.post('/:id/upload-image', [
  authenticateToken,
  requireUserType('store_owner'),
  requireVerified,
  requireStoreOwnership
], async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    if (store.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { imageType, imageData } = req.body; // base64 image data
    const { imageType: type } = req.body;

    if (!imageData || !type) {
      return res.status(400).json({ message: 'Image data and type required' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(imageData, {
      folder: 'mylocalmart/stores',
      public_id: `${store._id}_${type}_${Date.now()}`
    });

    // Update store with image URL
    if (type === 'logo') {
      store.images.logo = result.secure_url;
    } else if (type === 'cover') {
      store.images.cover = result.secure_url;
    } else if (type === 'gallery') {
      store.images.gallery.push(result.secure_url);
    }

    await store.save();

    res.json({
      message: 'Image uploaded successfully',
      imageUrl: result.secure_url
    });

  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ message: 'Failed to upload image' });
  }
});

// Get store analytics
router.get('/:id/analytics', [
  authenticateToken,
  requireUserType('store_owner'),
  requireVerified,
  requireStoreOwnership
], async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    if (store.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get product count
    const Product = require('../models/Product');
    const Order = require('../models/Order');

    const productCount = await Product.countDocuments({ store: store._id });
    const activeProductCount = await Product.countDocuments({ 
      store: store._id, 
      status: 'active' 
    });
    const orderCount = await Order.countDocuments({ store: store._id });
    const recentOrders = await Order.find({ store: store._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer', 'profile firstName lastName');

    const analytics = {
      stats: {
        totalProducts: productCount,
        activeProducts: activeProductCount,
        totalOrders: orderCount,
        totalRevenue: store.stats.totalRevenue,
        averageRating: store.rating.average,
        ratingCount: store.rating.count
      },
      recentOrders
    };

    res.json({ analytics });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Failed to get analytics' });
  }
});

module.exports = router;



