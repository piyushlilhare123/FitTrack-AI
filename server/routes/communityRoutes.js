const express = require('express');
const router = express.Router();
const { getFeed, getLeaderboard, createPost, toggleLikePost, addComment } = require('../controllers/communityController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/feed', authMiddleware, getFeed);
router.get('/leaderboard', authMiddleware, getLeaderboard);
router.post('/posts/create', authMiddleware, createPost);
router.post('/posts/:postId/like', authMiddleware, toggleLikePost);
router.post('/posts/:postId/comment', authMiddleware, addComment);

module.exports = router;
