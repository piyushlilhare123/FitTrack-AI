const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sets: { type: Number, default: 3 },
  reps: { type: Number, default: 10 },
  weight: { type: Number, default: 0 }, // in kg
  duration: { type: Number, default: 0 }, // in minutes (if applicable, e.g., cardio)
  completed: { type: Boolean, default: false },
});

const WorkoutSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    default: 'Workout Session',
  },
  exercises: [ExerciseSchema],
  totalCalories: {
    type: Number,
    default: 0,
  },
  duration: {
    type: Number, // in minutes
    default: 0,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  isGenerated: {
    type: Boolean,
    default: false,
  },
  goal: {
    type: String,
    default: '',
  },
  fitnessLevel: {
    type: String,
    default: '',
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Workout', WorkoutSchema);
