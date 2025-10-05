const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
    type: String,
    required: true,
    enum: ['grocery', 'pharmacy', 'electronics', 'clothing', 'restaurant', 'general']
  },
  contact: {
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    }
  },
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    }
  },
  businessDetails: {
    gstin: {
      type: String,
      trim: true
    },
    pan: {
      type: String,
      trim: true
    },
    licenseNumber: {
      type: String,
      trim: true
    }
  },
  images: {
    logo: {
      type: String
    },
    cover: {
      type: String
    },
    gallery: [{
      type: String
    }]
  },
  services: {
    pickup: {
      type: Boolean,
      default: true
    },
    delivery: {
      type: Boolean,
      default: false
    },
    deliveryRadius: {
      type: Number,
      default: 5 // in kilometers
    },
    deliveryFee: {
      type: Number,
      default: 0
    },
    minOrderAmount: {
      type: Number,
      default: 0
    }
  },
  operatingHours: {
    monday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    tuesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    wednesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    thursday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    friday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    saturday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    sunday: { open: String, close: String, isOpen: { type: Boolean, default: true } }
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
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  stats: {
    totalProducts: {
      type: Number,
      default: 0
    },
    totalOrders: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// GeoJSON index for location-based queries
storeSchema.index({ 'address.coordinates': '2dsphere' });

// Text index for search
storeSchema.index({ 
  name: 'text', 
  description: 'text', 
  'address.city': 'text',
  'address.state': 'text'
});

// Index for owner
storeSchema.index({ owner: 1 });

// Index for category
storeSchema.index({ category: 1 });

// Virtual for full address
storeSchema.virtual('fullAddress').get(function() {
  return `${this.address.street}, ${this.address.city}, ${this.address.state} - ${this.address.pincode}`;
});

// Method to check if store is open
storeSchema.methods.isOpen = function() {
  const now = new Date();
  const day = now.toLocaleLowerCase().slice(0, 3) + 'day';
  const currentTime = now.toTimeString().slice(0, 5);
  
  const todayHours = this.operatingHours[day];
  if (!todayHours || !todayHours.isOpen) {
    return false;
  }
  
  return currentTime >= todayHours.open && currentTime <= todayHours.close;
};

// Method to calculate distance from coordinates
storeSchema.methods.calculateDistance = function(lat, lng) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat - this.address.coordinates[1]) * Math.PI / 180;
  const dLng = (lng - this.address.coordinates[0]) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(this.address.coordinates[1] * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

module.exports = mongoose.model('Store', storeSchema);



