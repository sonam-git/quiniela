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

// @route   POST /api/results/update-match
// @desc    Update a single match result
// @access  Private
router.post('/update-match', auth, async (req, res) => {
  try {
    const { weekNumber, year, matchId, scoreTeamA, scoreTeamB } = req.body;

    const schedule = await Schedule.findOne({ weekNumber, year });
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    const match = schedule.matches.id(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Update match result
    match.scoreTeamA = scoreTeamA;
    match.scoreTeamB = scoreTeamB;
    match.isCompleted = true;
    
    // Determine winner
    if (scoreTeamA > scoreTeamB) {
      match.result = 'teamA';
    } else if (scoreTeamB > scoreTeamA) {
      match.result = 'teamB';
    } else {
      match.result = 'draw';
    }

    await schedule.save();

    // Recalculate points for all bets after each match update
    await recalculatePoints(weekNumber, year, schedule);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('results:update', { weekNumber, year, matchId });
    }

    res.json({ message: 'Match result updated', match });
  } catch (error) {
    console.error('Update match result error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to recalculate points for all bets
const recalculatePoints = async (weekNumber, year, schedule) => {
  const bets = await Bet.find({ weekNumber, year, isPlaceholder: { $ne: true } });

  for (const bet of bets) {
    let totalPoints = 0;

    for (const prediction of bet.predictions) {
      const match = schedule.matches.id(prediction.matchId);
      // Only count points for completed matches
      if (match && match.isCompleted && match.result === prediction.prediction) {
        totalPoints += 1;
      }
    }

    bet.totalPoints = totalPoints;
    await bet.save();
  }
};

// @route   POST /api/results/settle
// @desc    Settle weekly results and calculate points
// @access  Private
router.post('/settle', auth, async (req, res) => {
  try {
    const { weekNumber: providedWeek, year: providedYear } = req.body;
    
    const now = new Date();
    const weekNumber = providedWeek || getWeekNumber(now);
    const year = providedYear || now.getFullYear();

    // Get the schedule
    const schedule = await Schedule.findOne({ weekNumber, year });
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Check if all matches are completed
    const allCompleted = schedule.matches.every(m => m.isCompleted);
    if (!allCompleted) {
      return res.status(400).json({ 
        message: 'Not all matches are completed yet',
        completedCount: schedule.matches.filter(m => m.isCompleted).length,
        totalMatches: 9
      });
    }

    // Calculate actual total goals
    const actualTotalGoals = schedule.matches.reduce((sum, match) => {
      return sum + (match.scoreTeamA || 0) + (match.scoreTeamB || 0);
    }, 0);

    schedule.actualTotalGoals = actualTotalGoals;

    // Get all bets for this week
    const bets = await Bet.find({ weekNumber, year });

    // Calculate points for each bet
    for (const bet of bets) {
      let totalPoints = 0;

      // Calculate points for correct predictions
      for (const prediction of bet.predictions) {
        const match = schedule.matches.id(prediction.matchId);
        if (match && match.result === prediction.prediction) {
          totalPoints += 1;
        }
      }

      // Calculate goal difference
      const goalDifference = Math.abs(bet.totalGoals - actualTotalGoals);

      bet.totalPoints = totalPoints;
      bet.goalDifference = goalDifference;
      bet.isWinner = false; // Reset, will be set after sorting

      await bet.save();
    }

    // Determine winner with tie-breaker logic
    const sortedBets = await Bet.find({ weekNumber, year, isPlaceholder: { $ne: true } })
      .sort({ totalPoints: -1, goalDifference: 1 });

    if (sortedBets.length > 0) {
      // Mark the winner
      const winner = sortedBets[0];
      winner.isWinner = true;
      await winner.save();

      // Handle ties - mark all with same points and goal difference as winners
      for (let i = 1; i < sortedBets.length; i++) {
        if (sortedBets[i].totalPoints === winner.totalPoints && 
            sortedBets[i].goalDifference === winner.goalDifference) {
          sortedBets[i].isWinner = true;
          await sortedBets[i].save();
        } else {
          break;
        }
      }
    }

    // Mark schedule as settled
    schedule.isSettled = true;
    await schedule.save();

    // Return the final results
    const finalBets = await Bet.find({ weekNumber, year, isPlaceholder: { $ne: true } })
      .populate('userId', 'name email')
      .sort({ totalPoints: -1, goalDifference: 1 });

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('week:settled', { weekNumber, year });
    }

    res.json({
      message: 'Results settled successfully',
      actualTotalGoals,
      bets: finalBets,
      winner: finalBets.find(b => b.isWinner)
    });
  } catch (error) {
    console.error('Settle results error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Exportable function for settling results (can be called programmatically)
const settleWeeklyResults = async (weekNumber, year) => {
  const schedule = await Schedule.findOne({ weekNumber, year });
  if (!schedule) {
    throw new Error('Schedule not found');
  }

  const allCompleted = schedule.matches.every(m => m.isCompleted);
  if (!allCompleted) {
    throw new Error('Not all matches are completed');
  }

  // Calculate actual total goals
  const actualTotalGoals = schedule.matches.reduce((sum, match) => {
    return sum + (match.scoreTeamA || 0) + (match.scoreTeamB || 0);
  }, 0);

  schedule.actualTotalGoals = actualTotalGoals;

  // Get all bets (excluding placeholder bets)
  const bets = await Bet.find({ weekNumber, year, isPlaceholder: { $ne: true } });

  // Calculate points
  for (const bet of bets) {
    let totalPoints = 0;

    for (const prediction of bet.predictions) {
      const match = schedule.matches.id(prediction.matchId);
      if (match && match.result === prediction.prediction) {
        totalPoints += 1;
      }
    }

    const goalDifference = Math.abs(bet.totalGoals - actualTotalGoals);

    bet.totalPoints = totalPoints;
    bet.goalDifference = goalDifference;
    bet.isWinner = false;

    await bet.save();
  }

  // Sort and determine winner with tie-breaker
  const sortedBets = await Bet.find({ weekNumber, year, isPlaceholder: { $ne: true } })
    .sort({ totalPoints: -1, goalDifference: 1 });

  if (sortedBets.length > 0) {
    sortedBets[0].isWinner = true;
    await sortedBets[0].save();

    // Handle ties
    for (let i = 1; i < sortedBets.length; i++) {
      if (sortedBets[i].totalPoints === sortedBets[0].totalPoints && 
          sortedBets[i].goalDifference === sortedBets[0].goalDifference) {
        sortedBets[i].isWinner = true;
        await sortedBets[i].save();
      } else {
        break;
      }
    }
  }

  schedule.isSettled = true;
  await schedule.save();

  return {
    actualTotalGoals,
    bets: sortedBets
  };
};

module.exports = router;
module.exports.settleWeeklyResults = settleWeeklyResults;
