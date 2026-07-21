const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Groq = require('groq-sdk');

// Initialize Groq dynamically
let groqClient = null;
function getGroq() {
  if (!groqClient && process.env.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretkeyfittrack123!', {
    expiresIn: '30d',
  });
};

const calculateCalorieMetrics = async (user) => {
  const age = user.age || 25;
  const weight = user.weight || 70;
  const height = user.height || 175;
  const goal = user.goal || 'maintain';
  const fitnessLevel = user.fitnessLevel || 'intermediate';
  const gender = user.gender || 'male';

  // Mifflin-St Jeor equation for BMR
  let bmr;
  if (gender === 'female') {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  } else if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 78; // unisex average
  }

  // TDEE Activity Multiplier
  let activityMultiplier = 1.375;
  if (fitnessLevel === 'beginner') activityMultiplier = 1.2;
  else if (fitnessLevel === 'advanced') activityMultiplier = 1.55;

  const tdee = Math.round(bmr * activityMultiplier);
  
  // BMI calculation
  const heightInMeters = height / 100;
  const bmi = Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;

  let caloriesLimit = tdee;
  if (goal === 'lose_weight') {
    caloriesLimit = Math.max(1200, tdee - 500);
  } else if (goal === 'gain_muscle') {
    caloriesLimit = tdee + 300;
  }

  let caloriesBurnedGoal = 400;
  if (fitnessLevel === 'beginner') {
    caloriesBurnedGoal = Math.round(weight * 4.5);
  } else if (fitnessLevel === 'advanced') {
    caloriesBurnedGoal = Math.round(weight * 8.5);
  } else {
    caloriesBurnedGoal = Math.round(weight * 6.5);
  }

  if (goal === 'lose_weight') caloriesBurnedGoal += 100;
  else if (goal === 'improve_endurance') caloriesBurnedGoal += 150;

  // Hydration fallback calculation (glasses of 250ml)
  let waterTarget = Math.round((weight * 0.033) / 0.25);
  if (fitnessLevel === 'intermediate') waterTarget += 1;
  else if (fitnessLevel === 'advanced') waterTarget += 2;
  if (goal === 'lose_weight' || goal === 'improve_endurance') waterTarget += 1;

  const promptText = `You are an expert fitness coach AI. Calculate the user's daily calories consumption limit (caloriesLimit), daily workout calories burned goal (caloriesBurnedGoal), and daily water intake goal in glasses of 250ml (waterTarget) based on:
Age: ${age}
Gender: ${gender}
Weight: ${weight} kg
Height: ${height} cm
Goal: ${goal}
Fitness Level: ${fitnessLevel}

Guidelines:
1. Use Mifflin-St Jeor formula for BMR and activity multipliers (beginner=1.2, intermediate=1.375, advanced=1.55) to compute TDEE, then apply goal offsets (lose_weight=-500, gain_muscle=+300, maintain=0).
2. For waterTarget (in 250ml glasses), use: weight (kg) * 0.033 / 0.25 (glasses). Add extra for activity (intermediate=+1, advanced=+2) and goals like weight loss or endurance (+1).
3. Return ONLY a JSON object. No markdown, no backticks:
{
  "caloriesLimit": number,
  "caloriesBurnedGoal": number,
  "waterTarget": number
}`;

  const groq = getGroq();
  if (groq) {
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: promptText }],
        temperature: 0.2,
      });
      let textResponse = completion.choices[0].message.content || '{}';
      textResponse = textResponse.replace(/```json|```/g, '').trim();
      const data = JSON.parse(textResponse);
      if (data.caloriesLimit && data.caloriesBurnedGoal && data.waterTarget) {
        return {
          bmr: Math.round(bmr),
          tdee: Math.round(tdee),
          bmi,
          caloriesLimit: Math.round(Number(data.caloriesLimit)),
          caloriesBurnedGoal: Math.round(Number(data.caloriesBurnedGoal)),
          waterTarget: Math.round(Number(data.waterTarget))
        };
      }
    } catch (err) {
      console.error('Groq Calorie/Water Calculation failed, using BMR formula fallback:', err.message);
    }
  }

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    bmi,
    caloriesLimit: Math.round(caloriesLimit),
    caloriesBurnedGoal: Math.round(caloriesBurnedGoal),
    waterTarget: Math.round(waterTarget)
  };
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, age, gender, weight, height, goal, fitnessLevel, bio } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      return next(new Error('Please provide all required fields'));
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      return next(new Error('User already exists with this email'));
    }

    // Calculate calorie metrics
    const parsedAge = (age && Number(age) > 0) ? Number(age) : 25;
    const parsedWeight = (weight && Number(weight) > 0) ? Number(weight) : 70;
    const parsedHeight = (height && Number(height) > 0) ? Number(height) : 175;

    const dummyUser = {
      age: parsedAge,
      weight: parsedWeight,
      height: parsedHeight,
      goal: goal || 'maintain',
      fitnessLevel: fitnessLevel || 'intermediate',
      gender: gender || 'male'
    };
    const metrics = await calculateCalorieMetrics(dummyUser);

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      age: parsedAge,
      weight: parsedWeight,
      height: parsedHeight,
      goal: goal || 'maintain',
      fitnessLevel: fitnessLevel || 'intermediate',
      bio: bio || '',
      gender: gender || 'male',
      bmi: metrics.bmi,
      bmr: metrics.bmr,
      tdee: metrics.tdee,
      caloriesLimit: metrics.caloriesLimit,
      caloriesBurnedGoal: metrics.caloriesBurnedGoal,
      waterTarget: metrics.waterTarget,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      age: user.age,
      weight: user.weight,
      height: user.height,
      goal: user.goal,
      fitnessLevel: user.fitnessLevel,
      bio: user.bio,
      gender: user.gender,
      bmi: user.bmi,
      bmr: user.bmr,
      tdee: user.tdee,
      caloriesLimit: user.caloriesLimit,
      caloriesBurnedGoal: user.caloriesBurnedGoal,
      waterTarget: user.waterTarget,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      return next(new Error('Please provide email and password'));
    }

    // Check for user
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401);
      return next(new Error('Invalid credentials'));
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401);
      return next(new Error('Invalid credentials'));
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

exports.updateMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    // Update settings fields
    user.name = req.body.name || user.name;
    user.age = (req.body.age && Number(req.body.age) > 0) ? Number(req.body.age) : user.age;
    user.weight = (req.body.weight && Number(req.body.weight) > 0) ? Number(req.body.weight) : user.weight;
    user.height = (req.body.height && Number(req.body.height) > 0) ? Number(req.body.height) : user.height;
    user.goal = req.body.goal || user.goal;
    user.fitnessLevel = req.body.fitnessLevel || user.fitnessLevel;
    user.gender = req.body.gender || user.gender;
    user.avatar = req.body.avatar || user.avatar;
    user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
    user.beforePhotoUrl = req.body.beforePhotoUrl !== undefined ? req.body.beforePhotoUrl : user.beforePhotoUrl;
    user.afterPhotoUrl = req.body.afterPhotoUrl !== undefined ? req.body.afterPhotoUrl : user.afterPhotoUrl;

    // Recalculate calorie metrics dynamically
    const metrics = await calculateCalorieMetrics(user);
    user.bmi = metrics.bmi;
    user.bmr = metrics.bmr;
    user.tdee = metrics.tdee;
    user.caloriesLimit = metrics.caloriesLimit;
    user.caloriesBurnedGoal = metrics.caloriesBurnedGoal;
    user.waterTarget = metrics.waterTarget;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      age: updatedUser.age,
      weight: updatedUser.weight,
      height: updatedUser.height,
      goal: updatedUser.goal,
      fitnessLevel: updatedUser.fitnessLevel,
      avatar: updatedUser.avatar,
      bio: updatedUser.bio,
      gender: updatedUser.gender,
      bmi: updatedUser.bmi,
      bmr: updatedUser.bmr,
      tdee: updatedUser.tdee,
      caloriesLimit: updatedUser.caloriesLimit,
      caloriesBurnedGoal: updatedUser.caloriesBurnedGoal,
      waterTarget: updatedUser.waterTarget,
      beforePhotoUrl: updatedUser.beforePhotoUrl,
      afterPhotoUrl: updatedUser.afterPhotoUrl,
      token: generateToken(updatedUser._id),
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteMe = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Completely remove all associated user data to prevent database bloat
    const Workout = require('../models/Workout');
    const NutritionLog = require('../models/NutritionLog');
    const ChatConversation = require('../models/ChatConversation');

    await Workout.deleteMany({ userId });
    await NutritionLog.deleteMany({ userId });
    await ChatConversation.deleteMany({ userId });

    // Finally delete the user document
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    res.json({ success: true, message: 'Account and all associated data completely deleted' });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      res.status(400);
      return next(new Error('Please provide both email and new password'));
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404);
      return next(new Error('No account found with this email address'));
    }

    // Securely update and hash password
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    next(error);
  }
};

