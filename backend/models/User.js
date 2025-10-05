const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  userType: {
    type: String,
    enum: ['customer', 'store_owner'],
    required: true
  },
  profile: {
    firstName: {
      type: String,
      trim: true
    },
    lastName: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    avatar: {
      type: String
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    code: String,
    expiresAt: Date
  },
  preferences: {
    notifications: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  lastLogin: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for phone number
userSchema.index({ phone: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName || ''} ${this.profile.lastName || ''}`.trim();
});

// Method to generate OTP
userSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = {
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  };
  return otp;
};

// Method to verify OTP
userSchema.methods.verifyOTP = function(otp) {
  if (!this.otp || !this.otp.code || !this.otp.expiresAt) {
    return false;
  }
  
  if (new Date() > this.otp.expiresAt) {
    return false;
  }
  
  return this.otp.code === otp;
};

// Method to clear OTP
userSchema.methods.clearOTP = function() {
  this.otp = undefined;
};

// Pre-save middleware
userSchema.pre('save', function(next) {
  if (this.isModified('phone')) {
    // Remove any non-digit characters except +
    this.phone = this.phone.replace(/[^\d+]/g, '');
  }
  next();
});

module.exports = mongoose.model('User', userSchema);



