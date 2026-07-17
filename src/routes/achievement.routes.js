const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievement.controller');
const authenticate = require('../middleware/authenticate');

// Get all achievements for a user
router.get('/users/:userId/achievements', authenticate, achievementController.getUserAchievements);

// Get achievement summary (counts)
router.get('/users/:userId/achievements/summary', authenticate, achievementController.getUserAchievementSummary);

module.exports = router;
