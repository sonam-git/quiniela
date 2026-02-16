/**
 * AUTOMATIC WEEKLY SCHEDULE CREATOR (HYBRID APPROACH)
 * 
 * This service automatically:
 * 1. Creates next week's schedule every Monday night at 11 PM PT
 * 2. Tries to fetch from API-Football first, falls back to hardcoded data
 * 3. Cleans up old schedules (keeps current + last week only)
 * 4. Allows admin overrides for match dates/times
 */

const cron = require('node-cron');
const Schedule = require('../models/Schedule');
const Bet = require('../models/Bet');
const GuestBet = require('../models/GuestBet');
const { getFixturesByRound, getCurrentRound, LEAGUES } = require('./apiFootball');

// Liga MX Clausura 2026 Complete Schedule (Jornadas 5-17)
const LIGA_MX_CLAUSURA_2026 = {
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
      { home: 'Club León', away: 'Guadalajara Chivas', date: '2026-03-18', time: '19:07' }
    ]
  },
  10: {
    startDate: '2026-03-06',
    matches: [
      { home: 'Club León', away: 'Mazatlán FC', date: '2026-03-06', time: '17:00' },
      { home: 'Necaxa', away: 'UNAM Pumas', date: '2026-03-06', time: '19:00' },
      { home: 'Atl. San Luis', away: 'Cruz Azul', date: '2026-03-07', time: '15:00' },
      { home: 'Pachuca', away: 'Querétaro', date: '2026-03-07', time: '15:00' },
      { home: 'Guadalajara Chivas', away: 'FC Juárez', date: '2026-03-07', time: '17:00' },
      { home: 'Club Tijuana', away: 'Santos Laguna', date: '2026-03-07', time: '19:05' },
      { home: 'Tigres UANL', away: 'Monterrey', date: '2026-03-08', time: '17:00' },
      { home: 'Puebla', away: 'Atlas', date: '2026-03-08', time: '17:05' },
      { home: 'Toluca', away: 'Club América', date: '2026-03-08', time: '19:00' }
    ]
  },
  11: {
    startDate: '2026-03-13',
    matches: [
      { home: 'Monterrey', away: 'Pachuca', date: '2026-03-13', time: '17:00' },
      { home: 'Club León', away: 'Tigres UANL', date: '2026-03-13', time: '19:00' },
      { home: 'Club Tijuana', away: 'Atl. San Luis', date: '2026-03-14', time: '15:00' },
      { home: 'Santos Laguna', away: 'Puebla', date: '2026-03-14', time: '15:00' },
      { home: 'Querétaro', away: 'Guadalajara Chivas', date: '2026-03-14', time: '17:00' },
      { home: 'UNAM Pumas', away: 'Cruz Azul', date: '2026-03-14', time: '19:00' },
      { home: 'Mazatlán FC', away: 'Club América', date: '2026-03-15', time: '13:00' },
      { home: 'FC Juárez', away: 'Toluca', date: '2026-03-15', time: '17:00' },
      { home: 'Atlas', away: 'Necaxa', date: '2026-03-15', time: '19:00' }
    ]
  },
  12: {
    startDate: '2026-03-13',
    matches: [
      { home: 'Pachuca', away: 'Santos Laguna', date: '2026-03-13', time: '17:00' },
      { home: 'Toluca', away: 'Querétaro', date: '2026-03-13', time: '19:00' },
      { home: 'Guadalajara Chivas', away: 'Atlas', date: '2026-03-14', time: '17:00' },
      { home: 'Club América', away: 'Club León', date: '2026-03-14', time: '19:00' },
      { home: 'Puebla', away: 'FC Juárez', date: '2026-03-15', time: '13:00' },
      { home: 'Necaxa', away: 'Mazatlán FC', date: '2026-03-15', time: '15:00' },
      { home: 'Tigres UANL', away: 'Atl. San Luis', date: '2026-03-15', time: '17:00' },
      { home: 'UNAM Pumas', away: 'Club Tijuana', date: '2026-03-15', time: '17:05' },
      { home: 'Cruz Azul', away: 'Monterrey', date: '2026-03-15', time: '19:00' }
    ]
  },
  13: {
    startDate: '2026-04-03',
    matches: [
      { home: 'Querétaro', away: 'UNAM Pumas', date: '2026-04-03', time: '17:00' },
      { home: 'Club Tijuana', away: 'Necaxa', date: '2026-04-03', time: '19:00' },
      { home: 'Santos Laguna', away: 'Guadalajara Chivas', date: '2026-04-04', time: '15:00' },
      { home: 'Mazatlán FC', away: 'Cruz Azul', date: '2026-04-04', time: '17:00' },
      { home: 'Pachuca', away: 'Club América', date: '2026-04-04', time: '19:00' },
      { home: 'FC Juárez', away: 'Tigres UANL', date: '2026-04-05', time: '13:00' },
      { home: 'Atl. San Luis', away: 'Club León', date: '2026-04-05', time: '15:00' },
      { home: 'Monterrey', away: 'Atlas', date: '2026-04-05', time: '17:00' },
      { home: 'Toluca', away: 'Puebla', date: '2026-04-05', time: '19:05' }
    ]
  },
  14: {
    startDate: '2026-04-10',
    matches: [
      { home: 'Santos Laguna', away: 'Monterrey', date: '2026-04-10', time: '17:00' },
      { home: 'Guadalajara Chivas', away: 'Atl. San Luis', date: '2026-04-10', time: '19:06' },
      { home: 'Cruz Azul', away: 'FC Juárez', date: '2026-04-11', time: '15:00' },
      { home: 'Tigres UANL', away: 'Atlas', date: '2026-04-11', time: '17:00' },
      { home: 'UNAM Pumas', away: 'Mazatlán FC', date: '2026-04-11', time: '17:05' },
      { home: 'Club América', away: 'Necaxa', date: '2026-04-11', time: '19:00' },
      { home: 'Club León', away: 'Pachuca', date: '2026-04-12', time: '13:00' },
      { home: 'Puebla', away: 'Querétaro', date: '2026-04-12', time: '17:00' },
      { home: 'Toluca', away: 'Club Tijuana', date: '2026-04-12', time: '19:05' }
    ]
  },
  15: {
    startDate: '2026-04-17',
    matches: [
      { home: 'Querétaro', away: 'Club Tijuana', date: '2026-04-17', time: '17:00' },
      { home: 'Necaxa', away: 'Santos Laguna', date: '2026-04-17', time: '19:00' },
      { home: 'Atl. San Luis', away: 'Monterrey', date: '2026-04-18', time: '15:00' },
      { home: 'Atlas', away: 'Toluca', date: '2026-04-18', time: '15:00' },
      { home: 'FC Juárez', away: 'Club León', date: '2026-04-18', time: '17:00' },
      { home: 'Pachuca', away: 'UNAM Pumas', date: '2026-04-18', time: '17:00' },
      { home: 'Mazatlán FC', away: 'Guadalajara Chivas', date: '2026-04-18', time: '19:06' },
      { home: 'Tigres UANL', away: 'Club América', date: '2026-04-19', time: '17:00' },
      { home: 'Cruz Azul', away: 'Puebla', date: '2026-04-19', time: '19:05' }
    ]
  },
  16: {
    startDate: '2026-04-21',
    matches: [
      { home: 'Querétaro', away: 'Atlas', date: '2026-04-21', time: '17:00' },
      { home: 'Club Tijuana', away: 'Guadalajara Chivas', date: '2026-04-21', time: '19:06' },
      { home: 'Puebla', away: 'Mazatlán FC', date: '2026-04-22', time: '17:00' },
      { home: 'Santos Laguna', away: 'Club América', date: '2026-04-22', time: '19:00' },
      { home: 'UNAM Pumas', away: 'Atl. San Luis', date: '2026-04-23', time: '17:00' },
      { home: 'Toluca', away: 'Necaxa', date: '2026-04-23', time: '17:00' },
      { home: 'Monterrey', away: 'FC Juárez', date: '2026-04-23', time: '19:00' },
      { home: 'Club León', away: 'Cruz Azul', date: '2026-04-23', time: '19:00' },
      { home: 'Pachuca', away: 'Tigres UANL', date: '2026-04-23', time: '21:05' }
    ]
  },
  17: {
    startDate: '2026-04-24',
    matches: [
      { home: 'Guadalajara Chivas', away: 'Pachuca', date: '2026-04-24', time: '19:06' },
      { home: 'Mazatlán FC', away: 'Querétaro', date: '2026-04-25', time: '15:00' },
      { home: 'Atl. San Luis', away: 'Toluca', date: '2026-04-25', time: '17:00' },
      { home: 'FC Juárez', away: 'Santos Laguna', date: '2026-04-25', time: '17:00' },
      { home: 'Atlas', away: 'Club León', date: '2026-04-25', time: '19:00' },
      { home: 'Club América', away: 'Cruz Azul', date: '2026-04-25', time: '21:00' },
      { home: 'Tigres UANL', away: 'Club Tijuana', date: '2026-04-26', time: '12:00' },
      { home: 'Necaxa', away: 'Monterrey', date: '2026-04-26', time: '18:00' },
      { home: 'UNAM Pumas', away: 'Puebla', date: '2026-04-26', time: '20:05' }
    ]
  }
};

// Helper to get week number from date
const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNumber;
};

// Get jornada for a specific week
const getJornadaForWeek = (weekNumber, year) => {
  for (const [jornada, data] of Object.entries(LIGA_MX_CLAUSURA_2026)) {
    const startDate = new Date(data.startDate);
    const jornadaWeek = getWeekNumber(startDate);
    const jornadaYear = startDate.getFullYear();
    
    if (jornadaWeek === weekNumber && jornadaYear === year) {
      return parseInt(jornada);
    }
  }
  return null;
};

// Get upcoming jornada (next jornada that hasn't started yet)
const getUpcomingJornada = () => {
  const now = new Date();
  
  for (const [jornada, data] of Object.entries(LIGA_MX_CLAUSURA_2026)) {
    const startDate = new Date(data.startDate);
    if (startDate > now) {
      return parseInt(jornada);
    }
  }
  
  return null;
};

// Convert jornada data to schedule matches
const createMatchesFromJornada = (jornadaData) => {
  return jornadaData.matches.map(match => {
    const [hours, minutes] = match.time.split(':');
    const startTime = new Date(match.date);
    startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    return {
      teamA: match.home,
      teamB: match.away,
      teamAIsHome: true,
      startTime,
      isCompleted: false,
      scoreTeamA: null,
      scoreTeamB: null,
      result: null,
      apiFixtureId: null
    };
  });
};

// Convert API-Football fixtures to schedule matches
const createMatchesFromApiFixtures = (fixtures) => {
  return fixtures.map(fixture => ({
    teamA: fixture.teams.home.name,
    teamB: fixture.teams.away.name,
    teamAIsHome: true,
    startTime: new Date(fixture.fixture.date),
    isCompleted: fixture.fixture.status.short === 'FT',
    scoreTeamA: fixture.goals.home,
    scoreTeamB: fixture.goals.away,
    result: fixture.fixture.status.short === 'FT' 
      ? (fixture.goals.home > fixture.goals.away ? 'A' : fixture.goals.home < fixture.goals.away ? 'B' : 'draw')
      : null,
    apiFixtureId: fixture.fixture.id
  }));
};

// Fetch schedule from API-Football
const fetchScheduleFromApi = async (jornada) => {
  try {
    const season = 2025; // Liga MX Clausura 2026 is season 2025
    const round = `Clausura - ${jornada}`;
    
    console.log(`[Scheduler] Fetching Jornada ${jornada} from API-Football...`);
    const fixtures = await getFixturesByRound(LEAGUES.LIGA_MX, season, round);
    
    if (fixtures && fixtures.length > 0) {
      console.log(`[Scheduler] ✅ Got ${fixtures.length} matches from API-Football`);
      return createMatchesFromApiFixtures(fixtures);
    }
    
    console.log('[Scheduler] No fixtures returned from API');
    return null;
  } catch (error) {
    console.log(`[Scheduler] API-Football error: ${error.message}`);
    return null;
  }
};

// Create schedule for a specific jornada (HYBRID: API first, then fallback)
const createScheduleForJornada = async (jornada) => {
  const jornadaData = LIGA_MX_CLAUSURA_2026[jornada];
  if (!jornadaData) {
    console.log(`[Scheduler] Jornada ${jornada} not found in hardcoded data`);
    return null;
  }

  const startDate = new Date(jornadaData.startDate);
  const weekNumber = getWeekNumber(startDate);
  const year = startDate.getFullYear();

  // Check if schedule already exists
  const existing = await Schedule.findOne({ weekNumber, year });
  if (existing) {
    console.log(`[Scheduler] Schedule already exists for Week ${weekNumber}/${year}`);
    return existing;
  }

  // HYBRID APPROACH: Try API-Football first, fallback to hardcoded data
  let matches = await fetchScheduleFromApi(jornada);
  let dataSource = 'api';
  
  if (!matches || matches.length === 0) {
    console.log(`[Scheduler] Using hardcoded fallback for Jornada ${jornada}`);
    matches = createMatchesFromJornada(jornadaData);
    dataSource = 'hardcoded';
  }
  
  const schedule = await Schedule.create({
    weekNumber,
    year,
    jornada, // Store jornada number for reference
    matches,
    dataSource, // Track where data came from
    isSettled: false,
    actualTotalGoals: null
  });

  console.log(`[Scheduler] ✅ Created schedule for Jornada ${jornada} (Week ${weekNumber}/${year}) from ${dataSource}`);
  return schedule;
};;

// Clean up old schedules and bets (keep only current and last week)
const cleanupOldData = async () => {
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

  // Find schedules older than last week
  const oldSchedules = await Schedule.find({
    $nor: [
      { weekNumber: currentWeek, year: currentYear },
      { weekNumber: lastWeek, year: lastWeekYear }
    ]
  });

  if (oldSchedules.length > 0) {
    for (const schedule of oldSchedules) {
      // Delete associated bets
      await Bet.deleteMany({ 
        weekNumber: schedule.weekNumber, 
        year: schedule.year 
      });
      
      // Delete the schedule
      await Schedule.deleteOne({ _id: schedule._id });
      
      console.log(`[Scheduler] 🗑️ Cleaned up Week ${schedule.weekNumber}/${schedule.year}`);
    }
  }
};

// Main scheduled task - runs every Monday night
// Only creates new schedule if the most recent week is settled
const scheduleWeeklyTask = () => {
  // Run every Monday at 23:00 (11 PM)
  cron.schedule('0 23 * * 1', async () => {
    console.log('[Scheduler] Running weekly schedule creation check...');
    
    try {
      // Check if the most recent unsettled schedule exists
      // If there's an unsettled schedule, don't create a new one
      const now = new Date();
      const currentWeek = getWeekNumber(now);
      const year = now.getFullYear();
      
      // Find any unsettled schedule
      const unsettledSchedule = await Schedule.findOne({ isSettled: false });
      
      if (unsettledSchedule) {
        console.log(`[Scheduler] ⏳ Skipping - Week ${unsettledSchedule.weekNumber}/${unsettledSchedule.year} is not settled yet`);
        console.log('[Scheduler] Admin must verify/settle the week before new schedule can be created');
        return;
      }
      
      console.log('[Scheduler] ✅ All previous weeks settled, creating new schedule...');
      
      // Get next week's jornada
      const upcomingJornada = getUpcomingJornada();
      
      if (upcomingJornada) {
        const schedule = await createScheduleForJornada(upcomingJornada);
        if (schedule && schedulerIo) {
          // Emit event to notify clients of new schedule
          schedulerIo.emit('schedule:created', { 
            schedule,
            weekNumber: schedule.weekNumber,
            year: schedule.year,
            jornada: schedule.jornada
          });
        }
      } else {
        console.log('[Scheduler] No upcoming jornada found');
      }
      
      // Clean up old data
      await cleanupOldData();
      
    } catch (error) {
      console.error('[Scheduler] Error:', error.message);
    }
  }, {
    timezone: 'America/Los_Angeles' // Pacific Time
  });

  console.log('[Scheduler] ⏰ Weekly schedule task initialized (runs every Monday at 11 PM PT)');
  console.log('[Scheduler] ℹ️ New schedules only created after admin settles the current week');
};

// Manual trigger for creating next week's schedule
// Called after admin settles a week
const createNextWeekSchedule = async (io) => {
  // First check if there's any unsettled schedule
  const unsettledSchedule = await Schedule.findOne({ isSettled: false });
  
  if (unsettledSchedule) {
    return { 
      success: false, 
      message: `Cannot create new schedule - Week ${unsettledSchedule.weekNumber} is not settled yet` 
    };
  }
  
  const upcomingJornada = getUpcomingJornada();
  
  if (!upcomingJornada) {
    return { success: false, message: 'No upcoming jornada found' };
  }

  const schedule = await createScheduleForJornada(upcomingJornada);
  
  if (schedule) {
    // Emit event to notify clients of new schedule
    if (io) {
      io.emit('schedule:created', { 
        schedule,
        weekNumber: schedule.weekNumber,
        year: schedule.year,
        jornada: schedule.jornada
      });
    }
    return { 
      success: true, 
      message: `Created schedule for Jornada ${upcomingJornada}`,
      schedule 
    };
  }
  
  return { success: false, message: 'Failed to create schedule' };
};

// Initialize scheduler on server start
const initScheduler = (io) => {
  // Store io instance for emitting events
  schedulerIo = io;
  
  scheduleWeeklyTask();
  
  // NOTE: Auto-settlement has been removed
  // Admin must manually verify/settle weeks using the admin panel
  
  // Also check if current week needs a schedule (only if no unsettled schedules exist)
  (async () => {
    // Check for any unsettled schedule first
    const unsettledSchedule = await Schedule.findOne({ isSettled: false });
    
    if (unsettledSchedule) {
      console.log(`[Scheduler] Found unsettled schedule for Week ${unsettledSchedule.weekNumber}/${unsettledSchedule.year}`);
      console.log('[Scheduler] Admin must settle this week before new schedules are created');
      return;
    }
    
    const now = new Date();
    const currentWeek = getWeekNumber(now);
    const year = now.getFullYear();
    
    const existing = await Schedule.findOne({ weekNumber: currentWeek, year });
    if (!existing) {
      console.log('[Scheduler] No schedule for current week, checking jornadas...');
      
      // Find jornada for current week
      const jornada = getJornadaForWeek(currentWeek, year);
      if (jornada) {
        const schedule = await createScheduleForJornada(jornada);
        if (schedule && io) {
          io.emit('schedule:created', { 
            schedule,
            weekNumber: schedule.weekNumber,
            year: schedule.year,
            jornada: schedule.jornada
          });
        }
      }
    }
  })();
};

// Store io instance for emitting events
let schedulerIo = null;

// NOTE: Auto-settlement has been removed.
// Admin must manually verify/settle weeks using the admin panel.
// This ensures proper review of scores before finalizing results.

module.exports = {
  initScheduler,
  createNextWeekSchedule,
  createScheduleForJornada,
  fetchScheduleFromApi,
  cleanupOldData,
  getWeekNumber,
  getUpcomingJornada,
  LIGA_MX_CLAUSURA_2026
};
