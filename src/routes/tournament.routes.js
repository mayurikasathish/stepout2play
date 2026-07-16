const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournament.controller');
const eventController = require('../controllers/event.controller');
const authenticate = require('../middleware/authenticate');
const requireTournamentOrgRole = require('../middleware/requireTournamentOrgRole');
const requireEventOrgRole = require('../middleware/requireEventOrgRole');

/**
 * Public routes
 */
// GET /tournaments - List all tournaments (with filters)
router.get('/', tournamentController.listTournaments.bind(tournamentController));

// GET /tournaments/:id - Get tournament by ID
router.get('/:id', tournamentController.getTournamentById.bind(tournamentController));

// PATCH /tournaments/:tournamentId - Update tournament (organizer only)
router.patch(
  '/:tournamentId',
  authenticate,
  requireTournamentOrgRole(['OWNER', 'ADMIN']),
  tournamentController.updateTournament.bind(tournamentController)
);

// DELETE /tournaments/:tournamentId - Delete tournament (organizer only)
router.delete(
  '/:tournamentId',
  authenticate,
  requireTournamentOrgRole(['OWNER', 'ADMIN']),
  tournamentController.deleteTournament.bind(tournamentController)
);

// GET /tournaments/:tournamentId/events - List events for tournament
router.get('/:tournamentId/events', eventController.listEvents.bind(eventController));

// GET /tournaments/:tournamentId/live-matches - Get all live matches for tournament (public)
router.get('/:tournamentId/live-matches', tournamentController.getLiveMatches.bind(tournamentController));

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

// PATCH /events/:eventId - Update event (OWNER/ADMIN of tournament's org only)
router.patch(
  '/events/:eventId',
  authenticate,
  requireEventOrgRole(['OWNER', 'ADMIN']),
  eventController.updateEvent.bind(eventController)
);

// DELETE /events/:eventId - Delete event (OWNER/ADMIN of tournament's org only)
router.delete(
  '/events/:eventId',
  authenticate,
  requireEventOrgRole(['OWNER', 'ADMIN']),
  eventController.deleteEvent.bind(eventController)
);

module.exports = router;
