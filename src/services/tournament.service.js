const prisma = require('../lib/prisma');

class TournamentService {
  /**
   * Create a new tournament
   */
  async createTournament(organizationId, tournamentData) {
    // Validate organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    if (!organization) {
      const error = new Error('Organization not found');
      error.statusCode = 404;
      throw error;
    }

    // Validate dates
    const startDate = new Date(tournamentData.startDate);
    const endDate = new Date(tournamentData.endDate);
    const registrationDeadline = new Date(tournamentData.registrationDeadline);

    if (endDate <= startDate) {
      const error = new Error('End date must be after start date');
      error.statusCode = 400;
      throw error;
    }

    if (registrationDeadline >= startDate) {
      const error = new Error('Registration deadline must be before start date');
      error.statusCode = 400;
      throw error;
    }

    // Create tournament
    const tournament = await prisma.tournament.create({
      data: {
        organizationId,
        name: tournamentData.name,
        sport: tournamentData.sport,
        format: tournamentData.format || 'BRACKET',
        startDate,
        endDate,
        venueName: tournamentData.venueName,
        venueAddress: tournamentData.venueAddress || null,
        city: tournamentData.city,
        registrationDeadline,
        entryFee: tournamentData.entryFee || null,
        description: tournamentData.description || null,
        maxParticipants: tournamentData.maxParticipants || null,
        status: tournamentData.status || 'DRAFT'
      },
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

    return tournament;
  }

  /**
   * List tournaments with filters
   */
  async listTournaments(filters = {}) {
    const where = {};

    // Filter by sport
    if (filters.sport) {
      where.sport = filters.sport;
    }

    // Filter by city
    if (filters.city) {
      where.city = {
        contains: filters.city,
        mode: 'insensitive'
      };
    }

    // Filter by status
    if (filters.status) {
      where.status = filters.status;
    }

    const tournaments = await prisma.tournament.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true
          }
        },
        events: {
          select: {
            id: true,
            name: true,
            format: true,
            maxParticipants: true,
            _count: {
              select: {
                registrations: true
              }
            }
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    });

    // Calculate participant counts
    const tournamentsWithCounts = tournaments.map(tournament => {
      const totalRegistrations = tournament.events.reduce(
        (sum, event) => sum + event._count.registrations,
        0
      );

      const maxParticipants = tournament.maxParticipants ||
        tournament.events.reduce((sum, event) => sum + (event.maxParticipants || 0), 0);

      return {
        ...tournament,
        participantCount: totalRegistrations,
        maxParticipants: maxParticipants || null
      };
    });

    return tournamentsWithCounts;
  }

  /**
   * Get tournament by ID with full details
   */
  async getTournamentById(tournamentId) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true
          }
        },
        events: {
          select: {
            id: true,
            name: true,
            format: true,
            maxParticipants: true,
            registrationFee: true,
            _count: {
              select: {
                registrations: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!tournament) {
      const error = new Error('Tournament not found');
      error.statusCode = 404;
      throw error;
    }

    // Calculate participant counts for tournament
    const totalRegistrations = tournament.events.reduce(
      (sum, event) => sum + event._count.registrations,
      0
    );

    const maxParticipants = tournament.maxParticipants ||
      tournament.events.reduce((sum, event) => sum + (event.maxParticipants || 0), 0);

    // Add counts to events
    const eventsWithCounts = tournament.events.map(event => ({
      ...event,
      participantCount: event._count.registrations,
      spotsRemaining: event.maxParticipants
        ? event.maxParticipants - event._count.registrations
        : null
    }));

    return {
      ...tournament,
      events: eventsWithCounts,
      participantCount: totalRegistrations,
      maxParticipants: maxParticipants || null,
      spotsRemaining: maxParticipants ? maxParticipants - totalRegistrations : null
    };
  }

  /**
   * Get all registrations for a tournament (across all events)
   */
  async getTournamentRegistrations(tournamentId) {
    const prisma = require('../lib/prisma');

    // First verify tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        events: {
          include: {
            registrations: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    gender: true,
                    dob: true
                  }
                },
                partner: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    gender: true,
                    dob: true
                  }
                },
                event: {
                  select: {
                    id: true,
                    name: true,
                    format: true,
                    category: true,
                    gender: true
                  }
                }
              },
              orderBy: {
                createdAt: 'asc'
              }
            }
          }
        }
      }
    });

    if (!tournament) {
      const error = new Error('Tournament not found');
      error.statusCode = 404;
      throw error;
    }

    // Flatten registrations from all events
    const allRegistrations = [];
    tournament.events.forEach(event => {
      event.registrations.forEach(reg => {
        allRegistrations.push(reg);
      });
    });

    return allRegistrations;
  }
}

module.exports = new TournamentService();
