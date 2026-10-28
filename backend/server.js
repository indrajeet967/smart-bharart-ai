require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');

const app = express();

// Middlewares
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.includes(origin));
  }
}));
// Increase payload limit for base64 local image upload fallbacks
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/schemes', require('./routes/schemes'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/ai', require('./routes/ai'));

// Health Check API
app.get('/api/health', (req, res) => {
  const { isMock } = require('./config/db');
  res.json({
    status: 'online',
    timestamp: new Date(),
    database: isMock ? 'JSON Mock Mode' : 'MongoDB Connected',
    gemini: process.env.GEMINI_API_KEY ? 'Configured' : 'Unavailable; use local catalog'
  });
});

// Serve frontend in production (optional, we run concurrently in dev)
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'), (err) => {
    if (err) {
      res.status(200).send("Smart Bharat Backend Running. Frontend is active in dev mode.");
    }
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  connectDB()
    .then(() => {
      if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
        app.listen(PORT, () => {
          console.log(`🚀 Smart Bharat Server is running on port ${PORT}`);
        });
      }
    })
    .catch((err) => {
      console.error('Failed to initialize the database:', err.message);
      process.exitCode = 1;
    });
}

module.exports = app;
