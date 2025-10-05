const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken } = require('../middlewares/auth');
const twilio = require('twilio');

const router = express.Router();

// Initialize Twilio client (only if credentials are provided)
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  } catch (error) {
    console.warn('Twilio initialization failed:', error.message);
  }
}

// Send OTP
router.post('/send-otp', [
  body('phone').isMobilePhone().withMessage('Valid phone number required'),
  body('userType').isIn(['customer', 'store_owner']).withMessage('Valid user type required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, userType } = req.body;

    // Find or create user
    let user = await User.findOne({ phone });
    if (!user) {
      user = new User({ phone, userType });
    } else {
      // Update user type if changed
      if (user.userType !== userType) {
        user.userType = userType;
      }
    }

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP via Twilio (if configured)
    if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
      try {
        await twilioClient.messages.create({
          body: `Your MyLocalMart OTP is: ${otp}. Valid for 10 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone
        });
        console.log(`OTP sent via Twilio to ${phone}`);
      } catch (twilioError) {
        console.error('Twilio error:', twilioError);
        // Continue execution even if Twilio fails
      }
    } else {
      // In development or when Twilio is not configured, log the OTP
      console.log(`[DEVELOPMENT] OTP for ${phone}: ${otp}`);
      console.log('Note: Configure Twilio credentials to send real SMS');
    }

    res.json({
      message: 'OTP sent successfully',
      // In development, include OTP for testing
      ...(process.env.NODE_ENV !== 'production' && { otp })
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

// Verify OTP and login
router.post('/verify-otp', [
  body('phone').isMobilePhone().withMessage('Valid phone number required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('6-digit OTP required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, otp } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Verify OTP
    if (!user.verifyOTP(otp)) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Mark user as verified and clear OTP
    user.isVerified = true;
    user.clearOTP();
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        phone: user.phone,
        userType: user.userType,
        profile: user.profile,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
});

// Get current user profile
router.get('/profile', require('../middlewares/auth').authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-otp');
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get profile' });
  }
});

// Update user profile
router.put('/profile', [
  require('../middlewares/auth').authenticateToken,
  body('profile.firstName').optional().isLength({ min: 1 }).withMessage('First name required'),
  body('profile.lastName').optional().isLength({ min: 1 }).withMessage('Last name required'),
  body('profile.email').optional().isEmail().withMessage('Valid email required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { profile } = req.body;
    const user = await User.findById(req.user._id);

    if (profile) {
      user.profile = { ...user.profile, ...profile };
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        phone: user.phone,
        userType: user.userType,
        profile: user.profile,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Logout
router.post('/logout', require('../middlewares/auth').authenticateToken, async (req, res) => {
  try {
    // In a more sophisticated setup, you might want to blacklist the token
    // For now, we'll just return success
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Failed to logout' });
  }
});

// Refresh token
router.post('/refresh', require('../middlewares/auth').authenticateToken, async (req, res) => {
  try {
    const newToken = generateToken(req.user._id);
    res.json({
      message: 'Token refreshed successfully',
      token: newToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Failed to refresh token' });
  }
});

module.exports = router;



