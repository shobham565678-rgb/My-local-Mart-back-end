const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-otp');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(500).json({ message: 'Authentication error' });
  }
};

// Middleware to check user type
const requireUserType = (userType) => {
  return (req, res, next) => {
    if (req.user.userType !== userType) {
      return res.status(403).json({ 
        message: `Access denied. ${userType} role required.` 
      });
    }
    next();
  };
};

// Middleware to check if user is verified
const requireVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({ 
      message: 'Account verification required' 
    });
  }
  next();
};

// Middleware to check store ownership
const requireStoreOwnership = async (req, res, next) => {
  try {
    const Store = require('../models/Store');
    const store = await Store.findOne({ owner: req.user._id });
    
    if (!store) {
      return res.status(403).json({ 
        message: 'Store not found or access denied' 
      });
    }
    
    req.store = store;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Store verification error' });
  }
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

module.exports = {
  authenticateToken,
  requireUserType,
  requireVerified,
  requireStoreOwnership,
  generateToken
};



