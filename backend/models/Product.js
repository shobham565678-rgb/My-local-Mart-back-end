const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  pricing: {
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    unit: {
      type: String,
      required: true,
      enum: ['kg', 'g', 'l', 'ml', 'piece', 'pack', 'dozen', 'box']
    }
  },
  inventory: {
    stock: {
      type: Number,
      required: true,
      min: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 10
    },
    trackStock: {
      type: Boolean,
      default: true
    }
  },
  availability: {
    pickup: {
      type: Boolean,
      default: true
    },
    delivery: {
      type: Boolean,
      default: true
    }
  },
  specifications: {
    weight: String,
    dimensions: String,
    color: String,
    material: String,
    expiryDate: Date,
    manufacturingDate: Date,
    barcode: String,
    sku: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'out_of_stock', 'discontinued'],
    default: 'active'
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    slug: String
  }
}, {
  timestamps: true
});

// Indexes
productSchema.index({ store: 1 });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ 'pricing.sellingPrice': 1 });
productSchema.index({ isFeatured: 1 });

// Text index for search
productSchema.index({ 
  name: 'text', 
  description: 'text', 
  brand: 'text',
  tags: 'text'
});

// Compound index for store and status
productSchema.index({ store: 1, status: 1 });

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.pricing.basePrice > 0) {
    return Math.round(((this.pricing.basePrice - this.pricing.sellingPrice) / this.pricing.basePrice) * 100);
  }
  return 0;
});

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary ? primary.url : (this.images[0] ? this.images[0].url : null);
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (!this.inventory.trackStock) return 'unlimited';
  if (this.inventory.stock === 0) return 'out_of_stock';
  if (this.inventory.stock <= this.inventory.lowStockThreshold) return 'low_stock';
  return 'in_stock';
});

// Method to check if product is available
productSchema.methods.isAvailable = function() {
  return this.status === 'active' && 
         (this.inventory.stock > 0 || !this.inventory.trackStock);
};

// Method to update stock
productSchema.methods.updateStock = function(quantity) {
  if (this.inventory.trackStock) {
    this.inventory.stock = Math.max(0, this.inventory.stock + quantity);
    
    // Update status based on stock
    if (this.inventory.stock === 0) {
      this.status = 'out_of_stock';
    } else if (this.status === 'out_of_stock') {
      this.status = 'active';
    }
  }
};

// Pre-save middleware
productSchema.pre('save', function(next) {
  // Calculate discount percentage
  if (this.pricing.basePrice > 0) {
    this.pricing.discount = Math.round(((this.pricing.basePrice - this.pricing.sellingPrice) / this.pricing.basePrice) * 100);
  }
  
  // Generate slug if not provided
  if (!this.seo.slug) {
    this.seo.slug = this.name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  next();
});

module.exports = mongoose.model('Product', productSchema);



