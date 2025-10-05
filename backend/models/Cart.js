const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [cartItemSchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for user
cartSchema.index({ user: 1 });

// Virtual for total items count
cartSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for total amount
cartSchema.virtual('totalAmount').get(function() {
  return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
});

// Method to add item to cart
cartSchema.methods.addItem = function(productId, quantity, price) {
  const existingItem = this.items.find(item => item.product.toString() === productId.toString());
  
  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.price = price; // Update price in case it changed
  } else {
    this.items.push({
      product: productId,
      quantity: quantity,
      price: price
    });
  }
  
  this.lastUpdated = new Date();
};

// Method to remove item from cart
cartSchema.methods.removeItem = function(productId) {
  this.items = this.items.filter(item => item.product.toString() !== productId.toString());
  this.lastUpdated = new Date();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function(productId, quantity) {
  const item = this.items.find(item => item.product.toString() === productId.toString());
  
  if (item) {
    if (quantity <= 0) {
      this.removeItem(productId);
    } else {
      item.quantity = quantity;
      this.lastUpdated = new Date();
    }
  }
};

// Method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  this.lastUpdated = new Date();
};

// Method to get cart summary
cartSchema.methods.getSummary = function() {
  return {
    totalItems: this.totalItems,
    totalAmount: this.totalAmount,
    itemCount: this.items.length
  };
};

// Pre-save middleware
cartSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('Cart', cartSchema);



