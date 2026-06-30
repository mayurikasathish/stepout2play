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
        duration: event.tournament.matchDuration || 45,
        status: match.status, // COMPLETED, READY, PENDING, BYE
        isLocked: match.status === 'COMPLETED' || match.status === 'BYE' // Can't reschedule completed/bye matches
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
              const matchName = this._formatMatchName(match);
              conflicts.push({
                type: 'PLAYER_OVERLAP',
                message: `Player conflict: Participant in ${matchName} is already scheduled for another match at ${this._formatTimeFromMinutes(existing.startTime)} on ${item.date}`,
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
              const matchName = this._formatMatchName(match);
              conflicts.push({
                type: 'PLAYER_OVERLAP',
                message: `Player conflict: Participant in ${matchName} is already scheduled for another match at ${this._formatTimeFromMinutes(existing.startTime)} on ${item.date}`,
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
      const currentMatchName = this._formatMatchName(match);
      const nextMatch = matchMap.get(match.nextMatchId);
      const nextMatchName = this._formatMatchName(nextMatch);

      if (nextDate < currentDate) {
        conflicts.push({
          type: 'DEPENDENCY_VIOLATION',
          message: `${nextMatchName} (${nextDate.toISOString().split('T')[0]}) cannot happen before ${currentMatchName} (${currentSchedule.date}) which feeds into it`,
          sourceMatchId: item.matchId,  // Store matchId for unique lookup
          nextMatchId: match.nextMatchId,  // Store matchId for unique lookup
          sourceMatch: item.matchNumber,  // Keep for display
          nextMatch: nextMatchSchedule.matchNumber  // Keep for display
        });
      } else if (nextDate.getTime() === currentDate.getTime()) {
        // Same day - next match must start after this one ends (with rest)
        if (nextMatchSchedule.startTime < currentSchedule.endTime + minRestTime) {
          conflicts.push({
            type: 'DEPENDENCY_VIOLATION',
            message: `${nextMatchName} starts at ${this._formatTimeFromMinutes(nextMatchSchedule.startTime)} but ${currentMatchName} (which feeds into it) doesn't finish until ${this._formatTimeFromMinutes(currentSchedule.endTime + minRestTime)}`,
            sourceMatchId: item.matchId,  // Store matchId for unique lookup
            nextMatchId: match.nextMatchId,  // Store matchId for unique lookup
            sourceMatch: item.matchNumber,  // Keep for display
            nextMatch: nextMatchSchedule.matchNumber,  // Keep for display
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
   * Helper: Format match name with round label (e.g., "M1 R6", "M3 R2")
   * Simple and consistent - just use R{roundNumber}
   */
  _formatMatchName(match) {
    if (!match) return 'Unknown Match';

    const matchNum = match.matchNumber || '?';
    const roundNum = match.roundNumber;

    return roundNum ? `M${matchNum} R${roundNum}` : `M${matchNum}`;
  }

  /**
   * POST /events/:eventId/validate-schedule
   * Validate schedule for conflicts WITHOUT saving
   * NOW WITH SMART SUGGESTIONS!
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
        // 🧠 SMART MODE: Generate suggestions to fix conflicts
        console.log('🔍 CONFLICTS:', JSON.stringify(validation.conflicts, null, 2));
        const suggestions = this._generateSmartSuggestions(schedule, validation.conflicts, event);
        console.log('🔍 GENERATED SUGGESTIONS:', JSON.stringify(suggestions, null, 2));

        return res.status(400).json({
          success: false,
          valid: false,
          error: validation.error,
          conflicts: validation.conflicts,
          suggestions // NEW: AI-like suggestions to fix issues
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
   * 🧠 SMART SUGGESTIONS ENGINE
   * Analyzes conflicts and suggests alternative times/courts
   */
  _generateSmartSuggestions(schedule, conflicts, event) {
    const suggestions = [];
    const matchDuration = event.tournament.matchDuration || 45;
    const minRestTime = event.tournament.minRestTime || 30;
    const breakDuration = event.tournament.breakDuration || 15;
    const seenSuggestions = new Set(); // Prevent duplicate suggestions

    console.log('🧠 Processing conflicts:', conflicts.length);
    conflicts.forEach((conflict, idx) => {
      console.log(`🧠 Conflict ${idx}:`, conflict.type, conflict);
      if (conflict.type === 'PLAYER_OVERLAP') {
        // Player has two matches at same time - suggest moving one match
        const match = schedule.find(m => m.matchNumber === conflict.match1);
        if (match) {
          const currentDateTime = new Date(`${match.date}T${match.time}`);
          const currentMinutes = currentDateTime.getHours() * 60 + currentDateTime.getMinutes();
          const matchObj = this._findMatchInEvent(match.matchId, event);
          const matchName = this._formatMatchName(matchObj);

          // Suggestion 1: Move 1 hour later
          const laterTime = this._formatTimeFromMinutes(currentMinutes + 60);
          const suggestionKey1 = `reschedule-${match.matchNumber}-${laterTime}`;

          if (!seenSuggestions.has(suggestionKey1)) {
            seenSuggestions.add(suggestionKey1);
            suggestions.push({
              type: 'RESCHEDULE',
              matchId: match.matchId,  // Add matchId for unique lookup
              matchNumber: match.matchNumber,
              currentTime: match.time,
              suggestedTime: laterTime,
              suggestedDate: match.date,
              reason: `Move ${matchName} from ${match.time} to ${laterTime} to avoid player conflict`,
              action: 'reschedule',
              confidence: 'high'
            });
          }

          // Suggestion 2: Move to next day
          const nextDay = new Date(match.date);
          nextDay.setDate(nextDay.getDate() + 1);
          const suggestionKey2 = `reschedule-${match.matchNumber}-${nextDay.toISOString().split('T')[0]}`;

          if (!seenSuggestions.has(suggestionKey2)) {
            seenSuggestions.add(suggestionKey2);
            suggestions.push({
              type: 'RESCHEDULE',
              matchId: match.matchId,  // Add matchId for unique lookup
              matchNumber: match.matchNumber,
              currentTime: match.time,
              suggestedTime: match.time,
              suggestedDate: nextDay.toISOString().split('T')[0],
              reason: `Move ${matchName} to ${nextDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to spread player load`,
              action: 'reschedule',
              confidence: 'medium'
            });
          }
        }
      }

      if (conflict.type === 'DEPENDENCY_VIOLATION') {
        // Next match scheduled before source match - suggest swapping times
        // Use matchId for unique lookup (matchNumber can be same across rounds!)
        const sourceMatch = schedule.find(m => m.matchId === conflict.sourceMatchId);
        const nextMatch = schedule.find(m => m.matchId === conflict.nextMatchId);

        console.log('🧠 Found sourceMatch:', sourceMatch?.matchId, 'nextMatch:', nextMatch?.matchId);

        // CRITICAL FIX: Compare by matchId, not matchNumber (same matchNumber can exist in different rounds!)
        if (sourceMatch && nextMatch &&
            sourceMatch.matchId !== nextMatch.matchId &&
            sourceMatch.time !== nextMatch.time) {

          const sourceMatchObj = this._findMatchInEvent(sourceMatch.matchId, event);
          const nextMatchObj = this._findMatchInEvent(nextMatch.matchId, event);
          const sourceMatchName = this._formatMatchName(sourceMatchObj);
          const nextMatchName = this._formatMatchName(nextMatchObj);

          const suggestionKey = `swap-${sourceMatch.matchId}-${nextMatch.matchId}`;

          if (!seenSuggestions.has(suggestionKey)) {
            seenSuggestions.add(suggestionKey);
            suggestions.push({
              type: 'SWAP_TIMES',
              match1Id: sourceMatch.matchId,  // Add matchId for unique lookup
              match1Number: sourceMatch.matchNumber,
              match1Time: sourceMatch.time,
              match2Id: nextMatch.matchId,  // Add matchId for unique lookup
              match2Number: nextMatch.matchNumber,
              match2Time: nextMatch.time,
              reason: `Swap ${sourceMatchName} (${sourceMatch.time}) with ${nextMatchName} (${nextMatch.time}) - source must finish first`,
              action: 'swap',
              confidence: 'high'
            });
            console.log('🧠 Added SWAP suggestion');
          }
        } else {
          console.log('🧠 Skipped swap - same match or same time');
        }

        // Alternative: Push next match later (only if not same matchId)
        if (nextMatch && sourceMatch && sourceMatch.matchId !== nextMatch.matchId) {
          const nextDateTime = new Date(`${nextMatch.date}T${nextMatch.time}`);
          const nextMinutes = nextDateTime.getHours() * 60 + nextDateTime.getMinutes();
          const safeTime = this._formatTimeFromMinutes(nextMinutes + 90); // Push 90 min later
          const nextMatchObj = this._findMatchInEvent(nextMatch.matchId, event);
          const nextMatchName = this._formatMatchName(nextMatchObj);

          const suggestionKey = `reschedule-dep-${nextMatch.matchId}-${safeTime}`;

          if (!seenSuggestions.has(suggestionKey)) {
            seenSuggestions.add(suggestionKey);
            suggestions.push({
              type: 'RESCHEDULE',
              matchId: nextMatch.matchId,  // Add matchId for unique lookup
              matchNumber: nextMatch.matchNumber,
              currentTime: nextMatch.time,
              suggestedTime: safeTime,
              suggestedDate: nextMatch.date,
              reason: `Move ${nextMatchName} from ${nextMatch.time} to ${safeTime} to allow source match to complete first`,
              action: 'reschedule',
              confidence: 'high'
            });
            console.log('🧠 Added RESCHEDULE suggestion');
          }
        } else {
          console.log('🧠 Skipped reschedule - same match');
        }
      }
    });

    console.log(`🧠 Generated ${suggestions.length} smart suggestions`);
    suggestions.forEach(s => console.log(`  - ${s.action.toUpperCase()}: ${s.reason}`));

    return suggestions;
  }

  _findMatchInEvent(matchId, event) {
    return event.matches.find(m => m.id === matchId);
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
          // Extract round label from bracketPosition for logging
          const roundLabel = item.bracketPosition?.split('-')[0] || '';
          const matchLabel = roundLabel ? `M${item.matchNumber} ${roundLabel}` : `M${item.matchNumber}`;
          console.log(`  ${matchLabel}: ${scheduledDateTime.toISOString()} on ${item.court}`);

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
