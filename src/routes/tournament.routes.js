const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournament.controller');
const eventController = require('../controllers/event.controller');
const authenticate = require('../middleware/authenticate');
const requireTournamentOrgRole = require('../middleware/requireTournamentOrgRole');

/**
 * Public routes
 */
// GET /tournaments - List all tournaments (with filters)
router.get('/', tournamentController.listTournaments.bind(tournamentController));

// GET /tournaments/:id - Get tournament by ID
router.get('/:id', tournamentController.getTournamentById.bind(tournamentController));

// PATCH /tournaments/:id - Update tournament (organizer only)
router.patch(
  '/:id',
  authenticate,
  tournamentController.updateTournament.bind(tournamentController)
);

// DELETE /tournaments/:id - Delete tournament (organizer only)
router.delete(
  '/:id',
  authenticate,
  tournamentController.deleteTournament.bind(tournamentController)
);

// GET /tournaments/:tournamentId/events - List events for tournament
router.get('/:tournamentId/events', eventController.listEvents.bind(eventController));

// GET /tournaments/:id/registrations - Get all registrations for tournament (organizer only)
router.get(
  '/:id/registrations',
  authenticate,
  tournamentController.getTournamentRegistrations.bind(tournamentController)
);

/**
 * Protected routes
 */
// POST /tournaments/:tournamentId/events - Create event (OWNER/ADMIN of tournament's org only)
router.post(
  '/:tournamentId/events',
  authenticate,
  requireTournamentOrgRole(['OWNER', 'ADMIN']),
  eventController.createEvent.bind(eventController)
);

module.exports = router;
