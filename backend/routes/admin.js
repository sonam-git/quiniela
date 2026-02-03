const express = require('express');
const auth = require('../middleware/auth');
const { adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const Bet = require('../models/Bet');
const Schedule = require('../models/Schedule');
const Announcement = require('../models/Announcement');

const router = express.Router();

// Store codes in memory (in production, use environment variables or database)
let SIGNUP_CODE = process.env.SIGNUP_CODE || 'QL2026';
let ADMIN_CODE = process.env.ADMIN_CODE || 'QLADMIN2026';

// Export codes for use in auth routes
const getCodes = () => ({ SIGNUP_CODE, ADMIN_CODE });
const setCodes = (signupCode, adminCode) => {
  if (signupCode) SIGNUP_CODE = signupCode;
  if (adminCode) ADMIN_CODE = adminCode;
};

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/users/:userId
// @desc    Delete a user
// @access  Admin
router.delete('/users/:userId', auth, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete all bets by this user
    await Bet.deleteMany({ userId });

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/admin/users/:userId/admin
// @desc    Toggle admin status for a user
// @access  Admin
router.patch('/users/:userId/admin', auth, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isAdmin } = req.body;

    // Prevent admin from removing their own admin status
    if (userId === req.user._id.toString() && !isAdmin) {
      return res.status(400).json({ message: 'You cannot remove your own admin privileges' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isAdmin = isAdmin;
    await user.save();

    res.json({ 
      message: `Admin privileges ${isAdmin ? 'granted' : 'removed'} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Toggle admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/bets
// @desc    Get all bets for current week with user info
// @access  Admin
router.get('/bets', auth, adminAuth, async (req, res) => {
  try {
    // Get current week's schedule
    const now = new Date();
    const schedule = await Schedule.findOne({
      weekStart: { $lte: now },
      weekEnd: { $gte: now }
    });

    if (!schedule) {
      return res.json({ 
        bets: [], 
        weekInfo: { weekNumber: 0, year: 0 } 
      });
    }

    // Get all bets for this schedule
    const bets = await Bet.find({ scheduleId: schedule._id })
      .populate('userId', 'name email')
      .sort({ totalPoints: -1, createdAt: 1 });

    res.json({ 
      bets,
      weekInfo: {
        weekNumber: schedule.weekNumber,
        year: schedule.year
      }
    });
  } catch (error) {
    console.error('Get bets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/admin/bets/:betId/payment
// @desc    Update payment status for a bet
// @access  Admin
router.patch('/bets/:betId/payment', auth, adminAuth, async (req, res) => {
  try {
    const { betId } = req.params;
    const { paid } = req.body;

    const bet = await Bet.findById(betId);
    if (!bet) {
      return res.status(404).json({ message: 'Bet not found' });
    }

    bet.paid = paid;
    await bet.save();

    res.json({ 
      message: `Payment status updated to ${paid ? 'Paid' : 'Pending'}`,
      bet
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/codes
// @desc    Get current access codes
// @access  Admin
router.get('/codes', auth, adminAuth, async (req, res) => {
  try {
    res.json({
      signupCode: SIGNUP_CODE,
      adminCode: ADMIN_CODE
    });
  } catch (error) {
    console.error('Get codes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/admin/codes
// @desc    Update access codes
// @access  Admin
router.patch('/codes', auth, adminAuth, async (req, res) => {
  try {
    const { signupCode, adminCode } = req.body;

    if (!signupCode && !adminCode) {
      return res.status(400).json({ message: 'Please provide at least one code to update' });
    }

    if (signupCode) {
      if (signupCode.length < 4) {
        return res.status(400).json({ message: 'Signup code must be at least 4 characters' });
      }
      SIGNUP_CODE = signupCode;
    }

    if (adminCode) {
      if (adminCode.length < 6) {
        return res.status(400).json({ message: 'Admin code must be at least 6 characters' });
      }
      ADMIN_CODE = adminCode;
    }

    res.json({ 
      message: 'Codes updated successfully',
      signupCode: SIGNUP_CODE,
      adminCode: ADMIN_CODE
    });
  } catch (error) {
    console.error('Update codes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ ANNOUNCEMENTS ============

// @route   GET /api/admin/announcements
// @desc    Get all announcements (admin view)
// @access  Admin
router.get('/announcements', auth, adminAuth, async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json({ announcements });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/announcements
// @desc    Create a new announcement
// @access  Admin
router.post('/announcements', auth, adminAuth, async (req, res) => {
  try {
    const { title, message, expiresAt } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    if (title.length > 100) {
      return res.status(400).json({ message: 'Title must be 100 characters or less' });
    }

    if (message.length > 500) {
      return res.status(400).json({ message: 'Message must be 500 characters or less' });
    }

    const announcement = new Announcement({
      title: title.trim(),
      message: message.trim(),
      createdBy: req.user._id,
      expiresAt: expiresAt || null
    });

    await announcement.save();
    await announcement.populate('createdBy', 'name');

    res.status(201).json({ 
      message: 'Announcement created successfully',
      announcement 
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/admin/announcements/:id
// @desc    Update announcement (toggle active status)
// @access  Admin
router.patch('/announcements/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, title, message } = req.body;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    if (typeof isActive === 'boolean') {
      announcement.isActive = isActive;
    }
    if (title) {
      announcement.title = title.trim();
    }
    if (message) {
      announcement.message = message.trim();
    }

    await announcement.save();
    await announcement.populate('createdBy', 'name');

    res.json({ 
      message: 'Announcement updated successfully',
      announcement 
    });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/announcements/:id
// @desc    Delete an announcement
// @access  Admin
router.delete('/announcements/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    await Announcement.findByIdAndDelete(id);

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
module.exports.getCodes = getCodes;
module.exports.setCodes = setCodes;
