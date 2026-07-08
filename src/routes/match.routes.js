const express = require('express');
const router = express.Router();
const matchController = require('../controllers/match.controller');

/**
 * Live matches routes (public)
 */

// GET /matches/live - Get all currently IN_PROGRESS matches
router.get('/live', matchController.getLiveMatches);

// GET /matches/upcoming - Get matches starting soon (next 30 mins)
router.get('/upcoming', matchController.getUpcomingMatches);

// GET /matches/recent - Get recently completed matches (last 2 hours)
router.get('/recent', matchController.getRecentMatches);

module.exports = router;
