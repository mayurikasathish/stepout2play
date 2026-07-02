const notificationService = require('../services/notification.service');
const liveFeedService = require('../services/livefeed.service');

/**
 * Helper functions to create common notification types
 */

const NotificationHelpers = {
  // Organization invitation
  async sendOrgInvitation({ inviteeId, inviterName, orgName, orgId, role }) {
    return await notificationService.createNotification({
      userId: inviteeId,
      type: 'ORG_INVITE',
      title: 'Organization Invitation',
      message: `${inviterName} invited you to join ${orgName}`,
      data: { orgId, role, inviterName },
      actionUrl: `/manage`,
      actionText: 'View Invitation',
      icon: 'user-group',
      priority: 'HIGH'
    });
  },

  // Match starting soon
  async sendMatchReminder({ userId, eventName, matchTime, tournamentId }) {
    return await notificationService.createNotification({
      userId,
      type: 'MATCH_SOON',
      title: 'Match Starting Soon',
      message: `Your match in ${eventName} starts at ${matchTime}`,
      data: { eventName, matchTime },
      actionUrl: `/tournaments/${tournamentId}`,
      actionText: 'View Details',
      icon: 'clock',
      priority: 'HIGH'
    });
  },

  // Standby promoted
  async sendStandbyPromotion({ userId, eventName, eventId }) {
    return await notificationService.createNotification({
      userId,
      type: 'STANDBY_PROMOTED',
      title: 'Promoted from Standby!',
      message: `You've been promoted from standby for ${eventName}`,
      data: { eventName, eventId },
      actionUrl: `/events/${eventId}`,
      actionText: 'View Event',
      icon: 'trophy',
      priority: 'HIGH'
    });
  },

  // Player withdrawal notification (to organizer)
  async sendWithdrawalNotification({ organizerId, playerName, eventName, tournamentId, eventId, standbyCount, replacementWindowOpen }) {
    let message = `${playerName} withdrew from ${eventName}`;
    let actionUrl = `/tournaments/${tournamentId}/manage`;
    let actionText = 'Manage Tournament';

    if (replacementWindowOpen && standbyCount > 0) {
      message = `${playerName} withdrew from ${eventName}. ${standbyCount} standby player(s) waiting.`;
      actionUrl = `/tournaments/${tournamentId}/manage?event=${eventId}&tab=registrations`;
      actionText = 'Notify Standby Players';
    }

    return await notificationService.createNotification({
      userId: organizerId,
      type: 'PLAYER_WITHDREW',
      title: 'Player Withdrawal',
      message,
      data: { playerName, eventName, eventId, standbyCount, replacementWindowOpen },
      actionUrl,
      actionText,
      icon: 'warning',
      priority: 'HIGH'
    });
  },

  // Registration deadline reminder
  async sendRegistrationDeadlineReminder({ userId, tournamentName, deadline, tournamentId }) {
    return await notificationService.createNotification({
      userId,
      type: 'REG_DEADLINE_SOON',
      title: 'Registration Closing Soon',
      message: `Registration for ${tournamentName} closes on ${deadline}`,
      data: { tournamentName, deadline },
      actionUrl: `/tournaments/${tournamentId}`,
      actionText: 'Register Now',
      icon: 'clock',
      priority: 'MEDIUM'
    });
  },

  // Bracket ready
  async sendBracketReady({ userId, tournamentName, tournamentId }) {
    return await notificationService.createNotification({
      userId,
      type: 'BRACKET_READY',
      title: 'Bracket Published',
      message: `The bracket for ${tournamentName} is now available`,
      data: { tournamentName },
      actionUrl: `/tournaments/${tournamentId}`,
      actionText: 'View Bracket',
      icon: 'trophy',
      priority: 'MEDIUM'
    });
  }
};

const LiveFeedHelpers = {
  // Player registered
  async playerRegistered({ actorId, playerName, eventName, tournamentId }) {
    return await liveFeedService.createFeedItem({
      actorId,
      type: 'PLAYER_REGISTERED',
      title: 'New Registration',
      message: `registered for ${eventName}`,
      targetId: tournamentId,
      targetType: 'tournament',
      visibility: 'public'
    });
  },

  // Tournament created
  async tournamentCreated({ actorId, tournamentName, city, tournamentId }) {
    return await liveFeedService.createFeedItem({
      actorId,
      type: 'TOURNAMENT_CREATED',
      title: 'New Tournament',
      message: `created a new tournament: ${tournamentName} in ${city}`,
      targetId: tournamentId,
      targetType: 'tournament',
      visibility: 'public'
    });
  },

  // Player won match
  async playerWonMatch({ actorId, eventName, tournamentId }) {
    return await liveFeedService.createFeedItem({
      actorId,
      type: 'MATCH_WON',
      title: 'Match Won',
      message: `won a match in ${eventName}`,
      targetId: tournamentId,
      targetType: 'tournament',
      visibility: 'public'
    });
  },

  // Player withdrew
  async playerWithdrew({ actorId, eventName, tournamentId }) {
    return await liveFeedService.createFeedItem({
      actorId,
      type: 'PLAYER_WITHDREW',
      title: 'Withdrawal',
      message: `withdrew from ${eventName}`,
      targetId: tournamentId,
      targetType: 'tournament',
      visibility: 'public'
    });
  }
};

module.exports = {
  NotificationHelpers,
  LiveFeedHelpers
};
