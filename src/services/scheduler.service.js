const prisma = require('../lib/prisma');

class SchedulerService {
  async autoScheduleEvent(eventId, options = {}) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        matches: {
          orderBy: [{ roundNumber: 'desc' }, { matchNumber: 'asc' }]
        },
        tournament: true
      }
    });

    if (!event) {
      const error = new Error('Event not found');
      error.statusCode = 404;
      throw error;
    }

    // Merge options with tournament config, then fall back to safe defaults
    const config = {
      dailyStartTime:  options.dailyStartTime  || event.tournament.dailyStartTime  || '09:00',
      dailyEndTime:    options.dailyEndTime    || event.tournament.dailyEndTime    || '18:00',
      courtsAvailable: options.courtsAvailable != null ? options.courtsAvailable : (event.tournament.courtsAvailable ?? 2),
      matchDuration:   options.matchDuration   != null ? options.matchDuration   : (event.tournament.matchDuration   ?? 45),
      breakDuration:   options.breakDuration   != null ? options.breakDuration   : (event.tournament.breakDuration   ?? 15),
      minRestTime:     options.minRestTime      != null ? options.minRestTime     : (event.tournament.minRestTime     ?? 30),
    };

    // First match date: option override > tournament config > tournament start date
    const rawDate = options.firstMatchDate || event.tournament.firstMatchDate || event.tournament.startDate;
    if (!rawDate) {
      const err = new Error('Tournament has no start date configured.');
      err.statusCode = 400;
      throw err;
    }
    config.firstMatchDate = new Date(rawDate);

    // Only schedule non-BYE matches
    const matchesToSchedule = event.matches.filter(m => m.status !== 'BYE');

    if (matchesToSchedule.length === 0) {
      return {
        success: true,
        message: 'No matches to schedule',
        summary: { totalMatches: 0, scheduledMatches: 0 }
      };
    }

    const slots = this._generateTimeSlots(config);

    if (slots.length === 0) {
      return {
        success: false,
        error: 'No valid time slots could be generated. Check your daily start/end times.',
        canFit: 0,
        total: matchesToSchedule.length,
        suggestion: 'Make sure daily end time is after start time and match duration fits in the window.'
      };
    }

    const schedule = [];
    const courtOccupancy = {};  // courtNumber → [{start, end}]
    const playerLastEnd   = {};  // registrationId → Date

    // Sort: highest round number first (R1 of 3 = QF, R2 = SF, R3 would be wrong)
    // Actually roundNumber 1 = Final. So schedule higher roundNumbers first.
    const regularMatches = matchesToSchedule
      .filter(m => m.roundNumber !== 1)
      .sort((a, b) => b.roundNumber - a.roundNumber || a.matchNumber - b.matchNumber);

    const finalsMatch = matchesToSchedule.find(m => m.roundNumber === 1);

    for (const match of regularMatches) {
      const slot = this._findSlot(match, slots, courtOccupancy, playerLastEnd, config);
      if (!slot) {
        return {
          success: false,
          error: 'Cannot fit all matches within the tournament window.',
          canFit: schedule.length,
          total: matchesToSchedule.length,
          suggestion: 'Try: more courts, longer tournament dates, shorter match duration, or reduce break time.'
        };
      }
      this._bookSlot(schedule, courtOccupancy, playerLastEnd, match, slot, config);
    }

    // Schedule finals last
    if (finalsMatch) {
      // Finals must start AFTER the last scheduled match ends + minRest
      const lastEndMs = schedule.length > 0
        ? Math.max(...schedule.map(s => new Date(s.scheduledAt).getTime() + s.duration * 60000))
        : config.firstMatchDate.getTime();

      const earliestFinalsStart = new Date(lastEndMs + config.minRestTime * 60000);

      const finalsSlot = this._findSlot(
        finalsMatch, slots, courtOccupancy, playerLastEnd, config, earliestFinalsStart
      );

      if (!finalsSlot) {
        return {
          success: false,
          error: 'Cannot schedule the finals match. Tournament window may be too short.',
          canFit: schedule.length,
          total: matchesToSchedule.length,
          suggestion: 'Extend the tournament end date or reduce match duration.'
        };
      }
      this._bookSlot(schedule, courtOccupancy, playerLastEnd, finalsMatch, finalsSlot, config);
    }

    await this._saveSchedule(schedule);

    const dates = schedule.map(s => new Date(s.scheduledAt).getTime());
    const firstMatch = new Date(Math.min(...dates));
    const lastMatchStart = new Date(Math.max(...dates));
    const daysUsed = Math.ceil((lastMatchStart - firstMatch) / 86400000) + 1;

    return {
      success: true,
      message: 'All matches scheduled successfully',
      summary: {
        totalMatches: matchesToSchedule.length,
        scheduledMatches: schedule.length,
        firstMatchDate: firstMatch.toISOString(),
        lastMatchDate: lastMatchStart.toISOString(),
        daysUsed,
        courtsUsed: config.courtsAvailable
      }
    };
  }

  // ── Generate all possible (slot, court) combinations ──────────────────────
  _generateTimeSlots(config) {
    const slots = [];
    const [sh, sm] = config.dailyStartTime.split(':').map(Number);
    const [eh, em] = config.dailyEndTime.split(':').map(Number);
    const slotStep = (config.matchDuration + config.breakDuration) * 60000;
    const matchMs  = config.matchDuration * 60000;

    for (let day = 0; day < 60; day++) {
      const base = new Date(config.firstMatchDate);
      base.setDate(base.getDate() + day);
      base.setSeconds(0, 0);

      const dayStart = new Date(base); dayStart.setHours(sh, sm, 0, 0);
      const dayEnd   = new Date(base); dayEnd.setHours(eh, em, 0, 0);

      let t = new Date(dayStart);
      while (t.getTime() + matchMs <= dayEnd.getTime()) {
        const end = new Date(t.getTime() + matchMs);
        for (let c = 1; c <= config.courtsAvailable; c++) {
          slots.push({ start: new Date(t), end: new Date(end), court: c });
        }
        t = new Date(t.getTime() + slotStep);
      }
    }
    return slots;
  }

  // ── Find the first slot where both court and players are free ─────────────
  _findSlot(match, slots, courtOccupancy, playerLastEnd, config, notBefore = null) {
    for (const slot of slots) {
      if (notBefore && slot.start < notBefore) continue;

      // Court free?
      const occupied = courtOccupancy[slot.court] || [];
      const courtBusy = occupied.some(
        o => slot.start < o.end && slot.end > o.start
      );
      if (courtBusy) continue;

      // Players rested?
      const restOk = (id) => {
        if (!id) return true;
        const last = playerLastEnd[id];
        if (!last) return true;
        return (slot.start - last) / 60000 >= config.minRestTime;
      };

      if (!restOk(match.participant1Id) || !restOk(match.participant2Id)) continue;

      return slot;
    }
    return null;
  }

  // ── Record a booking ──────────────────────────────────────────────────────
  _bookSlot(schedule, courtOccupancy, playerLastEnd, match, slot, config) {
    schedule.push({
      matchId: match.id,
      scheduledAt: slot.start,
      duration: config.matchDuration,
      courtNumber: slot.court,
      isFinalsMatch: match.roundNumber === 1
    });
    if (!courtOccupancy[slot.court]) courtOccupancy[slot.court] = [];
    courtOccupancy[slot.court].push({ start: slot.start, end: slot.end });
    if (match.participant1Id) playerLastEnd[match.participant1Id] = slot.end;
    if (match.participant2Id) playerLastEnd[match.participant2Id] = slot.end;
  }

  // ── Persist to DB ─────────────────────────────────────────────────────────
  async _saveSchedule(schedule) {
    await prisma.$transaction(
      schedule.map(item =>
        prisma.match.update({
          where: { id: item.matchId },
          data: {
            scheduledAt:   item.scheduledAt,
            duration:      item.duration,
            courtNumber:   item.courtNumber,
            isFinalsMatch: item.isFinalsMatch,
            status:        'PENDING'
          }
        })
      )
    );
  }

  // ── Get schedule (grouped by day → court) ─────────────────────────────────
  async getEventSchedule(eventId) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        tournament: true,
        matches: {
          where: { scheduledAt: { not: null } },
          include: {
            participant1: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true } },
                partner: { select: { id: true, firstName: true, lastName: true } }
              }
            },
            participant2: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true } },
                partner: { select: { id: true, firstName: true, lastName: true } }
              }
            }
          },
          orderBy: { scheduledAt: 'asc' }
        }
      }
    });
    if (!event) {
      const e = new Error('Event not found'); e.statusCode = 404; throw e;
    }

    const days = {};
    for (const m of event.matches) {
      const date = m.scheduledAt.toISOString().split('T')[0];
      if (!days[date]) days[date] = {};
      const c = m.courtNumber || 1;
      if (!days[date][c]) days[date][c] = [];
      days[date][c].push(m);
    }

    return {
      event: { id: event.id, name: event.name, format: event.format },
      tournament: { id: event.tournament.id, name: event.tournament.name, venueName: event.tournament.venueName },
      schedule: Object.entries(days).map(([date, courts]) => ({
        date,
        courts: Object.entries(courts).map(([n, matches]) => ({
          courtNumber: parseInt(n),
          matches
        }))
      }))
    };
  }

  async clearSchedule(eventId) {
    await prisma.match.updateMany({
      where: { eventId },
      data: { scheduledAt: null, duration: null, courtNumber: null, courtName: null, status: 'PENDING' }
    });
    return { message: 'Schedule cleared' };
  }
}

module.exports = new SchedulerService();
