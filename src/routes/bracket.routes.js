const express = require('express');
const router = express.Router();
const bracketController = require('../controllers/bracket.controller');
const seedController = require('../controllers/seed.controller');
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

// POST /events/:eventId/publish-bracket - Publish bracket and notify players
router.post(
  '/events/:eventId/publish-bracket',
  authenticate,
  requireEventOrgRole(['OWNER', 'ADMIN']),
  bracketController.publishBracket.bind(bracketController)
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

// PATCH /events/:eventId/seed-numbers - Update seed numbers for manual seeding
router.patch(
  '/events/:eventId/seed-numbers',
  authenticate,
  requireEventOrgRole(['OWNER', 'ADMIN']),
  bracketController.updateSeedNumbers.bind(bracketController)
);

/**
 * Automatic seeding routes (organizer only)
 */

// GET /events/:eventId/generate-seeds - Generate seeds based on ratings
router.get(
  '/events/:eventId/generate-seeds',
  authenticate,
  requireEventOrgRole(['OWNER', 'ADMIN']),
  seedController.generateSeeds.bind(seedController)
);

// POST /events/:eventId/apply-seeds - Apply generated seeds
router.post(
  '/events/:eventId/apply-seeds',
  authenticate,
  requireEventOrgRole(['OWNER', 'ADMIN']),
  seedController.applySeeds.bind(seedController)
);

// DELETE /events/:eventId/seeds - Clear all seeds
router.delete(
  '/events/:eventId/seeds',
  authenticate,
  requireEventOrgRole(['OWNER', 'ADMIN']),
  seedController.clearSeeds.bind(seedController)
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
