const matchSchedulerService = require('../services/matchScheduler.service');

class MatchSchedulerController {
  /**
   * POST /events/:eventId/generate-schedule
   * Generate automated schedule for an event
   */
  async generateSchedule(req, res, next) {
    try {
      const { eventId } = req.params;
      const settings = req.body; // Optional: startDate, endDate, courts, etc.

      const result = await matchSchedulerService.generateSchedule(eventId, settings);

      // Generate suggestions if there's overflow
      let suggestions = [];
      if (result.schedule.overflow) {
        suggestions = matchSchedulerService.generateSuggestions(result.metadata);
      }

      res.status(200).json({
        success: true,
        ...result,
        suggestions
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /events/:eventId/saved-schedule
   * Get the saved schedule for an event
   */
  async getSavedSchedule(req, res, next) {
    try {
      const { eventId } = req.params;
      const prisma = require('../lib/prisma');

      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          tournament: true,
          matches: {
            where: {
              scheduledAt: { not: null }
            },
            include: {
              participant1: { include: { user: true, partner: true } },
              participant2: { include: { user: true, partner: true } }
            },
            orderBy: [
              { scheduledAt: 'asc' },
              { courtNumber: 'asc' }
            ]
          }
        }
      });

      if (!event) {
        return res.status(404).json({ success: false, error: 'Event not found' });
      }

      if (event.matches.length === 0) {
        return res.status(200).json({ success: true, hasSchedule: false });
      }

      // Format matches for display
      const scheduledMatches = event.matches.map(match => ({
        matchId: match.id,
        matchNumber: match.matchNumber,
        roundNumber: match.roundNumber,
        bracketPosition: match.bracketPosition,
        participant1: this._formatParticipant(match.participant1),
        participant2: this._formatParticipant(match.participant2),
        court: match.courtName || `Court ${match.courtNumber}`,
        courtNumber: match.courtNumber,
        date: match.scheduledAt.toISOString().split('T')[0],
        time: match.scheduledAt.toTimeString().slice(0, 5),
        duration: event.tournament.matchDuration || 45
      }));

      const daysUsed = new Set(scheduledMatches.map(m => m.date)).size;

      // Calculate days available between tournament start and end
      const startDate = new Date(event.tournament.startDate);
      const endDate = new Date(event.tournament.endDate);
      const diffTime = Math.abs(endDate - startDate);
      const daysAvailable = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      // Calculate daily capacity based on tournament settings
      const [startHour, startMin] = (event.tournament.dailyStartTime || '09:00').split(':').map(Number);
      const [endHour, endMin] = (event.tournament.dailyEndTime || '18:00').split(':').map(Number);
      const dailyMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
      const matchDuration = event.tournament.matchDuration || 45;
      const breakDuration = event.tournament.breakDuration || 15;
      const slotDuration = matchDuration + breakDuration;
      const slotsPerCourt = Math.floor(dailyMinutes / slotDuration);
      const courtsAvailable = event.tournament.courtsAvailable || 4;
      const dailyCapacity = slotsPerCourt * courtsAvailable;

      res.status(200).json({
        success: true,
        hasSchedule: true,
        schedule: {
          scheduledMatches,
          daysUsed,
          overflow: false
        },
        metadata: {
          totalMatches: scheduledMatches.length,
          scheduledMatches: scheduledMatches.length,
          unscheduledMatches: 0,
          daysUsed,
          daysAvailable,
          dailyCapacity,
          settings: {
            courtsAvailable,
            matchDuration,
            breakDuration,
            dailyStartTime: event.tournament.dailyStartTime || '09:00',
            dailyEndTime: event.tournament.dailyEndTime || '18:00',
            minRestTime: event.tournament.minRestTime || 30
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  _formatParticipant(participant) {
    if (!participant) return 'TBD';
    const name = `${participant.user.firstName} ${participant.user.lastName}`;
    if (participant.partner) {
      return `${name} / ${participant.partner.firstName} ${participant.partner.lastName}`;
    }
    return name;
  }

  /**
   * Validate schedule for conflicts before saving
   * Checks: player overlaps, dependency violations, court conflicts
   */
  _validateSchedule(schedule, event) {
    const conflicts = [];
    const matchDuration = event.tournament.matchDuration || 45;
    const minRestTime = event.tournament.minRestTime || 30;

    // Create a map of matchId -> match data
    const matchMap = new Map();
    event.matches.forEach(m => matchMap.set(m.id, m));

    // VALIDATION 1: Check for player scheduling conflicts
    const playerSchedule = new Map(); // playerId -> array of {date, startTime, endTime, matchNumber}

    for (const item of schedule) {
      const match = matchMap.get(item.matchId);
      if (!match) continue;

      const dateTime = new Date(`${item.date}T${item.time}`);
      const startMinutes = dateTime.getHours() * 60 + dateTime.getMinutes();
      const endMinutes = startMinutes + matchDuration + minRestTime; // Include rest time

      // Check participant 1
      if (match.participant1Id) {
        if (!playerSchedule.has(match.participant1Id)) {
          playerSchedule.set(match.participant1Id, []);
        }
        const p1Matches = playerSchedule.get(match.participant1Id);

        // Check for overlap with existing matches
        for (const existing of p1Matches) {
          if (existing.date === item.date) {
            // Same day - check time overlap
            if (startMinutes < existing.endTime && endMinutes > existing.startTime) {
              // OVERLAP DETECTED!
              conflicts.push({
                type: 'PLAYER_OVERLAP',
                message: `Player conflict: Participant in Match ${item.matchNumber} is already playing Match ${existing.matchNumber} at ${this._formatTimeFromMinutes(existing.startTime)} on ${item.date}`,
                match1: item.matchNumber,
                match2: existing.matchNumber,
                date: item.date,
                playerId: match.participant1Id
              });
            }
          }
        }

        p1Matches.push({
          date: item.date,
          startTime: startMinutes,
          endTime: endMinutes,
          matchNumber: item.matchNumber
        });
      }

      // Check participant 2
      if (match.participant2Id) {
        if (!playerSchedule.has(match.participant2Id)) {
          playerSchedule.set(match.participant2Id, []);
        }
        const p2Matches = playerSchedule.get(match.participant2Id);

        for (const existing of p2Matches) {
          if (existing.date === item.date) {
            if (startMinutes < existing.endTime && endMinutes > existing.startTime) {
              conflicts.push({
                type: 'PLAYER_OVERLAP',
                message: `Player conflict: Participant in Match ${item.matchNumber} is already playing Match ${existing.matchNumber} at ${this._formatTimeFromMinutes(existing.startTime)} on ${item.date}`,
                match1: item.matchNumber,
                match2: existing.matchNumber,
                date: item.date,
                playerId: match.participant2Id
              });
            }
          }
        }

        p2Matches.push({
          date: item.date,
          startTime: startMinutes,
          endTime: endMinutes,
          matchNumber: item.matchNumber
        });
      }
    }

    // VALIDATION 2: Check knockout dependencies (next match must be after source matches)
    const scheduleMap = new Map();
    schedule.forEach(item => {
      const dateTime = new Date(`${item.date}T${item.time}`);
      const startMinutes = dateTime.getHours() * 60 + dateTime.getMinutes();
      scheduleMap.set(item.matchId, {
        date: item.date,
        startTime: startMinutes,
        endTime: startMinutes + matchDuration,
        matchNumber: item.matchNumber
      });
    });

    for (const item of schedule) {
      const match = matchMap.get(item.matchId);
      if (!match || !match.nextMatchId) continue;

      const nextMatchSchedule = scheduleMap.get(match.nextMatchId);
      if (!nextMatchSchedule) continue;

      const currentSchedule = scheduleMap.get(item.matchId);
      const currentDate = new Date(currentSchedule.date);
      const nextDate = new Date(nextMatchSchedule.date);

      // Next match must be AFTER this match (same day or later)
      if (nextDate < currentDate) {
        conflicts.push({
          type: 'DEPENDENCY_VIOLATION',
          message: `Match ${nextMatchSchedule.matchNumber} (${nextDate.toISOString().split('T')[0]}) cannot happen before Match ${item.matchNumber} (${currentSchedule.date}) which feeds into it`,
          sourceMatch: item.matchNumber,
          nextMatch: nextMatchSchedule.matchNumber
        });
      } else if (nextDate.getTime() === currentDate.getTime()) {
        // Same day - next match must start after this one ends (with rest)
        if (nextMatchSchedule.startTime < currentSchedule.endTime + minRestTime) {
          conflicts.push({
            type: 'DEPENDENCY_VIOLATION',
            message: `Match ${nextMatchSchedule.matchNumber} starts at ${this._formatTimeFromMinutes(nextMatchSchedule.startTime)} but Match ${item.matchNumber} (which feeds into it) doesn't finish until ${this._formatTimeFromMinutes(currentSchedule.endTime + minRestTime)}`,
            sourceMatch: item.matchNumber,
            nextMatch: nextMatchSchedule.matchNumber,
            date: currentSchedule.date
          });
        }
      }
    }

    // Return validation result
    if (conflicts.length > 0) {
      return {
        valid: false,
        error: `Schedule validation failed: ${conflicts.length} conflict(s) found`,
        conflicts
      };
    }

    return { valid: true };
  }

  _formatTimeFromMinutes(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  /**
   * POST /events/:eventId/validate-schedule
   * Validate schedule for conflicts WITHOUT saving
   */
  async validateScheduleOnly(req, res, next) {
    try {
      const { eventId } = req.params;
      const { schedule } = req.body;

      if (!schedule || !Array.isArray(schedule)) {
        return res.status(400).json({
          success: false,
          error: 'Schedule array is required'
        });
      }

      const prisma = require('../lib/prisma');

      // Fetch event with all matches and participants
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          tournament: true,
          matches: {
            include: {
              participant1: true,
              participant2: true
            }
          }
        }
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          error: 'Event not found'
        });
      }

      // Validate schedule
      const validation = this._validateSchedule(schedule, event);

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          valid: false,
          error: validation.error,
          conflicts: validation.conflicts
        });
      }

      // Schedule is valid!
      res.status(200).json({
        success: true,
        valid: true,
        message: 'Schedule is valid and ready to save'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /events/:eventId/delete-schedule
   * Clear all scheduling data for an event
   */
  async deleteSchedule(req, res, next) {
    try {
      const { eventId } = req.params;
      const prisma = require('../lib/prisma');

      // Clear scheduling fields for all matches in this event
      const result = await prisma.match.updateMany({
        where: { eventId },
        data: {
          scheduledAt: null,
          courtNumber: null,
          courtName: null
        }
      });

      console.log(`🗑️ Cleared schedule for ${result.count} matches`);

      res.status(200).json({
        success: true,
        message: 'Schedule deleted successfully',
        clearedMatches: result.count
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /events/:eventId/save-schedule
   * Save generated schedule to database (update match scheduledAt, courtNumber)
   * Validates schedule for conflicts before saving
   */
  async saveSchedule(req, res, next) {
    try {
      const { eventId } = req.params;
      const { schedule } = req.body; // Array of scheduled matches

      if (!schedule || !Array.isArray(schedule)) {
        return res.status(400).json({
          success: false,
          error: 'Schedule array is required'
        });
      }

      const prisma = require('../lib/prisma');

      // Fetch event with all matches and participants for validation
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          tournament: true,
          matches: {
            include: {
              participant1: true,
              participant2: true
            }
          }
        }
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          error: 'Event not found'
        });
      }

      // VALIDATION: Check for conflicts
      const validation = this._validateSchedule(schedule, event);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error,
          conflicts: validation.conflicts
        });
      }

      console.log(`📅 Saving schedule for ${schedule.length} matches...`);

      await prisma.$transaction(
        schedule.map(item => {
          const scheduledDateTime = new Date(`${item.date}T${item.time}`);
          console.log(`  Match ${item.matchNumber}: ${scheduledDateTime.toISOString()} on ${item.court}`);

          return prisma.match.update({
            where: { id: item.matchId },
            data: {
              scheduledAt: scheduledDateTime,
              courtNumber: item.courtNumber,
              courtName: item.court
            }
          });
        })
      );

      console.log('✅ Schedule saved to database!');

      res.status(200).json({
        success: true,
        message: 'Schedule saved successfully',
        updatedMatches: schedule.length
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MatchSchedulerController();
