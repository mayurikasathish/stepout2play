const express = require('express');
const router = express.Router();
const sportsController = require('../controllers/sports.controller');

// Get all sports
router.get('/', sportsController.getAllSports.bind(sportsController));

// Get specific sport
router.get('/:sportId', sportsController.getSportById.bind(sportsController));

// Get scoring rules for a sport
router.get('/:sportId/rules', sportsController.getScoringRules.bind(sportsController));

module.exports = router;
