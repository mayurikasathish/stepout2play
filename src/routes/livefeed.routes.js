const express = require('express');
const router = express.Router();
const liveFeedController = require('../controllers/livefeed.controller');
const authenticate = require('../middleware/authenticate');

// All routes require authentication
router.use(authenticate);

router.get('/', liveFeedController.getUserFeed);
router.get('/global', liveFeedController.getGlobalFeed);

module.exports = router;
