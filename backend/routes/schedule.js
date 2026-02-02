const express = require('express');
const Schedule = require('../models/Schedule');
const auth = require('../middleware/auth');
const { getFixtures, getFixturesByRound, getCurrentRound, LEAGUES } = require('../services/apiFootball');

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

// @route   GET /api/schedule/current
// @desc    Get current week's schedule
// @access  Public
router.get('/current', async (req, res) => {
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

    // Calculate lockout status
    const firstMatchTime = schedule.firstMatchTime;
    const lockoutTime = new Date(firstMatchTime.getTime() - 5 * 60 * 1000); // 5 minutes before
    const isBettingLocked = now >= lockoutTime;
    const hasStarted = now >= firstMatchTime;

    res.json({
      schedule,
      weekNumber,
      year,
      isBettingLocked,
      hasStarted,
      lockoutTime,
      firstMatchTime
    });
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/schedule/:weekNumber/:year
// @desc    Get schedule for a specific week
// @access  Public
router.get('/:weekNumber/:year', async (req, res) => {
  try {
    const { weekNumber, year } = req.params;

    const schedule = await Schedule.findOne({ 
      weekNumber: parseInt(weekNumber), 
      year: parseInt(year) 
    });

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    const now = new Date();
    const firstMatchTime = schedule.firstMatchTime;
    const lockoutTime = new Date(firstMatchTime.getTime() - 5 * 60 * 1000);
    const isBettingLocked = now >= lockoutTime;
    const hasStarted = now >= firstMatchTime;

    res.json({
      schedule,
      isBettingLocked,
      hasStarted,
      lockoutTime,
      firstMatchTime
    });
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/schedule
// @desc    Create a new weekly schedule (Admin only - simplified for demo)
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { weekNumber, year, matches } = req.body;

    // Check if schedule already exists
    const existing = await Schedule.findOne({ weekNumber, year });
    if (existing) {
      return res.status(400).json({ message: 'Schedule already exists for this week' });
    }

    const schedule = new Schedule({
      weekNumber,
      year,
      matches
    });

    await schedule.save();
    res.status(201).json({ message: 'Schedule created', schedule });
  } catch (error) {
    console.error('Create schedule error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/schedule/fetch-from-api
// @desc    Fetch matches from API-Football and create schedule (Liga MX)
// @access  Private
router.post('/fetch-from-api', auth, async (req, res) => {
  try {
    // Default to Liga MX (Mexican League)
    const { league = LEAGUES.LIGA_MX, season = 2025 } = req.body;
    
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const year = now.getFullYear();

    // Check if schedule already exists
    const existing = await Schedule.findOne({ weekNumber, year });
    if (existing) {
      return res.status(400).json({ 
        message: 'Schedule already exists for this week',
        schedule: existing
      });
    }

    // Get current round
    const currentRound = await getCurrentRound(league, season);
    console.log('Current round:', currentRound);

    // Get fixtures for the current round
    const fixtures = await getFixturesByRound(league, season, currentRound);
    
    if (!fixtures || fixtures.length === 0) {
      return res.status(404).json({ message: 'No fixtures found for current round' });
    }

    // Take first 9 matches (or all if less than 9)
    const selectedFixtures = fixtures.slice(0, 9);

    // Map API response to our schema
    const matches = selectedFixtures.map(fixture => ({
      teamA: fixture.teams.home.name,
      teamB: fixture.teams.away.name,
      startTime: new Date(fixture.fixture.date),
      apiFixtureId: fixture.fixture.id,
      result: null,
      scoreTeamA: null,
      scoreTeamB: null,
      isCompleted: false
    }));

    // Pad with placeholder matches if less than 9
    while (matches.length < 9) {
      const placeholderDate = new Date();
      placeholderDate.setDate(placeholderDate.getDate() + 7);
      matches.push({
        teamA: `Team A${matches.length + 1}`,
        teamB: `Team B${matches.length + 1}`,
        startTime: placeholderDate,
        result: null,
        scoreTeamA: null,
        scoreTeamB: null,
        isCompleted: false
      });
    }

    const schedule = new Schedule({
      weekNumber,
      year,
      matches
    });

    await schedule.save();

    res.status(201).json({ 
      message: 'Schedule created from API-Football',
      schedule,
      round: currentRound,
      fixturesCount: selectedFixtures.length
    });
  } catch (error) {
    console.error('Fetch from API error:', error);
    res.status(500).json({ message: 'Failed to fetch from API-Football', error: error.message });
  }
});

// @route   POST /api/schedule/sync-results
// @desc    Sync match results from API-Football
// @access  Private
router.post('/sync-results', auth, async (req, res) => {
  try {
    const { weekNumber: providedWeek, year: providedYear } = req.body;
    
    const now = new Date();
    const weekNumber = providedWeek || getWeekNumber(now);
    const year = providedYear || now.getFullYear();

    const schedule = await Schedule.findOne({ weekNumber, year });
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    let updatedCount = 0;

    for (const match of schedule.matches) {
      if (match.apiFixtureId && !match.isCompleted) {
        try {
          const { getFixtureById } = require('../services/apiFootball');
          const fixture = await getFixtureById(match.apiFixtureId);
          
          if (fixture && fixture.fixture.status.short === 'FT') {
            match.scoreTeamA = fixture.goals.home;
            match.scoreTeamB = fixture.goals.away;
            match.isCompleted = true;
            
            if (fixture.goals.home > fixture.goals.away) {
              match.result = 'teamA';
            } else if (fixture.goals.away > fixture.goals.home) {
              match.result = 'teamB';
            } else {
              match.result = 'draw';
            }
            
            updatedCount++;
          }
        } catch (err) {
          console.error(`Failed to fetch fixture ${match.apiFixtureId}:`, err.message);
        }
      }
    }

    await schedule.save();

    res.json({
      message: `Synced ${updatedCount} match results`,
      schedule
    });
  } catch (error) {
    console.error('Sync results error:', error);
    res.status(500).json({ message: 'Failed to sync results' });
  }
});

// @route   GET /api/schedule/leagues
// @desc    Get available leagues
// @access  Public
router.get('/leagues/available', async (req, res) => {
  res.json({
    leagues: {
      'La Liga (Spain)': LEAGUES.LA_LIGA,
      'Premier League (England)': LEAGUES.PREMIER_LEAGUE,
      'Serie A (Italy)': LEAGUES.SERIE_A,
      'Bundesliga (Germany)': LEAGUES.BUNDESLIGA,
      'Ligue 1 (France)': LEAGUES.LIGUE_1,
      'Champions League': LEAGUES.CHAMPIONS_LEAGUE,
      'MLS (USA)': LEAGUES.MLS,
      'Liga MX (Mexico)': LEAGUES.LIGA_MX
    }
  });
});

module.exports = router;
