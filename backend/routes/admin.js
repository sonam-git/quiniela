const express = require('express');
const auth = require('../middleware/auth');
const { adminAuth, developerAuth } = require('../middleware/auth');
const User = require('../models/User');
const Bet = require('../models/Bet');
const GuestBet = require('../models/GuestBet');
const Schedule = require('../models/Schedule');
const Announcement = require('../models/Announcement');
const Settings = require('../models/Settings');

const router = express.Router();

// Helper function to get week number from a date
const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

// Helper function to calculate bets with live points for real-time updates
const calculateBetsWithLivePoints = async (schedule) => {
  if (!schedule) return [];
  
  try {
    // Fetch all bets for this week
    const userBets = await Bet.find({ 
      weekNumber: schedule.weekNumber, 
      year: schedule.year,
      isGuestBet: { $ne: true }
    }).populate('userId', 'name email');
    
    const guestBets = await GuestBet.find({ 
      weekNumber: schedule.weekNumber, 
      year: schedule.year 
    }).populate('sponsorUserId', 'name');
    
    // Transform guest bets to match user bet format
    const transformedGuestBets = guestBets.map(gb => ({
      _id: gb._id,
      isGuestBet: true,
      participantName: gb.participantName,
      userId: { _id: gb.sponsorUserId?._id, name: gb.sponsorUserId?.name },
      weekNumber: gb.weekNumber,
      year: gb.year,
      predictions: gb.predictions,
      totalGoals: gb.totalGoals,
      totalPoints: gb.totalPoints,
      goalDifference: gb.goalDifference,
      paid: gb.paid,
      createdAt: gb.createdAt,
      updatedAt: gb.updatedAt
    }));
    
    // Combine all bets
    let bets = [...userBets.map(b => b.toObject()), ...transformedGuestBets];
    
    // Calculate actual total goals from completed matches
    const actualTotalGoals = schedule.matches.reduce((sum, match) => {
      if (match.isCompleted) {
        return sum + (match.scoreTeamA || 0) + (match.scoreTeamB || 0);
      }
      return sum;
    }, 0);
    
    // Calculate live points for each bet
    for (const bet of bets) {
      let livePoints = 0;
      
      for (const prediction of bet.predictions) {
        // Use find instead of .id() for better compatibility
        const matchIdStr = prediction.matchId?.toString();
        const match = schedule.matches.find(m => m._id?.toString() === matchIdStr);
        if (match && match.isCompleted && match.result === prediction.prediction) {
          livePoints += 1;
        }
      }
      
      // Calculate goal difference (only meaningful when all matches complete)
      const allCompleted = schedule.matches.every(m => m.isCompleted);
      const goalDifference = allCompleted 
        ? Math.abs(bet.totalGoals - actualTotalGoals)
        : null;
      
      bet.totalPoints = livePoints;
      bet.goalDifference = goalDifference;
    }
    
    // Sort by points (desc), then by goal difference (asc - closest wins)
    bets.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      if (a.goalDifference === null && b.goalDifference === null) return 0;
      if (a.goalDifference === null) return 1;
      if (b.goalDifference === null) return -1;
      return a.goalDifference - b.goalDifference;
    });
    
    return bets;
  } catch (error) {
    console.error('Error calculating bets with live points:', error);
    return [];
  }
};

// Load codes from environment variables with fallbacks
let SIGNUP_CODE = process.env.SIGNUP_CODE || 'QL2026';
let ADMIN_CODE = process.env.ADMIN_CODE || 'QLADMIN2026';
const DEV_CODE = process.env.DEV_CODE || 'DEV2026'; // Developer code - cannot be changed at runtime

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

    // Prevent deleting developer accounts
    if (user.isDeveloper) {
      return res.status(403).json({ message: 'Cannot delete developer accounts. Developer accounts are protected.' });
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

    // Prevent demoting developer accounts
    if (user.isDeveloper && !isAdmin) {
      return res.status(403).json({ message: 'Cannot remove admin privileges from developer accounts. Developer accounts are protected.' });
    }

    user.isAdmin = isAdmin;
    await user.save();

    // Emit real-time update for admin status change
    const io = req.app.get('io');
    if (io) {
      io.emit('admin:update', { 
        action: isAdmin ? 'granted' : 'removed', 
        userId: user._id,
        isAdmin: user.isAdmin
      });
    }

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

// @route   POST /api/admin/upgrade-to-developer
// @desc    Upgrade current user to developer status using DEV code
// @access  Admin (with DEV code)
router.post('/upgrade-to-developer', auth, async (req, res) => {
  try {
    const { devCode } = req.body;

    if (!devCode || devCode !== DEV_CODE) {
      return res.status(403).json({ message: 'Invalid developer code' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isDeveloper) {
      return res.status(400).json({ message: 'User is already a developer' });
    }

    user.isDeveloper = true;
    user.isAdmin = true;
    await user.save();

    res.json({ 
      message: 'Successfully upgraded to developer status',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        isDeveloper: user.isDeveloper
      }
    });
  } catch (error) {
    console.error('Upgrade to developer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/bets
// @desc    Get all bets for current week with user info
// @access  Admin
router.get('/bets', auth, adminAuth, async (req, res) => {
  try {
    const now = new Date();
    let weekNumber = getWeekNumber(now);
    let year = now.getFullYear();

    // Find the oldest unsettled schedule (this is the active betting week)
    // This ensures consistency with the payments endpoint
    let schedule = await Schedule.findOne({ 
      isSettled: false,
      year: { $gte: year - 1 }
    }).sort({ year: 1, weekNumber: 1 });

    // If found an unsettled schedule, use its week
    if (schedule) {
      weekNumber = schedule.weekNumber;
      year = schedule.year;
      console.log(`📊 Admin Bets: Using unsettled schedule - Week ${weekNumber}, Year ${year}`);
    } else {
      // Fall back to calculated week if no unsettled schedule
      schedule = await Schedule.findOne({ weekNumber, year });
      console.log(`📊 Admin Bets: No unsettled schedule found, using calculated Week ${weekNumber}, Year ${year}`);
    }

    if (!schedule) {
      return res.json({ 
        bets: [], 
        weekInfo: { weekNumber, year } 
      });
    }

    // Get all bets for this week (using weekNumber/year for consistency)
    const bets = await Bet.find({ weekNumber, year, isGuestBet: { $ne: true }, isPlaceholder: { $ne: true } })
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
// @desc    Update payment status for a bet (supports both user bets and guest bets)
// @access  Admin
router.patch('/bets/:betId/payment', auth, adminAuth, async (req, res) => {
  try {
    const { betId } = req.params;
    const { paid, isGuestBet } = req.body;

    let bet;
    
    if (isGuestBet) {
      // Update guest bet from GuestBet model
      bet = await GuestBet.findById(betId);
      if (!bet) {
        return res.status(404).json({ message: 'Guest bet not found' });
      }
      bet.paid = paid;
      await bet.save();
    } else {
      // Update user bet from Bet model
      bet = await Bet.findById(betId);
      if (!bet) {
        return res.status(404).json({ message: 'Bet not found' });
      }
      bet.paid = paid;
      await bet.save();
    }

    // Emit real-time update for payment status change
    const io = req.app.get('io');
    if (io) {
      const updateData = { 
        action: 'update', 
        betId: bet._id.toString(), 
        paid,
        isGuestBet: !!isGuestBet
      };
      if (!isGuestBet && bet.userId) {
        updateData.userId = bet.userId.toString();
      }
      io.emit('payments:update', updateData);
    }

    res.json({ 
      message: `Payment status updated to ${paid ? 'Paid' : 'Pending'}`,
      bet
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/bets/:betId
// @desc    Delete any bet (including guest bets) - Admin only
// @access  Admin
router.delete('/bets/:betId', auth, adminAuth, async (req, res) => {
  try {
    const { betId } = req.params;
    const { isGuestBet } = req.query; // Pass isGuestBet=true for guest bets

    let bet;
    let weekNumber, year, participantName, oderId;

    if (isGuestBet === 'true') {
      // Delete from GuestBet model
      bet = await GuestBet.findById(betId);
      if (!bet) {
        return res.status(404).json({ message: 'Guest bet not found' });
      }
      weekNumber = bet.weekNumber;
      year = bet.year;
      participantName = bet.participantName;
      oderId = bet.sponsorUserId;
      await GuestBet.findByIdAndDelete(betId);
    } else {
      // Delete from Bet model
      bet = await Bet.findById(betId);
      if (!bet) {
        return res.status(404).json({ message: 'Bet not found' });
      }
      weekNumber = bet.weekNumber;
      year = bet.year;
      participantName = bet.participantName;
      oderId = bet.userId;
      await Bet.findByIdAndDelete(betId);
    }

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('bets:update', { 
        action: 'delete', 
        weekNumber, 
        year,
        betId: bet._id.toString(),
        userId: oderId?.toString(),
        isGuestBet: isGuestBet === 'true',
        participantName
      });
    }

    res.json({ 
      message: isGuestBet === 'true'
        ? `Guest bet for "${participantName}" deleted successfully`
        : 'Bet deleted successfully'
    });
  } catch (error) {
    console.error('Admin delete bet error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/admin/users/:userId/payment
// @desc    Update payment status for a user (creates placeholder bet if needed)
// @access  Admin
router.patch('/users/:userId/payment', auth, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body; // 'paid', 'pending', 'na'

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const now = new Date();
    let weekNumber = getWeekNumber(now);
    let year = now.getFullYear();

    // Check if current week's schedule is settled - if so, use next week
    let schedule = await Schedule.findOne({ weekNumber, year });
    
    if (schedule && schedule.isSettled) {
      const nextWeek = weekNumber + 1;
      const nextYear = nextWeek > 52 ? year + 1 : year;
      const actualNextWeek = nextWeek > 52 ? 1 : nextWeek;
      
      const nextWeekSchedule = await Schedule.findOne({ 
        weekNumber: actualNextWeek, 
        year: nextYear 
      });
      
      // If next week's schedule exists and isn't settled, use it
      if (nextWeekSchedule && !nextWeekSchedule.isSettled) {
        weekNumber = actualNextWeek;
        year = nextYear;
        schedule = nextWeekSchedule;
      }
    }

    const scheduleId = schedule?._id || null;

    // Find existing bet for this user and week (exclude any legacy guest bets)
    let bet = await Bet.findOne({
      userId,
      weekNumber,
      year,
      isGuestBet: { $ne: true }
    });

    if (status === 'na') {
      // If setting to N/A and there's a placeholder bet (no predictions), delete it
      if (bet && bet.isPlaceholder) {
        await Bet.findByIdAndDelete(bet._id);
        // Emit real-time update
        const io = req.app.get('io');
        if (io) {
          io.emit('payments:update', { action: 'delete', userId: userId.toString(), status: 'na' });
        }
        return res.json({ 
          message: 'Payment status set to N/A',
          status: 'na'
        });
      } else if (bet) {
        // User has actual bet, just mark as unpaid
        bet.paid = false;
        await bet.save();
        // Emit real-time update
        const io = req.app.get('io');
        if (io) {
          io.emit('payments:update', { action: 'update', userId: userId.toString(), status: 'pending', betId: bet._id.toString(), paid: false });
        }
        return res.json({ 
          message: 'Payment status set to Pending (user has active bet)',
          status: 'pending',
          bet
        });
      }
      return res.json({ 
        message: 'Payment status is already N/A',
        status: 'na'
      });
    }

    if (bet) {
      // Update existing bet
      bet.paid = status === 'paid';
      await bet.save();
    } else {
      // Create a placeholder bet for payment tracking only
      const betData = {
        userId,
        weekNumber,
        year,
        totalGoals: 0,
        predictions: [],
        paid: status === 'paid',
        isPlaceholder: true
      };
      
      // Only add scheduleId if we have a schedule
      if (scheduleId) {
        betData.scheduleId = scheduleId;
      }
      
      bet = new Bet(betData);
      await bet.save();
    }

    // Emit real-time update for payment status change
    const io = req.app.get('io');
    if (io) {
      io.emit('payments:update', { 
        action: 'update', 
        userId: userId.toString(), 
        status, 
        betId: bet._id.toString(),
        paid: status === 'paid'
      });
    }

    res.json({ 
      message: `Payment status updated to ${status === 'paid' ? 'Paid' : 'Pending'}`,
      status,
      bet
    });
  } catch (error) {
    console.error('Update user payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/payments
// @desc    Get only users and guests with bets for current week (payment tracking)
// @access  Admin
router.get('/payments', auth, adminAuth, async (req, res) => {
  try {
    const now = new Date();
    let weekNumber = getWeekNumber(now);
    let year = now.getFullYear();

    // Find the oldest unsettled schedule (this is the active betting week)
    let schedule = await Schedule.findOne({ 
      isSettled: false,
      year: { $gte: year - 1 }
    }).sort({ year: 1, weekNumber: 1 });

    // If found an unsettled schedule, use its week
    if (schedule) {
      weekNumber = schedule.weekNumber;
      year = schedule.year;
      console.log(`💳 Admin Payments: Using unsettled schedule - Week ${weekNumber}, Year ${year}`);
    } else {
      // Fall back to calculated week if no unsettled schedule
      schedule = await Schedule.findOne({ weekNumber, year });
      console.log(`💳 Admin Payments: No unsettled schedule found, using calculated Week ${weekNumber}, Year ${year}`);
    }

    // Get all user bets for this week (excluding placeholders and guest bets)
    const userBets = await Bet.find({ 
      weekNumber, 
      year, 
      isGuestBet: { $ne: true },
      isPlaceholder: { $ne: true }
    }).populate('userId', 'name email isAdmin isDeveloper');
    
    // Get all guest bets from the GuestBet model
    const guestBets = await GuestBet.find({ weekNumber, year })
      .populate('sponsorUserId', 'name');
    
    console.log(`💳 Admin Payments: Found ${userBets.length} user bets and ${guestBets.length} guest bets for Week ${weekNumber}`);

    // Build payments data from actual bets only
    const paymentsData = [];

    // Add user bets to payments data
    userBets.forEach(bet => {
      if (bet.userId) {
        paymentsData.push({
          oderId: `user_${bet._id}`,
          odaUserId: bet.userId._id,
          name: bet.userId.name || 'Unknown User',
          email: bet.userId.email,
          isAdmin: bet.userId.isAdmin || false,
          isDeveloper: bet.userId.isDeveloper || false,
          hasBet: true,
          isPlaceholder: false,
          betId: bet._id,
          paid: bet.paid || false,
          paymentStatus: bet.paid ? 'paid' : 'pending',
          totalPoints: bet.totalPoints || 0,
          totalGoals: bet.totalGoals ?? null,
          createdAt: bet.createdAt,
          isGuestBet: false
        });
      }
    });

    // Add guest bets to the payments data
    guestBets.forEach(guestBet => {
      paymentsData.push({
        oderId: `guest_${guestBet._id}`,
        sponsorUserId: guestBet.sponsorUserId?._id || guestBet.sponsorUserId,
        name: guestBet.participantName,
        email: null,
        isAdmin: false,
        isDeveloper: false,
        hasBet: true,
        isPlaceholder: false,
        betId: guestBet._id,
        paid: guestBet.paid || false,
        paymentStatus: guestBet.paid ? 'paid' : 'pending',
        totalPoints: guestBet.totalPoints || 0,
        totalGoals: guestBet.totalGoals ?? null,
        createdAt: guestBet.createdAt,
        isGuestBet: true,
        managedBy: guestBet.sponsorUserId?.name || 'Unknown',
        managedByUserId: guestBet.sponsorUserId?._id || guestBet.sponsorUserId
      });
    });

    // Sort by name alphabetically
    paymentsData.sort((a, b) => a.name.localeCompare(b.name));

    res.json({ 
      payments: paymentsData,
      weekInfo: {
        weekNumber,
        year,
        jornada: schedule?.jornada || null
      }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/codes
// @desc    Get current access codes
// @access  Developer only
router.get('/codes', auth, developerAuth, async (req, res) => {
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
// @access  Developer only
router.patch('/codes', auth, developerAuth, async (req, res) => {
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

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('announcement:update', { action: 'create', announcementId: announcement._id });
    }

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

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('announcement:update', { action: 'update', announcementId: announcement._id });
    }

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

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('announcement:update', { action: 'delete', announcementId: id });
    }

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/schedule
// @desc    Get current week's schedule for admin (oldest unsettled schedule)
// @access  Admin
router.get('/schedule', auth, adminAuth, async (req, res) => {
  try {
    const now = new Date();
    let weekNumber = getWeekNumber(now);
    let year = now.getFullYear();

    // Find the oldest unsettled schedule (this is the active week)
    let schedule = await Schedule.findOne({ 
      isSettled: false,
      year: { $gte: year - 1 }
    }).sort({ year: 1, weekNumber: 1 });

    // Update weekNumber/year to match found schedule
    if (schedule) {
      weekNumber = schedule.weekNumber;
      year = schedule.year;
    }

    if (!schedule) {
      return res.status(404).json({ 
        message: 'No unsettled schedule found',
        weekNumber,
        year
      });
    }

    res.json({ 
      schedule,
      weekNumber,
      year,
      jornada: schedule.jornada
    });
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/admin/schedule/match/:matchId
// @desc    Update a single match score
// @access  Admin
router.patch('/schedule/match/:matchId', auth, adminAuth, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { scoreTeamA, scoreTeamB } = req.body;

    // Validate scores
    if (scoreTeamA === undefined || scoreTeamB === undefined) {
      return res.status(400).json({ message: 'Both scores are required' });
    }

    const scoreA = parseInt(scoreTeamA);
    const scoreB = parseInt(scoreTeamB);

    if (isNaN(scoreA) || isNaN(scoreB) || scoreA < 0 || scoreB < 0) {
      return res.status(400).json({ message: 'Scores must be non-negative numbers' });
    }

    // Find the schedule containing this match
    const schedule = await Schedule.findOne({ 'matches._id': matchId });
    
    if (!schedule) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Find and update the specific match
    const match = schedule.matches.id(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found in schedule' });
    }

    match.scoreTeamA = scoreA;
    match.scoreTeamB = scoreB;
    match.isCompleted = true;

    // Determine result
    if (scoreA > scoreB) {
      match.result = 'teamA';
    } else if (scoreB > scoreA) {
      match.result = 'teamB';
    } else {
      match.result = 'draw';
    }

    await schedule.save();

    // Calculate bets with updated live points for real-time updates
    const updatedBets = await calculateBetsWithLivePoints(schedule);
    
    // Calculate actual total goals
    const actualTotalGoals = schedule.matches.reduce((sum, m) => {
      if (m.isCompleted) {
        return sum + (m.scoreTeamA || 0) + (m.scoreTeamB || 0);
      }
      return sum;
    }, 0);

    // Emit real-time update for match score change with full match data AND updated bets
    const io = req.app.get('io');
    if (io) {
      io.emit('results:update', { 
        action: 'score', 
        matchId, 
        weekNumber: schedule.weekNumber, 
        year: schedule.year,
        // Include match data for targeted frontend updates
        scoreTeamA: match.scoreTeamA,
        scoreTeamB: match.scoreTeamB,
        isCompleted: match.isCompleted,
        result: match.result,
        match: match.toObject(),
        // Include updated bets with recalculated points
        bets: updatedBets,
        actualTotalGoals
      });
    }

    res.json({ 
      message: 'Match score updated successfully',
      match,
      schedule
    });
  } catch (error) {
    console.error('Update match score error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/admin/schedule/match/:matchId/reset
// @desc    Reset a match score (mark as not completed)
// @access  Admin
router.patch('/schedule/match/:matchId/reset', auth, adminAuth, async (req, res) => {
  try {
    const { matchId } = req.params;

    const schedule = await Schedule.findOne({ 'matches._id': matchId });
    
    if (!schedule) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const match = schedule.matches.id(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found in schedule' });
    }

    match.scoreTeamA = null;
    match.scoreTeamB = null;
    match.result = null;
    match.isCompleted = false;

    await schedule.save();

    // Calculate bets with updated live points for real-time updates
    const updatedBets = await calculateBetsWithLivePoints(schedule);
    
    // Calculate actual total goals
    const actualTotalGoals = schedule.matches.reduce((sum, m) => {
      if (m.isCompleted) {
        return sum + (m.scoreTeamA || 0) + (m.scoreTeamB || 0);
      }
      return sum;
    }, 0);

    // Emit real-time update for match reset with full match data AND updated bets
    const io = req.app.get('io');
    if (io) {
      io.emit('results:update', { 
        action: 'reset', 
        matchId, 
        weekNumber: schedule.weekNumber, 
        year: schedule.year,
        // Include reset state for targeted frontend updates
        scoreTeamA: null,
        scoreTeamB: null,
        isCompleted: false,
        result: null,
        match: match.toObject(),
        // Include updated bets with recalculated points
        bets: updatedBets,
        actualTotalGoals
      });
    }

    res.json({ 
      message: 'Match score reset successfully',
      match,
      schedule
    });
  } catch (error) {
    console.error('Reset match score error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/schedule/settle
// @desc    Settle the week (calculate total goals, determine winners with tiebreaker)
// @access  Admin
router.post('/schedule/settle', auth, adminAuth, async (req, res) => {
  try {
    const now = new Date();
    let year = now.getFullYear();

    // Find the oldest unsettled schedule (this is the active week to settle)
    let schedule = await Schedule.findOne({ 
      isSettled: false,
      year: { $gte: year - 1 }
    }).sort({ year: 1, weekNumber: 1 });
    
    if (!schedule) {
      return res.status(404).json({ message: 'No unsettled schedule found to settle' });
    }

    const weekNumber = schedule.weekNumber;
    year = schedule.year;
    
    console.log(`📋 Settling schedule: Week ${weekNumber}, Year ${year}, Jornada ${schedule.jornada}`);

    // Check if all matches are completed
    const allCompleted = schedule.matches.every(m => m.isCompleted);
    if (!allCompleted) {
      return res.status(400).json({ 
        message: 'Cannot settle week - not all matches are completed',
        completedCount: schedule.matches.filter(m => m.isCompleted).length,
        totalMatches: schedule.matches.length
      });
    }

    // Calculate total goals
    const actualTotalGoals = schedule.matches.reduce((sum, match) => {
      return sum + (match.scoreTeamA || 0) + (match.scoreTeamB || 0);
    }, 0);

    schedule.actualTotalGoals = actualTotalGoals;

    // Get all regular bets for this week (exclude placeholders)
    const bets = await Bet.find({ weekNumber, year, isPlaceholder: { $ne: true }, isGuestBet: { $ne: true } });

    // Calculate points and goal difference for each regular bet
    for (const bet of bets) {
      let totalPoints = 0;

      // Calculate points for correct predictions
      for (const prediction of bet.predictions) {
        const match = schedule.matches.id(prediction.matchId);
        if (match && match.isCompleted && match.result === prediction.prediction) {
          totalPoints += 1;
        }
      }

      // Calculate goal difference (how close their prediction was)
      const goalDifference = Math.abs(bet.totalGoals - actualTotalGoals);

      bet.totalPoints = totalPoints;
      bet.goalDifference = goalDifference;
      bet.isWinner = false; // Reset, will be set after sorting

      await bet.save();
    }

    // Get all guest bets for this week
    const guestBets = await GuestBet.find({ weekNumber, year });

    // Calculate points and goal difference for each guest bet
    for (const guestBet of guestBets) {
      let totalPoints = 0;

      // Calculate points for correct predictions
      for (const prediction of guestBet.predictions) {
        const match = schedule.matches.id(prediction.matchId);
        if (match && match.isCompleted && match.result === prediction.prediction) {
          totalPoints += 1;
        }
      }

      // Calculate goal difference
      const goalDifference = Math.abs(guestBet.totalGoals - actualTotalGoals);

      guestBet.totalPoints = totalPoints;
      guestBet.goalDifference = goalDifference;
      guestBet.isWinner = false; // Reset, will be set after sorting

      await guestBet.save();
    }

    // Combine all bets for ranking
    const allBetsForRanking = [
      ...await Bet.find({ weekNumber, year, isPlaceholder: { $ne: true }, isGuestBet: { $ne: true } }),
      ...await GuestBet.find({ weekNumber, year })
    ];

    // Sort all bets: by points (desc), then by goal difference (asc - closest wins)
    allBetsForRanking.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      return a.goalDifference - b.goalDifference;
    });

    // Determine winners with tie-breaker logic
    if (allBetsForRanking.length > 0) {
      const topBet = allBetsForRanking[0];
      
      // Mark all bets with the same points AND goal difference as winners
      for (const bet of allBetsForRanking) {
        if (bet.totalPoints === topBet.totalPoints && 
            bet.goalDifference === topBet.goalDifference) {
          bet.isWinner = true;
          await bet.save();
        } else {
          // Once we find someone with different stats, stop
          break;
        }
      }
    }

    // Mark schedule as settled
    schedule.isSettled = true;
    schedule.settledBy = req.user._id;
    schedule.settledAt = new Date();
    await schedule.save();

    // NOTE: Next schedule must be created manually by admin via the Create Schedule UI
    // Auto-creation from seed data has been removed

    // Emit real-time update for week settled
    const io = req.app.get('io');
    if (io) {
      io.emit('week:settled', { 
        weekNumber, 
        year, 
        actualTotalGoals,
        winnersCount: allBetsForRanking.filter(b => b.isWinner).length
      });
    }

    // Get final results with user info (regular bets)
    const finalBets = await Bet.find({ weekNumber, year, isPlaceholder: { $ne: true }, isGuestBet: { $ne: true } })
      .populate('userId', 'name email')
      .sort({ totalPoints: -1, goalDifference: 1 });

    // Get final guest bets
    const finalGuestBets = await GuestBet.find({ weekNumber, year })
      .populate('sponsorUserId', 'name email')
      .sort({ totalPoints: -1, goalDifference: 1 });

    // Combine all winners
    const allWinners = [
      ...finalBets.filter(b => b.isWinner).map(w => ({
        name: w.userId?.name,
        points: w.totalPoints,
        goalDifference: w.goalDifference,
        predictedGoals: w.totalGoals,
        isGuest: false
      })),
      ...finalGuestBets.filter(b => b.isWinner).map(w => ({
        name: w.participantName,
        points: w.totalPoints,
        goalDifference: w.goalDifference,
        predictedGoals: w.totalGoals,
        isGuest: true,
        sponsorName: w.sponsorUserId?.name
      }))
    ];

    res.json({ 
      message: 'Week settled successfully',
      schedule,
      actualTotalGoals,
      winners: allWinners,
      bets: finalBets,
      guestBets: finalGuestBets
    });
  } catch (error) {
    console.error('Settle week error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/schedule/settled-results
// @desc    Delete the most recently settled week's results (after prize distribution)
// @access  Admin
router.delete('/schedule/settled-results', auth, adminAuth, async (req, res) => {
  try {
    // Find the most recently settled schedule
    const schedule = await Schedule.findOne({ 
      isSettled: true 
    }).sort({ settledAt: -1 });

    if (!schedule) {
      return res.status(404).json({ message: 'No settled results found to delete' });
    }

    const weekNumber = schedule.weekNumber;
    const year = schedule.year;

    // Delete the schedule
    await Schedule.deleteOne({ _id: schedule._id });

    // Delete associated bets
    await Bet.deleteMany({ weekNumber, year });

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('results:deleted', { weekNumber, year });
    }

    res.json({ 
      message: 'Settled results deleted successfully',
      deletedWeek: weekNumber,
      deletedYear: year
    });
  } catch (error) {
    console.error('Delete settled results error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== SCHEDULE MANAGEMENT ====================

// @route   GET /api/admin/schedules
// @desc    Get all schedules
// @access  Admin
router.get('/schedules', auth, adminAuth, async (req, res) => {
  try {
    const schedules = await Schedule.find()
      .sort({ year: -1, weekNumber: -1 });
    res.json({ schedules });
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/schedules/:scheduleId
// @desc    Get a specific schedule
// @access  Admin
router.get('/schedules/:scheduleId', auth, adminAuth, async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    res.json({ schedule });
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/schedules/:scheduleId/match/:matchId
// @desc    Update a specific match in a schedule (admin override)
// @access  Admin
router.put('/schedules/:scheduleId/match/:matchId', auth, adminAuth, async (req, res) => {
  try {
    const { scheduleId, matchId } = req.params;
    const { teamA, teamB, startTime } = req.body;

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Find the match
    const match = schedule.matches.id(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Admin can update match details anytime (even after games start)
    // This allows fixing errors in team names or times

    // Update match fields
    if (teamA) match.teamA = teamA;
    if (teamB) match.teamB = teamB;
    if (startTime) match.startTime = new Date(startTime);

    // Mark as admin-modified
    schedule.dataSource = 'admin';
    await schedule.save();

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('schedule:updated', { schedule });
    }

    res.json({ message: 'Match updated successfully', schedule });
  } catch (error) {
    console.error('Update match error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/schedules/create
// @desc    Manually create a new schedule (admin)
// @access  Admin
router.post('/schedules/create', auth, adminAuth, async (req, res) => {
  try {
    const { weekNumber, year, jornada, matches } = req.body;

    // Validate
    if (!weekNumber || !year || !matches || matches.length !== 9) {
      return res.status(400).json({ message: 'Invalid schedule data. Must have weekNumber, year, and exactly 9 matches.' });
    }

    // Check if schedule already exists
    const existing = await Schedule.findOne({ weekNumber, year });
    if (existing) {
      return res.status(400).json({ message: `Schedule already exists for Week ${weekNumber}/${year}` });
    }

    // Format matches
    const formattedMatches = matches.map(m => ({
      teamA: m.teamA || m.home,
      teamB: m.teamB || m.away,
      teamAIsHome: true,
      startTime: new Date(m.startTime || `${m.date}T${m.time}`),
      isCompleted: false,
      scoreTeamA: null,
      scoreTeamB: null,
      result: null,
      apiFixtureId: m.apiFixtureId || null
    }));

    const schedule = await Schedule.create({
      weekNumber,
      year,
      jornada: jornada || null,
      matches: formattedMatches,
      dataSource: 'admin',
      isSettled: false,
      actualTotalGoals: null
    });

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('schedule:created', { schedule });
    }

    res.status(201).json({ message: 'Schedule created successfully', schedule });
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/schedules/:scheduleId
// @desc    Delete a schedule
// @access  Admin
router.delete('/schedules/:scheduleId', auth, adminAuth, async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Admin can delete schedule anytime (even after matches have started)
    // This allows fixing major errors if needed

    const weekNumber = schedule.weekNumber;
    const year = schedule.year;
    const scheduleId = schedule._id.toString();

    // Delete associated bets
    await Bet.deleteMany({ scheduleId: schedule._id });

    // Delete schedule
    await Schedule.findByIdAndDelete(schedule._id);

    // Emit real-time update for schedule deletion
    const io = req.app.get('io');
    if (io) {
      io.emit('schedule:deleted', { 
        scheduleId,
        weekNumber, 
        year 
      });
    }

    res.json({ 
      message: 'Schedule deleted successfully',
      scheduleId,
      weekNumber,
      year
    });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/admin/schedules/:scheduleId/fix-week
// @desc    Fix schedule week number (for correcting timezone-related issues)
// @access  Admin
router.patch('/schedules/:scheduleId/fix-week', auth, adminAuth, async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { newWeekNumber } = req.body;

    if (!newWeekNumber || typeof newWeekNumber !== 'number') {
      return res.status(400).json({ message: 'newWeekNumber is required and must be a number' });
    }

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    const oldWeekNumber = schedule.weekNumber;

    // Check if a schedule already exists for the target week
    const existingSchedule = await Schedule.findOne({ 
      weekNumber: newWeekNumber, 
      year: schedule.year,
      _id: { $ne: scheduleId }
    });

    if (existingSchedule) {
      return res.status(400).json({ 
        message: `A schedule already exists for week ${newWeekNumber}, year ${schedule.year}` 
      });
    }

    // Update schedule week number
    schedule.weekNumber = newWeekNumber;
    schedule.dataSource = 'admin';
    await schedule.save();

    // Also update any bets that reference the old week number
    const betUpdateResult = await Bet.updateMany(
      { weekNumber: oldWeekNumber, year: schedule.year },
      { $set: { weekNumber: newWeekNumber } }
    );

    const guestBetUpdateResult = await GuestBet.updateMany(
      { weekNumber: oldWeekNumber, year: schedule.year },
      { $set: { weekNumber: newWeekNumber } }
    );

    console.log(`📅 Fixed schedule week: ${oldWeekNumber} -> ${newWeekNumber}`);
    console.log(`📊 Updated ${betUpdateResult.modifiedCount} user bets, ${guestBetUpdateResult.modifiedCount} guest bets`);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('schedule:updated', { schedule });
    }

    res.json({ 
      message: `Schedule week number updated from ${oldWeekNumber} to ${newWeekNumber}`,
      schedule,
      betsUpdated: betUpdateResult.modifiedCount,
      guestBetsUpdated: guestBetUpdateResult.modifiedCount
    });
  } catch (error) {
    console.error('Fix schedule week error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/schedules/refresh
// @desc    Refresh schedule from API-Football
// @access  Admin
router.post('/schedules/refresh', auth, adminAuth, async (req, res) => {
  try {
    const { createNextWeekSchedule } = require('../services/scheduler');
    const result = await createNextWeekSchedule();
    
    if (result.success) {
      // Emit real-time update
      const io = req.app.get('io');
      if (io) {
        io.emit('schedule:created', { schedule: result.schedule });
      }
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Refresh schedule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== SETTINGS ROUTES ====================

// @route   GET /api/admin/settings
// @desc    Get all settings (public ones without auth, all with auth)
// @access  Public/Admin
router.get('/settings', async (req, res) => {
  try {
    // Get bet amount setting (default to 20 if not set)
    const betAmount = await Settings.getSetting('betAmount', 20);
    
    res.json({ 
      settings: {
        betAmount
      }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/settings/:key
// @desc    Get a specific setting
// @access  Public
router.get('/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const defaultValues = {
      betAmount: 20
    };
    
    const value = await Settings.getSetting(key, defaultValues[key] || null);
    
    res.json({ key, value });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/settings/betAmount
// @desc    Update the bet amount
// @access  Admin
router.put('/settings/betAmount', auth, adminAuth, async (req, res) => {
  try {
    const { amount } = req.body;
    
    // Validate amount
    if (typeof amount !== 'number' || amount < 0) {
      return res.status(400).json({ message: 'Invalid bet amount. Must be a positive number.' });
    }
    
    // Update the setting
    const setting = await Settings.setSetting('betAmount', amount, req.user._id);
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('settings:update', { key: 'betAmount', value: amount });
    }
    
    res.json({ 
      message: 'Bet amount updated successfully',
      betAmount: amount
    });
  } catch (error) {
    console.error('Update bet amount error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
module.exports.getCodes = getCodes;
module.exports.setCodes = setCodes;
