const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  teamA: {
    type: String,
    required: true,
    trim: true
  },
  teamB: {
    type: String,
    required: true,
    trim: true
  },
  // teamA is always the home team, teamB is always the away team
  // This follows standard Liga MX format: Home vs Away
  teamAIsHome: {
    type: Boolean,
    default: true // First team listed is always home
  },
  startTime: {
    type: Date,
    required: true
  },
  // Actual results (filled after match ends)
  result: {
    type: String,
    enum: ['teamA', 'teamB', 'draw', null],
    default: null
  },
  scoreTeamA: {
    type: Number,
    default: null
  },
  scoreTeamB: {
    type: Number,
    default: null
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  // API-Football fixture ID for syncing results
  apiFixtureId: {
    type: Number,
    default: null
  }
}, { _id: true });

const scheduleSchema = new mongoose.Schema({
  weekNumber: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true,
    default: () => new Date().getFullYear()
  },
  matches: {
    type: [matchSchema],
    validate: {
      validator: function(v) {
        return v.length === 9;
      },
      message: 'A weekly schedule must have exactly 9 matches'
    }
  },
  jornada: {
    type: Number,
    default: null
  },
  dataSource: {
    type: String,
    enum: ['api', 'hardcoded', 'admin'],
    default: 'hardcoded'
  },
  isSettled: {
    type: Boolean,
    default: false
  },
  actualTotalGoals: {
    type: Number,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for unique week per year
scheduleSchema.index({ weekNumber: 1, year: 1 }, { unique: true });

// Virtual to get the first match start time
scheduleSchema.virtual('firstMatchTime').get(function() {
  if (this.matches && this.matches.length > 0) {
    return this.matches.reduce((earliest, match) => {
      return match.startTime < earliest ? match.startTime : earliest;
    }, this.matches[0].startTime);
  }
  return null;
});

// Virtual to check if all matches are completed
scheduleSchema.virtual('allMatchesCompleted').get(function() {
  return this.matches && this.matches.every(match => match.isCompleted);
});

scheduleSchema.set('toJSON', { virtuals: true });
scheduleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
