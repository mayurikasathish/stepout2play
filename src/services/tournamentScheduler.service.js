const prisma = require('../lib/prisma');

/**
 * INTELLIGENT CROSS-EVENT TOURNAMENT SCHEDULER
 *
 * This is the BRAIN of the scheduling system!
 * Handles multiple events sharing the same courts across days.
 *
 * Key Features:
 * - Prevents court double-booking across events
 * - Enforces player rest requirements
 * - Supports multiple scheduling strategies
 * - Auto-detects and fixes conflicts
 */

class TournamentSchedulerService {

  /**
   * MAIN ENTRY POINT
   * Generate schedule for entire tournament (all events)
   * Can filter by phase: 'league', 'knockout', or null for all
   */
  async generateTournamentSchedule(tournamentId, settings = {}) {
    const phase = settings.phase || null; // 'league', 'knockout', or null
    console.log(`🚀 Starting cross-event scheduling for tournament ${tournamentId}${phase ? ` (${phase} phase only)` : ''}`);

    // Step 1: Load tournament with all events and matches
    const tournament = await this._loadTournamentData(tournamentId);

    // Step 2: Build scheduling configuration
    const config = this._buildSchedulingConfig(tournament, settings);

    // Step 3: Validate configuration
    this._validateConfiguration(config);

    // Step 4: Validate phase constraints
    if (phase === 'knockout') {
      const hasUnscheduledLeague = tournament.events.some(e =>
        e.bracketFormat === 'LEAGUE_CUM_KNOCKOUT' && !e.leaguePhaseScheduled
      );
      if (hasUnscheduledLeague) {
        throw new Error('Cannot schedule knockout phase before league phase is scheduled');
      }
    }

    // Step 5: Build Court Calendar (master timeline)
    const courtCalendar = this._initializeCourtCalendar(config);

    // Step 6: Collect matches for requested phase
    const allMatches = this._collectAllMatches(tournament.events, phase);

    if (allMatches.length === 0) {
      return {
        success: true,
        schedule: [],
        conflicts: [],
        analytics: null,
        config,
        tournamentId,
        message: `No ${phase || 'unscheduled'} matches found`
      };
    }

    // Step 7: Apply scheduling strategy
    let schedule;
    switch (config.strategy) {
      case 'sequential':
        schedule = await this._scheduleSequential(allMatches, courtCalendar, config, tournament);
        break;
      case 'interleaved':
        schedule = await this._scheduleInterleaved(allMatches, courtCalendar, config, tournament);
        break;
      case 'hybrid':
        schedule = await this._scheduleHybrid(allMatches, courtCalendar, config, tournament);
        break;
      default:
        throw new Error(`Unknown strategy: ${config.strategy}`);
    }

    // Step 8: Detect conflicts
    const conflicts = this._detectAllConflicts(schedule, config);

    // Step 9: Auto-fix conflicts if requested
    if (settings.autoFix && conflicts.length > 0) {
      schedule = await this._autoFixConflicts(schedule, conflicts, courtCalendar, config);
      // Re-detect after fixes
      conflicts.length = 0;
      conflicts.push(...this._detectAllConflicts(schedule, config));
    }

    // Step 10: Calculate analytics
    const analytics = this._calculateAnalytics(schedule, config, tournament);

    console.log(`✓ Schedule generated: ${schedule.length} matches, ${conflicts.length} conflicts`);

    return {
      success: true,
      schedule,
      conflicts,
      analytics,
      config,
      tournamentId,
      phase
    };
  }

  /**
   * Save generated schedule to database
   */
  async saveSchedule(tournamentId, schedule, config = null, phase = null) {
    console.log(`💾 Saving schedule for tournament ${tournamentId}${phase ? ` (${phase} phase)` : ''}`);

    const updates = [];

    for (const item of schedule) {
      const update = prisma.match.update({
        where: { id: item.matchId },
        data: {
          scheduledAt: item.date ? new Date(new Date(item.date).toISOString().split('T')[0] + 'T' + item.startTime + ':00.000Z') : null,
          courtNumber: item.courtNumber,
          courtName: item.court
        }
      });
      updates.push(update);
    }

    // Also update tournament with courtsBySport if provided
    if (config?.courtsBySport) {
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { courtsBySport: config.courtsBySport }
      });
      console.log(`✓ Updated tournament courtsBySport configuration`);
    }

    // Mark phase as scheduled for relevant events
    if (phase) {
      const eventIds = [...new Set(schedule.map(s => s.eventId))];
      const fieldToUpdate = phase === 'league' ? 'leaguePhaseScheduled' : 'knockoutPhaseScheduled';

      await prisma.event.updateMany({
        where: { id: { in: eventIds } },
        data: { [fieldToUpdate]: true }
      });

      console.log(`✓ Marked ${phase} phase as scheduled for ${eventIds.length} events`);
    }

    await prisma.$transaction(updates);

    console.log(`✓ Saved ${updates.length} match schedules`);

    return { success: true, matchesUpdated: updates.length };
  }

  /**
   * Clear all scheduling data for tournament
   */
  async clearTournamentSchedule(tournamentId) {
    const events = await prisma.event.findMany({
      where: { tournamentId }
    });

    const eventIds = events.map(e => e.id);

    const result = await prisma.match.updateMany({
      where: { eventId: { in: eventIds } },
      data: {
        date: null,
        startTime: null,
        endTime: null,
        court: null,
        courtNumber: null
      }
    });

    return { success: true, matchesCleared: result.count };
  }

  // ============================================================================
  // SCHEDULING STRATEGIES
  // ============================================================================

  /**
   * STRATEGY 1: SEQUENTIAL
   * Complete Event 1, then Event 2, then Event 3...
   * Pros: Clean separation, easy to manage
   * Cons: Takes longer, players wait between events
   */
  async _scheduleSequential(allMatches, courtCalendar, config, tournament) {
    console.log('📅 Using SEQUENTIAL strategy');

    const schedule = [];
    const events = tournament.events.sort((a, b) => {
      // Sort by priority (high -> low), then by participant count (larger first)
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const aPriority = a.priority || 'medium';
      const bPriority = b.priority || 'medium';

      if (priorityOrder[aPriority] !== priorityOrder[bPriority]) {
        return priorityOrder[aPriority] - priorityOrder[bPriority];
      }

      const aCount = a.matches?.filter(m => m.status === 'SCHEDULED').length || 0;
      const bCount = b.matches?.filter(m => m.status === 'SCHEDULED').length || 0;
      return bCount - aCount;
    });

    for (const event of events) {
      const eventMatches = allMatches.filter(m => m.eventId === event.id);
      console.log(`  Scheduling ${event.name}: ${eventMatches.length} matches`);

      const eventSchedule = this._scheduleEventMatches(
        eventMatches,
        courtCalendar,
        config,
        event
      );

      schedule.push(...eventSchedule);
    }

    return schedule;
  }

  /**
   * STRATEGY 2: INTERLEAVED
   * Mix all events, maximize court usage
   * Pros: Efficient court usage, faster tournament
   * Cons: Events are mixed, harder to follow
   */
  async _scheduleInterleaved(allMatches, courtCalendar, config, tournament) {
    console.log('🔀 Using INTERLEAVED strategy');

    // Sort all matches by priority and round
    const sortedMatches = this._sortMatchesByPriority(allMatches, tournament.events);

    const schedule = [];
    const playerSchedule = new Map(); // Track when each player plays

    for (const match of sortedMatches) {
      const slot = this._findBestSlot(
        match,
        courtCalendar,
        playerSchedule,
        config
      );

      if (slot) {
        schedule.push(slot);
        this._markCourtBusy(courtCalendar, slot);
        this._updatePlayerSchedule(playerSchedule, match, slot, config);
      } else {
        console.warn(`⚠️ Could not schedule match ${match.id}`);
      }
    }

    return schedule;
  }

  /**
   * STRATEGY 3: HYBRID
   * Priority events first (sequential), then fill gaps with others (interleaved)
   * Pros: Best of both worlds
   * Cons: More complex logic
   */
  async _scheduleHybrid(allMatches, courtCalendar, config, tournament) {
    console.log('🎯 Using HYBRID strategy');

    const schedule = [];

    // Phase 1: Schedule high-priority events sequentially
    const highPriorityEvents = tournament.events.filter(e => e.priority === 'high');
    const highPriorityMatches = allMatches.filter(m =>
      highPriorityEvents.some(e => e.id === m.eventId)
    );

    console.log(`  Phase 1: Scheduling ${highPriorityEvents.length} high-priority events`);
    for (const event of highPriorityEvents) {
      const eventMatches = highPriorityMatches.filter(m => m.eventId === event.id);
      const eventSchedule = this._scheduleEventMatches(
        eventMatches,
        courtCalendar,
        config,
        event
      );
      schedule.push(...eventSchedule);
    }

    // Phase 2: Interleave remaining events in available gaps
    const remainingMatches = allMatches.filter(m =>
      !highPriorityEvents.some(e => e.id === m.eventId)
    );

    console.log(`  Phase 2: Interleaving ${remainingMatches.length} remaining matches`);
    const sortedRemaining = this._sortMatchesByPriority(remainingMatches, tournament.events);
    const playerSchedule = this._buildPlayerScheduleMap(schedule, config);

    for (const match of sortedRemaining) {
      const slot = this._findBestSlot(
        match,
        courtCalendar,
        playerSchedule,
        config
      );

      if (slot) {
        schedule.push(slot);
        this._markCourtBusy(courtCalendar, slot);
        this._updatePlayerSchedule(playerSchedule, match, slot, config);
      }
    }

    return schedule;
  }

  // ============================================================================
  // CORE SCHEDULING LOGIC
  // ============================================================================

  /**
   * Schedule all matches for a single event
   */
  _scheduleEventMatches(eventMatches, courtCalendar, config, event) {
    const schedule = [];
    const playerSchedule = new Map();

    // Sort matches by round (R1 first, then R2, etc.) and match number
    const sortedMatches = eventMatches.sort((a, b) => {
      if (a.roundNumber !== b.roundNumber) {
        return b.roundNumber - a.roundNumber; // Higher round = later rounds = lower priority first
      }
      return a.matchNumber - b.matchNumber;
    });

    for (const match of sortedMatches) {
      const slot = this._findBestSlot(
        match,
        courtCalendar,
        playerSchedule,
        config,
        event
      );

      if (slot) {
        schedule.push(slot);
        this._markCourtBusy(courtCalendar, slot);
        this._updatePlayerSchedule(playerSchedule, match, slot, config);
      }
    }

    return schedule;
  }

  /**
   * Find the best available slot for a match
   * NOW WITH MULTI-SPORT COURT SUPPORT!
   */
  _findBestSlot(match, courtCalendar, playerSchedule, config, event = null) {
    const duration = config.matchDuration;
    const matchSportId = match.sportId || event?.sportId;

    // Get available courts for this match's sport
    const availableCourts = courtCalendar.allCourts || [];
    const courtsForThisSport = availableCourts.filter(court =>
      !court.sportId || court.sportId === matchSportId
    );

    // Try each day
    for (let dayIndex = 0; dayIndex < courtCalendar.days.length; dayIndex++) {
      const day = courtCalendar.days[dayIndex];

      // Try each time slot
      for (let slotIndex = 0; slotIndex < day.slots.length; slotIndex++) {
        const timeSlot = day.slots[slotIndex];

        // Try each court (only those matching this sport)
        for (const availableCourt of courtsForThisSport) {
          const courtIdx = availableCourt.courtNumber - 1;

          // Check if slot is available
          if (!this._isSlotAvailable(courtCalendar, dayIndex, slotIndex, courtIdx, duration, config)) {
            continue;
          }

          // Check player rest requirements
          if (!this._checkPlayerRestRequirement(match, playerSchedule, day.date, timeSlot.start, config)) {
            continue;
          }

          // Check event-specific constraints
          if (event && !this._checkEventConstraints(match, event, availableCourt.courtNumber, timeSlot, config)) {
            continue;
          }

          // Found a valid slot!
          return {
            matchId: match.id,
            eventId: match.eventId,
            eventName: event?.name || match.eventName || 'Unknown Event',
            matchNumber: match.matchNumber,
            roundNumber: match.roundNumber,
            date: day.date,
            startTime: timeSlot.start,
            endTime: this._addMinutes(timeSlot.start, duration),
            court: availableCourt.courtName,
            courtNumber: availableCourt.courtNumber,
            sportId: matchSportId,
            participants: this._getMatchParticipants(match)
          };
        }
      }
    }

    return null; // No slot found
  }

  /**
   * Check if a time slot is available on a court
   */
  _isSlotAvailable(courtCalendar, dayIndex, slotIndex, courtIdx, duration, config) {
    const day = courtCalendar.days[dayIndex];

    // Calculate how many consecutive slots we need
    const slotsNeeded = Math.ceil(duration / config.timeSlotDuration);

    // Check if we have enough consecutive free slots
    for (let i = 0; i < slotsNeeded; i++) {
      const checkSlotIdx = slotIndex + i;
      if (checkSlotIdx >= day.slots.length) {
        return false; // Not enough slots left in the day
      }

      const slot = day.slots[checkSlotIdx];
      if (slot.courts[courtIdx].occupied) {
        return false; // Court is busy
      }
    }

    return true;
  }

  /**
   * Mark court as busy for a time period
   */
  _markCourtBusy(courtCalendar, scheduledSlot) {
    const duration = this._getMinutesBetween(scheduledSlot.startTime, scheduledSlot.endTime);

    for (const day of courtCalendar.days) {
      if (this._isSameDate(day.date, scheduledSlot.date)) {
        for (const slot of day.slots) {
          if (this._timeOverlaps(slot.start, slot.end, scheduledSlot.startTime, scheduledSlot.endTime)) {
            const courtIdx = scheduledSlot.courtNumber - 1;
            slot.courts[courtIdx].occupied = true;
            slot.courts[courtIdx].matchId = scheduledSlot.matchId;
          }
        }
        break;
      }
    }
  }

  /**
   * Check if players have sufficient rest between matches
   */
  _checkPlayerRestRequirement(match, playerSchedule, date, startTime, config) {
    const participants = this._getMatchParticipants(match);
    const minRestMinutes = config.minRestTime;

    for (const playerId of participants) {
      const lastMatch = playerSchedule.get(playerId);
      if (!lastMatch) continue; // First match for this player

      // Check if same day
      if (!this._isSameDate(lastMatch.date, date)) continue;

      // Calculate rest time
      const restMinutes = this._getMinutesBetween(lastMatch.endTime, startTime);

      if (restMinutes < minRestMinutes) {
        return false; // Not enough rest
      }
    }

    return true;
  }

  /**
   * Update player schedule tracking
   */
  _updatePlayerSchedule(playerSchedule, match, slot, config) {
    const participants = this._getMatchParticipants(match);

    for (const playerId of participants) {
      playerSchedule.set(playerId, {
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        matchId: slot.matchId
      });
    }
  }

  /**
   * Build player schedule map from existing schedule
   */
  _buildPlayerScheduleMap(schedule, config) {
    const playerSchedule = new Map();

    // Sort by date and time
    const sorted = [...schedule].sort((a, b) => {
      if (a.date !== b.date) {
        return new Date(a.date) - new Date(b.date);
      }
      return this._compareTimeStrings(a.startTime, b.startTime);
    });

    for (const slot of sorted) {
      for (const playerId of slot.participants) {
        playerSchedule.set(playerId, {
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          matchId: slot.matchId
        });
      }
    }

    return playerSchedule;
  }

  /**
   * Check event-specific constraints
   */
  _checkEventConstraints(match, event, courtNum, timeSlot, config) {
    // Constraint: Reserve Court 1 for finals/semis (if enabled)
    if (config.advancedOptions?.reserveCourt1ForFinals) {
      const isFinalRound = match.roundNumber === 1 || match.roundNumber === 2;
      const isCourt1 = courtNum === 1;

      if (isFinalRound && !isCourt1) {
        // Finals should be on Court 1
        return false;
      }

      if (!isFinalRound && isCourt1) {
        // Don't put non-finals on Court 1 if finals exist
        return false;
      }
    }

    // Constraint: Avoid scheduling finals early in the day
    if (config.advancedOptions?.avoidEarlyFinals) {
      const isFinals = match.roundNumber === 1;
      const isEarly = this._parseTimeString(timeSlot.start) < this._parseTimeString('14:00');

      if (isFinals && isEarly) {
        return false;
      }
    }

    return true;
  }

  // ============================================================================
  // CONFLICT DETECTION
  // ============================================================================

  /**
   * Detect all types of conflicts in the schedule
   */
  _detectAllConflicts(schedule, config) {
    const conflicts = [];

    // 1. Court conflicts (same court, same time)
    const courtConflicts = this._detectCourtConflicts(schedule);
    conflicts.push(...courtConflicts);

    // 2. Player conflicts (same player, overlapping times)
    const playerConflicts = this._detectPlayerConflicts(schedule, config);
    conflicts.push(...playerConflicts);

    return conflicts;
  }

  /**
   * Detect court double-booking
   */
  _detectCourtConflicts(schedule) {
    const conflicts = [];
    const courtTimeSlots = new Map(); // "date|court|time" -> matchId

    for (const slot of schedule) {
      const key = `${slot.date}|${slot.courtNumber}|${slot.startTime}`;

      if (courtTimeSlots.has(key)) {
        const conflictingMatchId = courtTimeSlots.get(key);
        const conflictingSlot = schedule.find(s => s.matchId === conflictingMatchId);

        conflicts.push({
          type: 'COURT_CONFLICT',
          severity: 'HIGH',
          date: slot.date,
          time: slot.startTime,
          court: slot.court,
          matches: [
            { matchId: slot.matchId, eventName: slot.eventName, matchNumber: slot.matchNumber },
            { matchId: conflictingMatchId, eventName: conflictingSlot.eventName, matchNumber: conflictingSlot.matchNumber }
          ],
          message: `Court ${slot.courtNumber} has 2 matches at ${slot.startTime} on ${slot.date}`
        });
      } else {
        courtTimeSlots.set(key, slot.matchId);
      }
    }

    return conflicts;
  }

  /**
   * Detect player rest violations
   */
  _detectPlayerConflicts(schedule, config) {
    const conflicts = [];
    const playerMatches = new Map(); // playerId -> array of slots

    // Group matches by player
    for (const slot of schedule) {
      for (const playerId of slot.participants) {
        if (!playerMatches.has(playerId)) {
          playerMatches.set(playerId, []);
        }
        playerMatches.get(playerId).push(slot);
      }
    }

    // Check each player's schedule
    for (const [playerId, slots] of playerMatches) {
      // Sort by date and time
      const sortedSlots = slots.sort((a, b) => {
        if (a.date !== b.date) {
          return new Date(a.date) - new Date(b.date);
        }
        return this._compareTimeStrings(a.startTime, b.startTime);
      });

      // Check consecutive matches
      for (let i = 0; i < sortedSlots.length - 1; i++) {
        const current = sortedSlots[i];
        const next = sortedSlots[i + 1];

        // Only check if same day
        if (!this._isSameDate(current.date, next.date)) continue;

        const restMinutes = this._getMinutesBetween(current.endTime, next.startTime);

        if (restMinutes < config.minRestTime) {
          conflicts.push({
            type: 'PLAYER_CONFLICT',
            severity: 'MEDIUM',
            playerId,
            date: current.date,
            matches: [
              { matchId: current.matchId, time: current.startTime, endTime: current.endTime },
              { matchId: next.matchId, time: next.startTime, endTime: next.endTime }
            ],
            restMinutes,
            requiredRest: config.minRestTime,
            message: `Player has only ${restMinutes} min rest (requires ${config.minRestTime} min)`
          });
        }
      }
    }

    return conflicts;
  }

  // ============================================================================
  // AUTO-FIX CONFLICTS
  // ============================================================================

  /**
   * Automatically fix detected conflicts
   */
  async _autoFixConflicts(schedule, conflicts, courtCalendar, config) {
    console.log(`🔧 Auto-fixing ${conflicts.length} conflicts...`);

    let fixedSchedule = [...schedule];

    for (const conflict of conflicts) {
      if (conflict.type === 'COURT_CONFLICT') {
        fixedSchedule = this._fixCourtConflict(fixedSchedule, conflict, courtCalendar, config);
      } else if (conflict.type === 'PLAYER_CONFLICT') {
        fixedSchedule = this._fixPlayerConflict(fixedSchedule, conflict, courtCalendar, config);
      }
    }

    console.log(`✓ Auto-fix complete`);
    return fixedSchedule;
  }

  /**
   * Fix court double-booking by moving one match
   */
  _fixCourtConflict(schedule, conflict, courtCalendar, config) {
    // Move the second conflicting match to next available slot
    const matchToMove = conflict.matches[1];
    const slotIndex = schedule.findIndex(s => s.matchId === matchToMove.matchId);

    if (slotIndex === -1) return schedule;

    const slot = schedule[slotIndex];

    // Rebuild court calendar without this match
    const tempCalendar = this._initializeCourtCalendar(config);
    const tempSchedule = schedule.filter((_, i) => i !== slotIndex);

    for (const s of tempSchedule) {
      this._markCourtBusy(tempCalendar, s);
    }

    // Find new slot
    const playerSchedule = this._buildPlayerScheduleMap(tempSchedule, config);
    const matchData = { id: slot.matchId, eventId: slot.eventId, roundNumber: slot.roundNumber, matchNumber: slot.matchNumber };
    const newSlot = this._findBestSlot(matchData, tempCalendar, playerSchedule, config);

    if (newSlot) {
      newSlot.participants = slot.participants;
      newSlot.eventName = slot.eventName;
      const newSchedule = [...schedule];
      newSchedule[slotIndex] = newSlot;
      return newSchedule;
    }

    return schedule; // Couldn't fix
  }

  /**
   * Fix player rest violation by moving one match
   */
  _fixPlayerConflict(schedule, conflict, courtCalendar, config) {
    // Move the second match to give more rest
    const matchToMove = conflict.matches[1];
    const slotIndex = schedule.findIndex(s => s.matchId === matchToMove.matchId);

    if (slotIndex === -1) return schedule;

    const slot = schedule[slotIndex];

    // Similar logic to court conflict fix
    const tempCalendar = this._initializeCourtCalendar(config);
    const tempSchedule = schedule.filter((_, i) => i !== slotIndex);

    for (const s of tempSchedule) {
      this._markCourtBusy(tempCalendar, s);
    }

    const playerSchedule = this._buildPlayerScheduleMap(tempSchedule, config);
    const matchData = { id: slot.matchId, eventId: slot.eventId, roundNumber: slot.roundNumber, matchNumber: slot.matchNumber };
    const newSlot = this._findBestSlot(matchData, tempCalendar, playerSchedule, config);

    if (newSlot) {
      newSlot.participants = slot.participants;
      newSlot.eventName = slot.eventName;
      const newSchedule = [...schedule];
      newSchedule[slotIndex] = newSlot;
      return newSchedule;
    }

    return schedule;
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  /**
   * Calculate utilization and other metrics
   */
  _calculateAnalytics(schedule, config, tournament) {
    const analytics = {
      totalMatches: schedule.length,
      daysUsed: 0,
      courtUtilization: [],
      peakTimes: [],
      eventDistribution: {}
    };

    // Court utilization per court
    for (let i = 1; i <= config.courtsAvailable; i++) {
      const courtMatches = schedule.filter(s => s.courtNumber === i);
      const totalSlots = this._calculateTotalSlots(config);
      const utilization = totalSlots > 0 ? (courtMatches.length / totalSlots) * 100 : 0;

      analytics.courtUtilization.push({
        court: i,
        matches: courtMatches.length,
        utilization: Math.round(utilization)
      });
    }

    // Days used
    const uniqueDays = new Set(schedule.map(s => s.date.toISOString().split('T')[0]));
    analytics.daysUsed = uniqueDays.size;

    // Event distribution
    for (const event of tournament.events) {
      const eventMatches = schedule.filter(s => s.eventId === event.id);
      analytics.eventDistribution[event.name] = {
        total: eventMatches.length,
        percentage: Math.round((eventMatches.length / schedule.length) * 100)
      };
    }

    return analytics;
  }

  _calculateTotalSlots(config) {
    const daysCount = this._calculateDaysBetween(config.startDate, config.endDate);
    const dailyMinutes = this._getMinutesBetween(config.dailyStartTime, config.dailyEndTime);
    const slotsPerDay = Math.floor(dailyMinutes / (config.matchDuration + config.breakDuration));
    return daysCount * slotsPerDay * config.courtsAvailable;
  }

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  async _loadTournamentData(tournamentId) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        events: {
          include: {
            matches: {
              include: {
                participant1: {
                  include: { user: true, partner: true }
                },
                participant2: {
                  include: { user: true, partner: true }
                }
              }
            }
          }
        }
      }
    });

    if (!tournament) {
      throw new Error('Tournament not found');
    }

    return tournament;
  }

  _buildSchedulingConfig(tournament, settings) {
    // Handle courtsBySport (new) or fall back to courtsAvailable (legacy)
    const courtsBySport = settings.courtsBySport || tournament.courtsBySport || null;
    const courtsAvailable = settings.courtsAvailable ?? tournament.courtsAvailable ?? 4;

    return {
      startDate: settings.startDate || tournament.startDate,
      endDate: settings.endDate || tournament.endDate,
      dailyStartTime: settings.dailyStartTime || tournament.dailyStartTime || '09:00',
      dailyEndTime: settings.dailyEndTime || tournament.dailyEndTime || '18:00',
      courtsBySport, // { "badminton": ["Court 1", "Court 2"], "table-tennis": ["Table 1"] }
      courtsAvailable, // Legacy fallback
      matchDuration: settings.matchDuration ?? tournament.matchDuration ?? 45,
      breakDuration: settings.breakDuration ?? tournament.breakDuration ?? 15,
      minRestTime: settings.minRestTime ?? tournament.minRestTime ?? 30,
      timeSlotDuration: 15, // 15-minute granularity
      strategy: settings.strategy || 'hybrid', // 'sequential', 'interleaved', or 'hybrid'
      advancedOptions: settings.advancedOptions || {
        avoidEarlyFinals: true,
        reserveCourt1ForFinals: false,
        separatePartnerMatches: true
      }
    };
  }

  _validateConfiguration(config) {
    if (!config.startDate || !config.endDate) {
      throw new Error('Start date and end date are required');
    }

    if (new Date(config.endDate) < new Date(config.startDate)) {
      throw new Error('End date must be after start date');
    }

    // Validate courts - check either courtsBySport or legacy courtsAvailable
    if (config.courtsBySport) {
      const totalCourts = Object.values(config.courtsBySport).reduce((sum, courts) => sum + courts.length, 0);
      if (totalCourts < 1) {
        throw new Error('At least 1 court is required');
      }
    } else if (config.courtsAvailable < 1) {
      throw new Error('At least 1 court is required');
    }
  }

  _initializeCourtCalendar(config) {
    const calendar = { days: [], courtsBySport: config.courtsBySport };

    const currentDate = new Date(config.startDate);
    const endDate = new Date(config.endDate);

    // Build court list from courtsBySport or legacy courtsAvailable
    const allCourts = [];
    if (config.courtsBySport) {
      // Multi-sport: flatten all courts with their sport metadata
      for (const [sportId, courts] of Object.entries(config.courtsBySport)) {
        courts.forEach((courtName, index) => {
          allCourts.push({
            sportId,
            courtName,
            courtNumber: allCourts.length + 1 // Sequential numbering across all sports
          });
        });
      }
    } else {
      // Legacy: simple numbered courts
      for (let i = 1; i <= config.courtsAvailable; i++) {
        allCourts.push({
          sportId: null,
          courtName: `Court ${i}`,
          courtNumber: i
        });
      }
    }

    while (currentDate <= endDate) {
      const day = {
        date: new Date(currentDate),
        slots: []
      };

      // Generate time slots for this day
      const startMinutes = this._parseTimeString(config.dailyStartTime);
      const endMinutes = this._parseTimeString(config.dailyEndTime);

      for (let time = startMinutes; time < endMinutes; time += config.timeSlotDuration) {
        const slot = {
          start: this._formatMinutesToTime(time),
          end: this._formatMinutesToTime(time + config.timeSlotDuration),
          courts: []
        };

        // Initialize each court for this slot
        for (const court of allCourts) {
          slot.courts.push({
            occupied: false,
            matchId: null,
            sportId: court.sportId,
            courtName: court.courtName,
            courtNumber: court.courtNumber
          });
        }

        day.slots.push(slot);
      }

      calendar.days.push(day);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    calendar.allCourts = allCourts; // Store for reference
    return calendar;
  }

  _collectAllMatches(events, phaseFilter = null) {
    const matches = [];

    console.log(`📊 Collecting matches from ${events.length} events, phaseFilter: ${phaseFilter}`);

    for (const event of events) {
      const hasLeaguePhase = event.bracketFormat === 'LEAGUE_CUM_KNOCKOUT';
<<<<<<< HEAD
      const matchCount = event.matches?.length || 0;

      console.log(`  Event "${event.name}": ${matchCount} matches, bracketGenerated: ${event.bracketGenerated}`);

      if (!event.matches || event.matches.length === 0) {
        console.log(`    ⚠️ Skipping - no matches found`);
        continue;
      }
=======
>>>>>>> ec1c24c (cross-event scheduling)

      for (const match of event.matches) {
        // Determine if this is a league or knockout match
        const isLeagueMatch = match.groupId != null; // League matches have groupId
        const isKnockoutMatch = !isLeagueMatch;

        // Apply phase filter if specified
        if (phaseFilter === 'league' && !isLeagueMatch) continue;
        if (phaseFilter === 'knockout' && !isKnockoutMatch) continue;

        matches.push({
          ...match,
          eventId: event.id,
          eventName: event.name,
          eventPriority: event.priority || 'medium',
          sportId: event.sportId,
          isLeagueMatch,
          isKnockoutMatch,
          hasLeaguePhase: hasLeaguePhase
        });
      }
    }

    console.log(`✅ Collected ${matches.length} total matches`);
    return matches;
  }

  _sortMatchesByPriority(matches, events) {
    const eventMap = new Map(events.map(e => [e.id, e]));

    return matches.sort((a, b) => {
      const eventA = eventMap.get(a.eventId);
      const eventB = eventMap.get(b.eventId);

      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const aPriority = eventA?.priority || 'medium';
      const bPriority = eventB?.priority || 'medium';

      if (priorityOrder[aPriority] !== priorityOrder[bPriority]) {
        return priorityOrder[aPriority] - priorityOrder[bPriority];
      }

      // Within same priority, later rounds first (finals, semis, etc.)
      if (a.roundNumber !== b.roundNumber) {
        return a.roundNumber - b.roundNumber;
      }

      return a.matchNumber - b.matchNumber;
    });
  }

  _getMatchParticipants(match) {
    const participants = [];

    if (match.participant1?.userId) participants.push(match.participant1.userId);
    if (match.participant1?.partnerId) participants.push(match.participant1.partnerId);
    if (match.participant2?.userId) participants.push(match.participant2.userId);
    if (match.participant2?.partnerId) participants.push(match.participant2.partnerId);

    return participants;
  }

  _parseTimeString(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  _formatMinutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  _addMinutes(timeStr, minutesToAdd) {
    const minutes = this._parseTimeString(timeStr);
    return this._formatMinutesToTime(minutes + minutesToAdd);
  }

  _getMinutesBetween(startTime, endTime) {
    return this._parseTimeString(endTime) - this._parseTimeString(startTime);
  }

  _compareTimeStrings(time1, time2) {
    return this._parseTimeString(time1) - this._parseTimeString(time2);
  }

  _isSameDate(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.toDateString() === d2.toDateString();
  }

  _timeOverlaps(start1, end1, start2, end2) {
    const s1 = this._parseTimeString(start1);
    const e1 = this._parseTimeString(end1);
    const s2 = this._parseTimeString(start2);
    const e2 = this._parseTimeString(end2);

    return s1 < e2 && s2 < e1;
  }

  _calculateDaysBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
}

module.exports = new TournamentSchedulerService();
