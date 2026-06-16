const express = require('express');
const router = express.Router();
const { logMeal, deleteMeal, getTodayNutrition, getNutritionHistory, generateMealPlan, updateWater } = require('../controllers/nutritionController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/log', authMiddleware, logMeal);
router.delete('/log/:mealId', authMiddleware, deleteMeal);
router.get('/history', authMiddleware, getNutritionHistory);
router.get('/today', authMiddleware, getTodayNutrition);
router.post('/meal-plan', authMiddleware, generateMealPlan);
router.put('/water', authMiddleware, updateWater);

module.exports = router;
