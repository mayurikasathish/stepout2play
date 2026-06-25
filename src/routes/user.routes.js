const express = require('express');
const userController = require('../controllers/user.controller');

const router = express.Router();

// Public routes - anyone can view player profiles
router.get('/players', (req, res, next) => userController.getPlayers(req, res, next));
router.get('/players/:id', (req, res, next) => userController.getPlayerById(req, res, next));

module.exports = router;
