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

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, inviteCode } = req.body;
    const { SIGNUP_CODE } = getCodes();

    // Check if using developer code
    const isDeveloperSignup = inviteCode === DEV_CODE;

    // Validate invite code (accept either signup code or dev code)
    if (!inviteCode || (inviteCode !== SIGNUP_CODE && inviteCode !== DEV_CODE)) {
      return res.status(400).json({ message: 'Invalid invite code. Please enter a valid code to sign up.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user - if using DEV code, make them developer AND admin
    const user = new User({ 
      name, 
      email, 
      password,
      isAdmin: isDeveloperSignup,
      isDeveloper: isDeveloperSignup
    });
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
        email: user.email,
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
    const { email, password, adminCode } = req.body;
    const { ADMIN_CODE } = getCodes();

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user
    const user = await User.findOne({ email });
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
        email: user.email,
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
      email: req.user.email,
      isAdmin: req.user.isAdmin || false,
      isDeveloper: req.user.isDeveloper || false
    }
  });
});

module.exports = router;
