/**
 * CREATE SCHEDULE ONLY
 * This script creates/updates the weekly schedule without touching users or bets.
 * Run this script to add a new week's schedule or update the current one.
 * 
 * Usage: 
 *   node createSchedule.js           # Creates schedule for current week
 *   node createSchedule.js 6         # Creates schedule for Jornada 6
 *   node createSchedule.js 7 --force # Force replace existing schedule for Jornada 7
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Schedule = require('./models/Schedule');

// Liga MX Clausura 2026 Complete Schedule (Jornadas 5-17)
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
      { home: 'Club León', away: 'Guadalajara Chivas', date: '2026-03-18', time: '19:07' }
    ]
  },
  // Jornada 10 - March 6-8, 2026
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
  // Jornada 11 - March 13-15, 2026
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
  // Jornada 12 - March 13-15, 2026
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
  // Jornada 13 - April 3-5, 2026
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
  // Jornada 14 - April 10-12, 2026
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
  // Jornada 15 - April 17-19, 2026
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
  // Jornada 16 - April 21-23, 2026
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
  // Jornada 17 - April 24-26, 2026
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

// Get current jornada based on date
const getCurrentJornada = () => {
  const now = new Date();
  
  for (const [jornada, data] of Object.entries(LIGA_MX_CLAUSURA_2026)) {
    const jornadaStart = new Date(data.startDate);
    const jornadaEnd = new Date(jornadaStart);
    jornadaEnd.setDate(jornadaEnd.getDate() + 4);
    
    if (now <= jornadaEnd) {
      return parseInt(jornada);
    }
  }
  
  return 5; // Default
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

// Main function
const createSchedule = async () => {
  const args = process.argv.slice(2);
  const forceReplace = args.includes('--force');
  const specifiedJornada = args.find(arg => !arg.startsWith('--'));
  
  try {
    console.log('\n⚽ QUINIELA SCHEDULE CREATOR');
    console.log('═'.repeat(50));
    
    console.log('\n📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });
    console.log('✅ Connected to MongoDB');

    // Determine which jornada to create
    const targetJornada = specifiedJornada ? parseInt(specifiedJornada) : getCurrentJornada();
    
    if (!LIGA_MX_CLAUSURA_2026[targetJornada]) {
      console.log(`\n❌ Jornada ${targetJornada} not found in schedule data`);
      console.log('   Available jornadas: 5-17');
      process.exit(1);
    }

    const jornadaData = LIGA_MX_CLAUSURA_2026[targetJornada];
    const jornadaStartDate = new Date(jornadaData.startDate);
    const weekNumber = getWeekNumber(jornadaStartDate);
    const year = jornadaStartDate.getFullYear();

    console.log(`\n📅 Target: Jornada ${targetJornada}`);
    console.log(`   Week Number: ${weekNumber}`);
    console.log(`   Year: ${year}`);

    // Check if schedule exists
    const existing = await Schedule.findOne({ weekNumber, year });
    
    if (existing && !forceReplace) {
      console.log(`\n⚠️  Schedule already exists for Week ${weekNumber}/${year}`);
      console.log('   Use --force flag to replace it');
      console.log(`   Example: node createSchedule.js ${targetJornada} --force`);
      process.exit(0);
    }

    if (existing && forceReplace) {
      console.log(`\n🗑️  Removing existing schedule for Week ${weekNumber}/${year}...`);
      await Schedule.deleteOne({ weekNumber, year });
    }

    // Create new schedule
    const matches = createMatchesFromJornada(jornadaData);
    
    const schedule = await Schedule.create({
      weekNumber,
      year,
      matches,
      isSettled: false,
      actualTotalGoals: null
    });

    console.log(`\n✅ Schedule created successfully!`);
    console.log('═'.repeat(50));
    
    console.log(`\n⚽ Jornada ${targetJornada} - Liga MX Clausura 2026`);
    console.log(`   Week: ${weekNumber} | Year: ${year}`);
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

    console.log('\n✅ Done! Users and bets were NOT modified.');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
};

createSchedule();
