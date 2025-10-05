const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    trim: true
  },
  icon: {
    type: String,
    default: '📦'
  },
  image: {
    type: String
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  seo: {
    metaTitle: String,
    metaDescription: String
  }
}, {
  timestamps: true
});

// Index for slug
categorySchema.index({ slug: 1 });

// Index for parent
categorySchema.index({ parent: 1 });

// Index for active status
categorySchema.index({ isActive: 1 });

// Virtual for full path
categorySchema.virtual('path').get(function() {
  if (this.parent) {
    return `${this.parent.path}/${this.slug}`;
  }
  return this.slug;
});

// Pre-save middleware to generate slug
categorySchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Static method to get category tree
categorySchema.statics.getTree = function() {
  return this.find({ isActive: true })
    .populate('children')
    .sort({ sortOrder: 1, name: 1 });
};

// Static method to get root categories
categorySchema.statics.getRootCategories = function() {
  return this.find({ parent: null, isActive: true })
    .sort({ sortOrder: 1, name: 1 });
};

module.exports = mongoose.model('Category', categorySchema);



