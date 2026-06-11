const tournamentService = require('../services/tournament.service');

class TournamentController {
  /**
   * Create a new tournament
   * POST /orgs/:orgId/tournaments
   */
  async createTournament(req, res, next) {
    try {
      const { orgId } = req.params;
      const {
        name,
        sport,
        startDate,
        endDate,
        venueName,
        venueAddress,
        city,
        registrationDeadline,
        entryFee,
        description,
        maxParticipants,
        status
      } = req.body;

      // Validation
      const errors = [];

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        errors.push('Tournament name is required');
      }

      const validSports = ['badminton', 'tennis', 'table-tennis', 'squash', 'pickleball', 'padel'];
      if (!sport || !validSports.includes(sport)) {
        errors.push(`Sport must be one of: ${validSports.join(', ')}`);
      }

      const validFormats = ['ROUND_ROBIN', 'KNOCKOUT'];
      const format = req.body.format || 'ROUND_ROBIN';
      if (!validFormats.includes(format)) {
        errors.push(`Format must be one of: ${validFormats.join(', ')}`);
      }

      if (!startDate) {
        errors.push('Start date is required');
      }

      if (!endDate) {
        errors.push('End date is required');
      }

      if (!venueName || typeof venueName !== 'string' || venueName.trim().length === 0) {
        errors.push('Venue name is required');
      }

      if (!city || typeof city !== 'string' || city.trim().length === 0) {
        errors.push('City is required');
      }

      if (!registrationDeadline) {
        errors.push('Registration deadline is required');
      }

      if (entryFee !== undefined && entryFee !== null) {
        const fee = parseFloat(entryFee);
        if (isNaN(fee) || fee < 0) {
          errors.push('Entry fee must be a positive number');
        }
      }

      if (maxParticipants !== undefined && maxParticipants !== null) {
        const max = parseInt(maxParticipants, 10);
        if (isNaN(max) || max < 1) {
          errors.push('Max participants must be a positive integer');
        }
      }

      const validStatuses = ['DRAFT', 'OPEN', 'CLOSED', 'ONGOING', 'COMPLETED'];
      if (status && !validStatuses.includes(status)) {
        errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
      }

      if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
      }

      const tournament = await tournamentService.createTournament(orgId, {
        name: name.trim(),
        sport,
        format,
        startDate,
        endDate,
        venueName: venueName.trim(),
        venueAddress: venueAddress?.trim(),
        city: city.trim(),
        registrationDeadline,
        entryFee: entryFee ? parseFloat(entryFee) : null,
        description: description?.trim(),
        maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : null,
        status: status || 'DRAFT'
      });

      res.status(201).json({
        success: true,
        tournament
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List tournaments with filters
   * GET /tournaments
   */
  async listTournaments(req, res, next) {
    try {
      const { sport, city, status } = req.query;

      // Validate filters
      const validSports = ['badminton', 'tennis', 'table-tennis', 'squash', 'pickleball', 'padel'];
      if (sport && !validSports.includes(sport)) {
        return res.status(400).json({
          success: false,
          error: `Invalid sport. Must be one of: ${validSports.join(', ')}`
        });
      }

      const validStatuses = ['DRAFT', 'OPEN', 'CLOSED', 'ONGOING', 'COMPLETED'];
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }

      const filters = {};
      if (sport) filters.sport = sport;
      if (city) filters.city = city;
      if (status) filters.status = status;

      const tournaments = await tournamentService.listTournaments(filters);

      res.status(200).json({
        success: true,
        tournaments,
        count: tournaments.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get tournament by ID
   * GET /tournaments/:id
   */
  async getTournamentById(req, res, next) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Tournament ID is required'
        });
      }

      const tournament = await tournamentService.getTournamentById(id);

      res.status(200).json({
        success: true,
        tournament
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update tournament
   * PATCH /tournaments/:id
   */
  async updateTournament(req, res, next) {
    try {
      const { id } = req.params;
      const {
        name,
        sport,
        format,
        startDate,
        endDate,
        venueName,
        venueAddress,
        city,
        registrationDeadline,
        entryFee,
        description,
        maxParticipants,
        status
      } = req.body;

      const updateData = {};

      if (name !== undefined) updateData.name = name.trim();
      if (sport !== undefined) updateData.sport = sport;
      if (format !== undefined) updateData.format = format;
      if (startDate !== undefined) updateData.startDate = new Date(startDate);
      if (endDate !== undefined) updateData.endDate = new Date(endDate);
      if (venueName !== undefined) updateData.venueName = venueName.trim();
      if (venueAddress !== undefined) updateData.venueAddress = venueAddress?.trim() || null;
      if (city !== undefined) updateData.city = city.trim();
      if (registrationDeadline !== undefined) updateData.registrationDeadline = new Date(registrationDeadline);
      if (entryFee !== undefined) updateData.entryFee = entryFee ? parseFloat(entryFee) : null;
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (maxParticipants !== undefined) updateData.maxParticipants = maxParticipants ? parseInt(maxParticipants, 10) : null;
      if (status !== undefined) updateData.status = status;

      const prisma = require('../lib/prisma');
      const tournament = await prisma.tournament.update({
        where: { id },
        data: updateData,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true
            }
          }
        }
      });

      res.status(200).json({
        success: true,
        tournament
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete tournament
   * DELETE /tournaments/:id
   */
  async deleteTournament(req, res, next) {
    try {
      const { id } = req.params;

      // Delete tournament (cascades to events and registrations)
      const prisma = require('../lib/prisma');
      await prisma.tournament.delete({
        where: { id }
      });

      res.status(200).json({
        success: true,
        message: 'Tournament deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TournamentController();
