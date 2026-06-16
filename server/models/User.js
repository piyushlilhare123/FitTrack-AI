const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    default: 25,
  },
  weight: {
    type: Number, // in kg
    default: 70,
  },
  height: {
    type: Number, // in cm
    default: 175,
  },
  goal: {
    type: String,
    enum: ['lose_weight', 'gain_muscle', 'maintain', 'improve_endurance'],
    default: 'maintain',
  },
  fitnessLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate',
  },
  avatar: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    default: '',
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'male',
  },
  bmi: {
    type: Number,
    default: 22.9,
  },
  bmr: {
    type: Number,
    default: 1600,
  },
  tdee: {
    type: Number,
    default: 2200,
  },
  caloriesLimit: {
    type: Number,
    default: 2000,
  },
  caloriesBurnedGoal: {
    type: Number,
    default: 500,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
