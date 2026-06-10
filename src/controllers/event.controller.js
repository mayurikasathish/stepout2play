const eventService = require('../services/event.service');

class EventController {
  /**
   * Create a new event for a tournament
   * POST /tournaments/:tournamentId/events
   */
  async createEvent(req, res, next) {
    try {
      const { tournamentId } = req.params;
      const { name, format, category, gender, maxParticipants, registrationFee } = req.body;

      // Validation
      const errors = [];

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        errors.push('Event name is required');
      }

      const validFormats = ['SINGLES', 'DOUBLES', 'MIXED_DOUBLES'];
      if (!format || !validFormats.includes(format)) {
        errors.push(`Format must be one of: ${validFormats.join(', ')}`);
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

      const event = await eventService.createEvent(tournamentId, {
        name: name.trim(),
        format,
        category: category?.trim() || null,
        gender: gender?.trim() || null,
        maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : null,
        registrationFee: registrationFee ? parseFloat(registrationFee) : null
      });

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
}

module.exports = new EventController();
