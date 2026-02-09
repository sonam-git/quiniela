const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  prediction: {
    type: String,
    enum: ['teamA', 'teamB', 'draw'],
    required: true
  }
}, { _id: false });

const guestBetSchema = new mongoose.Schema({
  // The registered user who submitted this guest bet
  sponsorUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Guest participant name
  participantName: {
    type: String,
    required: true,
    trim: true,
    minlength: [2, 'Guest name must be at least 2 characters']
  },
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule',
    required: false
  },
  weekNumber: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true,
    default: () => new Date().getFullYear()
  },
  totalGoals: {
    type: Number,
    required: true,
    min: [0, 'Total goals cannot be negative'],
    default: 0
  },
  predictions: {
    type: [predictionSchema],
    validate: {
      validator: function(v) {
        return v.length === 9;
      },
      message: 'Must have exactly 9 match predictions'
    }
  },
  // Scoring fields
  totalPoints: {
    type: Number,
    default: 0
  },
  goalDifference: {
    type: Number,
    default: null
  },
  paid: {
    type: Boolean,
    default: false
  },
  isWinner: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure one guest bet per participant name per sponsor per week
guestBetSchema.index({ sponsorUserId: 1, participantName: 1, weekNumber: 1, year: 1 }, { unique: true });

// Index for querying all guest bets by sponsor
guestBetSchema.index({ sponsorUserId: 1, weekNumber: 1, year: 1 });

// Index for querying all bets for a week (for leaderboard)
guestBetSchema.index({ weekNumber: 1, year: 1 });

guestBetSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('GuestBet', guestBetSchema);
