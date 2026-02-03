const express = require('express');
const Announcement = require('../models/Announcement');

const router = express.Router();

// @route   GET /api/announcements
// @desc    Get active announcements (public for logged-in users)
// @access  Public (but intended for authenticated users on frontend)
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    
    // Get active announcements that haven't expired
    const announcements = await Announcement.find({
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: now } }
      ]
    })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5); // Limit to 5 most recent active announcements
    
    res.json({ announcements });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
