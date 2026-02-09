const express = require('express');
const Bet = require('../models/Bet');
const GuestBet = require('../models/GuestBet');
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

// Check if betting is locked (5 minutes before first match until week is settled)
const checkBettingLock = async (weekNumber, year) => {
  const schedule = await Schedule.findOne({ weekNumber, year });
  if (!schedule) {
    // No schedule for this week - betting is not locked (nothing to bet on yet)
    return { locked: false, reason: 'No schedule found for this week' };
  }

  // If the week is already settled, betting is unlocked for the next week
  if (schedule.isSettled) {
    return { locked: false, reason: 'Week is settled, ready for next week' };
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
// @desc    Get current user's bet for the current week (or next week if current is settled)
// @access  Private
// NOTE: This route must come BEFORE /:weekNumber/:year to avoid route conflicts
router.get('/my/current', auth, async (req, res) => {
  try {
    const now = new Date();
    let weekNumber = getWeekNumber(now);
    let year = now.getFullYear();

    // Check if current week's schedule is settled
    const schedule = await Schedule.findOne({ weekNumber, year });
    
    // If current week is settled, check for next week
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
      }
    }

    const bet = await Bet.findOne({ 
      userId: req.user._id, 
      weekNumber, 
      year,
      isGuestBet: { $ne: true } // Exclude guest bets - only get user's own bet
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
    let weekNumber = getWeekNumber(now);
    let year = now.getFullYear();

    let schedule = await Schedule.findOne({ weekNumber, year });
    
    // If current week's schedule is settled, look for next week's schedule
    // This allows the standings to show the next week's bets after settling
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
        schedule = nextWeekSchedule;
        weekNumber = actualNextWeek;
        year = nextYear;
      }
    }
    
    // Fetch user bets
    let userBets = await Bet.find({ weekNumber, year, isPlaceholder: { $ne: true }, isGuestBet: { $ne: true } })
      .populate('userId', 'name email');

    // Fetch guest bets from the separate GuestBet model
    let guestBets = await GuestBet.find({ weekNumber, year })
      .populate('sponsorUserId', 'name email');

    // Transform guest bets to match the user bet format for the leaderboard
    const transformedGuestBets = guestBets.map(gb => ({
      _id: gb._id,
      sponsorUserId: gb.sponsorUserId._id,
      userId: { 
        _id: gb.sponsorUserId._id, 
        name: gb.participantName,  // Use guest name as the display name
        email: null 
      },
      participantName: gb.participantName,
      isGuestBet: true,
      sponsorName: gb.sponsorUserId.name,
      weekNumber: gb.weekNumber,
      year: gb.year,
      totalGoals: gb.totalGoals,
      predictions: gb.predictions,
      totalPoints: gb.totalPoints,
      goalDifference: gb.goalDifference,
      paid: gb.paid,
      isWinner: gb.isWinner,
      createdAt: gb.createdAt,
      updatedAt: gb.updatedAt
    }));

    // Combine user bets and guest bets
    let bets = [...userBets, ...transformedGuestBets];

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

// @route   GET /api/bets/settled-results
// @desc    Get all bets for the most recently settled week (for Results tab)
// @access  Public
router.get('/settled-results', async (req, res) => {
  try {
    // Find the most recently settled schedule
    const schedule = await Schedule.findOne({ 
      isSettled: true 
    }).sort({ settledAt: -1 });

    if (!schedule) {
      return res.status(404).json({ 
        message: 'No settled results found',
        hasResults: false
      });
    }

    // Fetch user bets
    const userBets = await Bet.find({ 
      weekNumber: schedule.weekNumber, 
      year: schedule.year,
      isPlaceholder: { $ne: true }
    })
      .populate('userId', 'name email');

    // Fetch guest bets
    const guestBets = await GuestBet.find({ 
      weekNumber: schedule.weekNumber, 
      year: schedule.year
    })
      .populate('sponsorUserId', 'name email');

    // Transform guest bets to match user bet format
    const transformedGuestBets = guestBets.map(gb => ({
      _id: gb._id,
      sponsorUserId: gb.sponsorUserId._id,
      userId: { 
        _id: gb.sponsorUserId._id, 
        name: gb.participantName,
        email: null 
      },
      participantName: gb.participantName,
      isGuestBet: true,
      sponsorName: gb.sponsorUserId.name,
      weekNumber: gb.weekNumber,
      year: gb.year,
      totalGoals: gb.totalGoals,
      predictions: gb.predictions,
      totalPoints: gb.totalPoints,
      goalDifference: gb.goalDifference,
      paid: gb.paid,
      isWinner: gb.isWinner,
      createdAt: gb.createdAt,
      updatedAt: gb.updatedAt
    }));

    // Combine and sort
    const bets = [...userBets, ...transformedGuestBets].sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (a.goalDifference === null && b.goalDifference === null) return 0;
      if (a.goalDifference === null) return 1;
      if (b.goalDifference === null) return -1;
      return a.goalDifference - b.goalDifference;
    });

    res.json({
      bets,
      weekNumber: schedule.weekNumber,
      year: schedule.year,
      jornada: schedule.jornada,
      isSettled: true,
      settledAt: schedule.settledAt,
      actualTotalGoals: schedule.actualTotalGoals,
      hasResults: true
    });
  } catch (error) {
    console.error('Get settled results bets error:', error);
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

// @route   GET /api/bets/my/guests
// @desc    Get all guest bets managed by the current user for current week
// @access  Private
// NOTE: This route must come BEFORE /:weekNumber/:year to avoid route conflicts
router.get('/my/guests', auth, async (req, res) => {
  try {
    const now = new Date();
    let weekNumber = getWeekNumber(now);
    let year = now.getFullYear();

    // Check if current week's schedule is settled - if so, look at next week
    // (Same logic as /my/current to keep week numbers in sync)
    const schedule = await Schedule.findOne({ weekNumber, year });
    
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
      }
    }

    const guestBets = await GuestBet.find({ 
      sponsorUserId: req.user._id, 
      weekNumber, 
      year
    });

    const lockStatus = await checkBettingLock(weekNumber, year);

    res.json({
      guestBets,
      weekNumber,
      year,
      ...lockStatus
    });
  } catch (error) {
    console.error('Get guest bets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bets/:weekNumber/:year
// @desc    Get all bets for a specific week
// @access  Public
router.get('/:weekNumber/:year', async (req, res) => {
  try {
    const { weekNumber, year } = req.params;
    
    // Validate that weekNumber and year are valid numbers
    const parsedWeek = parseInt(weekNumber, 10);
    const parsedYear = parseInt(year, 10);
    
    if (isNaN(parsedWeek) || isNaN(parsedYear)) {
      return res.status(400).json({ 
        message: 'Invalid week number or year',
        weekNumber,
        year
      });
    }

    const bets = await Bet.find({ 
      weekNumber: parsedWeek, 
      year: parsedYear,
      isPlaceholder: { $ne: true }
    })
      .populate('userId', 'name email')
      .sort({ totalPoints: -1, goalDifference: 1 });

    const schedule = await Schedule.findOne({ 
      weekNumber: parsedWeek, 
      year: parsedYear 
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
    let weekNumber = providedWeek || getWeekNumber(now);
    let year = providedYear || now.getFullYear();

    // If no week provided, check if current week is settled and use next week
    if (!providedWeek) {
      const schedule = await Schedule.findOne({ weekNumber, year });
      
      if (schedule && schedule.isSettled) {
        const nextWeek = weekNumber + 1;
        const nextYear = nextWeek > 52 ? year + 1 : year;
        const actualNextWeek = nextWeek > 52 ? 1 : nextWeek;
        
        const nextWeekSchedule = await Schedule.findOne({ 
          weekNumber: actualNextWeek, 
          year: nextYear 
        });
        
        if (nextWeekSchedule && !nextWeekSchedule.isSettled) {
          weekNumber = actualNextWeek;
          year = nextYear;
        }
      }
    }

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
    let weekNumber = getWeekNumber(now);
    let year = now.getFullYear();

    // Check if current week's schedule is settled - if so, use next week
    // (Same logic as GET /my/current to ensure we're looking at the same week)
    const schedule = await Schedule.findOne({ weekNumber, year });
    
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
      }
    }

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

    // Emit real-time update so other users see the deletion
    const io = req.app.get('io');
    if (io) {
      io.emit('bets:update', { 
        action: 'delete', 
        weekNumber, 
        year,
        userId: req.user._id,
        betId: bet._id,
        isGuestBet: false
      });
    }

    res.json({ message: 'Bet deleted successfully' });
  } catch (error) {
    console.error('Delete bet error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// =============================================
// GUEST BET ROUTES (POST, PUT, DELETE)
// NOTE: GET /my/guests is defined earlier to avoid route conflicts
// =============================================

// @route   POST /api/bets/guest
// @desc    Create a guest bet (registered user submitting on behalf of a guest)
// @access  Private
router.post('/guest', auth, async (req, res) => {
  try {
    const { participantName, totalGoals, predictions, paid, weekNumber: providedWeek, year: providedYear } = req.body;
    
    const now = new Date();
    let weekNumber = providedWeek || getWeekNumber(now);
    let year = providedYear || now.getFullYear();

    // If no week provided, check if current week is settled and use next week
    if (!providedWeek) {
      const schedule = await Schedule.findOne({ weekNumber, year });
      
      if (schedule && schedule.isSettled) {
        const nextWeek = weekNumber + 1;
        const nextYear = nextWeek > 52 ? year + 1 : year;
        const actualNextWeek = nextWeek > 52 ? 1 : nextWeek;
        
        const nextWeekSchedule = await Schedule.findOne({ 
          weekNumber: actualNextWeek, 
          year: nextYear 
        });
        
        if (nextWeekSchedule && !nextWeekSchedule.isSettled) {
          weekNumber = actualNextWeek;
          year = nextYear;
        }
      }
    }

    // Validate participant name
    if (!participantName || participantName.trim().length < 2) {
      return res.status(400).json({ message: 'Guest participant name is required (min 2 characters)' });
    }

    const cleanName = participantName.trim();

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

    // Check if this guest already has a bet for this week from this user
    const existingBet = await GuestBet.findOne({ 
      sponsorUserId: req.user._id, 
      weekNumber, 
      year,
      participantName: cleanName
    });

    if (existingBet) {
      return res.status(400).json({ 
        message: `Guest "${cleanName}" already has a bet for this week. Edit or delete the existing bet.` 
      });
    }

    // Create guest bet using the new GuestBet model
    const guestBet = new GuestBet({
      sponsorUserId: req.user._id,
      participantName: cleanName,
      weekNumber,
      year,
      totalGoals,
      predictions,
      paid: paid || false
    });

    await guestBet.save();

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('bets:update', { 
        action: 'create', 
        weekNumber, 
        year,
        userId: req.user._id,
        betId: guestBet._id,
        isGuestBet: true,
        participantName: cleanName
      });
    }

    res.status(201).json({ 
      message: `Guest bet placed for "${cleanName}"`, 
      bet: guestBet,
      lockoutTime: lockStatus.lockoutTime
    });
  } catch (error) {
    console.error('Place guest bet error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This guest already has a bet for this week' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/bets/guest/:betId
// @desc    Update a guest bet
// @access  Private
router.put('/guest/:betId', auth, async (req, res) => {
  try {
    const { betId } = req.params;
    const { participantName, totalGoals, predictions, paid } = req.body;

    // Find the guest bet and ensure it belongs to this user
    const guestBet = await GuestBet.findById(betId);

    if (!guestBet) {
      return res.status(404).json({ message: 'Guest bet not found' });
    }

    if (guestBet.sponsorUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this guest bet' });
    }

    // Check betting lock
    const lockStatus = await checkBettingLock(guestBet.weekNumber, guestBet.year);
    if (lockStatus.locked) {
      return res.status(403).json({ 
        message: lockStatus.reason,
        ...lockStatus
      });
    }

    // Update the guest bet
    if (participantName) guestBet.participantName = participantName.trim();
    if (totalGoals !== undefined) guestBet.totalGoals = totalGoals;
    if (predictions) guestBet.predictions = predictions;
    if (paid !== undefined) guestBet.paid = paid;
    guestBet.updatedAt = new Date();

    await guestBet.save();

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('bets:update', { 
        action: 'update', 
        weekNumber: guestBet.weekNumber, 
        year: guestBet.year,
        userId: req.user._id,
        betId: guestBet._id,
        isGuestBet: true
      });
    }

    res.json({ message: 'Guest bet updated successfully', bet: guestBet });
  } catch (error) {
    console.error('Update guest bet error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/bets/guest/:betId
// @desc    Delete a guest bet
// @access  Private
router.delete('/guest/:betId', auth, async (req, res) => {
  try {
    const { betId } = req.params;

    const guestBet = await GuestBet.findById(betId);

    if (!guestBet) {
      return res.status(404).json({ message: 'Guest bet not found' });
    }

    if (guestBet.sponsorUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this guest bet' });
    }

    // Check betting lock
    const lockStatus = await checkBettingLock(guestBet.weekNumber, guestBet.year);
    if (lockStatus.locked) {
      return res.status(403).json({ 
        message: 'Cannot delete bet after betting is locked',
        ...lockStatus
      });
    }

    await GuestBet.findByIdAndDelete(betId);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('bets:update', { 
        action: 'delete', 
        weekNumber: guestBet.weekNumber, 
        year: guestBet.year,
        userId: req.user._id,
        betId: guestBet._id,
        isGuestBet: true
      });
    }

    res.json({ message: 'Guest bet deleted successfully' });
  } catch (error) {
    console.error('Delete guest bet error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
