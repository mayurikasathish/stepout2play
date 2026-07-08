const express = require('express');
const router = express.Router();
const schedulerController = require('../controllers/scheduler.controller');
const matchSchedulerController = require('../controllers/matchScheduler.controller');
const authenticate = require('../middleware/authenticate');
const requireTournamentOrgRole = require('../middleware/requireTournamentOrgRole');
const requireEventOrgRole = require('../middleware/requireEventOrgRole');

/**
 * Tournament scheduling configuration (organizer only)
 */
// PATCH /tournaments/:id/schedule-config
router.patch(
  '/tournaments/:id/schedule-config',
  authenticate,
  requireTournamentOrgRole(['OWNER', 'ADMIN']),
  schedulerController.updateScheduleConfig.bind(schedulerController)
);

/**
 * Event scheduling routes
 */
// POST /events/:eventId/auto-schedule - Auto-schedule all matches
router.post(
  '/events/:eventId/auto-schedule',
  authenticate,
  requireEventOrgRole(['OWNER', 'ADMIN']),
  schedulerController.autoSchedule.bind(schedulerController)
);

// GET /events/:eventId/schedule - Get schedule
router.get(
  '/events/:eventId/schedule',
  schedulerController.getSchedule.bind(schedulerController)
);

// DELETE /events/:eventId/schedule - Clear schedule
router.delete(
  '/events/:eventId/schedule',
  authenticate,
  requireEventOrgRole(['OWNER', 'ADMIN']),
  schedulerController.clearSchedule.bind(schedulerController)
);

// NEW: Greedy algorithm scheduler
// GET /events/:eventId/saved-schedule
router.get(
  '/events/:eventId/saved-schedule',
  authenticate,
  matchSchedulerController.getSavedSchedule.bind(matchSchedulerController)
);

// POST /events/:eventId/generate-schedule
router.post(
  '/events/:eventId/generate-schedule',
  authenticate,
  requireEventOrgRole(['OWNER', 'ADMIN']),
  matchSchedulerController.generateSchedule.bind(matchSchedulerController)
);

// POST /events/:eventId/validate-schedule (validate without saving)
router.post(
  '/events/:eventId/validate-schedule',
  authenticate,
  requireEventOrgRole(['OWNER', 'ADMIN']),
  matchSchedulerController.validateScheduleOnly.bind(matchSchedulerController)
);

// POST /events/:eventId/save-schedule
router.post(
  '/events/:eventId/save-schedule',
  authenticate,
  requireEventOrgRole(['OWNER', 'ADMIN']),
  matchSchedulerController.saveSchedule.bind(matchSchedulerController)
);

// DELETE /events/:eventId/delete-schedule
router.delete(
  '/events/:eventId/delete-schedule',
  authenticate,
  requireEventOrgRole(['OWNER', 'ADMIN']),
  matchSchedulerController.deleteSchedule.bind(matchSchedulerController)
);

module.exports = router;
