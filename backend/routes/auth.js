const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get codes dynamically from admin module (lazy loaded to avoid circular dependency)
const getCodes = () => {
  try {
    const { getCodes: getAdminCodes } = require('./admin');
    return getAdminCodes();
  } catch {
    return {
      SIGNUP_CODE: process.env.SIGNUP_CODE || 'QL2026',
      ADMIN_CODE: process.env.ADMIN_CODE || 'QLADMIN2026'
    };
  }
};

// Developer code from environment variable
const DEV_CODE = process.env.DEV_CODE || 'DEV2026';

// Helper to detect if input is email or phone
const isEmail = (input) => {
  return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(input);
};

const isPhone = (input) => {
  return /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/.test(input);
};

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const { name, email, phone, password, inviteCode } = req.body;
    const { SIGNUP_CODE } = getCodes();

    // Check if using developer code
    const isDeveloperSignup = inviteCode === DEV_CODE;

    // Validate invite code (accept either signup code or dev code)
    if (!inviteCode || (inviteCode !== SIGNUP_CODE && inviteCode !== DEV_CODE)) {
      return res.status(400).json({ message: 'Invalid invite code. Please enter a valid code to sign up.' });
    }

    // Validate that either email or phone is provided
    if (!email && !phone) {
      return res.status(400).json({ message: 'Please provide either an email or phone number' });
    }

    // Check if user already exists with email or phone
    if (email) {
      const existingEmailUser = await User.findOne({ email: email.toLowerCase() });
      if (existingEmailUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }
    }
    
    if (phone) {
      const existingPhoneUser = await User.findOne({ phone });
      if (existingPhoneUser) {
        return res.status(400).json({ message: 'User already exists with this phone number' });
      }
    }

    // Create new user - if using DEV code, make them developer AND admin
    const userData = { 
      name, 
      password,
      isAdmin: isDeveloperSignup,
      isDeveloper: isDeveloperSignup
    };
    
    if (email) userData.email = email.toLowerCase();
    if (phone) userData.phone = phone;

    const user = new User(userData);
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: isDeveloperSignup ? 'Developer account created successfully' : 'User created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email || null,
        phone: user.phone || null,
        isAdmin: user.isAdmin,
        isDeveloper: user.isDeveloper
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user and return JWT
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, phone, identifier, password, adminCode } = req.body;
    const { ADMIN_CODE } = getCodes();

    // Support both old (email) and new (identifier) login methods
    const loginIdentifier = identifier || email || phone;

    // Validate input
    if (!loginIdentifier || !password) {
      return res.status(400).json({ message: 'Please provide email/phone and password' });
    }

    // Find user by email or phone
    let user;
    if (isEmail(loginIdentifier)) {
      user = await User.findOne({ email: loginIdentifier.toLowerCase() });
    } else if (isPhone(loginIdentifier)) {
      user = await User.findOne({ phone: loginIdentifier });
    } else {
      // Try both
      user = await User.findOne({ 
        $or: [
          { email: loginIdentifier.toLowerCase() },
          { phone: loginIdentifier }
        ]
      });
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if admin code is provided and valid
    let isAdminSession = false;
    if (adminCode) {
      if (adminCode === ADMIN_CODE) {
        isAdminSession = true;
        // Optionally persist admin status to user record
        if (!user.isAdmin) {
          user.isAdmin = true;
          await user.save();
        }
      } else {
        return res.status(400).json({ message: 'Invalid admin code' });
      }
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, isAdmin: isAdminSession || user.isAdmin, isDeveloper: user.isDeveloper },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email || null,
        phone: user.phone || null,
        isAdmin: isAdminSession || user.isAdmin,
        isDeveloper: user.isDeveloper || false
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email || null,
      phone: req.user.phone || null,
      isAdmin: req.user.isAdmin || false,
      isDeveloper: req.user.isDeveloper || false
    }
  });
});

module.exports = router;
