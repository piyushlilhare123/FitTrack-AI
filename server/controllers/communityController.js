const Post = require('../models/Post');
const Workout = require('../models/Workout');
const User = require('../models/User');

// Get all posts for feed
exports.getFeed = async (req, res, next) => {
  try {
    const posts = await Post.find()
      .populate('userId', 'name avatar')
      .populate('workoutId')
      .populate('likes', 'name')
      .sort({ date: -1 });
    res.json(posts);
  } catch (error) {
    next(error);
  }
};

// Get top leaderboard users
exports.getLeaderboard = async (req, res, next) => {
  try {
    const users = await User.find().select('name avatar');
    
    const leaderboard = await Promise.all(users.map(async (u) => {
      const workouts = await Workout.find({ userId: u._id, isCompleted: true });
      const activeWorkouts = await Workout.find({ userId: u._id });
      const score = (activeWorkouts.length * 50) + (workouts.length * 100) + 200; // Base points + workouts
      
      return {
        _id: u._id.toString(),
        name: u.name,
        avatar: u.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${u.name}`,
        score
      };
    }));

    leaderboard.sort((a, b) => b.score - a.score);
    res.json(leaderboard);
  } catch (error) {
    next(error);
  }
};

// Create a new feed post
exports.createPost = async (req, res, next) => {
  try {
    const { content, workoutId, image } = req.body;

    if (!content) {
      res.status(400);
      return next(new Error('Post content cannot be empty'));
    }

    const post = await Post.create({
      userId: req.user._id,
      content,
      workoutId: workoutId || null,
      image: image || '',
      likes: [],
      comments: [],
    });

    const populatedPost = await Post.findById(post._id)
      .populate('userId', 'name avatar')
      .populate('workoutId')
      .populate('likes', 'name');

    res.status(201).json(populatedPost);
  } catch (error) {
    next(error);
  }
};

// Toggle like a post
exports.toggleLikePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);

    if (!post) {
      res.status(404);
      return next(new Error('Post not found'));
    }

    const userIdStr = req.user._id.toString();
    const index = post.likes.indexOf(req.user._id);

    if (index === -1) {
      post.likes.push(req.user._id);
    } else {
      post.likes.splice(index, 1);
    }

    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate('userId', 'name avatar')
      .populate('workoutId')
      .populate('likes', 'name');

    res.json(populatedPost);
  } catch (error) {
    next(error);
  }
};

// Comment on a post
exports.addComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;

    if (!text) {
      res.status(400);
      return next(new Error('Comment text cannot be empty'));
    }

    const post = await Post.findById(postId);
    if (!post) {
      res.status(404);
      return next(new Error('Post not found'));
    }

    post.comments.push({
      userId: req.user._id,
      name: req.user.name,
      avatar: req.user.avatar || '',
      text,
    });

    await post.save();
    
    const populatedPost = await Post.findById(postId)
      .populate('userId', 'name avatar')
      .populate('workoutId')
      .populate('likes', 'name');
      
    res.json(populatedPost);
  } catch (error) {
    next(error);
  }
};
