// Script to delete week 12 schedule (which was created prematurely)
const mongoose = require('mongoose');
require('dotenv').config();
const Schedule = require('./models/Schedule');

async function deleteWeek12() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find and list all schedules
    const allSchedules = await Schedule.find().sort({ jornada: 1 });
    console.log('\nCurrent schedules in database:');
    allSchedules.forEach(s => {
      console.log(`  - Jornada ${s.jornada} (Week ${s.weekNumber}) - ${s.isSettled ? 'SETTLED' : 'ACTIVE'}`);
    });
    
    // Find week 12 / Jornada 12
    const week12 = await Schedule.findOne({ jornada: 12 });
    
    if (week12) {
      console.log(`\nDeleting Jornada 12 (Week ${week12.weekNumber})...`);
      await Schedule.deleteOne({ _id: week12._id });
      console.log('✅ Jornada 12 deleted successfully');
    } else {
      console.log('\nNo Jornada 12 found in database');
    }
    
    // Show remaining schedules
    const remaining = await Schedule.find().sort({ jornada: 1 });
    console.log('\nRemaining schedules:');
    remaining.forEach(s => {
      console.log(`  - Jornada ${s.jornada} (Week ${s.weekNumber}) - ${s.isSettled ? 'SETTLED' : 'ACTIVE'}`);
    });
    
    await mongoose.disconnect();
    console.log('\nDone!');
  } catch (err) {
    console.error('Error:', err.message);
    await mongoose.disconnect();
  }
}

deleteWeek12();
