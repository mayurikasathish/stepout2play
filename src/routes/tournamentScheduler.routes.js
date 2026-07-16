const express = require('express');
const router = express.Router();
const tournamentSchedulerController = require('../controllers/tournamentScheduler.controller');
const authenticate = require('../middleware/authenticate');
const requireTournamentOrgRole = require('../middleware/requireTournamentOrgRole');

/**
 * TOURNAMENT-LEVEL CROSS-EVENT SCHEDULER ROUTES
 *
 * These routes handle scheduling ACROSS ALL EVENTS in a tournament
 * to prevent court conflicts and manage shared resources
 */

// Generate tournament schedule (cross-event intelligent scheduling)
// POST /tournaments/:tournamentId/scheduler/generate
router.post(
  '/:tournamentId/scheduler/generate',
  authenticate,
  requireTournamentOrgRole(['OWNER', 'ADMIN']),
  tournamentSchedulerController.generateSchedule.bind(tournamentSchedulerController)
);

// Save generated schedule to database
// POST /tournaments/:tournamentId/scheduler/save
router.post(
  '/:tournamentId/scheduler/save',
  authenticate,
  requireTournamentOrgRole(['OWNER', 'ADMIN']),
  tournamentSchedulerController.saveSchedule.bind(tournamentSchedulerController)
);

// Get current tournament schedule (supports multiple views)
// GET /tournaments/:tournamentId/scheduler/schedule?view=day|week|event|court|player
router.get(
  '/:tournamentId/scheduler/schedule',
  tournamentSchedulerController.getSchedule.bind(tournamentSchedulerController)
);

// Clear tournament schedule
// DELETE /tournaments/:tournamentId/scheduler/schedule
router.delete(
  '/:tournamentId/scheduler/schedule',
  authenticate,
  requireTournamentOrgRole(['OWNER', 'ADMIN']),
  tournamentSchedulerController.clearSchedule.bind(tournamentSchedulerController)
);

module.exports = router;
