const prisma = require('../lib/prisma');

class RegistrationService {
  /**
   * Register a user for an event
   */
  async registerForEvent(userId, eventId, registrationData = {}) {
    // Get event with tournament details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        tournament: true,
        _count: {
          select: {
            registrations: true
          }
        }
      }
    });

    if (!event) {
      const error = new Error('Event not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if tournament registration is still open
    const now = new Date();
    if (new Date(event.tournament.registrationDeadline) < now) {
      const error = new Error('Registration deadline has passed');
      error.statusCode = 400;
      throw error;
    }

    if (event.tournament.status === 'CLOSED' || event.tournament.status === 'COMPLETED') {
      const error = new Error('Tournament registration is closed');
      error.statusCode = 400;
      throw error;
    }

    // Count confirmed registrations (excluding withdrawn and standby)
    const confirmedCount = await prisma.registration.count({
      where: {
        eventId,
        status: 'CONFIRMED',
        isWithdrawn: false
      }
    });

    // Determine if this should be confirmed or standby
    let isStandby = false;
    let standbyPosition = null;
    let status = 'CONFIRMED';

    if (event.maxParticipants && confirmedCount >= event.maxParticipants) {
      // Event is full - add to standby
      const standbyCount = await prisma.registration.count({
        where: {
          eventId,
          status: 'STANDBY',
          isStandby: true,
          isWithdrawn: false
        }
      });

      isStandby = true;
      standbyPosition = standbyCount + 1;
      status = 'STANDBY';
    }

    // Check if user has any existing registration (confirmed or cancelled)
    const existingRegistration = await prisma.registration.findUnique({
      where: {
        userId_eventId: { userId, eventId }
      }
    });

    // If already confirmed and NOT withdrawn, throw error
    if (existingRegistration && existingRegistration.status === 'CONFIRMED' && !existingRegistration.isWithdrawn) {
      const error = new Error('You are already registered for this event');
      error.statusCode = 409;
      throw error;
    }

    // If already on standby and NOT withdrawn, throw error
    if (existingRegistration && existingRegistration.status === 'STANDBY' && !existingRegistration.isWithdrawn) {
      const error = new Error('You are already on the standby list for this event');
      error.statusCode = 409;
      throw error;
    }

    // For doubles, validate partner
    let partnerId = null;
    if (event.format === 'DOUBLES' || event.format === 'MIXED_DOUBLES') {
      if (registrationData.partnerId) {
        // Validate partner exists
        const partner = await prisma.user.findUnique({
          where: { id: registrationData.partnerId }
        });

        if (!partner) {
          const error = new Error('Partner not found');
          error.statusCode = 404;
          throw error;
        }

        // Check if partner is already registered (as primary or partner) and not cancelled
        const partnerRegistration = await prisma.registration.findFirst({
          where: {
            eventId,
            status: 'CONFIRMED',
            OR: [
              { userId: registrationData.partnerId },
              { partnerId: registrationData.partnerId }
            ]
          }
        });

        if (partnerRegistration) {
          const error = new Error('Partner is already registered for this event');
          error.statusCode = 409;
          throw error;
        }

        partnerId = registrationData.partnerId;
      }
      // For doubles, partnerId can be null if registering solo and will find partner later
    }

    // Get registration order
    const registrationOrder = await prisma.registration.count({
      where: { eventId }
    }) + 1;

    // If there's a cancelled or withdrawn registration, update it. Otherwise create new
    let registration;
    if (existingRegistration && (existingRegistration.status === 'CANCELLED' || existingRegistration.isWithdrawn)) {
      // Update the cancelled/withdrawn registration back to CONFIRMED or STANDBY
      registration = await prisma.registration.update({
        where: { id: existingRegistration.id },
        data: {
          partnerId,
          teamName: registrationData.teamName || null,
          status,
          isStandby,
          standbyPosition,
          registrationOrder,
          isWithdrawn: false,
          withdrawnAt: null,
          withdrawalReason: null
        },
      });
    } else {
      // Get next player ID for this event
      const { getNextPlayerId } = require('../utils/playerIdGenerator');
      const playerId = await getNextPlayerId(eventId);

      // Create new registration with player ID
      registration = await prisma.registration.create({
        data: {
          userId,
          eventId,
          partnerId,
          teamName: registrationData.teamName || null,
          playerId,
          status,
          isStandby,
          standbyPosition,
          registrationOrder
        },
      });

      console.log(`✅ Assigned player ID ${playerId} to new registration`);
    }

    // Fetch the complete registration with relations
    registration = await prisma.registration.findUnique({
      where: { id: registration.id },
      include: {
        event: {
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
                sport: true,
                startDate: true,
                venueName: true,
                city: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        partner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return registration;
  }

  /**
   * Get all registrations for a user
   */
  async getMyRegistrations(userId) {
    const registrations = await prisma.registration.findMany({
      where: {
        OR: [
          { userId },
          { partnerId: userId }
        ]
      },
      include: {
        event: {
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
                sport: true,
                startDate: true,
                endDate: true,
                venueName: true,
                city: true,
                status: true,
                registrationDeadline: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        partner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return registrations;
  }

  /**
   * Get all registrations for an event (organizer view)
   */
  async getEventRegistrations(eventId) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        tournament: true
      }
    });

    if (!event) {
      const error = new Error('Event not found');
      error.statusCode = 404;
      throw error;
    }

    const registrations = await prisma.registration.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        partner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return registrations;
  }
}

module.exports = new RegistrationService();
