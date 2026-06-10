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
        registrationFee: eventData.registrationFee || null
      },
      include: {
        _count: {
          select: {
            registrations: true
          }
        }
      }
    });

    return {
      ...event,
      participantCount: event._count.registrations,
      spotsRemaining: event.maxParticipants
        ? event.maxParticipants - event._count.registrations
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
        _count: {
          select: {
            registrations: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Add participant counts to events
    const eventsWithCounts = events.map(event => ({
      ...event,
      participantCount: event._count.registrations,
      spotsRemaining: event.maxParticipants
        ? event.maxParticipants - event._count.registrations
        : null
    }));

    return eventsWithCounts;
  }
}

module.exports = new EventService();
