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

const betSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
    required: [true, 'Total goals prediction is required'],
    min: [0, 'Total goals cannot be negative']
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

// Compound index to ensure one bet per user per week
betSchema.index({ userId: 1, weekNumber: 1, year: 1 }, { unique: true });

betSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Bet', betSchema);
