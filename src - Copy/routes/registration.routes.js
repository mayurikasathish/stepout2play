const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registration.controller');
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
