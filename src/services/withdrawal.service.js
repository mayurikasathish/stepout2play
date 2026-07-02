const prisma = require('../lib/prisma');
const { NotificationHelpers } = require('../utils/notificationHelpers');
const emailService = require('./email.service');

class WithdrawalService {
  /**
   * Check if replacement window is still open
   */
  isReplacementWindowOpen(tournament, event) {
    const now = new Date();
    const eventStartTime = new Date(tournament.startDate);

    // Add start time if available
    if (tournament.startTime) {
      const [hours, minutes] = tournament.startTime.split(':');
      eventStartTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }

    const replacementWindowHours = tournament.replacementWindowHours || 24;
    const lockTime = new Date(eventStartTime.getTime() - replacementWindowHours * 60 * 60 * 1000);

    return now < lockTime;
  }

  /**
   * Withdraw a player from an event
   */
  async withdrawPlayer(registrationId, userId, reason = null) {
    // Get registration with event and tournament details
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        event: {
          include: {
            tournament: true
          }
        },
        user: true
      }
    });

    if (!registration) {
      const error = new Error('Registration not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if user owns this registration
    if (registration.userId !== userId) {
      const error = new Error('Not authorized to withdraw this registration');
      error.statusCode = 403;
      throw error;
    }

    // Check if already withdrawn
    if (registration.isWithdrawn) {
      const error = new Error('Already withdrawn from this event');
      error.statusCode = 400;
      throw error;
    }

    // Check if event has already started
    const tournament = registration.event.tournament;
    const eventStartTime = new Date(tournament.startDate);
    if (tournament.startTime) {
      const [hours, minutes] = tournament.startTime.split(':');
      eventStartTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }

    const now = new Date();
    if (now >= eventStartTime) {
      const error = new Error('Cannot withdraw after event has started');
      error.statusCode = 400;
      throw error;
    }

    // Mark as withdrawn
    const updatedRegistration = await prisma.registration.update({
      where: { id: registrationId },
      data: {
        isWithdrawn: true,
        withdrawnAt: new Date(),
        withdrawalReason: reason,
        status: 'WITHDRAWN'
      }
    });

    // Notify organizers (get them separately)
    const organizers = await prisma.orgMember.findMany({
      where: {
        orgId: registration.event.tournament.organizationId,
        role: { in: ['OWNER', 'ADMIN'] }
      },
      include: {
        user: true
      }
    });

    // Check if replacement window is still open
    const replacementWindowOpen = this.isReplacementWindowOpen(tournament, registration.event);

    // Get standby count for organizer notification
    const standbyCount = await prisma.registration.count({
      where: {
        eventId: registration.eventId,
        isStandby: true,
        status: 'STANDBY',
        isWithdrawn: false
      }
    });

    for (const member of organizers) {
      try {
        // In-app notification
        await NotificationHelpers.sendWithdrawalNotification({
          organizerId: member.userId,
          playerName: `${registration.user.firstName} ${registration.user.lastName}`,
          eventName: registration.event.name,
          tournamentId: registration.event.tournamentId,
          eventId: registration.eventId,
          standbyCount,
          replacementWindowOpen
        });

        // Email notification
        await emailService.sendWithdrawalNotification({
          to: member.user.email,
          playerName: `${registration.user.firstName} ${registration.user.lastName}`,
          eventName: registration.event.name,
          tournamentName: registration.event.tournament.name,
          reason: reason
        });
      } catch (err) {
        console.error('Error sending withdrawal notification:', err);
      }
    }

    return {
      success: true,
      registration: updatedRegistration,
      replacementWindowOpen,
      standbyCount
    };
  }

  /**
   * Notify all standby players about an available spot (called by organizer)
   * They can accept by clicking a link in the email
   * First person to accept gets the spot
   */
  async notifyStandbyPlayers(eventId) {
    // Get ALL standby players
    const standbyPlayers = await prisma.registration.findMany({
      where: {
        eventId,
        isStandby: true,
        status: 'STANDBY',
        isWithdrawn: false
      },
      orderBy: {
        standbyPosition: 'asc'
      },
      include: {
        user: true,
        event: {
          include: {
            tournament: true
          }
        }
      }
    });

    if (!standbyPlayers || standbyPlayers.length === 0) {
      console.log('No standby players available for promotion');
      return null;
    }

    // Send notification email to ALL standby players
    // The email will contain a link to accept the spot
    // First person to click and accept gets promoted
    const baseUrl = process.env.CLIENT_URL || 'https://stepout2play-web.onrender.com';

    for (const standbyPlayer of standbyPlayers) {
      try {
        // In-app notification
        await NotificationHelpers.sendStandbyPromotion({
          userId: standbyPlayer.userId,
          eventName: standbyPlayer.event.name,
          eventId: standbyPlayer.eventId,
          tournamentName: standbyPlayer.event.tournament.name,
          standbyPosition: standbyPlayer.standbyPosition
        });

        // Email notification with accept link
        const acceptUrl = `${baseUrl}/matches?eventId=${standbyPlayer.eventId}&standbyPromotion=true`;
        await emailService.sendStandbyPromotionEmail({
          to: standbyPlayer.user.email,
          userName: `${standbyPlayer.user.firstName} ${standbyPlayer.user.lastName}`,
          eventName: standbyPlayer.event.name,
          tournamentName: standbyPlayer.event.tournament.name,
          acceptUrl,
          standbyPosition: standbyPlayer.standbyPosition
        });

        console.log(`Sent promotion notification to standby player #${standbyPlayer.standbyPosition}: ${standbyPlayer.user.email}`);
      } catch (err) {
        console.error('Error sending standby promotion notification:', err);
      }
    }

    // Return info about how many were notified
    return {
      notified: standbyPlayers.length,
      message: `${standbyPlayers.length} standby player(s) have been notified via email. First to accept gets the spot.`
    };
  }

  /**
   * Get standby list for an event
   */
  async getStandbyList(eventId) {
    return await prisma.registration.findMany({
      where: {
        eventId,
        isStandby: true,
        status: 'STANDBY',
        isWithdrawn: false
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        standbyPosition: 'asc'
      }
    });
  }

  /**
   * Accept a standby spot when notified
   * First standby player to accept gets promoted
   */
  async acceptStandbySpot(eventId, userId) {
    // Check if user is on standby for this event
    const standbyRegistration = await prisma.registration.findFirst({
      where: {
        eventId,
        userId,
        isStandby: true,
        status: 'STANDBY',
        isWithdrawn: false
      },
      include: {
        user: true,
        event: {
          include: {
            tournament: true
          }
        }
      }
    });

    if (!standbyRegistration) {
      const error = new Error('You are not on the standby list for this event');
      error.statusCode = 404;
      throw error;
    }

    // Check if event still has space (race condition check)
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            registrations: {
              where: {
                status: 'CONFIRMED',
                isWithdrawn: false,
                isStandby: false
              }
            }
          }
        }
      }
    });

    const confirmedCount = event._count.registrations;
    if (event.maxParticipants && confirmedCount >= event.maxParticipants) {
      const error = new Error('Event is already full. Someone else may have accepted the spot first.');
      error.statusCode = 409;
      throw error;
    }

    // Promote this standby player
    const promoted = await prisma.registration.update({
      where: { id: standbyRegistration.id },
      data: {
        isStandby: false,
        standbyPosition: null,
        status: 'CONFIRMED'
      }
    });

    // Send confirmation notification
    try {
      // In-app notification
      await NotificationHelpers.sendStandbyPromotion({
        userId: standbyRegistration.userId,
        eventName: standbyRegistration.event.name,
        eventId: standbyRegistration.eventId,
        confirmed: true
      });

      // Email confirmation
      await emailService.sendSpotConfirmationEmail({
        to: standbyRegistration.user.email,
        userName: `${standbyRegistration.user.firstName} ${standbyRegistration.user.lastName}`,
        eventName: standbyRegistration.event.name,
        tournamentName: standbyRegistration.event.tournament.name
      });
    } catch (err) {
      console.error('Error sending confirmation notification:', err);
    }

    return {
      message: 'Successfully promoted from standby to confirmed!',
      registration: promoted
    };
  }
}

module.exports = new WithdrawalService();
