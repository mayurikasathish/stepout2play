const express = require('express');
const router = express.Router();
const nextMatchController = require('../controllers/nextMatch.controller');
const authenticate = require('../middleware/authenticate');

// Get next match for a user
router.get('/users/:userId/next-match', authenticate, nextMatchController.getNextMatch);

module.exports = router;
