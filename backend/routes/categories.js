const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const { authenticateToken, requireUserType } = require('../middlewares/auth');

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const { parent, active = true } = req.query;
    
    let query = {};
    if (active !== 'false') {
      query.isActive = true;
    }
    if (parent) {
      query.parent = parent;
    }

    const categories = await Category.find(query)
      .populate('children')
      .sort({ sortOrder: 1, name: 1 });

    res.json({ categories });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Failed to get categories' });
  }
});

// Get category tree
router.get('/tree', async (req, res) => {
  try {
    const categories = await Category.getTree();
    res.json({ categories });

  } catch (error) {
    console.error('Get category tree error:', error);
    res.status(500).json({ message: 'Failed to get category tree' });
  }
});

// Get root categories
router.get('/root', async (req, res) => {
  try {
    const categories = await Category.getRootCategories();
    res.json({ categories });

  } catch (error) {
    console.error('Get root categories error:', error);
    res.status(500).json({ message: 'Failed to get root categories' });
  }
});

// Get category details
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parent')
      .populate('children');

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ category });

  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ message: 'Failed to get category details' });
  }
});

// Create category (admin only - for now, any authenticated user)
router.post('/', [
  authenticateToken,
  body('name').isLength({ min: 1 }).withMessage('Category name required'),
  body('parent').optional().isMongoId().withMessage('Valid parent category ID required'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('icon').optional().isString().withMessage('Icon must be a string'),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('Sort order must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, parent, description, icon, sortOrder } = req.body;

    // Check if parent exists
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(400).json({ message: 'Parent category not found' });
      }
    }

    const category = new Category({
      name,
      parent,
      description,
      icon,
      sortOrder: sortOrder || 0
    });

    await category.save();

    // Update parent's children array
    if (parent) {
      await Category.findByIdAndUpdate(parent, {
        $push: { children: category._id }
      });
    }

    res.status(201).json({
      message: 'Category created successfully',
      category
    });

  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Failed to create category' });
  }
});

// Update category
router.put('/:id', [
  authenticateToken,
  body('name').optional().isLength({ min: 1 }).withMessage('Category name required'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('icon').optional().isString().withMessage('Icon must be a string'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('Sort order must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Category updated successfully',
      category: updatedCategory
    });

  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Failed to update category' });
  }
});

// Delete category
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if category has children
    if (category.children.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with subcategories' 
      });
    }

    // Check if category has products
    const Product = require('../models/Product');
    const productCount = await Product.countDocuments({ category: category._id });
    if (productCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with products' 
      });
    }

    // Remove from parent's children array
    if (category.parent) {
      await Category.findByIdAndUpdate(category.parent, {
        $pull: { children: category._id }
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({ message: 'Category deleted successfully' });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Failed to delete category' });
  }
});

// Initialize default categories
router.post('/initialize', authenticateToken, async (req, res) => {
  try {
    // Check if categories already exist
    const existingCategories = await Category.countDocuments();
    if (existingCategories > 0) {
      return res.status(400).json({ message: 'Categories already initialized' });
    }

    const defaultCategories = [
      {
        name: 'Fruits & Vegetables',
        slug: 'fruits-vegetables',
        icon: '🥬',
        description: 'Fresh fruits and vegetables',
        sortOrder: 1
      },
      {
        name: 'Groceries',
        slug: 'groceries',
        icon: '🛒',
        description: 'Daily grocery items',
        sortOrder: 2
      },
      {
        name: 'Dairy & Eggs',
        slug: 'dairy-eggs',
        icon: '🥛',
        description: 'Dairy products and eggs',
        sortOrder: 3
      },
      {
        name: 'Meat & Seafood',
        slug: 'meat-seafood',
        icon: '🥩',
        description: 'Fresh meat and seafood',
        sortOrder: 4
      },
      {
        name: 'Snacks & Beverages',
        slug: 'snacks-beverages',
        icon: '🍿',
        description: 'Snacks and beverages',
        sortOrder: 5
      },
      {
        name: 'Health & Beauty',
        slug: 'health-beauty',
        icon: '💄',
        description: 'Health and beauty products',
        sortOrder: 6
      },
      {
        name: 'Household',
        slug: 'household',
        icon: '🏠',
        description: 'Household essentials',
        sortOrder: 7
      },
      {
        name: 'Electronics',
        slug: 'electronics',
        icon: '📱',
        description: 'Electronic items',
        sortOrder: 8
      }
    ];

    const categories = await Category.insertMany(defaultCategories);

    res.status(201).json({
      message: 'Default categories initialized successfully',
      categories
    });

  } catch (error) {
    console.error('Initialize categories error:', error);
    res.status(500).json({ message: 'Failed to initialize categories' });
  }
});

module.exports = router;



