const Workout = require('../models/Workout');
const User = require('../models/User');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini only if valid key exists
let genAI = null;
if (process.env.GEMINI_WORKOUT_KEY || process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_WORKOUT_KEY || process.env.GEMINI_API_KEY);
}

// Log a completed workout
exports.logWorkout = async (req, res, next) => {
  try {
    const { name, exercises, totalCalories, duration, isCompleted, isGenerated, date, goal, fitnessLevel } = req.body;

    if (!exercises || !Array.isArray(exercises)) {
      res.status(400);
      return next(new Error('Please provide an array of exercises'));
    }

    const workout = await Workout.create({
      userId: req.user._id,
      name: name || 'Workout Session',
      exercises,
      totalCalories: totalCalories || 0,
      duration: duration || 0,
      isCompleted: isCompleted !== undefined ? isCompleted : true,
      isGenerated: isGenerated || false,
      goal: goal || '',
      fitnessLevel: fitnessLevel || '',
      date: date || new Date(),
    });

    res.status(201).json(workout);
  } catch (error) {
    next(error);
  }
};

// Get workout history for logged-in user
exports.getWorkoutHistory = async (req, res, next) => {
  try {
    // Automatically delete workouts older than 7 days (1 week)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    await Workout.deleteMany({
      userId: req.user._id,
      date: { $lt: oneWeekAgo }
    });

    const workouts = await Workout.find({ userId: req.user._id }).sort({ date: -1 });
    res.json(workouts);
  } catch (error) {
    next(error);
  }
};

// Generate AI Workout plan
exports.generateWorkoutPlan = async (req, res, next) => {
  try {
    const { goal, equipment, time, fitnessLevel } = req.body;
    const user = await User.findById(req.user._id);

    const timeMinutes = Number(time) || 30;
    const goalStr = goal || (user ? user.goal : 'maintain');
    const levelStr = fitnessLevel || (user ? user.fitnessLevel : 'intermediate');
    const equipList = Array.isArray(equipment) ? equipment.join(', ') : (equipment || 'Bodyweight');

    console.log(`Generating workout for user: Goal=${goalStr}, Level=${levelStr}, Time=${timeMinutes}m, Equipment=${equipList}`);

    let workoutPlan = null;

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        const promptText = `You are an expert personal trainer. Generate a highly customized workout session based on user specifications.
Create a unique, creative, and inspiring name for the workout session (e.g., "Velocity Shred Pro", "Apex Iron Build", "Kinetic Flow Endurance") that is specific to the goal and different every time. Avoid generic names like "HIIT Workout" or "Workout Session".
Return ONLY a JSON object matching this structure. No markdown formatting, no backticks, just raw JSON:
{
  "name": "Name of Workout Session",
  "duration": ${timeMinutes},
  "totalCalories": 250,
  "exercises": [
    { "name": "Pushups", "sets": 3, "reps": 12, "weight": 0, "duration": 0, "completed": false },
    { "name": "Plank", "sets": 3, "reps": 1, "weight": 0, "duration": 1, "completed": false }
  ]
}
Ensure calories and duration are realistic estimations.

User Specs:
- Target Goal: ${goalStr}
- Available Equipment: ${equipList}
- Available Time: ${timeMinutes} minutes
- Fitness Level: ${levelStr}`;

        const result = await model.generateContent(promptText);
        let textResponse = result.response.text() || '{}';
        // Clean markdown if Gemini accidentally included it
        textResponse = textResponse.replace(/```json|```/g, '').trim();
        workoutPlan = JSON.parse(textResponse);
      } catch (err) {
        console.error('Gemini API call failed, running fallback generator:', err.message);
      }
    }

    // Fallback Mock Workout Generation if OpenAI not available or failed
    if (!workoutPlan) {
      workoutPlan = generateFallbackWorkout(goalStr, levelStr, timeMinutes, equipList);
    }

    // Ensure the name contains the minute tagline (e.g. "(X min)")
    if (workoutPlan && workoutPlan.name) {
      const minutesTag = `(${timeMinutes} min)`;
      if (!workoutPlan.name.includes(minutesTag)) {
        // Remove any other existing duration tag to prevent duplicates (e.g. "30 min", "30 minutes", "(30 min)")
        let cleanName = workoutPlan.name
          .replace(/\(\d+\s*min\)/gi, '')
          .replace(/\d+\s*min(utes?)?/gi, '')
          .trim();
        // Remove trailing hyphens or spaces
        cleanName = cleanName.replace(/[-\s]+$/, '').trim();
        workoutPlan.name = `${cleanName} ${minutesTag}`;
      }
    }

    if (workoutPlan) {
      workoutPlan.goal = goalStr;
      workoutPlan.fitnessLevel = levelStr;
    }

    // Return generated plan (but do not save it automatically in history yet - wait for the user to complete/save it)
    res.json(workoutPlan);
  } catch (error) {
    next(error);
  }
};

function generateFallbackWorkout(goal, level, time, equipment) {
  let exercises = [];
  let name = '';
  let calories = 0;

  const eq = equipment.toLowerCase();
  const namePools = {
    lose: [
      'Metabolic Burner',
      'Fat Torch HIIT',
      'Cardio Inferno Blast',
      'Lean Engine Shred',
      'Calorie Crush Circuit',
      'Sweat & Shred Focus',
      'Lipid Shred Velocity',
      'Aerobic Firestorm',
      'HIIT Catalyst Pro'
    ],
    gain: [
      'Hypertrophy Target',
      'Strength & Mass Builder',
      'Iron Pump Session',
      'Savage Strength Drive',
      'Heavy Resistance Build',
      'Power Focus Routine',
      'Apex Muscle Forge',
      'Titan Strength Peak',
      'Anabolic Core Load'
    ],
    other: [
      'Core & Conditioning',
      'Athletic Endurance Blast',
      'Stamina Engine Flow',
      'Total Body Synergy',
      'Agility & Tone Express',
      'Core Flow & Stability',
      'Flexibility & Power Align',
      'Vaporizer Core Session',
      'Zenith Performance Routine'
    ]
  };

  let chosenType = 'other';
  const g = goal.toLowerCase();
  if (g.includes('weight') || g.includes('lose') || g.includes('fat') || g.includes('burn') || g.includes('shred')) {
    chosenType = 'lose';
  } else if (g.includes('muscle') || g.includes('gain') || g.includes('strength') || g.includes('hypertrophy') || g.includes('power')) {
    chosenType = 'gain';
  }

  const pool = namePools[chosenType];
  const randIndex = Math.floor(Math.random() * pool.length);
  name = `AI ${pool[randIndex]} (${time} min)`;

  if (goal.includes('weight') || goal.includes('lose')) {
    calories = Math.round(time * 8.5);
    if (eq.includes('dumbbell') || eq.includes('kettlebell')) {
      exercises = [
        { name: 'Goblet Squats', sets: 4, reps: 12, weight: 12, duration: 0, completed: false },
        { name: 'Dumbbell Thrusters', sets: 3, reps: 10, weight: 8, duration: 0, completed: false },
        { name: 'Dumbbell Renegade Rows', sets: 3, reps: 12, weight: 10, duration: 0, completed: false },
        { name: 'Burpees', sets: 3, reps: 10, weight: 0, duration: 0, completed: false },
        { name: 'Mountain Climbers', sets: 3, reps: 30, weight: 0, duration: 1, completed: false }
      ];
    } else {
      exercises = [
        { name: 'Bodyweight Squats', sets: 4, reps: 20, weight: 0, duration: 0, completed: false },
        { name: 'Pushups (Tempo 2-1-2)', sets: 3, reps: 12, weight: 0, duration: 0, completed: false },
        { name: 'Jumping Jacks', sets: 3, reps: 40, weight: 0, duration: 1, completed: false },
        { name: 'Mountain Climbers', sets: 3, reps: 30, weight: 0, duration: 1, completed: false },
        { name: 'Plank Hold', sets: 3, reps: 1, weight: 0, duration: 1, completed: false }
      ];
    }
  } else if (goal.includes('muscle') || goal.includes('gain')) {
    calories = Math.round(time * 6);
    if (eq.includes('barbell') || eq.includes('gym') || eq.includes('dumbbell')) {
      exercises = [
        { name: 'Dumbbell Bench Press', sets: 4, reps: 8, weight: 20, duration: 0, completed: false },
        { name: 'Romanian Deadlifts', sets: 4, reps: 10, weight: 35, duration: 0, completed: false },
        { name: 'Overhead Press', sets: 3, reps: 8, weight: 15, duration: 0, completed: false },
        { name: 'Dumbbell Bicep Curls', sets: 3, reps: 12, weight: 10, duration: 0, completed: false },
        { name: 'Tricep Overhead Extension', sets: 3, reps: 12, weight: 12, duration: 0, completed: false }
      ];
    } else {
      exercises = [
        { name: 'Decline Pushups', sets: 4, reps: 12, weight: 0, duration: 0, completed: false },
        { name: 'Bodyweight Bulgarian Split Squats', sets: 4, reps: 10, weight: 0, duration: 0, completed: false },
        { name: 'Pike Pushups', sets: 3, reps: 10, weight: 0, duration: 0, completed: false },
        { name: 'Bodyweight Pullups (or Door Rows)', sets: 3, reps: 8, weight: 0, duration: 0, completed: false },
        { name: 'Chair Dips', sets: 3, reps: 12, weight: 0, duration: 0, completed: false }
      ];
    }
  } else {
    calories = Math.round(time * 7);
    exercises = [
      { name: 'Lying Leg Raises', sets: 3, reps: 15, weight: 0, duration: 0, completed: false },
      { name: 'Bicycle Crunches', sets: 3, reps: 20, weight: 0, duration: 0, completed: false },
      { name: 'Plank Shoulder Taps', sets: 3, reps: 16, weight: 0, duration: 0, completed: false },
      { name: 'Bird-Dog Hold', sets: 3, reps: 10, weight: 0, duration: 0, completed: false },
      { name: 'Superman Hold', sets: 3, reps: 12, weight: 0, duration: 0, completed: false }
    ];
  }

  // Adjust exercises length based on time limit (fewer exercises if < 20 min, more if > 60 min)
  if (time < 20) {
    exercises = exercises.slice(0, 3);
  } else if (time > 50) {
    exercises.push({ name: 'Cooldown Stretching', sets: 1, reps: 1, weight: 0, duration: 5, completed: false });
  }

  // Adjust weights and reps slightly depending on level
  if (level === 'beginner') {
    exercises.forEach(ex => {
      if (ex.weight > 0) ex.weight = Math.round(ex.weight * 0.6);
      if (ex.reps > 5) ex.reps = Math.round(ex.reps * 0.8);
      if (ex.sets > 3) ex.sets = 3;
    });
  } else if (level === 'advanced') {
    exercises.forEach(ex => {
      if (ex.weight > 0) ex.weight = Math.round(ex.weight * 1.3);
      ex.sets += 1;
    });
  }

  return {
    name,
    duration: time,
    totalCalories: calories,
    exercises
  };
}

exports.updateWorkout = async (req, res, next) => {
  try {
    const { isCompleted } = req.body;
    const workout = await Workout.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isCompleted },
      { new: true }
    );
    if (!workout) {
      res.status(404);
      return next(new Error('Workout not found'));
    }
    res.json(workout);
  } catch (error) {
    next(error);
  }
};

exports.deleteWorkout = async (req, res, next) => {
  try {
    const workout = await Workout.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!workout) {
      res.status(404);
      return next(new Error('Workout not found'));
    }
    res.json({ message: 'Workout deleted successfully' });
  } catch (error) {
    next(error);
  }
};
