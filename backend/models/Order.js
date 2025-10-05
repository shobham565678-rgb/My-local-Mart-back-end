const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productSnapshot: {
    name: String,
    price: Number,
    unit: String,
    image: String
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
  total: {
    type: Number,
    required: true,
    min: 0
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  items: [orderItemSchema],
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  payment: {
    method: {
      type: String,
      enum: ['cod', 'online'],
      default: 'cod'
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paidAt: Date
  },
  delivery: {
    type: {
      type: String,
      enum: ['pickup', 'delivery'],
      required: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: [Number]
      }
    },
    fee: {
      type: Number,
      default: 0
    },
    estimatedTime: Date,
    deliveredAt: Date,
    notes: String
  },
  pricing: {
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0
    },
    tax: {
      type: Number,
      default: 0,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    }
  },
  timeline: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String
  }],
  notes: {
    customer: String,
    store: String
  },
  rating: {
    value: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    ratedAt: Date
  }
}, {
  timestamps: true
});

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1 });
orderSchema.index({ store: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

// Virtual for order age
orderSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Method to generate order number
orderSchema.statics.generateOrderNumber = function() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `MLM${timestamp.slice(-6)}${random}`;
};

// Method to update status
orderSchema.methods.updateStatus = function(newStatus, note = '') {
  this.status = newStatus;
  this.timeline.push({
    status: newStatus,
    note: note
  });
  
  // Set specific timestamps
  if (newStatus === 'delivered') {
    this.delivery.deliveredAt = new Date();
  } else if (newStatus === 'paid') {
    this.payment.paidAt = new Date();
  }
};

// Method to calculate total
orderSchema.methods.calculateTotal = function() {
  this.pricing.subtotal = this.items.reduce((total, item) => total + item.total, 0);
  this.pricing.total = this.pricing.subtotal + this.pricing.deliveryFee + this.pricing.tax - this.pricing.discount;
  return this.pricing.total;
};

// Method to add rating
orderSchema.methods.addRating = function(rating, review = '') {
  this.rating = {
    value: rating,
    review: review,
    ratedAt: new Date()
  };
};

// Pre-save middleware
orderSchema.pre('save', function(next) {
  if (this.isNew && !this.orderNumber) {
    this.orderNumber = this.constructor.generateOrderNumber();
  }
  
  // Initialize timeline
  if (this.isNew) {
    this.timeline = [{
      status: 'pending',
      note: 'Order placed'
    }];
  }
  
  // Calculate total
  this.calculateTotal();
  
  next();
});

module.exports = mongoose.model('Order', orderSchema);



