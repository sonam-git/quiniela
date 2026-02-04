const express = require('express');
const auth = require('../middleware/auth');
const { adminAuth, developerAuth } = require('../middleware/auth');
const User = require('../models/User');
const Bet = require('../models/Bet');
const Schedule = require('../models/Schedule');
const Announcement = require('../models/Announcement');

const router = express.Router();

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

    // Emit real-time update for payment status change
    const io = req.app.get('io');
    if (io) {
      io.emit('payments:update', { action: 'update', betId: bet._id, paid });
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

    // Get current week's schedule
    const now = new Date();
    const schedule = await Schedule.findOne({
      weekStart: { $lte: now },
      weekEnd: { $gte: now }
    });

    // Calculate current week number if no schedule
    const getWeekNumber = (date) => {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    };

    const weekNumber = schedule?.weekNumber || getWeekNumber(now);
    const year = schedule?.year || now.getFullYear();
    const scheduleId = schedule?._id || null;

    // Find existing bet for this user and week
    let bet = await Bet.findOne({
      userId,
      weekNumber,
      year
    });

    if (status === 'na') {
      // If setting to N/A and there's a placeholder bet (no predictions), delete it
      if (bet && bet.isPlaceholder) {
        await Bet.findByIdAndDelete(bet._id);
        // Emit real-time update
        const io = req.app.get('io');
        if (io) {
          io.emit('payments:update', { action: 'delete', userId, status: 'na' });
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
          io.emit('payments:update', { action: 'update', userId, status: 'pending' });
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
      io.emit('payments:update', { action: 'update', userId, status, betId: bet._id });
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
// @desc    Get all users with their bet/payment status for current week
// @access  Admin
router.get('/payments', auth, adminAuth, async (req, res) => {
  try {
    // Get current week's schedule
    const now = new Date();
    const schedule = await Schedule.findOne({
      weekStart: { $lte: now },
      weekEnd: { $gte: now }
    });

    // Calculate current week number if no schedule
    const getWeekNumber = (date) => {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    };

    const weekNumber = schedule?.weekNumber || getWeekNumber(now);
    const year = schedule?.year || now.getFullYear();

    // Get all users (excluding password)
    const users = await User.find().select('-password').sort({ name: 1 });

    // Get all bets for this week
    const bets = await Bet.find({ weekNumber, year });
    
    // Create a map of userId to bet for quick lookup
    const betMap = new Map();
    bets.forEach(bet => {
      betMap.set(bet.userId.toString(), bet);
    });

    // Combine users with their bet info
    const paymentsData = users.map(user => {
      const bet = betMap.get(user._id.toString());
      const isPlaceholder = bet?.isPlaceholder || false;
      const hasRealBet = bet && !isPlaceholder;
      
      // Determine payment status: 'paid', 'pending', or 'na'
      let paymentStatus = 'na';
      if (bet) {
        paymentStatus = bet.paid ? 'paid' : 'pending';
      }
      
      return {
        userId: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        isDeveloper: user.isDeveloper,
        hasBet: hasRealBet,
        isPlaceholder,
        betId: bet?._id || null,
        paid: bet?.paid || false,
        paymentStatus,
        totalPoints: hasRealBet ? (bet?.totalPoints || 0) : 0,
        totalGoals: hasRealBet ? (bet?.totalGoals ?? null) : null,
        createdAt: user.createdAt
      };
    });

    // Sort: users with real bets first, then placeholders, then no records, then by name
    paymentsData.sort((a, b) => {
      if (a.hasBet && !b.hasBet) return -1;
      if (!a.hasBet && b.hasBet) return 1;
      if (a.isPlaceholder && !b.isPlaceholder) return -1;
      if (!a.isPlaceholder && b.isPlaceholder) return 1;
      return a.name.localeCompare(b.name);
    });

    res.json({ 
      payments: paymentsData,
      weekInfo: {
        weekNumber,
        year
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

// Helper to get week number
const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNumber;
};

// @route   GET /api/admin/schedule
// @desc    Get current week's schedule for admin
// @access  Admin
router.get('/schedule', auth, adminAuth, async (req, res) => {
  try {
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const year = now.getFullYear();

    let schedule = await Schedule.findOne({ weekNumber, year });

    if (!schedule) {
      return res.status(404).json({ 
        message: 'No schedule found for this week',
        weekNumber,
        year
      });
    }

    res.json({ 
      schedule,
      weekNumber,
      year
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

    // Emit real-time update for match score change
    const io = req.app.get('io');
    if (io) {
      io.emit('results:update', { 
        action: 'score', 
        matchId, 
        weekNumber: schedule.weekNumber, 
        year: schedule.year 
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

    // Emit real-time update for match reset
    const io = req.app.get('io');
    if (io) {
      io.emit('results:update', { 
        action: 'reset', 
        matchId, 
        weekNumber: schedule.weekNumber, 
        year: schedule.year 
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
    const weekNumber = getWeekNumber(now);
    const year = now.getFullYear();

    const schedule = await Schedule.findOne({ weekNumber, year });
    
    if (!schedule) {
      return res.status(404).json({ message: 'No schedule found for this week' });
    }

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

    // Get all bets for this week (exclude placeholders)
    const bets = await Bet.find({ weekNumber, year, isPlaceholder: { $ne: true } });

    // Calculate points and goal difference for each bet
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

    // Sort bets: by points (desc), then by goal difference (asc - closest wins)
    const sortedBets = await Bet.find({ weekNumber, year, isPlaceholder: { $ne: true } })
      .sort({ totalPoints: -1, goalDifference: 1 });

    // Determine winners with tie-breaker logic
    if (sortedBets.length > 0) {
      const topBet = sortedBets[0];
      
      // Mark all bets with the same points AND goal difference as winners
      for (const bet of sortedBets) {
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
    await schedule.save();

    // Emit real-time update for week settled
    const io = req.app.get('io');
    if (io) {
      io.emit('week:settled', { 
        weekNumber, 
        year, 
        actualTotalGoals,
        winnersCount: sortedBets.filter(b => b.isWinner).length
      });
    }

    // Get final results with user info
    const finalBets = await Bet.find({ weekNumber, year, isPlaceholder: { $ne: true } })
      .populate('userId', 'name email')
      .sort({ totalPoints: -1, goalDifference: 1 });

    const winners = finalBets.filter(b => b.isWinner);

    res.json({ 
      message: 'Week settled successfully',
      schedule,
      actualTotalGoals,
      winners: winners.map(w => ({
        name: w.userId?.name,
        points: w.totalPoints,
        goalDifference: w.goalDifference,
        predictedGoals: w.totalGoals
      })),
      bets: finalBets
    });
  } catch (error) {
    console.error('Settle week error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
module.exports.getCodes = getCodes;
module.exports.setCodes = setCodes;
