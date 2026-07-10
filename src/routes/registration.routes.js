const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registration.controller');
const withdrawalController = require('../controllers/withdrawal.controller');
const authenticate = require('../middleware/authenticate');
const requireEventOrgRole = require('../middleware/requireEventOrgRole');

/**
 * User registration routes
 */
// GET /events/:eventId/check-eligibility - Check if user is eligible for an event
router.get(
  '/events/:eventId/check-eligibility',
  authenticate,
  registrationController.checkEligibility.bind(registrationController)
);

// POST /events/:eventId/register - Register for an event
router.post(
  '/events/:eventId/register',
  authenticate,
  registrationController.registerForEvent.bind(registrationController)
);

// GET /users/me/registrations - Get my registrations
router.get(
  '/users/me/registrations',
  authenticate,
  registrationController.getMyRegistrations.bind(registrationController)
);

// DELETE /registrations/:registrationId - Cancel registration
router.delete(
  '/registrations/:registrationId',
  authenticate,
  registrationController.cancelRegistration.bind(registrationController)
);

// POST /registrations/:registrationId/withdraw - Withdraw from event
router.post(
  '/registrations/:registrationId/withdraw',
  authenticate,
  withdrawalController.withdrawFromEvent.bind(withdrawalController)
);

// GET /events/:eventId/standby - Get standby list (organizer only)
router.get(
  '/events/:eventId/standby',
  authenticate,
  requireEventOrgRole(['OWNER', 'ADMIN']),
  withdrawalController.getStandbyList.bind(withdrawalController)
);

// POST /events/:eventId/accept-spot - Accept standby promotion
router.post(
  '/events/:eventId/accept-spot',
  authenticate,
  withdrawalController.acceptSpot.bind(withdrawalController)
);

// POST /events/:eventId/reject-spot - Reject standby promotion
router.post(
  '/events/:eventId/reject-spot',
  authenticate,
  withdrawalController.rejectSpot.bind(withdrawalController)
);

// POST /events/:eventId/notify-standby - Notify standby players (organizer only)
router.post(
  '/events/:eventId/notify-standby',
  authenticate,
  requireEventOrgRole(['OWNER', 'ADMIN']),
  withdrawalController.notifyStandbyPlayers.bind(withdrawalController)
);

// POST /events/:eventId/search-partner - Search for a partner by email
router.post(
  '/events/:eventId/search-partner',
  authenticate,
  registrationController.searchPartner.bind(registrationController)
);

// POST /events/:eventId/verify-partner - Verify partner eligibility
router.post(
  '/events/:eventId/verify-partner',
  authenticate,
  registrationController.verifyPartner.bind(registrationController)
);

// POST /events/:eventId/check-team-name - Check if team name is available
router.post(
  '/events/:eventId/check-team-name',
  authenticate,
  registrationController.checkTeamName.bind(registrationController)
);

/**
 * Organizer routes
 */
// GET /events/:eventId/registrations - View registrations for an event (organizer only)
router.get(
  '/events/:eventId/registrations',
  authenticate,
  requireEventOrgRole(['OWNER', 'ADMIN']),
  registrationController.getEventRegistrations.bind(registrationController)
);

module.exports = router;
