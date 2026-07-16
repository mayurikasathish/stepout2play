const prisma = require('../lib/prisma');

class TournamentService {
  /**
   * Calculate computed status based on dates
   * Organizer can only set DRAFT or OPEN
   * System calculates: CLOSED, ONGOING, COMPLETED
   */
  calculateStatus(tournament) {
    const now = new Date();
    const registrationDeadline = new Date(tournament.registrationDeadline);
    const startDate = new Date(tournament.startDate);
    const endDate = new Date(tournament.endDate);

    // If organizer set it to DRAFT, keep it DRAFT
    if (tournament.status === 'DRAFT') {
      return 'DRAFT';
    }

    // If organizer set it to OPEN, calculate based on dates
    if (tournament.status === 'OPEN') {
      // Tournament ended
      if (now > endDate) {
        return 'COMPLETED';
      }

      // Tournament started
      if (now >= startDate) {
        return 'ONGOING';
      }

      // Registration deadline passed
      if (now > registrationDeadline) {
        return 'CLOSED';
      }

      // Still open for registration
      return 'OPEN';
    }

    // Fallback to stored status (shouldn't happen)
    return tournament.status;
  }
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
        sportType: tournamentData.sportType || 'single',
        sports: tournamentData.sports || [tournamentData.sport],
        format: tournamentData.format || 'BRACKET',
        startDate,
        endDate,
        startTime: tournamentData.startTime || null,
        endTime: tournamentData.endTime || null,
        venueName: tournamentData.venueName,
        venueAddress: tournamentData.venueAddress || null,
        city: tournamentData.city,
        state: tournamentData.state || null,
        latitude: tournamentData.latitude || null,
        longitude: tournamentData.longitude || null,
        registrationDeadline,
        entryFee: tournamentData.entryFee || null,
        description: tournamentData.description || null,
        rules: tournamentData.rules || null,
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

    // Don't filter by status in database query - we'll filter after calculating status

    const tournaments = await prisma.tournament.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            contactEmail: true,
            contactPhone: true
          }
        },
        events: {
          select: {
            id: true,
            name: true,
            format: true,
            category: true,
            gender: true,
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

    // Calculate participant counts and computed status
    let tournamentsWithCounts = tournaments.map(tournament => {
      const totalRegistrations = tournament.events.reduce(
        (sum, event) => sum + event._count.registrations,
        0
      );

      const maxParticipants = tournament.maxParticipants ||
        tournament.events.reduce((sum, event) => sum + (event.maxParticipants || 0), 0);

      return {
        ...tournament,
        participantCount: totalRegistrations,
        maxParticipants: maxParticipants || null,
        status: this.calculateStatus(tournament)
      };
    });

    // Filter by computed status after calculation
    if (filters.status) {
      tournamentsWithCounts = tournamentsWithCounts.filter(t => t.status === filters.status);
    } else {
      // By default, exclude DRAFT and COMPLETED tournaments from browse page
      tournamentsWithCounts = tournamentsWithCounts.filter(t =>
        t.status !== 'COMPLETED' && t.status !== 'DRAFT'
      );
    }

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
            logoUrl: true,
            contactEmail: true,
            contactPhone: true
          }
        },
        events: {
          select: {
            id: true,
            name: true,
            format: true,
            category: true,
            gender: true,
            maxParticipants: true,
            registrationFee: true,
            rules: true,
            _count: {
              select: {
                registrations: {
                  where: {
                    isWithdrawn: false
                  }
                }
              }
            },
            registrations: {
              where: {
                isWithdrawn: false
              },
              select: {
                status: true,
                isStandby: true
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

    // Add counts to events only
    const eventsWithCounts = tournament.events.map(event => {
      const confirmedCount = event.registrations.filter(r => r.status === 'CONFIRMED' && !r.isStandby).length;
      const standbyCount = event.registrations.filter(r => r.status === 'STANDBY' && r.isStandby).length;

      return {
        ...event,
        participantCount: event._count.registrations, // Total (for backward compatibility)
        confirmedCount,
        standbyCount,
        spotsRemaining: event.maxParticipants
          ? event.maxParticipants - confirmedCount
          : null,
        registrations: undefined // Remove registrations from response
      };
    });

    return {
      ...tournament,
      events: eventsWithCounts,
      status: this.calculateStatus(tournament)
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
