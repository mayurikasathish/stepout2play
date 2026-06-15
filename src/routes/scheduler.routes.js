const express = require('express');
const router = express.Router();
const schedulerController = require('../controllers/scheduler.controller');
const authenticate = require('../middleware/authenticate');

/**
 * Tournament scheduling configuration (organizer only)
 */
// PATCH /tournaments/:id/schedule-config
router.patch(
  '/tournaments/:id/schedule-config',
  authenticate,
  schedulerController.updateScheduleConfig.bind(schedulerController)
);

/**
 * Event scheduling routes
 */
// POST /events/:eventId/auto-schedule - Auto-schedule all matches
router.post(
  '/events/:eventId/auto-schedule',
  authenticate,
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
  schedulerController.clearSchedule.bind(schedulerController)
);

module.exports = router;
