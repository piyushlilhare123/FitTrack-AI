const express = require('express');
const router = express.Router();
const { logWorkout, getWorkoutHistory, generateWorkoutPlan, updateWorkout, deleteWorkout } = require('../controllers/workoutController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/log', authMiddleware, logWorkout);
router.get('/history', authMiddleware, getWorkoutHistory);
router.post('/generate', authMiddleware, generateWorkoutPlan);
router.put('/:id', authMiddleware, updateWorkout);
router.delete('/:id', authMiddleware, deleteWorkout);

module.exports = router;
