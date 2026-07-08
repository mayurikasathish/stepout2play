const express = require('express');
const router = express.Router();
const playerProfileController = require('../controllers/playerProfile.controller');
const authenticate = require('../middleware/authenticate');

/**
 * Player Profile Routes
 */

// GET /users/:userId/profile-stats - Get comprehensive profile stats
router.get(
  '/:userId/profile-stats',
  authenticate,
  playerProfileController.getProfileStats.bind(playerProfileController)
);

// GET /users/:userId/match-history - Get detailed match history
router.get(
  '/:userId/match-history',
  authenticate,
  playerProfileController.getMatchHistory.bind(playerProfileController)
);

// GET /users/:userId/rating-history/:sportId - Get rating history for graph
router.get(
  '/:userId/rating-history/:sportId',
  authenticate,
  playerProfileController.getRatingHistory.bind(playerProfileController)
);

module.exports = router;
