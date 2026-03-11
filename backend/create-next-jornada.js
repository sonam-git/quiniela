const mongoose = require('mongoose');
require('dotenv').config();
const Schedule = require('./models/Schedule');
const { LIGA_MX_CLAUSURA_2026 } = require('./seed');

const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

async function createNextJornada() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find the last settled jornada
    const lastSettled = await Schedule.findOne({ isSettled: true }).sort({ jornada: -1 });
    console.log('Last settled jornada:', lastSettled?.jornada || 'none');
    
    // Find if there's any unsettled schedule
    const unsettled = await Schedule.findOne({ isSettled: false });
    console.log('Current unsettled jornada:', unsettled?.jornada || 'none');
    
    if (unsettled) {
      console.log('✅ An unsettled schedule already exists (Jornada ' + unsettled.jornada + ')');
      await mongoose.disconnect();
      return;
    }
    
    // Determine next jornada to create
    const nextJornada = (lastSettled?.jornada || 0) + 1;
    console.log('Looking for Jornada', nextJornada, 'in seed data...');
    
    const jornadaData = LIGA_MX_CLAUSURA_2026[nextJornada];
    
    if (!jornadaData) {
      console.log('❌ No data for Jornada', nextJornada);
      console.log('Available jornadas:', Object.keys(LIGA_MX_CLAUSURA_2026).join(', '));
      await mongoose.disconnect();
      return;
    }
    
    const startDate = new Date(jornadaData.startDate);
    const weekNumber = getWeekNumber(startDate);
    const year = startDate.getFullYear();
    
    const matches = jornadaData.matches.map(m => {
      const [y, mo, d] = m.date.split('-').map(Number);
      const [h, mi] = m.time.split(':').map(Number);
      return {
        teamA: m.home,
        teamB: m.away,
        teamAIsHome: true,
        startTime: new Date(y, mo - 1, d, h, mi),
        isCompleted: false,
        scoreTeamA: null,
        scoreTeamB: null,
        result: null
      };
    });
    
    const schedule = await Schedule.create({
      weekNumber,
      year,
      jornada: nextJornada,
      matches,
      dataSource: 'hardcoded',
      isSettled: false
    });
    
    console.log('✅ Created Jornada ' + nextJornada + ' (Week ' + weekNumber + ', Year ' + year + ')');
    console.log('   Start date:', jornadaData.startDate);
    console.log('   Matches:', matches.length);
    
    await mongoose.disconnect();
    console.log('Done!');
  } catch (err) {
    console.error('Error:', err.message);
    await mongoose.disconnect();
  }
}

createNextJornada();
