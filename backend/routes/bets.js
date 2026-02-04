const express = require('express');
const Bet = require('../models/Bet');
const Schedule = require('../models/Schedule');
const auth = require('../middleware/auth');

const router = express.Router();

// Helper to get current week number
const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNumber;
};

// Check if betting is locked (5 minutes before first match)
const checkBettingLock = async (weekNumber, year) => {
  const schedule = await Schedule.findOne({ weekNumber, year });
  if (!schedule) {
    return { locked: true, reason: 'No schedule found for this week' };
  }

  const now = new Date();
  const firstMatchTime = schedule.firstMatchTime;
  const lockoutTime = new Date(firstMatchTime.getTime() - 5 * 60 * 1000); // 5 minutes before

  if (now >= lockoutTime) {
    return { 
      locked: true, 
      reason: 'Betting is closed. It locks 5 minutes before the first match.',
      lockoutTime,
      firstMatchTime
    };
  }

  return { locked: false, lockoutTime, firstMatchTime };
};

// @route   GET /api/bets/my/current
// @desc    Get current user's bet for the current week
// @access  Private
// NOTE: This route must come BEFORE /:weekNumber/:year to avoid route conflicts
router.get('/my/current', auth, async (req, res) => {
  try {
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const year = now.getFullYear();

    const bet = await Bet.findOne({ 
      userId: req.user._id, 
      weekNumber, 
      year 
    });

    const lockStatus = await checkBettingLock(weekNumber, year);

    res.json({
      bet,
      weekNumber,
      year,
      ...lockStatus
    });
  } catch (error) {
    console.error('Get my bet error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bets/current
// @desc    Get all bets for the current week with live points calculation
// @access  Public
router.get('/current', async (req, res) => {
  try {
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const year = now.getFullYear();

    const schedule = await Schedule.findOne({ weekNumber, year });
    
    let bets = await Bet.find({ weekNumber, year, isPlaceholder: { $ne: true } })
      .populate('userId', 'name email');

    // Calculate live points and goal differences if not settled yet
    if (schedule && !schedule.isSettled) {
      const actualTotalGoals = schedule.matches.reduce((sum, match) => {
        if (match.isCompleted) {
          return sum + (match.scoreTeamA || 0) + (match.scoreTeamB || 0);
        }
        return sum;
      }, 0);

      // Update each bet's live stats
      for (const bet of bets) {
        let livePoints = 0;

        for (const prediction of bet.predictions) {
          const match = schedule.matches.id(prediction.matchId);
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
    }

    // Sort by points (desc), then by goal difference (asc - closest wins)
    bets.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      // If goalDifference is null, put at the end
      if (a.goalDifference === null && b.goalDifference === null) return 0;
      if (a.goalDifference === null) return 1;
      if (b.goalDifference === null) return -1;
      return a.goalDifference - b.goalDifference;
    });

    res.json({
      bets,
      weekNumber,
      year,
      isSettled: schedule?.isSettled || false,
      allMatchesCompleted: schedule?.allMatchesCompleted || false,
      actualTotalGoals: schedule?.actualTotalGoals || null
    });
  } catch (error) {
    console.error('Get bets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bets/last-week
// @desc    Get all bets for last week with final results
// @access  Public
router.get('/last-week', async (req, res) => {
  try {
    const now = new Date();
    const currentWeek = getWeekNumber(now);
    const currentYear = now.getFullYear();
    
    // Calculate last week
    let lastWeek = currentWeek - 1;
    let lastWeekYear = currentYear;
    if (lastWeek < 1) {
      lastWeek = 52;
      lastWeekYear = currentYear - 1;
    }

    const schedule = await Schedule.findOne({ 
      weekNumber: lastWeek, 
      year: lastWeekYear 
    });

    if (!schedule) {
      return res.status(404).json({ 
        message: 'No data found for last week',
        weekNumber: lastWeek,
        year: lastWeekYear
      });
    }

    const bets = await Bet.find({ 
      weekNumber: lastWeek, 
      year: lastWeekYear,
      isPlaceholder: { $ne: true }
    })
      .populate('userId', 'name email')
      .sort({ totalPoints: -1, goalDifference: 1 });

    res.json({
      bets,
      weekNumber: lastWeek,
      year: lastWeekYear,
      isSettled: schedule?.isSettled || false,
      actualTotalGoals: schedule?.actualTotalGoals || null
    });
  } catch (error) {
    console.error('Get last week bets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bets/:weekNumber/:year
// @desc    Get all bets for a specific week
// @access  Public
router.get('/:weekNumber/:year', async (req, res) => {
  try {
    const { weekNumber, year } = req.params;

    const bets = await Bet.find({ 
      weekNumber: parseInt(weekNumber), 
      year: parseInt(year),
      isPlaceholder: { $ne: true }
    })
      .populate('userId', 'name email')
      .sort({ totalPoints: -1, goalDifference: 1 });

    const schedule = await Schedule.findOne({ 
      weekNumber: parseInt(weekNumber), 
      year: parseInt(year) 
    });

    res.json({
      bets,
      isSettled: schedule?.isSettled || false,
      allMatchesCompleted: schedule?.allMatchesCompleted || false
    });
  } catch (error) {
    console.error('Get bets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/bets
// @desc    Create or update a bet
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { totalGoals, predictions, paid, weekNumber: providedWeek, year: providedYear } = req.body;
    
    const now = new Date();
    const weekNumber = providedWeek || getWeekNumber(now);
    const year = providedYear || now.getFullYear();

    // Check betting lock
    const lockStatus = await checkBettingLock(weekNumber, year);
    if (lockStatus.locked) {
      return res.status(403).json({ 
        message: lockStatus.reason,
        ...lockStatus
      });
    }

    // Validate predictions array
    if (!predictions || predictions.length !== 9) {
      return res.status(400).json({ message: 'Must provide exactly 9 match predictions' });
    }

    // Check if user already has a bet for this week
    let bet = await Bet.findOne({ 
      userId: req.user._id, 
      weekNumber, 
      year 
    });

    if (bet) {
      // Update existing bet - DO NOT update payment status (only admin can change it)
      bet.totalGoals = totalGoals;
      bet.predictions = predictions;
      // Keep existing paid status - users cannot change payment after initial submission
      // bet.paid stays unchanged
      bet.updatedAt = new Date();
      await bet.save();
      
      // Emit real-time update with user info for targeted updates
      const io = req.app.get('io');
      if (io) {
        io.emit('bets:update', { 
          action: 'update', 
          weekNumber, 
          year,
          userId: req.user._id,
          betId: bet._id
        });
      }
      
      return res.json({ 
        message: 'Bet updated successfully', 
        bet,
        lockoutTime: lockStatus.lockoutTime
      });
    }

    // Create new bet
    bet = new Bet({
      userId: req.user._id,
      weekNumber,
      year,
      totalGoals,
      predictions,
      paid: paid || false
    });

    await bet.save();

    // Emit real-time update with user info
    const io = req.app.get('io');
    if (io) {
      io.emit('bets:update', { 
        action: 'create', 
        weekNumber, 
        year,
        userId: req.user._id,
        betId: bet._id
      });
    }

    res.status(201).json({ 
      message: 'Bet placed successfully', 
      bet,
      lockoutTime: lockStatus.lockoutTime
    });
  } catch (error) {
    console.error('Place bet error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You already have a bet for this week' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/bets/:betId/paid
// @desc    Update paid status
// @access  Private
router.patch('/:betId/paid', auth, async (req, res) => {
  try {
    const { betId } = req.params;
    const { paid } = req.body;

    const bet = await Bet.findByIdAndUpdate(
      betId,
      { paid },
      { new: true }
    );

    if (!bet) {
      return res.status(404).json({ message: 'Bet not found' });
    }

    // Emit real-time update with user and bet info
    const io = req.app.get('io');
    if (io) {
      io.emit('bets:update', { 
        action: 'paid', 
        betId: bet._id,
        userId: bet.userId,
        paid: bet.paid
      });
    }

    res.json({ message: 'Paid status updated', bet });
  } catch (error) {
    console.error('Update paid status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/bets/my/current
// @desc    Delete current user's bet for the current week
// @access  Private
router.delete('/my/current', auth, async (req, res) => {
  try {
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const year = now.getFullYear();

    // Check betting lock - can only delete if betting is still open
    const lockStatus = await checkBettingLock(weekNumber, year);
    if (lockStatus.locked) {
      return res.status(403).json({ 
        message: 'Cannot delete bet after betting is locked',
        ...lockStatus
      });
    }

    const bet = await Bet.findOneAndDelete({ 
      userId: req.user._id, 
      weekNumber, 
      year 
    });

    if (!bet) {
      return res.status(404).json({ message: 'No bet found for this week' });
    }

    res.json({ message: 'Bet deleted successfully' });
  } catch (error) {
    console.error('Delete bet error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
