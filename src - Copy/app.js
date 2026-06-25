const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const orgRoutes = require('./routes/org.routes');
const tournamentRoutes = require('./routes/tournament.routes');
const registrationRoutes = require('./routes/registration.routes');
const bracketRoutes = require('./routes/bracket.routes');
const schedulerRoutes = require('./routes/scheduler.routes');
const sportsRoutes = require('./routes/sports.routes');
// const uploadRoutes = require('./routes/upload.routes'); // Temporarily disabled until Cloudinary is configured

const app = express();

// Middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175'
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes - all under /api prefix
app.use('/api/auth', authRoutes);
app.use('/api/orgs', orgRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/sports', sportsRoutes); // Sports metadata routes
app.use('/api', registrationRoutes); // Registration routes use /events and /users paths
app.use('/api', bracketRoutes); // Bracket routes use /events and /matches paths
app.use('/api', schedulerRoutes); // Scheduler routes use /events and /tournaments paths
// app.use('/api', uploadRoutes); // Upload routes - disabled until Cloudinary is configured

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
