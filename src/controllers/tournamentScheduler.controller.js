const tournamentSchedulerService = require('../services/tournamentScheduler.service');

class TournamentSchedulerController {

  /**
   * Generate cross-event tournament schedule
   * POST /tournaments/:id/generate-schedule
   */
  async generateSchedule(req, res, next) {
    try {
      const { tournamentId } = req.params;
      const settings = req.body;

      console.log(`📅 Generating tournament schedule for ${tournamentId}`);

      const result = await tournamentSchedulerService.generateTournamentSchedule(
        tournamentId,
        settings
      );

      res.status(200).json({
        success: true,
        message: result.conflicts.length === 0
          ? 'Schedule generated successfully with no conflicts!'
          : `Schedule generated with ${result.conflicts.length} conflicts`,
        ...result
      });

    } catch (error) {
      console.error('Error generating tournament schedule:', error);
      next(error);
    }
  }

  /**
   * Save generated schedule to database
   * POST /tournaments/:id/save-schedule
   */
  async saveSchedule(req, res, next) {
    try {
      const { tournamentId } = req.params;
      const { schedule } = req.body;

      if (!schedule || !Array.isArray(schedule)) {
        return res.status(400).json({
          success: false,
          error: 'Schedule array is required'
        });
      }

      const result = await tournamentSchedulerService.saveSchedule(tournamentId, schedule);

      res.status(200).json({
        success: true,
        message: `Successfully saved ${result.matchesUpdated} match schedules`,
        ...result
      });

    } catch (error) {
      console.error('Error saving schedule:', error);
      next(error);
    }
  }

  /**
   * Clear tournament schedule
   * DELETE /tournaments/:id/schedule
   */
  async clearSchedule(req, res, next) {
    try {
      const { tournamentId } = req.params;

      const result = await tournamentSchedulerService.clearTournamentSchedule(tournamentId);

      res.status(200).json({
        success: true,
        message: `Cleared ${result.matchesCleared} match schedules`,
        ...result
      });

    } catch (error) {
      console.error('Error clearing schedule:', error);
      next(error);
    }
  }

  /**
   * Get current tournament schedule
   * GET /tournaments/:id/schedule
   */
  async getSchedule(req, res, next) {
    try {
      const { tournamentId } = req.params;
      const { view } = req.query; // 'day', 'week', 'event', 'court', 'player'

      const prisma = require('../lib/prisma');

      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
          events: {
            include: {
              matches: {
                where: {
                  status: { notIn: ['COMPLETED', 'CANCELLED'] }
                },
                include: {
                  participant1: {
                    include: { user: true, partner: true }
                  },
                  participant2: {
                    include: { user: true, partner: true }
                  }
                },
                orderBy: [
                  { scheduledAt: 'asc' },
                  { roundNumber: 'asc' },
                  { matchNumber: 'asc' }
                ]
              }
            }
          }
        }
      });

      if (!tournament) {
        return res.status(404).json({
          success: false,
          error: 'Tournament not found'
        });
      }

      // Collect all scheduled matches
      const allMatches = [];
      for (const event of tournament.events) {
        for (const match of event.matches) {
          allMatches.push({
            matchId: match.id,
            eventId: event.id,
            eventName: event.name,
            eventPriority: event.priority || 'medium',
            matchNumber: match.matchNumber,
            roundNumber: match.roundNumber,
            scheduledAt: match.scheduledAt,
            courtNumber: match.courtNumber,
            duration: match.duration || tournament.matchDuration || 45,
            participant1Id: match.participant1Id,
            participant2Id: match.participant2Id,
            participant1: match.participant1,
            participant2: match.participant2,
            status: match.status
          });
        }
      }

      // Format based on view type
      let formattedSchedule;
      switch (view) {
        case 'day':
          formattedSchedule = this._formatDayView(allMatches);
          break;
        case 'week':
          formattedSchedule = this._formatWeekView(allMatches);
          break;
        case 'event':
          formattedSchedule = this._formatEventView(allMatches, tournament.events);
          break;
        case 'court':
          formattedSchedule = this._formatCourtView(allMatches, tournament.courtsAvailable);
          break;
        case 'player':
          formattedSchedule = this._formatPlayerView(allMatches);
          break;
        default:
          formattedSchedule = allMatches;
      }

      res.status(200).json({
        success: true,
        tournament: {
          id: tournament.id,
          name: tournament.name,
          startDate: tournament.startDate,
          endDate: tournament.endDate,
          courtsAvailable: tournament.courtsAvailable
        },
        schedule: formattedSchedule,
        totalMatches: allMatches.length,
        view: view || 'default'
      });

    } catch (error) {
      console.error('Error fetching schedule:', error);
      next(error);
    }
  }

  // ============================================================================
  // VIEW FORMATTERS
  // ============================================================================

  _formatDayView(matches) {
    const days = {};

    for (const match of matches) {
      const dateKey = new Date(match.date).toISOString().split('T')[0];

      if (!days[dateKey]) {
        days[dateKey] = {
          date: match.date,
          matches: []
        };
      }

      days[dateKey].matches.push(match);
    }

    return Object.values(days);
  }

  _formatWeekView(matches) {
    // Group by week
    const weeks = {};

    for (const match of matches) {
      const date = new Date(match.date);
      const weekStart = this._getWeekStart(date);
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeks[weekKey]) {
        weeks[weekKey] = {
          weekStart,
          weekEnd: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000),
          matches: []
        };
      }

      weeks[weekKey].matches.push(match);
    }

    return Object.values(weeks);
  }

  _formatEventView(matches, events) {
    const eventSchedules = {};

    for (const event of events) {
      eventSchedules[event.id] = {
        eventId: event.id,
        eventName: event.name,
        priority: event.priority,
        matches: matches.filter(m => m.eventId === event.id)
      };
    }

    return Object.values(eventSchedules);
  }

  _formatCourtView(matches, courtsAvailable) {
    const courts = {};

    for (let i = 1; i <= courtsAvailable; i++) {
      courts[i] = {
        courtNumber: i,
        courtName: `Court ${i}`,
        matches: matches.filter(m => m.courtNumber === i)
      };
    }

    return Object.values(courts);
  }

  _formatPlayerView(matches) {
    const players = {};

    for (const match of matches) {
      // Add participant1
      if (match.participant1) {
        const userId = match.participant1.userId;
        if (!players[userId]) {
          players[userId] = {
            userId,
            name: `${match.participant1.user.firstName} ${match.participant1.user.lastName}`,
            matches: []
          };
        }
        players[userId].matches.push(match);

        // Add partner if exists
        if (match.participant1.partner) {
          const partnerId = match.participant1.partnerId;
          if (!players[partnerId]) {
            players[partnerId] = {
              userId: partnerId,
              name: `${match.participant1.partner.firstName} ${match.participant1.partner.lastName}`,
              matches: []
            };
          }
          players[partnerId].matches.push(match);
        }
      }

      // Add participant2
      if (match.participant2) {
        const userId = match.participant2.userId;
        if (!players[userId]) {
          players[userId] = {
            userId,
            name: `${match.participant2.user.firstName} ${match.participant2.user.lastName}`,
            matches: []
          };
        }
        players[userId].matches.push(match);

        // Add partner if exists
        if (match.participant2.partner) {
          const partnerId = match.participant2.partnerId;
          if (!players[partnerId]) {
            players[partnerId] = {
              userId: partnerId,
              name: `${match.participant2.partner.firstName} ${match.participant2.partner.lastName}`,
              matches: []
            };
          }
          players[partnerId].matches.push(match);
        }
      }
    }

    return Object.values(players);
  }

  _getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    return new Date(d.setDate(diff));
  }
}

module.exports = new TournamentSchedulerController();
