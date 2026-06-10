const registrationService = require('../services/registration.service');

class RegistrationController {
  /**
   * Register current user for an event
   * POST /events/:eventId/register
   */
  async registerForEvent(req, res, next) {
    try {
      const { eventId } = req.params;
      const { partnerId } = req.body;
      const userId = req.user.id;

      // Validation
      if (partnerId && typeof partnerId !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Partner ID must be a valid string'
        });
      }

      // Cannot register with yourself as partner
      if (partnerId && partnerId === userId) {
        return res.status(400).json({
          success: false,
          error: 'You cannot register with yourself as a partner'
        });
      }

      const registration = await registrationService.registerForEvent(userId, eventId, {
        partnerId: partnerId || null
      });

      res.status(201).json({
        success: true,
        registration
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user's registrations
   * GET /users/me/registrations
   */
  async getMyRegistrations(req, res, next) {
    try {
      const userId = req.user.id;

      const registrations = await registrationService.getMyRegistrations(userId);

      res.status(200).json({
        success: true,
        registrations,
        count: registrations.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all registrations for an event (organizer only)
   * GET /events/:eventId/registrations
   */
  async getEventRegistrations(req, res, next) {
    try {
      const { eventId } = req.params;

      const registrations = await registrationService.getEventRegistrations(eventId);

      res.status(200).json({
        success: true,
        registrations,
        count: registrations.length
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RegistrationController();
