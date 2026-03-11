// Script to fix schedule without deleting bets
// This will:
// 1. Ensure Jornada 10 schedule exists and is settled (preserves existing bets)
// 2. Create Jornada 11 schedule (unsettled, current week)
// 3. Remove any future schedules (like Jornada 12) that shouldn't exist yet

const mongoose = require('mongoose');
require('dotenv').config();
const Schedule = require('./models/Schedule');
const Bet = require('./models/Bet');
const GuestBet = require('./models/GuestBet');
const { LIGA_MX_CLAUSURA_2026 } = require('./seed');

const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

const getStaticSchedule = (jornada) => {
  const jornadaData = LIGA_MX_CLAUSURA_2026[jornada];
  if (!jornadaData) return null;
  
  return jornadaData.matches.map(match => {
    const [year, month, day] = match.date.split('-').map(Number);
    const [hour, minute] = match.time.split(':').map(Number);
    return {
      teamA: match.home,
      teamB: match.away,
      teamAIsHome: true,
      startTime: new Date(year, month - 1, day, hour, minute),
      isCompleted: jornadaData.completed || false,
      scoreTeamA: match.scoreA ?? null,
      scoreTeamB: match.scoreB ?? null,
      result: match.result ?? null
    };
  });
};

async function fixSchedules() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Check existing data
    const existingSchedules = await Schedule.find().sort({ jornada: 1 });
    const existingBets = await Bet.countDocuments();
    const existingGuestBets = await GuestBet.countDocuments();
    
    console.log('📊 Current state:');
    console.log(`   Schedules: ${existingSchedules.length}`);
    existingSchedules.forEach(s => {
      console.log(`      - Jornada ${s.jornada} (Week ${s.weekNumber}) - ${s.isSettled ? 'SETTLED' : 'ACTIVE'}`);
    });
    console.log(`   User Bets: ${existingBets}`);
    console.log(`   Guest Bets: ${existingGuestBets}`);
    console.log('');
    
    // Step 1: Ensure Jornada 10 exists and is settled
    const jornada10Data = LIGA_MX_CLAUSURA_2026[10];
    const jornada10WeekNumber = getWeekNumber(new Date(jornada10Data.startDate));
    const jornada10Year = new Date(jornada10Data.startDate).getFullYear();
    
    let jornada10 = await Schedule.findOne({ jornada: 10 });
    if (!jornada10) {
      console.log('📅 Creating Jornada 10 schedule (settled)...');
      const matches = getStaticSchedule(10);
      
      // Calculate total goals
      const totalGoals = matches.reduce((sum, m) => {
        return sum + (m.scoreTeamA || 0) + (m.scoreTeamB || 0);
      }, 0);
      
      jornada10 = await Schedule.create({
        weekNumber: jornada10WeekNumber,
        year: jornada10Year,
        jornada: 10,
        matches,
        dataSource: 'hardcoded',
        isSettled: true,
        settledAt: new Date(),
        actualTotalGoals: totalGoals
      });
      console.log(`   ✅ Created Jornada 10 (Week ${jornada10WeekNumber})`);
    } else if (!jornada10.isSettled) {
      console.log('📅 Marking Jornada 10 as settled...');
      const matches = getStaticSchedule(10);
      const totalGoals = matches.reduce((sum, m) => sum + (m.scoreTeamA || 0) + (m.scoreTeamB || 0), 0);
      
      jornada10.isSettled = true;
      jornada10.settledAt = new Date();
      jornada10.actualTotalGoals = totalGoals;
      jornada10.matches = matches;
      await jornada10.save();
      console.log(`   ✅ Jornada 10 marked as settled`);
    } else {
      console.log('✅ Jornada 10 already exists and is settled');
    }
    
    // Step 2: Ensure Jornada 11 exists and is NOT settled
    const jornada11Data = LIGA_MX_CLAUSURA_2026[11];
    const jornada11WeekNumber = getWeekNumber(new Date(jornada11Data.startDate));
    const jornada11Year = new Date(jornada11Data.startDate).getFullYear();
    
    let jornada11 = await Schedule.findOne({ jornada: 11 });
    if (!jornada11) {
      console.log('📅 Creating Jornada 11 schedule (current week)...');
      const matches = getStaticSchedule(11);
      
      jornada11 = await Schedule.create({
        weekNumber: jornada11WeekNumber,
        year: jornada11Year,
        jornada: 11,
        matches,
        dataSource: 'hardcoded',
        isSettled: false
      });
      console.log(`   ✅ Created Jornada 11 (Week ${jornada11WeekNumber})`);
    } else {
      console.log('✅ Jornada 11 already exists');
      if (jornada11.isSettled) {
        console.log('   ⚠️  Jornada 11 is marked as settled - unmarking...');
        jornada11.isSettled = false;
        jornada11.settledAt = null;
        jornada11.actualTotalGoals = null;
        await jornada11.save();
      }
    }
    
    // Step 3: Delete any future schedules (Jornada 12+)
    const deletedFuture = await Schedule.deleteMany({ jornada: { $gt: 11 } });
    if (deletedFuture.deletedCount > 0) {
      console.log(`🗑️  Deleted ${deletedFuture.deletedCount} future schedule(s) (will be auto-created when needed)`);
    }
    
    // Step 4: Update existing bets to have correct week numbers if needed
    const betsForJornada10 = await Bet.find({ weekNumber: jornada10WeekNumber, year: jornada10Year });
    const guestBetsForJornada10 = await GuestBet.find({ weekNumber: jornada10WeekNumber, year: jornada10Year });
    
    console.log('\n📊 Bets for Jornada 10 (settled week):');
    console.log(`   User Bets: ${betsForJornada10.length}`);
    console.log(`   Guest Bets: ${guestBetsForJornada10.length}`);
    
    // Final state
    console.log('\n' + '═'.repeat(50));
    console.log('✅ FIX COMPLETE!');
    console.log('═'.repeat(50));
    
    const finalSchedules = await Schedule.find().sort({ jornada: 1 });
    console.log('\n📊 Final state:');
    finalSchedules.forEach(s => {
      console.log(`   • Jornada ${s.jornada} (Week ${s.weekNumber}) - ${s.isSettled ? '✅ SETTLED' : '🎯 ACTIVE'}`);
    });
    console.log(`\n   User Bets preserved: ${existingBets}`);
    console.log(`   Guest Bets preserved: ${existingGuestBets}`);
    
    console.log('\n📱 Dashboard should now show:');
    console.log('   • Results tab: Jornada 10 (with your existing bets)');
    console.log('   • Standings/Schedule/Stats: Jornada 11 (current week)');
    
    await mongoose.disconnect();
    console.log('\n✅ Done!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    await mongoose.disconnect();
  }
}

fixSchedules();
