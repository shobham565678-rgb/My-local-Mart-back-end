const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category');
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

// Get products with filters
router.get('/', async (req, res) => {
  try {
    const {
      store,
      category,
      search,
      minPrice,
      maxPrice,
      status = 'active',
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let query = {};

    if (store) {
      query.store = store;
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    if (minPrice || maxPrice) {
      query['pricing.sellingPrice'] = {};
      if (minPrice) query['pricing.sellingPrice'].$gte = parseFloat(minPrice);
      if (maxPrice) query['pricing.sellingPrice'].$lte = parseFloat(maxPrice);
    }

    if (status) {
      query.status = status;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .populate('store', 'name address.city rating')
      .populate('category', 'name slug')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total,
        hasNext: skip + products.length < total,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Failed to get products' });
  }
});

// Search products
router.get('/search', async (req, res) => {
  try {
    const { q, store, category, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Search query required' });
    }

    let query = {
      $text: { $search: q },
      status: 'active'
    };

    if (store) {
      query.store = store;
    }

    if (category) {
      query.category = category;
    }

    const products = await Product.find(query)
      .populate('store', 'name address.city rating')
      .populate('category', 'name slug')
      .limit(parseInt(limit));

    res.json({ products });

  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ message: 'Failed to search products' });
  }
});

// Get product details
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('store', 'name address rating contact')
      .populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ product });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Failed to get product details' });
  }
});

// Create product (store owners only)
router.post('/', [
  authenticateToken,
  requireUserType('store_owner'),
  requireVerified,
  requireStoreOwnership,
  body('name').isLength({ min: 1 }).withMessage('Product name required'),
  body('category').isMongoId().withMessage('Valid category required'),
  body('pricing.basePrice').isFloat({ min: 0 }).withMessage('Valid base price required'),
  body('pricing.sellingPrice').isFloat({ min: 0 }).withMessage('Valid selling price required'),
  body('pricing.unit').isIn(['kg', 'g', 'l', 'ml', 'piece', 'pack', 'dozen', 'box']).withMessage('Valid unit required'),
  body('inventory.stock').isInt({ min: 0 }).withMessage('Valid stock quantity required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verify category exists
    const category = await Category.findById(req.body.category);
    if (!category) {
      return res.status(400).json({ message: 'Category not found' });
    }

    // Get store
    const store = await Store.findOne({ owner: req.user._id });
    if (!store) {
      return res.status(400).json({ message: 'Store not found' });
    }

    const productData = {
      ...req.body,
      store: store._id
    };

    const product = new Product(productData);
    await product.save();

    // Update store product count
    await Store.findByIdAndUpdate(store._id, {
      $inc: { 'stats.totalProducts': 1 }
    });

    res.status(201).json({
      message: 'Product created successfully',
      product
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Failed to create product' });
  }
});

// Update product
router.put('/:id', [
  authenticateToken,
  requireUserType('store_owner'),
  requireVerified,
  requireStoreOwnership
], async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if product belongs to user's store
    const store = await Store.findOne({ owner: req.user._id });
    if (!store || product.store.toString() !== store._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Failed to update product' });
  }
});

// Delete product
router.delete('/:id', [
  authenticateToken,
  requireUserType('store_owner'),
  requireVerified,
  requireStoreOwnership
], async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if product belongs to user's store
    const store = await Store.findOne({ owner: req.user._id });
    if (!store || product.store.toString() !== store._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Product.findByIdAndDelete(req.params.id);

    // Update store product count
    await Store.findByIdAndUpdate(store._id, {
      $inc: { 'stats.totalProducts': -1 }
    });

    res.json({ message: 'Product deleted successfully' });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

// Upload product image
router.post('/:id/upload-image', [
  authenticateToken,
  requireUserType('store_owner'),
  requireVerified,
  requireStoreOwnership
], async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if product belongs to user's store
    const store = await Store.findOne({ owner: req.user._id });
    if (!store || product.store.toString() !== store._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { imageData, isPrimary = false } = req.body;

    if (!imageData) {
      return res.status(400).json({ message: 'Image data required' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(imageData, {
      folder: 'mylocalmart/products',
      public_id: `${product._id}_${Date.now()}`
    });

    // Add image to product
    const newImage = {
      url: result.secure_url,
      alt: product.name,
      isPrimary: isPrimary
    };

    // If this is set as primary, unset other primary images
    if (isPrimary) {
      product.images.forEach(img => img.isPrimary = false);
    }

    product.images.push(newImage);
    await product.save();

    res.json({
      message: 'Image uploaded successfully',
      image: newImage
    });

  } catch (error) {
    console.error('Upload product image error:', error);
    res.status(500).json({ message: 'Failed to upload image' });
  }
});

// Update product stock
router.patch('/:id/stock', [
  authenticateToken,
  requireUserType('store_owner'),
  requireVerified,
  requireStoreOwnership,
  body('quantity').isInt().withMessage('Valid quantity required'),
  body('operation').isIn(['add', 'subtract', 'set']).withMessage('Valid operation required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { quantity, operation } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if product belongs to user's store
    const store = await Store.findOne({ owner: req.user._id });
    if (!store || product.store.toString() !== store._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update stock based on operation
    switch (operation) {
      case 'add':
        product.inventory.stock += quantity;
        break;
      case 'subtract':
        product.inventory.stock = Math.max(0, product.inventory.stock - quantity);
        break;
      case 'set':
        product.inventory.stock = Math.max(0, quantity);
        break;
    }

    // Update status based on stock
    if (product.inventory.stock === 0) {
      product.status = 'out_of_stock';
    } else if (product.status === 'out_of_stock') {
      product.status = 'active';
    }

    await product.save();

    res.json({
      message: 'Stock updated successfully',
      product: {
        id: product._id,
        stock: product.inventory.stock,
        status: product.status
      }
    });

  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ message: 'Failed to update stock' });
  }
});

module.exports = router;



