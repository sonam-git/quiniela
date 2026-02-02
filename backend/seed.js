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

// Liga MX Clausura 2026 Complete Schedule (Jornadas 5-17)
// Format: { home: 'HomeTeam 🏠', away: 'AwayTeam ✈️', date: 'YYYY-MM-DD', time: 'HH:MM' }
const LIGA_MX_CLAUSURA_2026 = {
  // Jornada 5 - February 6-7, 2026
  5: {
    startDate: '2026-02-06',
    matches: [
      { home: 'Necaxa', away: 'Atl. San Luis', date: '2026-02-06', time: '17:00' },
      { home: 'Santos Laguna', away: 'Tigres UANL', date: '2026-02-06', time: '17:00' },
      { home: 'Club Tijuana', away: 'Puebla', date: '2026-02-06', time: '19:00' },
      { home: 'Guadalajara Chivas', away: 'Mazatlán FC', date: '2026-02-06', time: '19:06' },
      { home: 'Club León', away: 'Querétaro', date: '2026-02-07', time: '15:00' },
      { home: 'Cruz Azul', away: 'Toluca', date: '2026-02-07', time: '15:00' },
      { home: 'Atlas', away: 'UNAM Pumas', date: '2026-02-07', time: '17:00' },
      { home: 'FC Juárez', away: 'Pachuca', date: '2026-02-07', time: '17:00' },
      { home: 'Club América', away: 'Monterrey', date: '2026-02-07', time: '19:00' }
    ]
  },
  // Jornada 6 - February 13-15, 2026
  6: {
    startDate: '2026-02-13',
    matches: [
      { home: 'Puebla', away: 'UNAM Pumas', date: '2026-02-13', time: '17:00' },
      { home: 'Club Tijuana', away: 'Toluca', date: '2026-02-13', time: '19:00' },
      { home: 'Atl. San Luis', away: 'Querétaro', date: '2026-02-14', time: '15:00' },
      { home: 'Atlas', away: 'Pachuca', date: '2026-02-14', time: '15:00' },
      { home: 'FC Juárez', away: 'Necaxa', date: '2026-02-14', time: '17:00' },
      { home: 'Club León', away: 'Monterrey', date: '2026-02-14', time: '17:00' },
      { home: 'Club América', away: 'Guadalajara Chivas', date: '2026-02-14', time: '19:07' },
      { home: 'Mazatlán FC', away: 'Santos Laguna', date: '2026-02-15', time: '15:00' },
      { home: 'Cruz Azul', away: 'Tigres UANL', date: '2026-02-15', time: '17:00' }
    ]
  },
  // Jornada 7 - February 20-22, 2026
  7: {
    startDate: '2026-02-20',
    matches: [
      { home: 'Pachuca', away: 'Tigres UANL', date: '2026-02-20', time: '17:00' },
      { home: 'Club América', away: 'Puebla', date: '2026-02-20', time: '19:06' },
      { home: 'Atlas', away: 'Atl. San Luis', date: '2026-02-21', time: '15:00' },
      { home: 'Club León', away: 'Santos Laguna', date: '2026-02-21', time: '17:00' },
      { home: 'Necaxa', away: 'Toluca', date: '2026-02-21', time: '17:00' },
      { home: 'Cruz Azul', away: 'Guadalajara Chivas', date: '2026-02-21', time: '19:00' },
      { home: 'Monterrey', away: 'UNAM Pumas', date: '2026-02-22', time: '15:00' },
      { home: 'FC Juárez', away: 'Querétaro', date: '2026-02-22', time: '17:00' },
      { home: 'Club Tijuana', away: 'Mazatlán FC', date: '2026-02-22', time: '19:06' }
    ]
  },
  // Jornada 8 - February 27-28, 2026
  8: {
    startDate: '2026-02-27',
    matches: [
      { home: 'Mazatlán FC', away: 'Pachuca', date: '2026-02-27', time: '17:00' },
      { home: 'Querétaro', away: 'Santos Laguna', date: '2026-02-27', time: '17:00' },
      { home: 'Atlas', away: 'FC Juárez', date: '2026-02-27', time: '19:00' },
      { home: 'Club Tijuana', away: 'UNAM Pumas', date: '2026-02-27', time: '19:06' },
      { home: 'Atl. San Luis', away: 'Puebla', date: '2026-02-28', time: '15:00' },
      { home: 'Guadalajara Chivas', away: 'Toluca', date: '2026-02-28', time: '15:00' },
      { home: 'Club León', away: 'Necaxa', date: '2026-02-28', time: '17:00' },
      { home: 'Cruz Azul', away: 'Monterrey', date: '2026-02-28', time: '17:00' },
      { home: 'Club América', away: 'Tigres UANL', date: '2026-02-28', time: '19:00' }
    ]
  },
  // Jornada 9 - March 3-4, 2026
  9: {
    startDate: '2026-03-03',
    matches: [
      { home: 'Necaxa', away: 'Pachuca', date: '2026-03-03', time: '17:00' },
      { home: 'Cruz Azul', away: 'Santos Laguna', date: '2026-03-03', time: '17:00' },
      { home: 'Atl. San Luis', away: 'Mazatlán FC', date: '2026-03-03', time: '19:00' },
      { home: 'Toluca', away: 'UNAM Pumas', date: '2026-03-03', time: '19:00' },
      { home: 'Monterrey', away: 'Querétaro', date: '2026-03-04', time: '17:00' },
      { home: 'Puebla', away: 'Tigres UANL', date: '2026-03-04', time: '17:00' },
      { home: 'Atlas', away: 'Club Tijuana', date: '2026-03-04', time: '19:00' },
      { home: 'Club América', away: 'FC Juárez', date: '2026-03-04', time: '19:00' },
      { home: 'Club León', away: 'Guadalajara Chivas', date: '2026-03-18', time: '19:07' } // Rescheduled
    ]
  },
  // Jornada 10 - March 6-8, 2026
  10: {
    startDate: '2026-03-06',
    matches: [
      { home: 'Club León', away: 'Mazatlán FC', date: '2026-03-06', time: '17:00' },
      { home: 'Necaxa', away: 'UNAM Pumas', date: '2026-03-06', time: '19:00' },
      { home: 'Atl. San Luis', away: 'Cruz Azul', date: '2026-03-07', time: '15:00' },
      { home: 'Pachuca', away: 'Puebla', date: '2026-03-07', time: '15:00' },
      { home: 'Atlas', away: 'Guadalajara Chivas', date: '2026-03-07', time: '17:00' },
      { home: 'Monterrey', away: 'Tigres UANL', date: '2026-03-07', time: '19:00' },
      { home: 'Club América', away: 'Querétaro', date: '2026-03-08', time: '16:00' },
      { home: 'FC Juárez', away: 'Toluca', date: '2026-03-08', time: '18:00' },
      { home: 'Club Tijuana', away: 'Santos Laguna', date: '2026-03-08', time: '20:00' }
    ]
  },
  // Jornada 11 - March 13-15, 2026
  11: {
    startDate: '2026-03-13',
    matches: [
      { home: 'Necaxa', away: 'Puebla', date: '2026-03-13', time: '18:00' },
      { home: 'Querétaro', away: 'Tigres UANL', date: '2026-03-13', time: '18:00' },
      { home: 'FC Juárez', away: 'Monterrey', date: '2026-03-13', time: '20:00' },
      { home: 'Atl. San Luis', away: 'Pachuca', date: '2026-03-14', time: '16:00' },
      { home: 'Guadalajara Chivas', away: 'Santos Laguna', date: '2026-03-14', time: '16:07' },
      { home: 'Club León', away: 'Club Tijuana', date: '2026-03-14', time: '18:00' },
      { home: 'Atlas', away: 'Toluca', date: '2026-03-14', time: '18:00' },
      { home: 'Cruz Azul', away: 'UNAM Pumas', date: '2026-03-14', time: '20:00' },
      { home: 'Club América', away: 'Mazatlán FC', date: '2026-03-15', time: '18:00' }
    ]
  },
  // Jornada 12 - March 20-22, 2026
  12: {
    startDate: '2026-03-20',
    matches: [
      { home: 'Club Tijuana', away: 'Necaxa', date: '2026-03-20', time: '18:00' },
      { home: 'Cruz Azul', away: 'Mazatlán FC', date: '2026-03-20', time: '20:06' },
      { home: 'Atlas', away: 'Querétaro', date: '2026-03-21', time: '16:00' },
      { home: 'Pachuca', away: 'Toluca', date: '2026-03-21', time: '16:00' },
      { home: 'Atl. San Luis', away: 'Club León', date: '2026-03-21', time: '18:00' },
      { home: 'Guadalajara Chivas', away: 'Monterrey', date: '2026-03-21', time: '18:00' },
      { home: 'Club América', away: 'UNAM Pumas', date: '2026-03-21', time: '20:00' },
      { home: 'Puebla', away: 'Santos Laguna', date: '2026-03-22', time: '16:00' },
      { home: 'FC Juárez', away: 'Tigres UANL', date: '2026-03-22', time: '18:00' }
    ]
  },
  // Jornada 13 - April 3-5, 2026
  13: {
    startDate: '2026-04-03',
    matches: [
      { home: 'FC Juárez', away: 'Puebla', date: '2026-04-03', time: '18:00' },
      { home: 'Mazatlán FC', away: 'Necaxa', date: '2026-04-03', time: '20:00' },
      { home: 'Club Tijuana', away: 'Tigres UANL', date: '2026-04-03', time: '20:06' },
      { home: 'Atl. San Luis', away: 'Monterrey', date: '2026-04-04', time: '16:00' },
      { home: 'Atlas', away: 'Club León', date: '2026-04-04', time: '18:00' },
      { home: 'Cruz Azul', away: 'Pachuca', date: '2026-04-04', time: '18:00' },
      { home: 'Club América', away: 'Santos Laguna', date: '2026-04-04', time: '20:00' },
      { home: 'Querétaro', away: 'Toluca', date: '2026-04-05', time: '17:00' },
      { home: 'Guadalajara Chivas', away: 'UNAM Pumas', date: '2026-04-05', time: '19:07' }
    ]
  },
  // Jornada 14 - April 10-12, 2026
  14: {
    startDate: '2026-04-10',
    matches: [
      { home: 'Club León', away: 'Puebla', date: '2026-04-10', time: '18:00' },
      { home: 'Club Tijuana', away: 'FC Juárez', date: '2026-04-10', time: '20:06' },
      { home: 'Necaxa', away: 'Querétaro', date: '2026-04-11', time: '16:00' },
      { home: 'Guadalajara Chivas', away: 'Tigres UANL', date: '2026-04-11', time: '16:00' },
      { home: 'Atlas', away: 'Monterrey', date: '2026-04-11', time: '18:00' },
      { home: 'Pachuca', away: 'Santos Laguna', date: '2026-04-11', time: '18:00' },
      { home: 'Club América', away: 'Cruz Azul', date: '2026-04-11', time: '20:00' },
      { home: 'Mazatlán FC', away: 'UNAM Pumas', date: '2026-04-12', time: '11:00' },
      { home: 'Atl. San Luis', away: 'Toluca', date: '2026-04-12', time: '18:00' }
    ]
  },
  // Jornada 15 - April 17-19, 2026
  15: {
    startDate: '2026-04-17',
    matches: [
      { home: 'Atl. San Luis', away: 'UNAM Pumas', date: '2026-04-17', time: '18:00' },
      { home: 'Mazatlán FC', away: 'Querétaro', date: '2026-04-17', time: '18:00' },
      { home: 'Necaxa', away: 'Tigres UANL', date: '2026-04-17', time: '20:00' },
      { home: 'Club Tijuana', away: 'Cruz Azul', date: '2026-04-18', time: '16:00' },
      { home: 'Monterrey', away: 'Pachuca', date: '2026-04-18', time: '18:00' },
      { home: 'Guadalajara Chivas', away: 'Puebla', date: '2026-04-18', time: '18:07' },
      { home: 'Club América', away: 'Toluca', date: '2026-04-18', time: '20:00' },
      { home: 'Club León', away: 'FC Juárez', date: '2026-04-18', time: '20:00' },
      { home: 'Atlas', away: 'Santos Laguna', date: '2026-04-19', time: '16:00' }
    ]
  },
  // Jornada 16 - April 21-22, 2026
  16: {
    startDate: '2026-04-21',
    matches: [
      { home: 'Cruz Azul', away: 'Querétaro', date: '2026-04-21', time: '18:00' },
      { home: 'FC Juárez', away: 'UNAM Pumas', date: '2026-04-21', time: '18:00' },
      { home: 'Monterrey', away: 'Puebla', date: '2026-04-21', time: '20:00' },
      { home: 'Club América', away: 'Club León', date: '2026-04-21', time: '20:06' },
      { home: 'Atl. San Luis', away: 'Santos Laguna', date: '2026-04-22', time: '18:00' },
      { home: 'Atlas', away: 'Tigres UANL', date: '2026-04-22', time: '18:00' },
      { home: 'Mazatlán FC', away: 'Toluca', date: '2026-04-22', time: '18:00' },
      { home: 'Club Tijuana', away: 'Pachuca', date: '2026-04-22', time: '20:00' },
      { home: 'Guadalajara Chivas', away: 'Necaxa', date: '2026-04-22', time: '20:00' }
    ]
  },
  // Jornada 17 - April 25-26, 2026 (Final regular season matchday)
  17: {
    startDate: '2026-04-25',
    matches: [
      { home: 'Tigres UANL', away: 'Club América', date: '2026-04-25', time: '18:00' },
      { home: 'UNAM Pumas', away: 'Guadalajara Chivas', date: '2026-04-25', time: '18:00' },
      { home: 'Santos Laguna', away: 'Cruz Azul', date: '2026-04-25', time: '20:00' },
      { home: 'Toluca', away: 'Atlas', date: '2026-04-25', time: '20:00' },
      { home: 'Querétaro', away: 'Atl. San Luis', date: '2026-04-26', time: '16:00' },
      { home: 'Pachuca', away: 'Club León', date: '2026-04-26', time: '16:00' },
      { home: 'Puebla', away: 'Club Tijuana', date: '2026-04-26', time: '18:00' },
      { home: 'Monterrey', away: 'Mazatlán FC', date: '2026-04-26', time: '18:00' },
      { home: 'Necaxa', away: 'FC Juárez', date: '2026-04-26', time: '20:00' }
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
    
    return {
      teamA: match.home, // Home team 🏠
      teamB: match.away, // Away team ✈️
      teamAIsHome: true, // teamA is always home
      startTime,
      isCompleted: false,
      scoreTeamA: null,
      scoreTeamB: null,
      result: null,
      apiFixtureId: null
    };
  });

  return matches;
};

// Determine current jornada based on date
const getCurrentJornada = () => {
  const now = new Date();
  
  // Check each jornada to find the current or upcoming one
  for (const [jornada, data] of Object.entries(LIGA_MX_CLAUSURA_2026)) {
    const jornadaStart = new Date(data.startDate);
    const jornadaEnd = new Date(jornadaStart);
    jornadaEnd.setDate(jornadaEnd.getDate() + 4); // Jornada typically spans 4 days
    
    if (now <= jornadaEnd) {
      return parseInt(jornada);
    }
  }
  
  // Default to jornada 5 if we can't determine
  return 5;
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

// Create demo users
const createDemoUsers = async () => {
  const users = await User.create([
    { name: 'Carlos García', email: 'carlos@example.com', password: 'password123' },
    { name: 'María López', email: 'maria@example.com', password: 'password123' },
    { name: 'Juan Martínez', email: 'juan@example.com', password: 'password123' },
    { name: 'Ana Rodríguez', email: 'ana@example.com', password: 'password123' },
    { name: 'Pedro Sánchez', email: 'pedro@example.com', password: 'password123' },
    { name: 'Luis Hernández', email: 'luis@example.com', password: 'password123' },
    { name: 'Sofia Torres', email: 'sofia@example.com', password: 'password123' }
  ]);
  return users;
};

// Create demo bets for users
const createDemoBets = async (users, schedule) => {
  const predictionOptions = ['teamA', 'teamB', 'draw'];
  
  const betsToCreate = [];
  
  for (const user of users.slice(0, 5)) { // Create bets for first 5 users
    const predictions = schedule.matches.map(match => ({
      matchId: match._id,
      prediction: predictionOptions[Math.floor(Math.random() * 3)]
    }));
    
    betsToCreate.push({
      userId: user._id,
      weekNumber: schedule.weekNumber,
      year: schedule.year,
      totalGoals: Math.floor(Math.random() * 20) + 15, // Random between 15-35
      predictions,
      paid: Math.random() > 0.3, // 70% chance of being paid
      totalPoints: 0,
      goalDifference: 0,
      isWinner: false
    });
  }
  
  for (const betData of betsToCreate) {
    await Bet.create(betData);
  }
  
  return betsToCreate.length;
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

    // Clear existing data
    console.log('\n🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Schedule.deleteMany({});
    await Bet.deleteMany({});
    console.log('✅ Cleared existing data');

    // Create demo users
    console.log('\n👥 Creating demo users...');
    const users = await createDemoUsers();
    console.log(`✅ Created ${users.length} demo users`);

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
    const schedule = await Schedule.create({
      weekNumber: calendarWeek,  // Use calendar week for route lookup
      year,
      matches: matches.slice(0, 9),
      isSettled: false,
      allMatchesCompleted: false,
      actualTotalGoals: null
    });

    console.log(`\n✅ Schedule created (Source: ${source})`);
    console.log(`   Jornada: ${currentJornada}, Week: ${calendarWeek}, Year: ${year}`);
    console.log(`   Matches: ${schedule.matches.length}`);

    // Create demo bets
    console.log('\n🎲 Creating demo bets...');
    const betCount = await createDemoBets(users, schedule);
    console.log(`✅ Created ${betCount} demo bets`);

    // Summary
    console.log('\n' + '═'.repeat(55));
    console.log('✅ DATABASE SEEDED SUCCESSFULLY!');
    console.log('═'.repeat(55));
    
    console.log('\n📊 Summary:');
    console.log(`   • Users: ${users.length}`);
    console.log(`   • Schedule: Jornada ${currentJornada} (Week ${calendarWeek}/${year})`);
    console.log(`   • Data source: ${source}`);
    console.log(`   • Matches: ${schedule.matches.length}`);
    console.log(`   • Bets: ${betCount}`);

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

    console.log('\n📅 Available Jornadas in seed (5-17):');
    Object.keys(LIGA_MX_CLAUSURA_2026).forEach(j => {
      const indicator = parseInt(j) === currentJornada ? ' 👈 CURRENT' : '';
      console.log(`   • Jornada ${j}${indicator}`);
    });

    console.log('\n🔑 Demo credentials:');
    console.log('   Email: carlos@example.com');
    console.log('   Password: password123');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed error:', error.message);
    console.error(error);
    process.exit(1);
  }
};

seedDatabase();
