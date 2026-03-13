const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const User = require('./models/User');
const Schedule = require('./models/Schedule');
const Bet = require('./models/Bet');

// API-Football configuration
const API_FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io';
const LIGA_MX_ID = 262;

// API-Football client
const apiFootball = axios.create({
  baseURL: API_FOOTBALL_BASE_URL,
  headers: {
    'x-apisports-key': process.env.API_FOOTBALL_KEY
  }
});

// Fetch fixtures for a specific round from API-Football
const fetchFixturesByRound = async (round) => {
  try {
    const season = 2025; // Clausura 2026 uses 2025 season in API
    
    console.log(`📡 Fetching Jornada ${round} fixtures from API-Football...`);
    
    const response = await apiFootball.get('/fixtures', {
      params: {
        league: LIGA_MX_ID,
        season,
        round: `Clausura - ${round}`
      }
    });
    
    if (response.data.response && response.data.response.length > 0) {
      console.log(`✅ Found ${response.data.response.length} fixtures for Jornada ${round}`);
      return response.data.response;
    }
    
    return null;
  } catch (error) {
    console.log(`⚠️  API-Football error for Jornada ${round}: ${error.response?.data?.message || error.message}`);
    return null;
  }
};

// Convert API fixtures to our match format
const convertApiFixtures = (fixtures) => {
  return fixtures.slice(0, 9).map(fixture => ({
    teamA: fixture.teams.home.name, // Home team (🏠)
    teamB: fixture.teams.away.name, // Away team (✈️)
    teamAIsHome: true, // teamA is always home in API response
    startTime: new Date(fixture.fixture.date),
    apiFixtureId: fixture.fixture.id,
    isCompleted: fixture.fixture.status.short === 'FT',
    scoreTeamA: fixture.goals.home,
    scoreTeamB: fixture.goals.away,
    result: fixture.fixture.status.short === 'FT' 
      ? (fixture.goals.home > fixture.goals.away ? 'teamA' 
        : fixture.goals.away > fixture.goals.home ? 'teamB' : 'draw')
      : null
  }));
};

// Liga MX Clausura 2026 Complete Schedule (Jornadas 4-17)
// Format: { home: 'HomeTeam 🏠', away: 'AwayTeam ✈️', date: 'YYYY-MM-DD', time: 'HH:MM' }
// For completed matches: result: 'teamA' | 'teamB' | 'draw', scoreA, scoreB
const LIGA_MX_CLAUSURA_2026 = {
  // Jornada 11 - March 13-15, 2026
  11: {
    startDate: '2026-03-13',
    matches: [
      { home: 'Puebla', away: 'Necaxa', date: '2026-03-13', time: '18:00' },
      { home: 'FC Juárez', away: 'Monterrey', date: '2026-03-13', time: '20:00' }, 
      { home: 'Atl. San Luis', away: 'Pachuca', date: '2026-03-14', time: '16:00' },
      { home: 'Guadalajara Chivas', away: 'Santos Laguna', date: '2026-03-14', time: '16:07' },
      { home: 'Club León', away: 'Club Tijuana', date: '2026-03-14', time: '18:00' },
      { home: 'Toluca', away: 'Atlas', date: '2026-03-14', time: '18:00' },
      { home: 'UNAM Pumas', away: 'Cruz Azul', date: '2026-03-14', time: '20:10' },
      { home: 'Tigres UANL', away: 'Querétaro', date: '2026-03-15', time: '16:00' },
      { home: 'Club América', away: 'Mazatlán FC', date: '2026-03-15', time: '18:00' }
    ]
  },
  // Jornada 12 - March 20-22, 2026
  12: {
    startDate: '2026-03-20',
    matches: [
      { home: 'Necaxa', away: 'Club Tijuana', date: '2026-03-20', time: '18:00' },
      { home: 'Mazatlán FC', away: 'Cruz Azul', date: '2026-03-20', time: '20:06' },
      { home: 'Atlas', away: 'Querétaro', date: '2026-03-21', time: '16:00' },
      { home: 'Pachuca', away: 'Toluca', date: '2026-03-21', time: '16:00' },
      { home: 'Atl. San Luis', away: 'Club León', date: '2026-03-21', time: '18:00' },
      { home: 'Monterrey', away: 'Guadalajara Chivas', date: '2026-03-21', time: '18:00' },
      { home: 'UNAM Pumas', away: 'Club América', date: '2026-03-21', time: '20:00' },
      { home: 'Santos Laguna', away: 'Puebla', date: '2026-03-22', time: '16:00' },
      { home: 'FC Juárez', away: 'Tigres UANL', date: '2026-03-22', time: '18:00' }
    ]
  },
  // Jornada 13 - April 3-5, 2026
  13: {
    startDate: '2026-04-03',
    matches: [
      { home: 'Puebla', away: 'FC Juárez', date: '2026-04-03', time: '18:00' },
      { home: 'Necaxa', away: 'Mazatlán FC', date: '2026-04-03', time: '20:00' },
      { home: 'Club Tijuana', away: 'Tigres UANL', date: '2026-04-03', time: '20:06' },
      { home: 'Monterrey', away: 'Atl. San Luis', date: '2026-04-04', time: '16:00' },
      { home: 'Club León', away: 'Atlas', date: '2026-04-04', time: '18:00' },
      { home: 'Cruz Azul', away: 'Pachuca', date: '2026-04-04', time: '18:00' },
      { home: 'Santos Laguna', away: 'Club América', date: '2026-04-04', time: '20:00' },
      { home: 'Querétaro', away: 'Toluca', date: '2026-04-05', time: '17:00' },
      { home: 'Guadalajara Chivas', away: 'UNAM Pumas', date: '2026-04-05', time: '19:07' }
    ]
  },
  // Jornada 14 - April 10-12, 2026
  14: {
    startDate: '2026-04-10',
    matches: [
      { home: 'Puebla', away: 'Club León', date: '2026-04-10', time: '18:00' },
      { home: 'FC Juárez', away: 'Club Tijuana', date: '2026-04-10', time: '20:06' },
      { home: 'Querétaro', away: 'Necaxa', date: '2026-04-11', time: '16:00' },
      { home: 'Tigres UANL', away: 'Guadalajara Chivas', date: '2026-04-11', time: '16:00' },
      { home: 'Atlas', away: 'Monterrey', date: '2026-04-11', time: '18:00' },
      { home: 'Pachuca', away: 'Santos Laguna', date: '2026-04-11', time: '18:00' },
      { home: 'Club América', away: 'Cruz Azul', date: '2026-04-11', time: '20:00' },
      { home: 'UNAM Pumas', away: 'Mazatlán FC', date: '2026-04-12', time: '11:00' },
      { home: 'Toluca', away: 'Atl. San Luis', date: '2026-04-12', time: '18:00' }
    ]
  },
  // Jornada 15 - April 17-19, 2026
  15: {
    startDate: '2026-04-17',
    matches: [
      { home: 'Atl. San Luis', away: 'UNAM Pumas', date: '2026-04-17', time: '18:00' },
      { home: 'Mazatlán FC', away: 'Querétaro', date: '2026-04-17', time: '18:00' },
      { home: 'Necaxa', away: 'Tigres UANL', date: '2026-04-17', time: '20:00' },
      { home: 'Cruz Azul', away: 'Club Tijuana', date: '2026-04-18', time: '16:00' },
      { home: 'Monterrey', away: 'Pachuca', date: '2026-04-18', time: '18:00' },
      { home: 'Guadalajara Chivas', away: 'Puebla', date: '2026-04-18', time: '18:07' },
      { home: 'Club América', away: 'Toluca', date: '2026-04-18', time: '20:00' },
      { home: 'Club León', away: 'FC Juárez', date: '2026-04-18', time: '20:00' },
      { home: 'Santos Laguna', away: 'Atlas', date: '2026-04-19', time: '16:00' }
    ]
  },
  // Jornada 16 - April 21-22, 2026
  16: {
    startDate: '2026-04-21',
    matches: [
      { home: 'Querétaro', away: 'Cruz Azul', date: '2026-04-21', time: '18:00' },
      { home: 'UNAM Pumas', away: 'FC Juárez', date: '2026-04-21', time: '18:00' },
      { home: 'Monterrey', away: 'Puebla', date: '2026-04-21', time: '20:00' },
      { home: 'Club León', away: 'Club América', date: '2026-04-21', time: '20:06' },
      { home: 'Atl. San Luis', away: 'Santos Laguna', date: '2026-04-22', time: '18:00' },
      { home: 'Atlas', away: 'Tigres UANL', date: '2026-04-22', time: '18:00' },
      { home: 'Mazatlán FC', away: 'Toluca', date: '2026-04-22', time: '18:00' },
      { home: 'Club Tijuana', away: 'Pachuca', date: '2026-04-22', time: '20:00' },
      { home: 'Necaxa', away: 'Guadalajara Chivas', date: '2026-04-22', time: '20:00' }
    ]
  },
  // Jornada 17 - April 25-26, 2026 (Final regular season matchday)
  17: {
    startDate: '2026-04-25',
    matches: [
      { home: 'Puebla', away: 'Querétaro', date: '2026-04-24', time: '20:00' },
      { home: 'Pachuca', away: 'UNAM Pumas', date: '2026-04-25', time: '16:00' },
      { home: 'Tigres UANL', away: 'Mazatlán FC', date: '2026-04-25', time: '16:00' },
      { home: 'Toluca', away: 'Club León', date: '2026-04-25', time: '18:00' },
      { home: 'Guadalajara Chivas', away: 'Tijuana', date: '2026-04-25', time: '18:07' },
      { home: 'Club América', away: 'Atlas', date: '2026-04-25', time: '20:00' },
      { home: 'FC Juárez', away: 'Atl. San Luis', date: '2026-04-25', time: '20:00' },
      { home: 'Santos Laguna', away: 'Monterrey', date: '2026-04-26', time: '16:00' },
      { home: 'Cruz Azul', away: 'Necaxa', date: '2026-04-26', time: '16:00' }
    ]
  }
};

// Get static schedule for a specific jornada
const getStaticSchedule = (jornada) => {
  const jornadaData = LIGA_MX_CLAUSURA_2026[jornada];
  
  if (!jornadaData) {
    console.log(`⚠️  No schedule found for Jornada ${jornada}, using Jornada 5 as default`);
    return getStaticSchedule(5);
  }

  console.log(`📅 Using static schedule for Jornada ${jornada}`);

  // Build matches with proper dates
  const matches = jornadaData.matches.map(match => {
    const [year, month, day] = match.date.split('-').map(Number);
    const [hour, minute] = match.time.split(':').map(Number);
    const startTime = new Date(year, month - 1, day, hour, minute);
    
    // Check if this jornada has completed matches
    const isCompleted = jornadaData.completed || false;
    
    return {
      teamA: match.home, // Home team 🏠
      teamB: match.away, // Away team ✈️
      teamAIsHome: true, // teamA is always home
      startTime,
      isCompleted: isCompleted,
      scoreTeamA: match.scoreA ?? null,
      scoreTeamB: match.scoreB ?? null,
      result: match.result ?? null,
      apiFixtureId: null
    };
  });

  return matches;
};

// Determine current jornada based on date
const getCurrentJornada = () => {
  const now = new Date();
  
  // Sort jornadas numerically to ensure correct order (11, 12, 13, ...)
  const sortedJornadas = Object.keys(LIGA_MX_CLAUSURA_2026)
    .map(Number)
    .sort((a, b) => a - b);
  
  // Check each jornada to find the current or upcoming one
  for (const jornada of sortedJornadas) {
    const data = LIGA_MX_CLAUSURA_2026[jornada];
    const jornadaStart = new Date(data.startDate);
    const jornadaEnd = new Date(jornadaStart);
    jornadaEnd.setDate(jornadaEnd.getDate() + 6); // Jornada spans about a week
    
    // If we're before the jornada ends, this is our current/upcoming jornada
    if (now <= jornadaEnd) {
      console.log(`📆 Date check: now=${now.toISOString().split('T')[0]}, jornada ${jornada} ends ${jornadaEnd.toISOString().split('T')[0]}`);
      return jornada;
    }
  }
  
  // If all jornadas have passed, return the last one
  return Math.max(...sortedJornadas);
};

// Helper to get current week number (same as schedule route)
const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNumber;
};

// Main seed function
const seedDatabase = async () => {
  try {
    console.log('\n🌱 QUINIELA DATABASE SEEDER - LIGA MX CLAUSURA 2026');
    console.log('═'.repeat(55));
    
    console.log('\n📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });
    console.log('✅ Connected to MongoDB');

    // Check existing users (we never delete users)
    const userCount = await User.countDocuments();
    console.log(`\n👥 Found ${userCount} existing user(s) - users are preserved`);
    
    // Clear schedules and associated bets
    console.log('\n🗑️  Clearing schedules and bets...');
    await Schedule.deleteMany({});
    await Bet.deleteMany({});
    console.log('✅ Cleared schedules and bets (users preserved)');

    // Determine current jornada and calendar week
    const currentJornada = getCurrentJornada();
    const now = new Date();
    const calendarWeek = getWeekNumber(now);
    const year = now.getFullYear();
    
    console.log(`\n⚽ Current Jornada: ${currentJornada} of Clausura 2026`);
    console.log(`📅 Calendar Week: ${calendarWeek} of ${year}`);
    console.log('═'.repeat(55));

    // Try to fetch from API-Football first
    let matches = null;
    let source = 'static';
    
    if (process.env.API_FOOTBALL_KEY) {
      const apiFixtures = await fetchFixturesByRound(currentJornada);
      if (apiFixtures && apiFixtures.length >= 5) {
        matches = convertApiFixtures(apiFixtures);
        source = 'API-Football';
      }
    } else {
      console.log('⚠️  No API_FOOTBALL_KEY found, using static schedule');
    }

    // Fallback to static schedule
    if (!matches) {
      console.log('\n📋 Using static schedule fallback...');
      matches = getStaticSchedule(currentJornada);
      source = 'static (Liga MX Clausura 2026)';
    }

    // Check if current jornada is already completed (matches have passed)
    const currentJornadaData = LIGA_MX_CLAUSURA_2026[currentJornada];
    const isCurrentJornadaCompleted = currentJornadaData?.completed || false;
    
    // Calculate total goals for current jornada if completed
    let currentJornadaTotalGoals = null;
    if (isCurrentJornadaCompleted) {
      currentJornadaTotalGoals = matches.reduce((sum, match) => {
        return sum + (match.scoreTeamA || 0) + (match.scoreTeamB || 0);
      }, 0);
    }

    // Ensure exactly 9 matches
    if (matches.length < 9) {
      console.log(`⚠️  Only ${matches.length} matches found, padding to 9...`);
      while (matches.length < 9) {
        const baseTime = matches[matches.length - 1]?.startTime || new Date();
        const nextTime = new Date(baseTime.getTime() + 2 * 60 * 60 * 1000);
        matches.push({
          teamA: `Team A${matches.length + 1}`,
          teamB: `Team B${matches.length + 1}`,
          teamAIsHome: true,
          startTime: nextTime,
          isCompleted: false,
          scoreTeamA: null,
          scoreTeamB: null,
          result: null,
          apiFixtureId: null
        });
      }
    }

    // Create schedule for current week (using calendar week number for route compatibility)
    // Mark as settled if jornada is already completed
    const schedule = await Schedule.create({
      weekNumber: calendarWeek,  // Use calendar week for route lookup
      year,
      jornada: currentJornada,   // Store jornada for reference
      matches: matches.slice(0, 9),
      dataSource: source.includes('API') ? 'api' : 'hardcoded',
      isSettled: isCurrentJornadaCompleted,
      settledAt: isCurrentJornadaCompleted ? new Date() : null,
      actualTotalGoals: currentJornadaTotalGoals
    });

    console.log(`\n✅ Schedule created (Source: ${source})`);
    console.log(`   Jornada: ${currentJornada}, Week: ${calendarWeek}, Year: ${year}`);
    console.log(`   Matches: ${schedule.matches.length}`);
    if (isCurrentJornadaCompleted) {
      console.log(`   Status: SETTLED (matches already completed)`);
      console.log(`   Total Goals: ${currentJornadaTotalGoals}`);
    }

    // Also create last week's schedule (Jornada 4) with completed results
    const lastWeekJornada = currentJornada - 1;
    let lastWeekSchedule = null;
    
    if (LIGA_MX_CLAUSURA_2026[lastWeekJornada]) {
      const lastWeekMatches = getStaticSchedule(lastWeekJornada);
      const lastWeekCalendarWeek = calendarWeek - 1;
      
      // Calculate total goals for last week
      const totalGoals = lastWeekMatches.reduce((sum, match) => {
        return sum + (match.scoreTeamA || 0) + (match.scoreTeamB || 0);
      }, 0);
      
      lastWeekSchedule = await Schedule.create({
        weekNumber: lastWeekCalendarWeek,
        year,
        jornada: lastWeekJornada,
        matches: lastWeekMatches.slice(0, 9),
        dataSource: 'hardcoded',
        isSettled: true,
        actualTotalGoals: totalGoals
      });
      
      console.log(`\n✅ Last week's schedule created (Jornada ${lastWeekJornada})`);
      console.log(`   Week: ${lastWeekCalendarWeek}, Year: ${year}`);
      console.log(`   Total Goals: ${totalGoals}`);
      console.log(`   Status: Settled ✓`);
    }

    // NOTE: Next week's schedule will be created automatically when current week is settled
    // This prevents showing future weeks before they should be visible

    // Summary
    console.log('\n' + '═'.repeat(55));
    console.log('✅ DATABASE SEEDED SUCCESSFULLY!');
    console.log('═'.repeat(55));
    
    console.log('\n📊 Summary:');
    console.log(`   • Users: ${userCount} (preserved)`);
    console.log(`   • Current Week: Jornada ${currentJornada} (Week ${calendarWeek}/${year})`);
    if (lastWeekSchedule) {
      console.log(`   • Last Week: Jornada ${lastWeekJornada} (Week ${calendarWeek - 1}/${year}) - SETTLED`);
    }
    console.log(`   • Next Week: Will be auto-created when current week is settled`);
    console.log(`   • Data source: ${source}`);
    console.log(`   • Matches per week: 9`);
    console.log(`   • Bets: 0 (cleared - users can place new bets)`);

    console.log('\n⚽ Matches for Jornada ' + currentJornada + ':');
    console.log('   Legend: 🏠 = Home | ✈️  = Away');
    console.log('   ─'.repeat(25));
    schedule.matches.forEach((match, idx) => {
      const date = new Date(match.startTime).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      console.log(`   ${idx + 1}. 🏠 ${match.teamA} vs ✈️  ${match.teamB}`);
      console.log(`      📆 ${date}`);
    });

    console.log('\n📅 Available Jornadas in seed (4-17):');
    Object.keys(LIGA_MX_CLAUSURA_2026).forEach(j => {
      const jNum = parseInt(j);
      let indicator = '';
      if (jNum === currentJornada) {
        indicator = ' 👈 CURRENT';
      } else if (jNum === lastWeekJornada) {
        indicator = ' ✅ COMPLETED';
      }
      console.log(`   • Jornada ${j}${indicator}`);
    });

    console.log('\n💡 Usage:');
    console.log('   node seed.js    # Resets schedules & bets, preserves users');
    console.log('');
    console.log('   ⚠️  Note: This clears all bets. Users will need to place new predictions.');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed error:', error.message);
    console.error(error);
    process.exit(1);
  }
};

// Only run seedDatabase if this file is executed directly (not imported)
if (require.main === module) {
  seedDatabase();
}

// Export schedule data for use in other modules
module.exports = { LIGA_MX_CLAUSURA_2026 };
