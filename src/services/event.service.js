const prisma = require('../lib/prisma');

class EventService {
  /**
   * Create a new event for a tournament
   */
  async createEvent(tournamentId, eventData) {
    // Validate tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!tournament) {
      const error = new Error('Tournament not found');
      error.statusCode = 404;
      throw error;
    }

    // Create event
    const event = await prisma.event.create({
      data: {
        tournamentId,
        name: eventData.name,
        format: eventData.format,
        category: eventData.category || null,
        gender: eventData.gender || null,
        maxParticipants: eventData.maxParticipants || null,
        registrationFee: eventData.registrationFee || null,
        rules: eventData.rules || null,
        sportId: eventData.sportId || null,
        scoringType: eventData.scoringType || null,
        scoringRules: eventData.scoringRules || null,
        bestOf: eventData.bestOf || null,
        pointsPerSet: eventData.pointsPerSet || null,
        goldenPoint: eventData.goldenPoint || false
      },
      include: {
        registrations: {
          where: {
            status: {
              not: 'CANCELLED'
            }
          },
          select: {
            id: true,
            userId: true,
            partnerId: true
          }
        }
      }
    });

    let participantCount;

    // For doubles/mixed doubles, count unique teams (pairs)
    if (event.format === 'DOUBLES' || event.format === 'MIXED_DOUBLES') {
      const processedPairs = new Set();
      participantCount = 0;

      event.registrations.forEach(reg => {
        if (reg.partnerId) {
          // Create a consistent pair ID (sorted to avoid counting same pair twice)
          const pairId = [reg.userId, reg.partnerId].sort().join('-');
          if (!processedPairs.has(pairId)) {
            processedPairs.add(pairId);
            participantCount++;
          }
        }
      });
    } else {
      // For singles, count individual registrations
      participantCount = event.registrations.length;
    }

    return {
      ...event,
      participantCount,
      spotsRemaining: event.maxParticipants
        ? event.maxParticipants - participantCount
        : null
    };
  }

  /**
   * List all events for a tournament
   */
  async listEventsByTournament(tournamentId) {
    // Validate tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!tournament) {
      const error = new Error('Tournament not found');
      error.statusCode = 404;
      throw error;
    }

    const events = await prisma.event.findMany({
      where: { tournamentId },
      include: {
        registrations: {
          where: {
            status: {
              not: 'CANCELLED'
            }
          },
          select: {
            id: true,
            userId: true,
            partnerId: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Add participant counts to events
    const eventsWithCounts = events.map(event => {
      let participantCount;

      // For doubles/mixed doubles, count unique teams (pairs)
      if (event.format === 'DOUBLES' || event.format === 'MIXED_DOUBLES') {
        const processedPairs = new Set();
        participantCount = 0;

        event.registrations.forEach(reg => {
          if (reg.partnerId) {
            // Create a consistent pair ID (sorted to avoid counting same pair twice)
            const pairId = [reg.userId, reg.partnerId].sort().join('-');
            if (!processedPairs.has(pairId)) {
              processedPairs.add(pairId);
              participantCount++;
            }
          }
        });
      } else {
        // For singles, count individual registrations
        participantCount = event.registrations.length;
      }

      return {
        ...event,
        participantCount,
        spotsRemaining: event.maxParticipants
          ? event.maxParticipants - participantCount
          : null
      };
    });

    return eventsWithCounts;
  }
}

module.exports = new EventService();
