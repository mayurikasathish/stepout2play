const prisma = require('../lib/prisma');
const { NotificationHelpers } = require('../utils/notificationHelpers');
const emailService = require('./email.service');

class WithdrawalService {
  /**
   * Check if replacement window is still open
   */
  isReplacementWindowOpen(tournament, event) {
    const now = new Date();

    // Parse the start date properly (tournament.startDate is a Date object from Prisma)
    const startDate = new Date(tournament.startDate);

    // Create event start time in local timezone
    const eventStartTime = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
      0, 0, 0, 0
    );

    // Add start time if available
    if (tournament.startTime) {
      const [hours, minutes] = tournament.startTime.split(':');
      eventStartTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }

    const replacementWindowHours = tournament.replacementWindowHours || 24;
    const lockTime = new Date(eventStartTime.getTime() - replacementWindowHours * 60 * 60 * 1000);

    console.log('\n=== REPLACEMENT WINDOW CHECK ===');
    console.log(`Tournament: ${tournament.name}`);
    console.log(`Current time: ${now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (${now.toISOString()})`);
    console.log(`Tournament starts: ${eventStartTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (${eventStartTime.toISOString()})`);
    console.log(`Replacement window: ${replacementWindowHours} hours before start`);
    console.log(`Lock time (deadline): ${lockTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (${lockTime.toISOString()})`);

    const isOpen = now < lockTime;
    console.log(`\nCurrent < Deadline? ${now.getTime()} < ${lockTime.getTime()}`);
    console.log(`Window is ${isOpen ? 'OPEN ✅' : 'CLOSED ❌'}`);
    console.log('================================\n');

    return isOpen;
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
    console.log('=== NOTIFY STANDBY PLAYERS SERVICE ===');
    console.log(`Looking for standby players in event: ${eventId}`);

    // Get ALL standby players
    const standbyPlayers = await prisma.registration.findMany({
      where: {
        eventId: eventId, // eventId is a UUID string, don't parse it!
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

    console.log(`Found ${standbyPlayers?.length || 0} standby players`);

    if (!standbyPlayers || standbyPlayers.length === 0) {
      console.log('❌ No standby players available for promotion');
      return {
        notified: 0,
        message: 'No standby players available to notify.'
      };
    }

    console.log('Standby players:', standbyPlayers.map(p => ({
      id: p.id,
      userId: p.userId,
      email: p.user.email,
      position: p.standbyPosition
    })));

    // Send notification email to ALL standby players
    // The email will contain a link to accept the spot
    // First person to click and accept gets promoted

    let successCount = 0;
    let errors = [];

    for (const standbyPlayer of standbyPlayers) {
      console.log(`\n--- Processing standby player #${standbyPlayer.standbyPosition}: ${standbyPlayer.user.email} ---`);

      try {
        // In-app notification - SPOT AVAILABLE (not promoted yet!)
        console.log('Sending in-app notification...');
        const notifResult = await NotificationHelpers.sendStandbySpotAvailable({
          userId: standbyPlayer.userId,
          eventName: standbyPlayer.event.name,
          eventId: standbyPlayer.eventId,
          tournamentName: standbyPlayer.event.tournament.name,
          standbyPosition: standbyPlayer.standbyPosition,
          registrationId: standbyPlayer.id
        });
        console.log('In-app notification result:', notifResult);

        // Email notification
        console.log('Sending email notification...');
        const emailResult = await emailService.sendStandbyPromotionEmail({
          to: standbyPlayer.user.email,
          userName: `${standbyPlayer.user.firstName} ${standbyPlayer.user.lastName}`,
          eventName: standbyPlayer.event.name,
          tournamentName: standbyPlayer.event.tournament.name,
          eventId: standbyPlayer.eventId,
          userId: standbyPlayer.userId,
          standbyPosition: standbyPlayer.standbyPosition
        });
        console.log('Email result:', emailResult);

        console.log(`✅ Sent spot available notification to standby player #${standbyPlayer.standbyPosition}: ${standbyPlayer.user.email}`);
        successCount++;
      } catch (err) {
        console.error(`\n\n❌❌❌ ERROR SENDING TO ${standbyPlayer.user.email} ❌❌❌`);
        console.error('Error message:', err.message);
        console.error('Error name:', err.name);
        console.error('Full error:', err);
        console.error('Stack:', err.stack);
        errors.push({ email: standbyPlayer.user.email, error: err.message });
      }
    }

    console.log(`\n=== NOTIFICATION SUMMARY ===`);
    console.log(`Total standby players: ${standbyPlayers.length}`);
    console.log(`Successfully notified: ${successCount}`);
    console.log(`Failed: ${errors.length}`);

    if (errors.length > 0) {
      console.error('\n❌❌❌ ERRORS OCCURRED ❌❌❌');
      errors.forEach(e => {
        console.error(`  - ${e.email}: ${e.error}`);
      });
      throw new Error(`Failed to notify ${errors.length} standby player(s). Check server logs for details.`);
    }

    // Return info about how many were notified
    return {
      notified: successCount,
      message: `${successCount} standby player(s) have been notified via email. First to accept gets the spot.`
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

    // Check if replacement window is still open
    const tournament = standbyRegistration.event.tournament;
    const replacementWindowOpen = this.isReplacementWindowOpen(tournament, standbyRegistration.event);

    if (!replacementWindowOpen) {
      const error = new Error('The replacement window has closed. Replacements are no longer being accepted for this event.');
      error.statusCode = 400;
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
    const playerName = `${standbyRegistration.user.firstName} ${standbyRegistration.user.lastName}`;

    try {
      // In-app notification to player
      await NotificationHelpers.sendStandbyPromotion({
        userId: standbyRegistration.userId,
        eventName: standbyRegistration.event.name,
        eventId: standbyRegistration.eventId,
        confirmed: true
      });

      // Email confirmation to player
      await emailService.sendSpotConfirmationEmail({
        to: standbyRegistration.user.email,
        userName: playerName,
        eventName: standbyRegistration.event.name,
        tournamentName: standbyRegistration.event.tournament.name
      });
    } catch (err) {
      console.error('Error sending confirmation notification:', err);
    }

    // Notify organizers about the acceptance
    try {
      const organizers = await prisma.orgMember.findMany({
        where: {
          orgId: standbyRegistration.event.tournament.organizationId,
          role: { in: ['OWNER', 'ADMIN'] }
        },
        include: {
          user: true
        }
      });

      for (const member of organizers) {
        try {
          // In-app notification to organizer
          await NotificationHelpers.sendStandbyAcceptedNotification({
            organizerId: member.userId,
            playerName,
            eventName: standbyRegistration.event.name,
            tournamentId: standbyRegistration.event.tournament.id,
            eventId: standbyRegistration.eventId
          });

          // Email to organizer
          await emailService.sendEmail({
            to: member.user.email,
            subject: `✅ Standby Player Confirmed: ${standbyRegistration.event.name}`,
            html: `
              <h2>Standby Player Accepted Promotion</h2>
              <p><strong>${playerName}</strong> has accepted their standby promotion and is now confirmed for:</p>
              <p><strong>Event:</strong> ${standbyRegistration.event.name}<br>
              <strong>Tournament:</strong> ${standbyRegistration.event.tournament.name}</p>
              <p>The player has been automatically promoted to confirmed status.</p>
            `,
            text: `${playerName} has accepted their standby promotion for ${standbyRegistration.event.name} and is now confirmed.`
          });
        } catch (err) {
          console.error(`Error notifying organizer ${member.user.email}:`, err);
        }
      }
    } catch (err) {
      console.error('Error getting organizers:', err);
    }

    return {
      message: 'Successfully promoted from standby to confirmed!',
      registration: promoted
    };
  }

  /**
   * Reject standby promotion
   */
  async rejectStandbySpot(eventId, userId) {
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

    // Just log the rejection (no database change needed, they stay on standby)
    console.log(`Player ${standbyRegistration.user.email} declined standby promotion for event ${eventId}`);

    return {
      message: 'You have declined this promotion. You will remain on the standby list.'
    };
  }
}

module.exports = new WithdrawalService();
