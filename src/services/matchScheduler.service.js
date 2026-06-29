/**
 * Match Scheduler Service
 * Implements a greedy algorithm for automatic match scheduling
 * Algorithm: Court parallelization with time-slot filling
 */

const prisma = require('../lib/prisma');

class MatchSchedulerService {
  /**
   * Generate schedule for an event
   * @param {string} eventId - Event ID
   * @param {object} settings - Scheduling settings from tournament
   * @returns {object} Schedule with matches array and metadata
   */
  async generateSchedule(eventId, settings = {}) {
    // Fetch event with matches
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        tournament: true,
        matches: {
          where: {
            status: { not: 'BYE' }
          },
          include: {
            participant1: { include: { user: true } },
            participant2: { include: { user: true } }
          },
          orderBy: [
            { roundNumber: 'desc' }, // Higher round number = earlier rounds
            { matchNumber: 'asc' }
          ]
        }
      }
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // Get settings from tournament or use defaults
    const tournament = event.tournament;
    const schedulingSettings = {
      startDate: settings.startDate || tournament.startDate,
      endDate: settings.endDate || tournament.endDate,
      dailyStartTime: settings.dailyStartTime || tournament.dailyStartTime || '09:00',
      dailyEndTime: settings.dailyEndTime || tournament.dailyEndTime || '18:00',
      courtsAvailable: settings.courtsAvailable ?? tournament.courtsAvailable ?? 4,
      matchDuration: settings.matchDuration ?? tournament.matchDuration ?? 45,
      breakDuration: settings.breakDuration ?? tournament.breakDuration ?? 15,
      minRestTime: settings.minRestTime ?? tournament.minRestTime ?? 30,
      courtNames: settings.courtNames || this._generateCourtNames(settings.courtsAvailable ?? tournament.courtsAvailable ?? 4)
    };

    // Validate settings
    this._validateSettings(schedulingSettings);

    // Calculate daily capacity
    const capacity = this._calculateDailyCapacity(schedulingSettings);

    // Check if this is a hybrid (league-cum-knockout) format
    const groupMatches = event.matches.filter(m => m.groupId !== null);
    const knockoutMatches = event.matches.filter(m => m.groupId === null);
    const isHybridFormat = groupMatches.length > 0 && knockoutMatches.length > 0;

    let schedule;

    if (isHybridFormat) {
      // HYBRID FORMAT: Schedule groups first, then knockout
      console.log(`📊 HYBRID: ${groupMatches.length} group matches + ${knockoutMatches.length} knockout matches`);

      // PHASE 1: Schedule all group matches first
      const groupSchedule = this._greedySchedule(groupMatches, schedulingSettings, capacity);

      // PHASE 2: Schedule knockout matches AFTER group stage completes
      const groupDates = groupSchedule.scheduledMatches.map(m => new Date(m.date));
      const lastGroupDate = new Date(Math.max(...groupDates));

      // Start knockout on the NEXT day after last group match
      const knockoutStartDate = new Date(lastGroupDate);
      knockoutStartDate.setDate(knockoutStartDate.getDate() + 1);

      console.log(`✅ Group stage ends: ${lastGroupDate.toISOString().split('T')[0]}`);
      console.log(`🏆 Knockout stage starts: ${knockoutStartDate.toISOString().split('T')[0]}`);

      // Schedule knockout with updated start date
      const knockoutSettings = {
        ...schedulingSettings,
        startDate: knockoutStartDate
      };
      const knockoutSchedule = this._greedySchedule(knockoutMatches, knockoutSettings, capacity);

      // Merge both schedules
      schedule = {
        scheduledMatches: [...groupSchedule.scheduledMatches, ...knockoutSchedule.scheduledMatches],
        unscheduledMatches: groupSchedule.unscheduledMatches + knockoutSchedule.unscheduledMatches,
        daysUsed: groupSchedule.daysUsed + knockoutSchedule.daysUsed,
        overflow: groupSchedule.overflow || knockoutSchedule.overflow
      };
    } else {
      // SINGLE ELIMINATION or ROUND ROBIN: Schedule all matches together
      console.log(`📊 Scheduling ${event.matches.length} matches (${event.bracketFormat})`);
      schedule = this._greedySchedule(event.matches, schedulingSettings, capacity);
    }

    const totalMatches = event.matches.length;

    return {
      success: true,
      schedule,
      metadata: {
        totalMatches,
        scheduledMatches: schedule.scheduledMatches.length,
        unscheduledMatches: totalMatches - schedule.scheduledMatches.length,
        daysUsed: schedule.daysUsed,
        daysAvailable: this._calculateDaysBetween(schedulingSettings.startDate, schedulingSettings.endDate),
        dailyCapacity: capacity.slotsPerDay,
        settings: schedulingSettings
      }
    };
  }

  /**
   * GREEDY ALGORITHM: Court Parallelization with Time-Slot Filling
   * Fills time slots across all courts to maximize parallel execution
   * CRITICAL: Respects match dependencies (knockout progression)
   */
  _greedySchedule(matches, settings, capacity) {
    const scheduledMatches = [];
    const unscheduledMatches = [...matches];
    const playerLastMatchEnd = new Map(); // Track when each player last finished
    const matchScheduleMap = new Map(); // Track when each match is scheduled (matchId -> {date, endTime})

    let currentDate = new Date(settings.startDate);
    const endDate = new Date(settings.endDate);
    let daysUsed = 0;

    // Schedule day by day
    while (currentDate <= endDate && unscheduledMatches.length > 0) {
      daysUsed++;
      const daySchedule = [];

      // Parse daily time window
      const [startHour, startMin] = settings.dailyStartTime.split(':').map(Number);
      const [endHour, endMin] = settings.dailyEndTime.split(':').map(Number);

      let currentTimeMinutes = startHour * 60 + startMin;
      const endTimeMinutes = endHour * 60 + endMin;

      // Track which courts are busy until what time
      const courtBusyUntil = Array(settings.courtsAvailable).fill(currentTimeMinutes);

      // Greedy: Fill time slots with available matches
      while (currentTimeMinutes < endTimeMinutes) {
        let matchScheduledThisSlot = false;

        // Try to schedule on each court
        for (let courtIndex = 0; courtIndex < settings.courtsAvailable; courtIndex++) {
          // Skip if court is still busy
          if (courtBusyUntil[courtIndex] > currentTimeMinutes) {
            continue;
          }

          // Find next schedulable match
          const matchIndex = unscheduledMatches.findIndex(match => {
            // Check if this match can be scheduled at this time
            return this._canScheduleMatch(
              match,
              currentDate,
              currentTimeMinutes,
              playerLastMatchEnd,
              matchScheduleMap,
              matches,
              settings
            );
          });

          if (matchIndex === -1) {
            // No match can be scheduled on this court at this time
            continue;
          }

          // Schedule the match!
          const match = unscheduledMatches[matchIndex];
          const scheduledTime = this._formatTime(currentTimeMinutes);
          const matchEndTime = currentTimeMinutes + settings.matchDuration;

          scheduledMatches.push({
            matchId: match.id,
            matchNumber: match.matchNumber,
            roundNumber: match.roundNumber,
            bracketPosition: match.bracketPosition,
            participant1: this._formatParticipantOrPlaceholder(match, 1, matches),
            participant2: this._formatParticipantOrPlaceholder(match, 2, matches),
            court: settings.courtNames[courtIndex],
            courtNumber: courtIndex + 1,
            date: currentDate.toISOString().split('T')[0],
            time: scheduledTime,
            duration: settings.matchDuration
          });

          // Track this match's schedule
          matchScheduleMap.set(match.id, {
            date: currentDate.toISOString().split('T')[0],
            endTime: matchEndTime + settings.minRestTime // Include rest time
          });

          // Update player availability
          if (match.participant1Id) {
            playerLastMatchEnd.set(match.participant1Id, {
              date: currentDate.toISOString().split('T')[0],
              endTime: matchEndTime + settings.minRestTime
            });
          }
          if (match.participant2Id) {
            playerLastMatchEnd.set(match.participant2Id, {
              date: currentDate.toISOString().split('T')[0],
              endTime: matchEndTime + settings.minRestTime
            });
          }

          // Mark court busy (match duration + break)
          courtBusyUntil[courtIndex] = matchEndTime + settings.breakDuration;

          // Remove from unscheduled
          unscheduledMatches.splice(matchIndex, 1);
          matchScheduledThisSlot = true;
        }

        // If no matches were scheduled this slot, advance time
        if (!matchScheduledThisSlot) {
          currentTimeMinutes += settings.matchDuration + settings.breakDuration;
        } else {
          // Advance to the next earliest available court time
          currentTimeMinutes = Math.min(...courtBusyUntil);
        }

        // Safety check: prevent infinite loop
        if (currentTimeMinutes > endTimeMinutes) {
          break;
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      scheduledMatches,
      unscheduledMatches: unscheduledMatches.length,
      daysUsed,
      overflow: unscheduledMatches.length > 0
    };
  }

  /**
   * Check if a match can be scheduled at given time
   * CRITICAL: Checks both player availability AND match dependencies (for knockout progression)
   */
  _canScheduleMatch(match, date, timeMinutes, playerLastMatchEnd, matchScheduleMap, allMatches, settings) {
    const dateStr = date.toISOString().split('T')[0];

    // RULE 1: Check if this match depends on other matches completing first (knockout dependency)
    // Find all matches that feed into this match
    const dependencyMatches = allMatches.filter(m => m.nextMatchId === match.id);

    if (dependencyMatches.length > 0) {
      // This match has dependencies - check each one
      for (const depMatch of dependencyMatches) {
        const depSchedule = matchScheduleMap.get(depMatch.id);

        if (!depSchedule) {
          // Dependency match not scheduled yet - CANNOT schedule this match
          return false;
        }

        // Check if dependency match finishes before this match can start
        const depDate = new Date(depSchedule.date);
        const currentDate = new Date(dateStr);

        if (depDate > currentDate) {
          // Dependency is on a later date - CANNOT schedule
          return false;
        }

        if (depDate.getTime() === currentDate.getTime()) {
          // Same day - check time
          if (depSchedule.endTime > timeMinutes) {
            // Dependency hasn't finished yet - CANNOT schedule
            return false;
          }
        }
      }
    }

    // RULE 2: Check participant availability (for confirmed players)
    if (match.participant1Id) {
      const lastMatch = playerLastMatchEnd.get(match.participant1Id);
      if (lastMatch) {
        const lastMatchDate = new Date(lastMatch.date);
        const currentDate = new Date(dateStr);

        if (lastMatchDate.getTime() === currentDate.getTime()) {
          // Same day - check if rest time has passed
          if (lastMatch.endTime > timeMinutes) {
            return false; // Player still resting
          }
        } else if (lastMatchDate > currentDate) {
          // Last match is in the future?? Should not happen
          return false;
        }
      }
    }

    if (match.participant2Id) {
      const lastMatch = playerLastMatchEnd.get(match.participant2Id);
      if (lastMatch) {
        const lastMatchDate = new Date(lastMatch.date);
        const currentDate = new Date(dateStr);

        if (lastMatchDate.getTime() === currentDate.getTime()) {
          // Same day - check if rest time has passed
          if (lastMatch.endTime > timeMinutes) {
            return false; // Player still resting
          }
        } else if (lastMatchDate > currentDate) {
          return false;
        }
      }
    }

    // RULE 3: If participants are TBD (no confirmed players), always schedulable IF dependencies are met
    return true;
  }

  /**
   * Calculate daily scheduling capacity
   */
  _calculateDailyCapacity(settings) {
    const [startHour, startMin] = settings.dailyStartTime.split(':').map(Number);
    const [endHour, endMin] = settings.dailyEndTime.split(':').map(Number);

    const dailyMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    const slotDuration = settings.matchDuration + settings.breakDuration;
    const slotsPerCourt = Math.floor(dailyMinutes / slotDuration);
    const slotsPerDay = slotsPerCourt * settings.courtsAvailable;

    return {
      dailyMinutes,
      slotsPerCourt,
      slotsPerDay
    };
  }

  /**
   * Generate suggestions when schedule doesn't fit
   */
  generateSuggestions(metadata) {
    const { totalMatches, scheduledMatches, daysAvailable, dailyCapacity, settings } = metadata;
    const unscheduled = totalMatches - scheduledMatches;

    if (unscheduled === 0) {
      return [];
    }

    const suggestions = [];

    // Suggestion 1: Add more days
    const additionalDaysNeeded = Math.ceil(unscheduled / dailyCapacity);
    suggestions.push({
      type: 'ADD_DAYS',
      description: `Add ${additionalDaysNeeded} more day${additionalDaysNeeded > 1 ? 's' : ''}`,
      value: additionalDaysNeeded,
      impact: 'All matches will fit'
    });

    // Suggestion 2: Add more courts
    const additionalCourtsNeeded = Math.ceil((totalMatches / daysAvailable) / this._calculateDailyCapacity({
      ...settings,
      courtsAvailable: settings.courtsAvailable + 1
    }).slotsPerCourt) - settings.courtsAvailable;

    if (additionalCourtsNeeded > 0) {
      suggestions.push({
        type: 'ADD_COURTS',
        description: `Add ${additionalCourtsNeeded} more court${additionalCourtsNeeded > 1 ? 's' : ''}`,
        value: additionalCourtsNeeded,
        impact: `Total ${settings.courtsAvailable + additionalCourtsNeeded} courts`
      });
    }

    // Suggestion 3: Reduce match duration
    const targetMatchDuration = Math.floor(settings.matchDuration * 0.85);
    suggestions.push({
      type: 'REDUCE_DURATION',
      description: `Reduce match duration to ${targetMatchDuration} minutes`,
      value: targetMatchDuration,
      impact: 'Fits more matches per day'
    });

    // Suggestion 4: Extend daily hours
    const currentDailyHours = this._calculateDailyCapacity(settings).dailyMinutes / 60;
    const extendedHours = Math.ceil(currentDailyHours + 1);
    suggestions.push({
      type: 'EXTEND_HOURS',
      description: `Extend to ${extendedHours} hours/day`,
      value: extendedHours,
      impact: 'Start earlier or end later'
    });

    return suggestions;
  }

  /**
   * Validate scheduling settings
   */
  _validateSettings(settings) {
    if (!settings.startDate || !settings.endDate) {
      throw new Error('Start date and end date are required');
    }

    if (new Date(settings.startDate) > new Date(settings.endDate)) {
      throw new Error('Start date must be before end date');
    }

    if (settings.courtsAvailable < 1) {
      throw new Error('At least 1 court is required');
    }

    if (settings.matchDuration < 1) {
      throw new Error('Match duration must be at least 1 minute');
    }

    const [startHour] = settings.dailyStartTime.split(':').map(Number);
    const [endHour] = settings.dailyEndTime.split(':').map(Number);

    if (startHour >= endHour) {
      throw new Error('Daily end time must be after start time');
    }
  }

  /**
   * Helper: Generate court names
   */
  _generateCourtNames(count) {
    return Array.from({ length: count }, (_, i) => `Court ${i + 1}`);
  }

  /**
   * Helper: Format time from minutes to HH:MM
   */
  _formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  /**
   * Helper: Calculate days between dates
   */
  _calculateDaysBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }

  /**
   * Helper: Format participant name or show placeholder for future rounds
   */
  _formatParticipantOrPlaceholder(match, position, allMatches) {
    const participant = position === 1 ? match.participant1 : match.participant2;

    if (participant) {
      return this._formatParticipant(participant);
    }

    // Find source match that feeds into this position
    const sourceMatch = allMatches.find(m =>
      m.nextMatchId === match.id && m.feedsPosition === position
    );

    if (sourceMatch) {
      return `Winner of M${sourceMatch.matchNumber}`;
    }

    return 'TBD';
  }

  /**
   * Helper: Format participant name
   */
  _formatParticipant(participant) {
    if (!participant) return 'TBD';
    const name = `${participant.user.firstName} ${participant.user.lastName}`;
    if (participant.partner) {
      return `${name} / ${participant.partner.firstName} ${participant.partner.lastName}`;
    }
    return name;
  }
}

module.exports = new MatchSchedulerService();
