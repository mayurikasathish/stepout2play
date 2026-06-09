const express = require('express');
const passport = require('../config/passport');
const authController = require('../controllers/auth.controller');
const oauthController = require('../controllers/oauth.controller');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Public routes
router.post('/register', (req, res, next) => authController.register(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));

// Google OAuth routes
router.get('/google', passport.authenticate('google', { session: false }));
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res, next) => oauthController.googleCallback(req, res, next)
);

// Protected routes
router.get('/me', authenticate, (req, res, next) => authController.getMe(req, res, next));
router.patch('/onboarding', authenticate, (req, res, next) => authController.completeOnboarding(req, res, next));

module.exports = router;