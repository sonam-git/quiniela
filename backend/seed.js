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
      { name: 'Pedro Sánchez', email: 'pedro@example.com', password: 'password123' },
      { name: 'Luis Hernández', email: 'luis@example.com', password: 'password123' },
      { name: 'Sofia Torres', email: 'sofia@example.com', password: 'password123' }
    ]);
    console.log('Created demo users');

    // Create current week's schedule
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const year = now.getFullYear();

    // Set match times - some in the past (completed), some upcoming
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(now.getDate() - 2);

    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    // Liga MX Teams with some completed matches (results included)
    const matches = [
      // COMPLETED MATCHES (5 matches with results)
      { 
        teamA: 'Club América', 
        teamB: 'Guadalajara', 
        startTime: new Date(twoDaysAgo.setHours(19, 0, 0, 0)),
        isCompleted: true,
        scoreTeamA: 2,
        scoreTeamB: 1,
        result: 'teamA'  // América wins
      },
      { 
        teamA: 'Cruz Azul', 
        teamB: 'Pumas UNAM', 
        startTime: new Date(twoDaysAgo.setHours(21, 0, 0, 0)),
        isCompleted: true,
        scoreTeamA: 1,
        scoreTeamB: 1,
        result: 'draw'  // Draw
      },
      { 
        teamA: 'Monterrey', 
        teamB: 'Tigres UANL', 
        startTime: new Date(yesterday.setHours(17, 0, 0, 0)),
        isCompleted: true,
        scoreTeamA: 0,
        scoreTeamB: 3,
        result: 'teamB'  // Tigres wins
      },
      { 
        teamA: 'Santos Laguna', 
        teamB: 'León', 
        startTime: new Date(yesterday.setHours(19, 0, 0, 0)),
        isCompleted: true,
        scoreTeamA: 2,
        scoreTeamB: 2,
        result: 'draw'  // Draw
      },
      { 
        teamA: 'Toluca', 
        teamB: 'Pachuca', 
        startTime: new Date(yesterday.setHours(21, 0, 0, 0)),
        isCompleted: true,
        scoreTeamA: 3,
        scoreTeamB: 1,
        result: 'teamA'  // Toluca wins
      },
      // UPCOMING MATCHES (4 matches not yet played)
      { 
        teamA: 'Atlas', 
        teamB: 'Necaxa', 
        startTime: new Date(tomorrow.setHours(14, 0, 0, 0)),
        isCompleted: false
      },
      { 
        teamA: 'Tijuana', 
        teamB: 'Mazatlán', 
        startTime: new Date(tomorrow.setHours(17, 0, 0, 0)),
        isCompleted: false
      },
      { 
        teamA: 'Querétaro', 
        teamB: 'Puebla', 
        startTime: new Date(tomorrow.setHours(19, 0, 0, 0)),
        isCompleted: false
      },
      { 
        teamA: 'FC Juárez', 
        teamB: 'San Luis', 
        startTime: new Date(tomorrow.setHours(21, 0, 0, 0)),
        isCompleted: false
      }
    ];

    const schedule = await Schedule.create({
      weekNumber,
      year,
      matches,
      isSettled: true,  // Mark as settled to show winner
      allMatchesCompleted: true,
      actualTotalGoals: 20  // Total goals: 2+1+1+1+0+3+2+2+3+1 = 16 for completed, assume 20 total
    });
    console.log(`Created schedule for week ${weekNumber} of ${year}`);
    console.log(`  - 5 completed matches with results`);
    console.log(`  - 4 upcoming matches`);
    console.log(`  - Schedule marked as SETTLED to show winner UI`);

    // Create demo bets with specific predictions to show variety in scores
    // Winner logic: highest points → closest goalDifference → tie (both winners)
    const betConfigs = [
      {
        user: users[0], // Carlos - 4 correct predictions, goalDiff = 2
        predictions: ['teamA', 'draw', 'teamB', 'teamA', 'teamA', 'teamA', 'draw', 'teamB', 'teamA'],
        totalGoals: 22,
        paid: true,
        goalDifference: 2
      },
      {
        user: users[1], // María - 3 correct predictions
        predictions: ['teamA', 'teamA', 'teamB', 'draw', 'teamB', 'draw', 'teamA', 'teamA', 'draw'],
        totalGoals: 18,
        paid: true,
        goalDifference: 2
      },
      {
        user: users[2], // Juan - 5 correct predictions (WINNER!), goalDiff = 0
        predictions: ['teamA', 'draw', 'teamB', 'draw', 'teamA', 'teamB', 'teamA', 'draw', 'teamB'],
        totalGoals: 20,
        paid: true,
        goalDifference: 0,
        isWinner: true
      },
      {
        user: users[3], // Ana - 2 correct predictions
        predictions: ['teamB', 'teamA', 'teamA', 'teamA', 'teamA', 'draw', 'draw', 'teamA', 'teamA'],
        totalGoals: 25,
        paid: false,
        goalDifference: 5
      },
      {
        user: users[4], // Pedro - 5 correct predictions (TIE WINNER!), goalDiff = 1
        predictions: ['teamA', 'draw', 'teamB', 'draw', 'teamA', 'teamA', 'teamB', 'draw', 'draw'],
        totalGoals: 19,
        paid: true,
        goalDifference: 1
      },
      {
        user: users[5], // Luis - 5 correct predictions (TIE WINNER!), goalDiff = 1
        predictions: ['teamA', 'draw', 'teamB', 'draw', 'teamA', 'draw', 'teamA', 'teamB', 'teamA'],
        totalGoals: 21,
        paid: false,
        goalDifference: 1
      },
      {
        user: users[6], // Sofia - 1 correct prediction
        predictions: ['teamB', 'teamB', 'teamA', 'teamB', 'teamB', 'teamA', 'draw', 'teamA', 'draw'],
        totalGoals: 15,
        paid: true,
        goalDifference: 5
      }
    ];

    // Calculate points for each bet based on completed matches
    // First pass: calculate points
    const betsToCreate = [];
    for (const config of betConfigs) {
      let totalPoints = 0;
      const predictions = schedule.matches.map((match, index) => {
        const prediction = config.predictions[index];
        // Calculate points for completed matches
        if (match.isCompleted && match.result === prediction) {
          totalPoints += 1;
        }
        return {
          matchId: match._id,
          prediction
        };
      });

      betsToCreate.push({
        userId: config.user._id,
        weekNumber,
        year,
        totalGoals: config.totalGoals,
        predictions,
        paid: config.paid,
        totalPoints,
        goalDifference: config.goalDifference || Math.abs(config.totalGoals - 20),
        isWinner: false // Will be set after sorting
      });
    }

    // Sort by points (desc), then by goalDifference (asc)
    betsToCreate.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      return a.goalDifference - b.goalDifference;
    });

    // Determine winners (highest points + closest goal difference)
    // Handle ties: if same points AND same goalDifference, both are winners
    if (betsToCreate.length > 0) {
      const topPoints = betsToCreate[0].totalPoints;
      const topGoalDiff = betsToCreate[0].goalDifference;
      
      for (const bet of betsToCreate) {
        if (bet.totalPoints === topPoints && bet.goalDifference === topGoalDiff) {
          bet.isWinner = true;
        }
      }
    }

    // Create all bets
    for (const betData of betsToCreate) {
      await Bet.create(betData);
    }
    console.log('Created demo bets with calculated points and winners');

    // Summary
    console.log('\n✅ Database seeded successfully with TEST DATA!');
    console.log('\n📊 Test Data Summary:');
    console.log('  - 7 users with bets');
    console.log('  - 5 completed matches (showing green/red predictions)');
    console.log('  - 4 upcoming matches (neutral styling)');
    console.log('  - Schedule is SETTLED - winner(s) will be highlighted');
    console.log('\n🏆 Winner Logic:');
    console.log('  1. Most correct predictions (points)');
    console.log('  2. Tie-breaker: closest goal prediction');
    console.log('  3. If still tied: both are winners');
    console.log('\n📋 Leaderboard (sorted by points, then goalDiff):');
    betsToCreate.forEach((bet, idx) => {
      const winner = bet.isWinner ? '👑💰 WINNER!' : '';
      const user = betConfigs.find(c => c.user._id.equals(bet.userId));
      console.log(`  ${idx + 1}. ${user.user.name} - ${bet.totalPoints} pts, ±${bet.goalDifference} goals ${winner}`);
    });
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
