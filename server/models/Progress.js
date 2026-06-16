const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  weight: {
    type: Number,
    required: true,
  },
  bodyFat: {
    type: Number,
    default: 0, // body fat percentage
  },
  fitnessScore: {
    type: Number,
    default: 50, // AI computed fitness rating (1-100)
  },
  photos: [{
    type: String, // URLs of photos uploaded
  }],
  note: {
    type: String,
    default: '',
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Progress', ProgressSchema);
