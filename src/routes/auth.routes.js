const express = require('express');

const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Public routes
router.post('/register', (req, res, next) => authController.register(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));



// Protected routes
router.get('/me', authenticate, (req, res, next) => authController.getMe(req, res, next));
router.patch('/onboarding', authenticate, (req, res, next) => authController.completeOnboarding(req, res, next));
router.patch('/profile', authenticate, (req, res, next) => authController.updateProfile(req, res, next));
router.delete('/profile', authenticate, (req, res, next) => authController.deleteAccount(req, res, next));

module.exports = router;