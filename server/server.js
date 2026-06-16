const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();

// Imports middleware
const errorHandler = require('./middleware/errorHandler');
const apiLimiter = require('./middleware/rateLimiter');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const workoutRoutes = require('./routes/workoutRoutes');
const nutritionRoutes = require('./routes/nutritionRoutes');
const progressRoutes = require('./routes/progressRoutes');
const communityRoutes = require('./routes/communityRoutes');
const aiRoutes = require('./routes/aiRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');

// Connect to Database
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fittrack';
console.log('Connecting to MongoDB at:', mongoURI);

// Disable buffering so queries fail immediately if there's no connection
mongoose.set('bufferCommands', false);

const fetchAndPrintIP = () => {
  try {
    const http = require('http');
    http.get({'host': 'api.ipify.org', 'port': 80, 'path': '/'}, function(resp) {
      resp.on('data', function(ip) {
        console.log("==================================================");
        console.log("Your current public IP address is:", ip.toString());
        console.log("Please whitelist this IP in MongoDB Atlas (Network Access -> Add IP Address).");
        console.log("==================================================");
      });
    }).on('error', () => {});
  } catch (e) {}
};

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
    });
    console.log('Successfully connected to MongoDB.');
  } catch (err) {
    console.error('MongoDB connection failure details:', err.message);
    fetchAndPrintIP();

    // Fallback to in-memory MongoDB if the main connection failed
    console.log('Attempting fallback connection to in-memory MongoDB...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const memUri = mongoServer.getUri();
      await mongoose.connect(memUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('Successfully connected to in-memory fallback MongoDB.');
    } catch (memErr) {
      console.error('In-memory fallback MongoDB connection failure:', memErr.message);
    }
  }
};

connectDB();

// Standard Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow React client to fetch photos from static folder
}));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection status check middleware
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: 'Database connection is not established. If you are using MongoDB Atlas, make sure your current IP address is whitelisted in your MongoDB Atlas Dashboard (Network Access -> Add IP Address -> Add Current IP Address). If you are running MongoDB locally, make sure your MongoDB service is running.'
    });
  }
  next();
});

// Apply rate limiter to general api calls
app.use('/api/', apiLimiter);

// Bind Routes
app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api', communityRoutes); // Mounts /api/feed and /api/posts/...

// Default Route
app.get('/', (req, res) => {
  res.send('AI FitTrack Server API is running...');
});

// Error handling middleware
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in mode: ${process.env.NODE_ENV || 'development'} on port ${PORT}`);
});
