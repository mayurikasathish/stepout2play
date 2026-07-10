const registrationService = require('../services/registration.service');
const eligibilityService = require('../services/eligibility.service');
const partnerService = require('../services/partner.service');
const prisma = require('../lib/prisma');
const { LiveFeedHelpers } = require('../utils/notificationHelpers');

class RegistrationController {
  /**
   * Check eligibility for an event
   * GET /events/:eventId/check-eligibility
   */
  async checkEligibility(req, res, next) {
    try {
      const { eventId } = req.params;
      const userId = req.user.id;

      const eligibility = await eligibilityService.checkEligibility(userId, eventId);

      res.status(200).json({
        success: true,
        ...eligibility
      });
    } catch (error) {
      next(error);
    }
  }
  /**
   * Register current user for an event
   * POST /events/:eventId/register
   */
  async registerForEvent(req, res, next) {
    try {
      const { eventId } = req.params;
      const { partnerId, teamName } = req.body;
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

      // Validate team name if provided
      if (teamName && partnerId) {
        if (typeof teamName !== 'string' || teamName.trim().length < 3) {
          return res.status(400).json({
            success: false,
            error: 'Team name must be at least 3 characters'
          });
        }

        // Check if team name already exists for this event
        const existingTeam = await prisma.registration.findFirst({
          where: {
            eventId,
            teamName: teamName.trim(),
            status: { not: 'WITHDRAWN' }
          }
        });

        if (existingTeam) {
          return res.status(400).json({
            success: false,
            error: 'This team name is already taken for this event'
          });
        }
      }

      // Check eligibility
      const eligibility = await eligibilityService.checkEligibility(userId, eventId);
      if (!eligibility.eligible) {
        return res.status(403).json({
          success: false,
          error: 'You are not eligible for this event',
          reasons: eligibility.reasons,
          userAge: eligibility.userAge,
          eventCategory: eligibility.eventCategory,
          eventGender: eligibility.eventGender
        });
      }

      const registration = await registrationService.registerForEvent(userId, eventId, {
        partnerId: partnerId || null,
        teamName: teamName ? teamName.trim() : null
      });

      // Create live feed item when player registers
      try {
        await LiveFeedHelpers.playerRegistered({
          actorId: userId,
          playerName: `${req.user.firstName} ${req.user.lastName}`,
          eventName: registration.event?.name || 'an event',
          tournamentId: registration.event?.tournamentId
        });
      } catch (feedError) {
        console.error('Error creating live feed item:', feedError);
        // Don't fail the registration if feed fails
      }

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

  /**
   * Search for a partner by email
   * POST /events/:eventId/search-partner
   */
  async searchPartner(req, res, next) {
    try {
      const { email } = req.body;

      if (!email || typeof email !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Email is required'
        });
      }

      const partner = await partnerService.searchPartnerByEmail(email);

      res.status(200).json({
        success: true,
        partner
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify partner eligibility for an event
   * POST /events/:eventId/verify-partner
   */
  async verifyPartner(req, res, next) {
    try {
      const { eventId } = req.params;
      const { partnerId } = req.body;
      const userId = req.user.id;

      if (!partnerId || typeof partnerId !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Partner ID is required'
        });
      }

      // Cannot partner with yourself
      if (partnerId === userId) {
        return res.status(400).json({
          success: false,
          error: 'You cannot register with yourself as a partner'
        });
      }

      const verification = await partnerService.verifyPartnerEligibility(userId, partnerId, eventId);

      res.status(200).json({
        success: true,
        ...verification
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel registration
   * DELETE /registrations/:registrationId
   */
  async cancelRegistration(req, res, next) {
    try {
      const { registrationId } = req.params;
      const userId = req.user.id;

      // Get registration with event and tournament details
      const registration = await prisma.registration.findUnique({
        where: { id: registrationId },
        include: {
          event: {
            include: {
              tournament: true
            }
          }
        }
      });

      if (!registration) {
        return res.status(404).json({
          success: false,
          error: 'Registration not found'
        });
      }

      // Check if user owns this registration
      if (registration.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'You can only cancel your own registrations'
        });
      }

      // Check if already cancelled
      if (registration.status === 'CANCELLED') {
        return res.status(400).json({
          success: false,
          error: 'Registration already cancelled'
        });
      }

      // Check if deadline has passed
      const now = new Date();
      const deadline = new Date(registration.event.tournament.registrationDeadline);

      if (now > deadline) {
        return res.status(400).json({
          success: false,
          error: 'Registration deadline has passed',
          deadlinePassed: true,
          deadline: deadline.toISOString()
        });
      }

      // Cancel the registration
      await prisma.registration.update({
        where: { id: registrationId },
        data: { status: 'CANCELLED' }
      });

      res.status(200).json({
        success: true,
        message: 'Registration cancelled successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if team name is available for an event
   * POST /events/:eventId/check-team-name
   */
  async checkTeamName(req, res, next) {
    try {
      const { eventId } = req.params;
      const { teamName } = req.body;

      if (!teamName || typeof teamName !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Team name is required'
        });
      }

      if (teamName.trim().length < 3) {
        return res.status(400).json({
          success: false,
          error: 'Team name must be at least 3 characters'
        });
      }

      // Check if team name exists for this event (excluding withdrawn registrations)
      const existingTeam = await prisma.registration.findFirst({
        where: {
          eventId,
          teamName: teamName.trim(),
          status: { not: 'WITHDRAWN' }
        }
      });

      res.status(200).json({
        success: true,
        available: !existingTeam,
        teamName: teamName.trim()
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RegistrationController();
