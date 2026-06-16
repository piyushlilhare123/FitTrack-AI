const express = require('express');
const router = express.Router();
const { getAllConversations, createConversation, getConversationById, sendMessage, deleteConversation, syncVoiceMessage, scanFood, searchFoodText } = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/conversations', authMiddleware, getAllConversations);
router.post('/conversations', authMiddleware, createConversation);
router.get('/conversations/:id', authMiddleware, getConversationById);
router.post('/conversations/:id/message', authMiddleware, sendMessage);
router.delete('/conversations/:id', authMiddleware, deleteConversation);
router.post('/conversations/:id/message/sync', authMiddleware, syncVoiceMessage);
router.post('/scan-food', authMiddleware, scanFood);
router.post('/search-food', authMiddleware, searchFoodText);

module.exports = router;
