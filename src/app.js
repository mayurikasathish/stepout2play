const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const orgRoutes = require('./routes/org.routes');
const userRoutes = require('./routes/user.routes');
const tournamentRoutes = require('./routes/tournament.routes');
const registrationRoutes = require('./routes/registration.routes');
const bracketRoutes = require('./routes/bracket.routes');
const schedulerRoutes = require('./routes/scheduler.routes');
const sportsRoutes = require('./routes/sports.routes');
const uploadRoutes = require('./routes/upload.routes');
const ocrRoutes = require('./routes/ocr.routes');
const notificationRoutes = require('./routes/notification.routes');
const liveFeedRoutes = require('./routes/livefeed.routes');
const replacementRoutes = require('./routes/replacement.routes');
const ratingRoutes = require('./routes/rating.routes');
const matchRoutes = require('./routes/match.routes');
const playerProfileRoutes = require('./routes/playerProfile.routes');

const app = express();

// Middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5173', // Always allow local dev
    'http://localhost:5174',
    'http://localhost:5175',
    'https://stepout2play-web.onrender.com' // Production frontend
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes - all under /api prefix
app.use('/api/auth', authRoutes);
app.use('/api/orgs', orgRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/sports', sportsRoutes); // Sports metadata routes
app.use('/api', registrationRoutes); // Registration routes use /events and /users paths
app.use('/api', bracketRoutes); // Bracket routes use /events and /matches paths
app.use('/api', schedulerRoutes); // Scheduler routes use /events and /tournaments paths
app.use('/api', uploadRoutes); // Upload routes for images
app.use('/api/ocr', ocrRoutes); // OCR routes for scorecard extraction
app.use('/api/notifications', notificationRoutes); // Notification routes
app.use('/api/live-feed', liveFeedRoutes); // Live feed routes
app.use('/api', replacementRoutes); // Auto-replacement routes
app.use('/api/ratings', ratingRoutes); // Rating routes
app.use('/api/matches', matchRoutes); // Match routes for live matches
app.use('/api/users', playerProfileRoutes); // Player profile routes

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'StepOut2Play API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: message,
  });
});

module.exports = app;
