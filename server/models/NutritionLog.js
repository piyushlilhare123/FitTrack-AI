const mongoose = require('mongoose');

const MealSchema = new mongoose.Schema({
  name: { type: String, required: true },
  calories: { type: Number, required: true },
  protein: { type: Number, default: 0 }, // in grams
  carbs: { type: Number, default: 0 }, // in grams
  fat: { type: Number, default: 0 }, // in grams
  type: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    default: 'breakfast',
  },
});

const NutritionLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  meals: [MealSchema],
  totalCalories: {
    type: Number,
    default: 0,
  },
  waterGlasses: {
    type: Number,
    default: 0,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('NutritionLog', NutritionLogSchema);
