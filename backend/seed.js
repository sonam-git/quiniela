const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Schedule = require('./models/Schedule');
const Bet = require('./models/Bet');

// Helper to get current week number
const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNumber;
};

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Schedule.deleteMany({});
    await Bet.deleteMany({});
    console.log('Cleared existing data');

    // Create demo users
    const users = await User.create([
      { name: 'Carlos García', email: 'carlos@example.com', password: 'password123' },
      { name: 'María López', email: 'maria@example.com', password: 'password123' },
      { name: 'Juan Martínez', email: 'juan@example.com', password: 'password123' },
      { name: 'Ana Rodríguez', email: 'ana@example.com', password: 'password123' },
      { name: 'Pedro Sánchez', email: 'pedro@example.com', password: 'password123' }
    ]);
    console.log('Created demo users');

    // Create current week's schedule
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const year = now.getFullYear();

    // Set match times for upcoming weekend (Liga MX)
    const saturday = new Date(now);
    saturday.setDate(now.getDate() + (6 - now.getDay()));
    saturday.setHours(19, 0, 0, 0);

    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);

    // Liga MX Teams
    const matches = [
      { teamA: 'Club América', teamB: 'Guadalajara', startTime: new Date(saturday) },
      { teamA: 'Cruz Azul', teamB: 'Pumas UNAM', startTime: new Date(saturday.setHours(21)) },
      { teamA: 'Monterrey', teamB: 'Tigres UANL', startTime: new Date(saturday.setHours(21)) },
      { teamA: 'Santos Laguna', teamB: 'León', startTime: new Date(sunday) },
      { teamA: 'Toluca', teamB: 'Pachuca', startTime: new Date(sunday.setHours(12)) },
      { teamA: 'Atlas', teamB: 'Necaxa', startTime: new Date(sunday.setHours(14)) },
      { teamA: 'Tijuana', teamB: 'Mazatlán', startTime: new Date(sunday.setHours(17)) },
      { teamA: 'Querétaro', teamB: 'Puebla', startTime: new Date(sunday.setHours(19)) },
      { teamA: 'FC Juárez', teamB: 'San Luis', startTime: new Date(sunday.setHours(21)) }
    ];

    const schedule = await Schedule.create({
      weekNumber,
      year,
      matches
    });
    console.log(`Created schedule for week ${weekNumber} of ${year}`);

    // Create some demo bets
    const predictions = ['teamA', 'teamB', 'draw'];
    
    for (let i = 0; i < 3; i++) {
      const user = users[i];
      const userPredictions = schedule.matches.map(match => ({
        matchId: match._id,
        prediction: predictions[Math.floor(Math.random() * 3)]
      }));

      await Bet.create({
        userId: user._id,
        weekNumber,
        year,
        totalGoals: Math.floor(Math.random() * 20) + 15,
        predictions: userPredictions,
        paid: i === 0 // First user marked as paid
      });
    }
    console.log('Created demo bets');

    console.log('\n✅ Database seeded successfully!');
    console.log('\nDemo credentials:');
    console.log('  Email: carlos@example.com');
    console.log('  Password: password123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();
