const eventService = require('../services/event.service');
const { parseAgeCategory } = require('../utils/ageValidation');

class EventController {
  /**
   * Create a new event for a tournament
   * POST /tournaments/:tournamentId/events
   */
  async createEvent(req, res, next) {
    try {
      const { tournamentId } = req.params;
      const { name, format, category, gender, maxParticipants, registrationFee, rules, sportId, bestOf, pointsPerSet, goldenPoint } = req.body;

      // Validation
      const errors = [];

      // Validate age category format if provided
      if (category && category.trim() !== '') {
        const ageValidation = parseAgeCategory(category.trim());
        if (!ageValidation.isValid) {
          errors.push(ageValidation.error);
        }
      }

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        errors.push('Event name is required');
      }

      const validFormats = ['SINGLES', 'DOUBLES', 'MIXED_DOUBLES'];
      if (!format || !validFormats.includes(format)) {
        errors.push(`Format must be one of: ${validFormats.join(', ')}`);
      }

      if (!gender || typeof gender !== 'string' || gender.trim().length === 0) {
        errors.push('Gender is required');
      }

      if (maxParticipants !== undefined && maxParticipants !== null) {
        const max = parseInt(maxParticipants, 10);
        if (isNaN(max) || max < 1) {
          errors.push('Max participants must be a positive integer');
        }
      }

      if (registrationFee !== undefined && registrationFee !== null) {
        const fee = parseFloat(registrationFee);
        if (isNaN(fee) || fee < 0) {
          errors.push('Registration fee must be a positive number');
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
      }

      const eventData = {
        name: name.trim(),
        format,
        category: category?.trim() || null,
        gender: gender?.trim() || null,
        maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : null,
        registrationFee: registrationFee ? parseFloat(registrationFee) : null,
        rules: rules?.trim() || null
      };

      // Handle sport selection vs custom rules
      if (sportId) {
        // Sport selected - use sport rules
        const sportsService = require('../services/sports.service');
        const sport = sportsService.getSportById(sportId);

        if (!sport) {
          return res.status(400).json({
            success: false,
            error: `Invalid sport ID: ${sportId}`
          });
        }

        eventData.sportId = sportId;
        eventData.scoringType = sport.scoringType;
        eventData.scoringRules = sport.rules;
        eventData.bestOf = sport.rules.bestOf;
        eventData.pointsPerSet = sport.rules.pointsPerSet;

        // Golden Point for Padel
        if (sportId === 'padel' && goldenPoint !== undefined) {
          eventData.goldenPoint = Boolean(goldenPoint);
        }
      } else {
        // Custom rules
        eventData.sportId = null;
        eventData.scoringType = 'point-based';

        if (bestOf && pointsPerSet) {
          const customBestOf = parseInt(bestOf, 10);
          const customPointsPerSet = parseInt(pointsPerSet, 10);

          eventData.bestOf = customBestOf;
          eventData.pointsPerSet = customPointsPerSet;
          eventData.scoringRules = {
            bestOf: customBestOf,
            pointsPerSet: customPointsPerSet,
            minimumLead: 2,
            maxPoints: null
          };
        }
      }

      const event = await eventService.createEvent(tournamentId, eventData);

      res.status(201).json({
        success: true,
        event
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all events for a tournament
   * GET /tournaments/:tournamentId/events
   */
  async listEvents(req, res, next) {
    try {
      const { tournamentId } = req.params;

      if (!tournamentId) {
        return res.status(400).json({
          success: false,
          error: 'Tournament ID is required'
        });
      }

      const events = await eventService.listEventsByTournament(tournamentId);

      res.status(200).json({
        success: true,
        events,
        count: events.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an event
   * PATCH /events/:eventId
   */
  async updateEvent(req, res, next) {
    try {
      const { eventId } = req.params;
      const { name, format, category, gender, maxParticipants, registrationFee, rules, bestOf, pointsPerSet, sportId, goldenPoint } = req.body;

      const updateData = {};

      if (name !== undefined) updateData.name = name.trim();
      if (format !== undefined) updateData.format = format;
      if (category !== undefined) updateData.category = category?.trim() || null;
      if (gender !== undefined) updateData.gender = gender?.trim() || null;
      if (maxParticipants !== undefined) updateData.maxParticipants = maxParticipants ? parseInt(maxParticipants, 10) : null;
      if (registrationFee !== undefined) updateData.registrationFee = registrationFee ? parseFloat(registrationFee) : null;
      if (rules !== undefined) updateData.rules = rules?.trim() || null;
      if (goldenPoint !== undefined) updateData.goldenPoint = Boolean(goldenPoint);

      // Handle sport selection vs custom rules
      if (sportId !== undefined) {
        if (sportId) {
          // Sport selected - use sport rules
          const sportsService = require('../services/sports.service');
          const sport = sportsService.getSportById(sportId);

          if (!sport) {
            return res.status(400).json({
              success: false,
              error: `Invalid sport ID: ${sportId}`
            });
          }

          updateData.sportId = sportId;
          updateData.scoringType = sport.scoringType;
          updateData.scoringRules = sport.rules;
          // Also update legacy fields for backward compatibility
          updateData.bestOf = sport.rules.bestOf;
          updateData.pointsPerSet = sport.rules.pointsPerSet;
        } else {
          // Custom rules - sportId is null/empty, use provided bestOf/pointsPerSet
          updateData.sportId = null;
          updateData.scoringType = 'point-based';

          // Build custom scoring rules from provided values
          if (bestOf !== undefined || pointsPerSet !== undefined) {
            const customBestOf = bestOf ? parseInt(bestOf, 10) : null;
            const customPointsPerSet = pointsPerSet ? parseInt(pointsPerSet, 10) : null;

            updateData.bestOf = customBestOf;
            updateData.pointsPerSet = customPointsPerSet;

            // Create custom scoringRules object
            if (customBestOf && customPointsPerSet) {
              updateData.scoringRules = {
                bestOf: customBestOf,
                pointsPerSet: customPointsPerSet,
                minimumLead: 2,
                maxPoints: null
              };
            } else {
              updateData.scoringRules = null;
            }
          }
        }
      } else {
        // sportId not in request, but bestOf/pointsPerSet might be updated independently
        if (bestOf !== undefined) updateData.bestOf = bestOf ? parseInt(bestOf, 10) : null;
        if (pointsPerSet !== undefined) updateData.pointsPerSet = pointsPerSet ? parseInt(pointsPerSet, 10) : null;

        // If both are provided and no sportId, create custom rules
        if (bestOf && pointsPerSet) {
          updateData.scoringRules = {
            bestOf: parseInt(bestOf, 10),
            pointsPerSet: parseInt(pointsPerSet, 10),
            minimumLead: 2,
            maxPoints: null
          };
        }
      }

      const prisma = require('../lib/prisma');
      const event = await prisma.event.update({
        where: { id: eventId },
        data: updateData
      });

      res.status(200).json({
        success: true,
        event
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete an event
   * DELETE /events/:eventId
   */
  async deleteEvent(req, res, next) {
    try {
      const { eventId } = req.params;

      const prisma = require('../lib/prisma');
      await prisma.event.delete({
        where: { id: eventId }
      });

      res.status(200).json({
        success: true,
        message: 'Event deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EventController();
