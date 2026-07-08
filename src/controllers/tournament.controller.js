const tournamentService = require('../services/tournament.service');
const { LiveFeedHelpers } = require('../utils/notificationHelpers');

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
        sportType,
        sports,
        startDate,
        endDate,
        startTime,
        endTime,
        venueName,
        venueAddress,
        city,
        registrationDeadline,
        entryFee,
        description,
        maxParticipants,
        status,
        allowReplacement,
        replacementWindowHours
      } = req.body;

      // Validation
      const errors = [];

      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        errors.push('Tournament name is required');
      }

      // Validate sport type and sports array
      const validSportTypes = ['single', 'multi'];
      const validSports = ['badminton', 'tennis', 'table-tennis', 'squash', 'pickleball', 'padel'];

      if (!sportType || !validSportTypes.includes(sportType)) {
        errors.push('Sport type must be either "single" or "multi"');
      }

      if (!sports || !Array.isArray(sports) || sports.length === 0) {
        errors.push('At least one sport must be selected');
      } else {
        // Validate each sport in the array
        const invalidSports = sports.filter(s => !validSports.includes(s));
        if (invalidSports.length > 0) {
          errors.push(`Invalid sports: ${invalidSports.join(', ')}`);
        }

        // Single sport tournaments must have exactly one sport
        if (sportType === 'single' && sports.length > 1) {
          errors.push('Single sport tournaments can only have one sport');
        }
      }

      // Legacy sport field - use first sport from array for backward compatibility
      const legacySport = sports && sports.length > 0 ? sports[0] : 'badminton';

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

      // Validate registration deadline is before tournament start
      if (registrationDeadline && startDate) {
        const regDeadline = new Date(registrationDeadline);
        const tournamentStart = new Date(startDate);

        // If startTime is provided, add it to the comparison
        if (startTime) {
          const [hours, minutes] = startTime.split(':');
          tournamentStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        }

        if (regDeadline >= tournamentStart) {
          errors.push('Registration deadline must be before the tournament start date and time');
        }
      }

      // Validate end date/time is after start date/time
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (startTime) {
          const [hours, minutes] = startTime.split(':');
          start.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        }

        if (endTime) {
          const [hours, minutes] = endTime.split(':');
          end.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        }

        if (end <= start) {
          errors.push('Tournament end date and time must be after the start date and time');
        }
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

      const validStatuses = ['DRAFT', 'OPEN'];
      if (status && !validStatuses.includes(status)) {
        errors.push(`Status must be one of: ${validStatuses.join(', ')} (other statuses are calculated automatically)`);
      }

      // Validate replacement window hours
      if (allowReplacement && replacementWindowHours !== undefined) {
        const hours = parseInt(replacementWindowHours, 10);
        if (isNaN(hours) || hours < 0 || hours > 168) {
          errors.push('Replacement window must be between 0 and 168 hours (7 days)');
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
      }

      const tournament = await tournamentService.createTournament(orgId, {
        name: name.trim(),
        sport: legacySport,
        sportType,
        sports,
        format,
        startDate,
        endDate,
        startTime,
        endTime,
        venueName: venueName.trim(),
        venueAddress: venueAddress?.trim(),
        city: city.trim(),
        registrationDeadline,
        description: description?.trim(),
        rules: req.body.rules?.trim(),
        status: status || 'DRAFT',
        replacementWindowHours: allowReplacement && replacementWindowHours ? parseInt(replacementWindowHours, 10) : null
      });

      // Create live feed item when tournament is created
      try {
        await LiveFeedHelpers.tournamentCreated({
          actorId: req.user.id,
          tournamentName: tournament.name,
          city: tournament.city,
          tournamentId: tournament.id
        });
      } catch (feedError) {
        console.error('Error creating live feed item:', feedError);
        // Don't fail the tournament creation if feed fails
      }

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
        sportType,
        sports,
        format,
        startDate,
        endDate,
        startTime,
        endTime,
        venueName,
        venueAddress,
        city,
        registrationDeadline,
        description,
        rules,
        status,
        allowReplacement,
        replacementWindowHours
      } = req.body;

      const updateData = {};

      if (name !== undefined) updateData.name = name.trim();
      if (sport !== undefined) updateData.sport = sport;

      // Handle sport type and sports array
      if (sportType !== undefined) {
        updateData.sportType = sportType;
      }
      if (sports !== undefined) {
        updateData.sports = sports;
      }

      if (format !== undefined) updateData.format = format;
      if (startDate !== undefined) updateData.startDate = new Date(startDate);
      if (endDate !== undefined) updateData.endDate = new Date(endDate);
      if (startTime !== undefined) updateData.startTime = startTime || null;
      if (endTime !== undefined) updateData.endTime = endTime || null;
      if (venueName !== undefined) updateData.venueName = venueName.trim();
      if (venueAddress !== undefined) updateData.venueAddress = venueAddress?.trim() || null;
      if (city !== undefined) updateData.city = city.trim();
      if (registrationDeadline !== undefined) updateData.registrationDeadline = new Date(registrationDeadline);
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (rules !== undefined) updateData.rules = rules?.trim() || null;

      // Handle replacement window
      if (allowReplacement !== undefined) {
        if (allowReplacement && replacementWindowHours !== undefined) {
          const hours = parseInt(replacementWindowHours, 10);
          if (!isNaN(hours) && hours >= 0 && hours <= 168) {
            updateData.replacementWindowHours = hours;
          }
        } else if (!allowReplacement) {
          updateData.replacementWindowHours = null;
        }
      }

      // Only allow DRAFT or OPEN status
      if (status !== undefined) {
        const validStatuses = ['DRAFT', 'OPEN'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            error: `Status must be one of: ${validStatuses.join(', ')} (other statuses are calculated automatically)`
          });
        }
        updateData.status = status;
      }

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

      // Apply computed status
      const tournamentService = require('../services/tournament.service');
      const tournamentWithComputedStatus = {
        ...tournament,
        status: tournamentService.calculateStatus(tournament)
      };

      res.status(200).json({
        success: true,
        tournament: tournamentWithComputedStatus
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

  /**
   * Get all registrations for a tournament
   * GET /tournaments/:id/registrations
   */
  async getTournamentRegistrations(req, res, next) {
    try {
      const { id } = req.params;

      const registrations = await tournamentService.getTournamentRegistrations(id);

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
   * Get all live matches for a tournament
   * GET /tournaments/:tournamentId/live-matches
   */
  async getLiveMatches(req, res, next) {
    try {
      const { tournamentId } = req.params;
      const prisma = require('../lib/prisma');

      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        select: { name: true, id: true }
      });

      if (!tournament) {
        return res.status(404).json({
          success: false,
          error: 'Tournament not found'
        });
      }

      const liveMatches = await prisma.match.findMany({
        where: {
          event: {
            tournamentId: tournamentId
          },
          status: 'IN_PROGRESS'
        },
        include: {
          participant1: {
            include: {
              user: { select: { firstName: true, lastName: true } },
              partner: { select: { firstName: true, lastName: true } }
            }
          },
          participant2: {
            include: {
              user: { select: { firstName: true, lastName: true } },
              partner: { select: { firstName: true, lastName: true } }
            }
          },
          event: {
            include: {
              tournament: { select: { name: true, id: true } }
            }
          }
        },
        orderBy: [
          { scheduledAt: 'asc' },
          { matchNumber: 'asc' }
        ]
      });

      // Add sport data (sportId is just a string like "badminton", "table-tennis")
      const matchesWithSport = liveMatches.map(match => {
        if (match.event?.sportId) {
          return {
            ...match,
            event: {
              ...match.event,
              sport: {
                id: match.event.sportId,
                name: match.event.sportId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
              }
            }
          };
        }
        return match;
      });

      res.status(200).json({
        success: true,
        tournament,
        matches: matchesWithSport,
        count: matchesWithSport.length
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TournamentController();
