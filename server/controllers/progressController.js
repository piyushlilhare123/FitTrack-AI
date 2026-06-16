const Progress = require('../models/Progress');
const User = require('../models/User');

// Log a progress entry
exports.logProgress = async (req, res, next) => {
  try {
    const { weight, bodyFat, note, date } = req.body;

    if (weight === undefined) {
      res.status(400);
      return next(new Error('Please provide weight in kg'));
    }

    // Update user's current weight in User model as well
    const user = await User.findById(req.user._id);
    if (user) {
      user.weight = Number(weight);
      await user.save();
    }

    // Compute a mock progress fitness score based on consistency, weight vs target
    const currentGoal = user ? user.goal : 'maintain';
    let baseScore = 70;
    if (bodyFat && bodyFat > 0) {
      if (currentGoal.includes('weight') && bodyFat > 25) baseScore -= 10;
      else if (currentGoal.includes('muscle') && bodyFat < 15) baseScore += 10;
    }
    const computedScore = Math.min(100, Math.max(30, baseScore + Math.floor(Math.random() * 10)));

    const progress = await Progress.create({
      userId: req.user._id,
      weight: Number(weight),
      bodyFat: bodyFat !== undefined ? Number(bodyFat) : 0,
      fitnessScore: computedScore,
      note: note || '',
      date: date || new Date(),
    });

    res.status(201).json(progress);
  } catch (error) {
    next(error);
  }
};

// Get progress logs for user
exports.getProgressHistory = async (req, res, next) => {
  try {
    const history = await Progress.find({ userId: req.user._id }).sort({ date: 1 });
    res.json(history);
  } catch (error) {
    next(error);
  }
};

// Upload photo handler (returns the local file path)
exports.uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      return next(new Error('Please upload a file'));
    }

    const photoUrl = `/uploads/${req.file.filename}`;
    
    // Log this photo into a progress log or return URL for direct submission
    res.json({ photoUrl });
  } catch (error) {
    next(error);
  }
};
