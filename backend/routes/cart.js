const express = require('express');
const { body, validationResult } = require('express-validator');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { authenticateToken, requireUserType } = require('../middlewares/auth');

const router = express.Router();

// Get user's cart
router.get('/', authenticateToken, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name pricing images status inventory');

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
      await cart.save();
    }

    // Filter out unavailable products
    const availableItems = cart.items.filter(item => {
      const product = item.product;
      return product && product.status === 'active' && 
             (product.inventory.stock >= item.quantity || !product.inventory.trackStock);
    });

    // Update cart with only available items
    if (availableItems.length !== cart.items.length) {
      cart.items = availableItems;
      await cart.save();
    }

    res.json({ cart });

  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Failed to get cart' });
  }
});

// Add item to cart
router.post('/add', [
  authenticateToken,
  requireUserType('customer'),
  body('productId').isMongoId().withMessage('Valid product ID required'),
  body('quantity').isInt({ min: 1 }).withMessage('Valid quantity required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId, quantity } = req.body;

    // Verify product exists and is available
    const product = await Product.findById(productId)
      .populate('store', 'name isActive');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.status !== 'active') {
      return res.status(400).json({ message: 'Product is not available' });
    }

    if (!product.store.isActive) {
      return res.status(400).json({ message: 'Store is not active' });
    }

    // Check stock availability
    if (product.inventory.trackStock && product.inventory.stock < quantity) {
      return res.status(400).json({ 
        message: 'Insufficient stock available',
        availableStock: product.inventory.stock
      });
    }

    // Get or create cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Check if item already exists in cart
    const existingItem = cart.items.find(item => 
      item.product.toString() === productId
    );

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      
      // Check stock again for total quantity
      if (product.inventory.trackStock && product.inventory.stock < newQuantity) {
        return res.status(400).json({ 
          message: 'Insufficient stock for total quantity',
          availableStock: product.inventory.stock,
          currentInCart: existingItem.quantity
        });
      }

      existingItem.quantity = newQuantity;
      existingItem.price = product.pricing.sellingPrice;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity: quantity,
        price: product.pricing.sellingPrice
      });
    }

    await cart.save();

    res.json({
      message: 'Item added to cart successfully',
      cart: await Cart.findById(cart._id).populate('items.product', 'name pricing images')
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Failed to add item to cart' });
  }
});

// Update item quantity in cart
router.put('/update', [
  authenticateToken,
  requireUserType('customer'),
  body('productId').isMongoId().withMessage('Valid product ID required'),
  body('quantity').isInt({ min: 0 }).withMessage('Valid quantity required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productId, quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    if (quantity === 0) {
      // Remove item from cart
      cart.removeItem(productId);
    } else {
      // Verify product availability
      const product = await Product.findById(productId);
      if (!product || product.status !== 'active') {
        return res.status(400).json({ message: 'Product not available' });
      }

      // Check stock
      if (product.inventory.trackStock && product.inventory.stock < quantity) {
        return res.status(400).json({ 
          message: 'Insufficient stock available',
          availableStock: product.inventory.stock
        });
      }

      cart.updateItemQuantity(productId, quantity);
    }

    await cart.save();

    res.json({
      message: 'Cart updated successfully',
      cart: await Cart.findById(cart._id).populate('items.product', 'name pricing images')
    });

  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ message: 'Failed to update cart' });
  }
});

// Remove item from cart
router.delete('/remove/:productId', [
  authenticateToken,
  requireUserType('customer')
], async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.removeItem(productId);
    await cart.save();

    res.json({
      message: 'Item removed from cart successfully',
      cart: await Cart.findById(cart._id).populate('items.product', 'name pricing images')
    });

  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ message: 'Failed to remove item from cart' });
  }
});

// Clear cart
router.delete('/clear', [
  authenticateToken,
  requireUserType('customer')
], async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.clearCart();
    await cart.save();

    res.json({
      message: 'Cart cleared successfully',
      cart
    });

  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'Failed to clear cart' });
  }
});

// Get cart summary
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name pricing images status inventory');

    if (!cart) {
      return res.json({
        totalItems: 0,
        totalAmount: 0,
        itemCount: 0,
        items: []
      });
    }

    // Filter available items and calculate totals
    const availableItems = cart.items.filter(item => {
      const product = item.product;
      return product && product.status === 'active' && 
             (product.inventory.stock >= item.quantity || !product.inventory.trackStock);
    });

    const totalItems = availableItems.reduce((total, item) => total + item.quantity, 0);
    const totalAmount = availableItems.reduce((total, item) => total + (item.price * item.quantity), 0);

    res.json({
      totalItems,
      totalAmount,
      itemCount: availableItems.length,
      items: availableItems.map(item => ({
        product: item.product,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      }))
    });

  } catch (error) {
    console.error('Get cart summary error:', error);
    res.status(500).json({ message: 'Failed to get cart summary' });
  }
});

module.exports = router;



