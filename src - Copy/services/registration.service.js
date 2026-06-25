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

    // Check if event is full
    if (event.maxParticipants && event._count.registrations >= event.maxParticipants) {
      const error = new Error('Event is full');
      error.statusCode = 400;
      throw error;
    }

    // Check if user has any existing registration (confirmed or cancelled)
    const existingRegistration = await prisma.registration.findUnique({
      where: {
        userId_eventId: { userId, eventId }
      }
    });

    // If already confirmed, throw error
    if (existingRegistration && existingRegistration.status === 'CONFIRMED') {
      const error = new Error('You are already registered for this event');
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

    // If there's a cancelled registration, update it. Otherwise create new
    let registration;
    if (existingRegistration && existingRegistration.status === 'CANCELLED') {
      // Update the cancelled registration back to CONFIRMED
      registration = await prisma.registration.update({
        where: { id: existingRegistration.id },
        data: {
          partnerId,
          status: 'CONFIRMED'
        },
      });
    } else {
      // Create new registration
      registration = await prisma.registration.create({
        data: {
          userId,
          eventId,
          partnerId,
          status: 'CONFIRMED'
        },
      });
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
