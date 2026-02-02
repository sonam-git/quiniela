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

    // Set match times - ALL COMPLETED for testing
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(now.getDate() - 2);
    
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(now.getDate() - 3);

    // Liga MX Teams - ALL 9 MATCHES COMPLETED with results
    // Total goals: 2+1 + 1+1 + 0+3 + 2+2 + 3+1 + 1+0 + 2+1 + 0+0 + 2+2 = 24 goals
    const matches = [
      { 
        teamA: 'Club América', 
        teamB: 'Guadalajara', 
        startTime: new Date(threeDaysAgo.setHours(17, 0, 0, 0)),
        isCompleted: true,
        scoreTeamA: 2,
        scoreTeamB: 1,
        result: 'teamA'  // América wins
      },
      { 
        teamA: 'Cruz Azul', 
        teamB: 'Pumas UNAM', 
        startTime: new Date(threeDaysAgo.setHours(19, 0, 0, 0)),
        isCompleted: true,
        scoreTeamA: 1,
        scoreTeamB: 1,
        result: 'draw'  // Draw
      },
      { 
        teamA: 'Monterrey', 
        teamB: 'Tigres UANL', 
        startTime: new Date(threeDaysAgo.setHours(21, 0, 0, 0)),
        isCompleted: true,
        scoreTeamA: 0,
        scoreTeamB: 3,
        result: 'teamB'  // Tigres wins
      },
      { 
        teamA: 'Santos Laguna', 
        teamB: 'León', 
        startTime: new Date(twoDaysAgo.setHours(12, 0, 0, 0)),
        isCompleted: true,
        scoreTeamA: 2,
        scoreTeamB: 2,
        result: 'draw'  // Draw
      },
      { 
        teamA: 'Toluca', 
        teamB: 'Pachuca', 
        startTime: new Date(twoDaysAgo.setHours(14, 0, 0, 0)),
        isCompleted: true,
        scoreTeamA: 3,
        scoreTeamB: 1,
        result: 'teamA'  // Toluca wins
      },
      { 
        teamA: 'Atlas', 
        teamB: 'Necaxa', 
        startTime: new Date(twoDaysAgo.setHours(17, 0, 0, 0)),
        isCompleted: true,
        scoreTeamA: 1,
        scoreTeamB: 0,
        result: 'teamA'  // Atlas wins
      },
      { 
        teamA: 'Tijuana', 
        teamB: 'Mazatlán', 
        startTime: new Date(twoDaysAgo.setHours(19, 0, 0, 0)),
        isCompleted: true,
        scoreTeamA: 2,
        scoreTeamB: 1,
        result: 'teamA'  // Tijuana wins
      },
      { 
        teamA: 'Querétaro', 
        teamB: 'Puebla', 
        startTime: new Date(twoDaysAgo.setHours(21, 0, 0, 0)),
        isCompleted: true,
        scoreTeamA: 0,
        scoreTeamB: 0,
        result: 'draw'  // Draw
      },
      { 
        teamA: 'FC Juárez', 
        teamB: 'San Luis', 
        startTime: new Date(twoDaysAgo.setHours(21, 30, 0, 0)),
        isCompleted: true,
        scoreTeamA: 2,
        scoreTeamB: 2,
        result: 'draw'  // Draw
      }
    ];

    // Actual results for reference:
    // M1: América (teamA) | M2: Draw | M3: Tigres (teamB) | M4: Draw | M5: Toluca (teamA)
    // M6: Atlas (teamA)   | M7: Tijuana (teamA) | M8: Draw | M9: Draw
    // Total goals: 24

    const schedule = await Schedule.create({
      weekNumber,
      year,
      matches,
      isSettled: true,  // Mark as settled to show winner
      allMatchesCompleted: true,
      actualTotalGoals: 24
    });
    console.log(`Created schedule for week ${weekNumber} of ${year}`);
    console.log(`  - All 9 matches COMPLETED with results`);
    console.log(`  - Total goals: 24`);
    console.log(`  - Schedule marked as SETTLED`);

    // Create demo bets with specific predictions
    // Actual results: teamA, draw, teamB, draw, teamA, teamA, teamA, draw, draw
    const betConfigs = [
      {
        user: users[0], // Carlos - 7 correct! 
        predictions: ['teamA', 'draw', 'teamB', 'draw', 'teamA', 'teamA', 'teamA', 'teamB', 'teamA'],
        totalGoals: 24,  // Exact! goalDiff = 0
        paid: true
      },
      {
        user: users[1], // María - 5 correct
        predictions: ['teamA', 'teamA', 'teamB', 'draw', 'teamB', 'draw', 'teamA', 'draw', 'draw'],
        totalGoals: 20,  // goalDiff = 4
        paid: true
      },
      {
        user: users[2], // Juan - 8 correct! (BEST)
        predictions: ['teamA', 'draw', 'teamB', 'draw', 'teamA', 'teamA', 'teamA', 'draw', 'teamB'],
        totalGoals: 22,  // goalDiff = 2
        paid: true
      },
      {
        user: users[3], // Ana - 4 correct
        predictions: ['teamB', 'teamA', 'teamA', 'teamA', 'teamA', 'draw', 'draw', 'teamA', 'teamA'],
        totalGoals: 30,  // goalDiff = 6
        paid: false
      },
      {
        user: users[4], // Pedro - 6 correct
        predictions: ['teamA', 'draw', 'teamB', 'teamA', 'teamA', 'teamB', 'teamA', 'draw', 'draw'],
        totalGoals: 25,  // goalDiff = 1
        paid: true
      },
      {
        user: users[5], // Luis - 8 correct! (TIE with Juan)
        predictions: ['teamA', 'draw', 'teamB', 'draw', 'teamA', 'teamA', 'teamA', 'draw', 'teamA'],
        totalGoals: 26,  // goalDiff = 2 (same as Juan - TIE!)
        paid: true
      },
      {
        user: users[6], // Sofia - 3 correct
        predictions: ['teamB', 'teamB', 'teamA', 'teamB', 'teamB', 'teamB', 'draw', 'teamA', 'teamA'],
        totalGoals: 15,  // goalDiff = 9
        paid: true
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
    console.log('\n✅ Database seeded successfully with FULL TEST DATA!');
    console.log('\n📊 Test Data Summary:');
    console.log('  - 7 users with bets');
    console.log('  - ALL 9 matches COMPLETED with results');
    console.log('  - Total goals scored: 24');
    console.log('  - Schedule is SETTLED - winners highlighted');
    console.log('\n⚽ Match Results:');
    console.log('  M1: Club América 2-1 Guadalajara (teamA wins)');
    console.log('  M2: Cruz Azul 1-1 Pumas UNAM (draw)');
    console.log('  M3: Monterrey 0-3 Tigres UANL (teamB wins)');
    console.log('  M4: Santos Laguna 2-2 León (draw)');
    console.log('  M5: Toluca 3-1 Pachuca (teamA wins)');
    console.log('  M6: Atlas 1-0 Necaxa (teamA wins)');
    console.log('  M7: Tijuana 2-1 Mazatlán (teamA wins)');
    console.log('  M8: Querétaro 0-0 Puebla (draw)');
    console.log('  M9: FC Juárez 2-2 San Luis (draw)');
    console.log('\n🏆 Winner Logic:');
    console.log('  1. Most correct predictions (points)');
    console.log('  2. Tie-breaker: closest goal prediction');
    console.log('  3. If still tied: both are winners');
    console.log('\n📋 Leaderboard:');
    betsToCreate.forEach((bet, idx) => {
      const winner = bet.isWinner ? '👑💰 WINNER!' : '';
      const userName = betConfigs.find(c => c.user._id.equals(bet.userId))?.user.name;
      console.log(`  ${idx + 1}. ${userName} - ${bet.totalPoints}/9 pts, ±${bet.goalDifference} goals ${winner}`);
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
