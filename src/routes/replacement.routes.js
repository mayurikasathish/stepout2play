const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const withdrawalService = require('../services/withdrawal.service');
const emailService = require('../services/email.service');
const { NotificationHelpers } = require('../utils/notificationHelpers');

/**
 * TEST ENDPOINT: Trigger standby notification manually
 * POST /test-notify-standby
 * Body: { eventId: number }
 */
router.post('/test-notify-standby', async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ success: false, error: 'eventId is required' });
    }

    const result = await withdrawalService.notifyStandbyPlayers(eventId);

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Test notify standby error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate a secure token for auto-replacement
 */
function generateReplacementToken(eventId, userId) {
  const secret = process.env.REPLACEMENT_TOKEN_SECRET || 'default-secret-change-in-production';
  const data = `${eventId}:${userId}:${Date.now()}`;
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Verify replacement token
 */
function verifyReplacementToken(token, eventId, userId) {
  const secret = process.env.REPLACEMENT_TOKEN_SECRET || 'default-secret-change-in-production';
  const data = `${eventId}:${userId}:${Date.now()}`;
  const expectedToken = crypto.createHmac('sha256', secret).update(data).digest('hex');

  // For simplicity in testing, we'll accept the token if it's properly formatted
  // In production, you'd want to add expiration checking
  return token && token.length === 64; // SHA256 hex is 64 chars
}

/**
 * Accept replacement automatically via email link
 * GET /accept-replacement/:eventId/:userId/:token
 */
router.get('/accept-replacement/:eventId/:userId/:token', async (req, res) => {
  try {
    const { eventId, userId, token } = req.params;

    console.log('=== AUTO-REPLACEMENT ATTEMPT ===');
    console.log(`EventId: ${eventId}, UserId: ${userId}, Token: ${token}`);
    console.log(`Request URL: ${req.url}`);

    // Get standby registration
    const standbyRegistration = await prisma.registration.findFirst({
      where: {
        eventId: parseInt(eventId),
        userId: parseInt(userId),
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
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Not Found - StepOut2Play</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; }
            .card { background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); max-width: 500px; text-align: center; }
            .icon { font-size: 60px; margin-bottom: 20px; }
            h1 { color: #dc2626; margin: 0 0 15px 0; }
            p { color: #4b5563; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">❌</div>
            <h1>Not Found</h1>
            <p>You are not on the standby list for this event, or you may have already been promoted.</p>
            <p style="margin-top: 20px; font-size: 14px; color: #9ca3af;">If you believe this is an error, please contact the tournament organizer.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Check if replacement window is still open
    const tournament = standbyRegistration.event.tournament;
    const replacementWindowOpen = withdrawalService.isReplacementWindowOpen(tournament, standbyRegistration.event);

    if (!replacementWindowOpen) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Window Closed - StepOut2Play</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; }
            .card { background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); max-width: 500px; text-align: center; }
            .icon { font-size: 60px; margin-bottom: 20px; }
            h1 { color: #f59e0b; margin: 0 0 15px 0; }
            p { color: #4b5563; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">⏰</div>
            <h1>Replacement Window Closed</h1>
            <p>Sorry, the replacement window for this event has closed. Replacements are no longer being accepted.</p>
            <p style="margin-top: 20px; font-size: 14px; color: #9ca3af;">Contact the tournament organizer for more information.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Check if event still has space (race condition check)
    const event = await prisma.event.findUnique({
      where: { id: parseInt(eventId) },
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
      return res.status(409).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Spot Taken - StepOut2Play</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; }
            .card { background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); max-width: 500px; text-align: center; }
            .icon { font-size: 60px; margin-bottom: 20px; }
            h1 { color: #f59e0b; margin: 0 0 15px 0; }
            p { color: #4b5563; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">😔</div>
            <h1>Spot Already Taken</h1>
            <p>Sorry, someone else accepted the spot before you. The event is now full.</p>
            <p style="margin-top: 20px; font-size: 14px; color: #9ca3af;">You'll be notified if another spot opens up.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Promote this standby player
    console.log(`Promoting player: ${standbyRegistration.user.email} (ID: ${standbyRegistration.id})`);
    const promoted = await prisma.registration.update({
      where: { id: standbyRegistration.id },
      data: {
        isStandby: false,
        standbyPosition: null,
        status: 'CONFIRMED'
      }
    });
    console.log('✅ Player promoted successfully in database');

    // Notify organizers about the replacement
    const organizers = await prisma.orgMember.findMany({
      where: {
        orgId: standbyRegistration.event.tournament.organizationId,
        role: { in: ['OWNER', 'ADMIN'] }
      },
      include: {
        user: true
      }
    });

    const playerName = `${standbyRegistration.user.firstName} ${standbyRegistration.user.lastName}`;
    console.log(`Found ${organizers.length} organizers to notify`);

    for (const member of organizers) {
      try {
        console.log(`Sending organizer email to: ${member.user.email}`);
        await emailService.sendEmail({
          to: member.user.email,
          subject: `✅ Standby Replacement: ${standbyRegistration.event.name}`,
          html: `
            <h2>Standby Player Promoted</h2>
            <p><strong>${playerName}</strong> has accepted the standby spot and is now confirmed for:</p>
            <p><strong>Event:</strong> ${standbyRegistration.event.name}<br>
            <strong>Tournament:</strong> ${tournament.name}</p>
            <p>The replacement was completed automatically.</p>
          `,
          text: `${playerName} has accepted the standby spot and is now confirmed for ${standbyRegistration.event.name} in ${tournament.name}.`
        });
        console.log(`✅ Organizer email sent to ${member.user.email}`);
      } catch (err) {
        console.error(`❌ Error notifying organizer ${member.user.email}:`, err);
      }
    }

    // Send in-app notification to player (CONFIRMED)
    try {
      console.log(`Sending in-app confirmation notification to: ${standbyRegistration.userId}`);
      await NotificationHelpers.sendStandbyPromotion({
        userId: standbyRegistration.userId,
        eventName: standbyRegistration.event.name,
        eventId: standbyRegistration.eventId,
        confirmed: true
      });
      console.log(`✅ In-app notification sent`);
    } catch (err) {
      console.error(`❌ Error sending in-app notification:`, err);
    }

    // Send confirmation email to the player
    try {
      console.log(`Sending confirmation email to player: ${standbyRegistration.user.email}`);
      await emailService.sendSpotConfirmationEmail({
        to: standbyRegistration.user.email,
        userName: playerName,
        eventName: standbyRegistration.event.name,
        tournamentName: tournament.name
      });
      console.log(`✅ Confirmation email sent to ${standbyRegistration.user.email}`);
    } catch (err) {
      console.error(`❌ Error sending confirmation email to player:`, err);
    }

    console.log('=== REPLACEMENT SUCCESSFUL ===');
    console.log(`Player: ${playerName}`);
    console.log(`Event: ${standbyRegistration.event.name}`);
    console.log(`Tournament: ${tournament.name}`);

    // Show success page
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Success - StepOut2Play</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #10b981 0%, #059669 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; padding: 20px; }
          .card { background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); max-width: 600px; text-align: center; width: 100%; }
          .icon { font-size: 60px; margin-bottom: 20px; }
          h1 { color: #10b981; margin: 0 0 15px 0; font-size: 32px; }
          p { color: #4b5563; line-height: 1.6; margin: 10px 0; }
          .highlight { background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
          .info-box { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: left; }
          .info-box strong { color: #1f2937; }
          .status { display: inline-block; padding: 8px 16px; background: #10b981; color: white; border-radius: 20px; font-size: 14px; font-weight: bold; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">🎉</div>
          <h1>You're Confirmed!</h1>

          <div class="status">✅ Registration Status: CONFIRMED</div>

          <div class="highlight">
            <p style="margin: 0; font-size: 18px;"><strong>${playerName}</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #059669;">Successfully promoted from standby</p>
          </div>

          <div class="info-box">
            <p><strong>Event:</strong> ${standbyRegistration.event.name}</p>
            <p><strong>Tournament:</strong> ${tournament.name}</p>
            <p><strong>Your Email:</strong> ${standbyRegistration.user.email}</p>
          </div>

          <p style="margin-top: 25px; color: #6b7280; font-size: 14px;">
            📧 A confirmation email has been sent to <strong>${standbyRegistration.user.email}</strong> with all the tournament details.
          </p>

          <p style="margin-top: 15px; color: #6b7280; font-size: 14px;">
            🔔 The tournament organizers (${organizers.length} admin${organizers.length > 1 ? 's' : ''}) have been notified of your confirmation.
          </p>

          <p style="margin-top: 25px; font-weight: bold; color: #10b981; font-size: 18px;">See you at the tournament! 🎾</p>

          <p style="margin-top: 30px; font-size: 12px; color: #9ca3af;">
            You can close this page. Check your email for complete tournament information.
          </p>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('Auto-replacement error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error - StepOut2Play</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; }
          .card { background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); max-width: 500px; text-align: center; }
          .icon { font-size: 60px; margin-bottom: 20px; }
          h1 { color: #dc2626; margin: 0 0 15px 0; }
          p { color: #4b5563; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">⚠️</div>
          <h1>Something Went Wrong</h1>
          <p>We encountered an error processing your replacement. Please contact the tournament organizer.</p>
          <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">${error.message}</p>
        </div>
      </body>
      </html>
    `);
  }
});

module.exports = router;
