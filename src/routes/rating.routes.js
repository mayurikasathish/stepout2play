const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/rating.controller');
const authenticate = require('../middleware/authenticate');

// Get leaderboard for a sport (public)
router.get('/leaderboard/:sportId', ratingController.getLeaderboard);

// Get rating stats for a sport (public)
router.get('/stats/:sportId', ratingController.getRatingStats);

// Get user's ratings for all sports (public)
router.get('/:userId', ratingController.getUserRatings);

// Get user's rating for specific sport (public)
router.get('/:userId/:sportId', ratingController.getUserRatingForSport);

module.exports = router;
