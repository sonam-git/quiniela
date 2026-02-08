const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Static method to get a setting with a default value
settingsSchema.statics.getSetting = async function(key, defaultValue = null) {
  const setting = await this.findOne({ key });
  return setting ? setting.value : defaultValue;
};

// Static method to set a setting
settingsSchema.statics.setSetting = async function(key, value, userId = null) {
  const setting = await this.findOneAndUpdate(
    { key },
    { 
      key,
      value, 
      updatedAt: new Date(),
      updatedBy: userId
    },
    { upsert: true, new: true }
  );
  return setting;
};

module.exports = mongoose.model('Settings', settingsSchema);
