const express = require('express');
const router = express.Router();
const bracketController = require('../controllers/bracket.controller');
const authenticate = require('../middleware/authenticate');
const requireEventOrgRole = require('../middleware/requireEventOrgRole');

/**
 * Bracket generation routes (organizer only)
 */

// POST /events/:eventId/generate-bracket - Generate bracket
router.post(
  '/events/:eventId/generate-bracket',
  authenticate,
  requireEventOrgRole(['OWNER', 'ADMIN']),
  bracketController.generateBracket.bind(bracketController)
);

// GET /events/:eventId/bracket - Get bracket (public)
router.get(
  '/events/:eventId/bracket',
  bracketController.getBracket.bind(bracketController)
);

// DELETE /events/:eventId/bracket - Delete bracket (organizer only)
router.delete(
  '/events/:eventId/bracket',
  authenticate,
  requireEventOrgRole(['OWNER', 'ADMIN']),
  bracketController.deleteBracket.bind(bracketController)
);

/**
 * Match result routes (organizer only)
 */

// PATCH /matches/:matchId/result - Update match result
router.patch(
  '/matches/:matchId/result',
  authenticate,
  bracketController.updateMatchResult.bind(bracketController)
);

module.exports = router;
