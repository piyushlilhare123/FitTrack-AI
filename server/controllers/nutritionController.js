const NutritionLog = require('../models/NutritionLog');
const User = require('../models/User');
const { OpenAI } = require('openai');

let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-') && process.env.OPENAI_API_KEY.length > 20) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Log a meal item
exports.logMeal = async (req, res, next) => {
  try {
    const { name, calories, protein, carbs, fat, type, date } = req.body;

    if (!name || calories === undefined) {
      res.status(400);
      return next(new Error('Please provide meal name and calories'));
    }

    const queryDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

    // Find if a nutrition log already exists for this day
    let log = await NutritionLog.findOne({
      userId: req.user._id,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    const mealItem = {
      name,
      calories: Number(calories),
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      type: type || 'breakfast',
    };

    if (!log) {
      log = await NutritionLog.create({
        userId: req.user._id,
        meals: [mealItem],
        totalCalories: Number(calories),
        date: date || new Date(),
      });
    } else {
      log.meals.push(mealItem);
      log.totalCalories = log.meals.reduce((sum, item) => sum + item.calories, 0);
      await log.save();
    }

    res.status(201).json(log);
  } catch (error) {
    next(error);
  }
};

// Delete a meal item
exports.deleteMeal = async (req, res, next) => {
  try {
    const { mealId } = req.params;
    const { date } = req.query;

    const queryDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

    const log = await NutritionLog.findOne({
      userId: req.user._id,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (!log) {
      res.status(404);
      return next(new Error('Nutrition log not found for today'));
    }

    log.meals = log.meals.filter(meal => meal._id.toString() !== mealId);
    log.totalCalories = log.meals.reduce((sum, item) => sum + item.calories, 0);
    await log.save();

    res.json(log);
  } catch (error) {
    next(error);
  }
};

// Get today's nutrition log
exports.getTodayNutrition = async (req, res, next) => {
  try {
    const { date } = req.query;
    const queryDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

    let log = await NutritionLog.findOne({
      userId: req.user._id,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (!log) {
      // Return a blank template schema if not found
      return res.json({
        userId: req.user._id,
        meals: [],
        totalCalories: 0,
        waterGlasses: 0,
        date: queryDate,
      });
    }

    res.json(log);
  } catch (error) {
    next(error);
  }
};

// Get nutrition history logs for user
exports.getNutritionHistory = async (req, res, next) => {
  try {
    const logs = await NutritionLog.find({ userId: req.user._id })
      .sort({ date: -1 })
      .limit(30);
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

// Generate AI Meal plan (7 days)
exports.generateMealPlan = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const goalStr = user ? user.goal : 'maintain';
    const weightVal = user ? user.weight : 70;

    console.log(`Generating AI meal plan for user: Goal=${goalStr}, Weight=${weightVal}kg`);

    let mealPlan = null;

    if (openai) {
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4-turbo',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `You are a professional dietitian. Generate a 7-day meal plan based on user specs. Return ONLY a JSON object matching this structure:
              {
                "days": [
                  {
                    "day": "Monday",
                    "meals": [
                      { "type": "breakfast", "name": "Oatmeal with Bananas & Whey", "calories": 450, "protein": 30, "carbs": 55, "fat": 8 },
                      { "type": "lunch", "name": "Grilled Chicken Salad", "calories": 550, "protein": 45, "carbs": 20, "fat": 15 },
                      { "type": "dinner", "name": "Baked Salmon with Quinoa", "calories": 650, "protein": 40, "carbs": 40, "fat": 22 },
                      { "type": "snack", "name": "Mixed Almonds & Greek Yogurt", "calories": 250, "protein": 18, "carbs": 12, "fat": 10 }
                    ]
                  }
                ]
              }
              Include Monday through Sunday.`
            },
            {
              role: 'user',
              content: `Generate a 7-day meal plan for a user aiming to: ${goalStr}. Weight is ${weightVal} kg.`
            }
          ]
        });

        mealPlan = JSON.parse(response.choices[0].message.content);
      } catch (err) {
        console.error('OpenAI Meal Plan API failed, running fallback:', err.message);
      }
    }

    if (!mealPlan) {
      mealPlan = generateFallbackMealPlan(goalStr);
    }

    res.json(mealPlan);
  } catch (error) {
    next(error);
  }
};

function generateFallbackMealPlan(goal) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const planDays = days.map((day, index) => {
    let meals = [];
    if (goal.includes('muscle') || goal.includes('gain')) {
      // High protein muscle gain
      meals = [
        { type: 'breakfast', name: 'Scrambled Eggs (3) with Spinach & Whole Wheat Toast', calories: 480, protein: 28, carbs: 32, fat: 18 },
        { type: 'lunch', name: 'Grilled Chicken Breast, Brown Rice, and Broccoli', calories: 650, protein: 50, carbs: 60, fat: 12 },
        { type: 'snack', name: 'Whey Protein Shake & 1 Banana with Peanut Butter', calories: 350, protein: 30, carbs: 35, fat: 10 },
        { type: 'dinner', name: 'Lean Beef Sirloin, Sweet Potato, and Asparagus', calories: 720, protein: 55, carbs: 55, fat: 20 }
      ];
    } else if (goal.includes('weight') || goal.includes('lose')) {
      // Fat loss cutting
      meals = [
        { type: 'breakfast', name: 'Greek Yogurt with Mixed Berries & Chia Seeds', calories: 280, protein: 22, carbs: 24, fat: 6 },
        { type: 'lunch', name: 'Large Turkey Breast Salad with Avocado & Vinaigrette', calories: 420, protein: 38, carbs: 12, fat: 18 },
        { type: 'snack', name: 'Apple Slices with 1 tbsp Almond Butter', calories: 180, protein: 4, carbs: 22, fat: 9 },
        { type: 'dinner', name: 'Baked Salmon Fillet with Zucchini Noodles & Pesto', calories: 480, protein: 36, carbs: 10, fat: 26 }
      ];
    } else {
      // Maintenance/Balance
      meals = [
        { type: 'breakfast', name: 'Oatmeal with Blueberries, Honey, and Whey Protein', calories: 380, protein: 26, carbs: 50, fat: 7 },
        { type: 'lunch', name: 'Tuna Salad Wrap in Whole Wheat Tortilla', calories: 510, protein: 40, carbs: 45, fat: 14 },
        { type: 'snack', name: 'Cottage Cheese with Pineapple Slices', calories: 210, protein: 16, carbs: 18, fat: 5 },
        { type: 'dinner', name: 'Stir-fried Tofu/Chicken with Quinoa and Mixed Vegetables', calories: 580, protein: 35, carbs: 65, fat: 16 }
      ];
    }

    // Add a bit of variety based on day index
    if (index % 2 === 1) {
      // Alternate lunch or dinner options
      meals[1].name = meals[1].name.replace('Chicken', 'Turkey').replace('Brown Rice', 'Quinoa');
      meals[3].name = meals[3].name.replace('Beef', 'Cod').replace('Sweet Potato', 'Basmati Rice');
    }

    return { day, meals };
  });

  return { days: planDays };
}

// Update water glasses
exports.updateWater = async (req, res, next) => {
  try {
    const { waterGlasses, date } = req.body;
    
    const queryDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

    let log = await NutritionLog.findOne({
      userId: req.user._id,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (!log) {
      log = await NutritionLog.create({
        userId: req.user._id,
        meals: [],
        totalCalories: 0,
        waterGlasses: Number(waterGlasses) || 0,
        date: date || new Date(),
      });
    } else {
      log.waterGlasses = Number(waterGlasses) || 0;
      await log.save();
    }

    res.json(log);
  } catch (error) {
    next(error);
  }
};
