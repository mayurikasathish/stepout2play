const withdrawalService = require('../services/withdrawal.service');

class WithdrawalController {
  /**
   * Withdraw from an event
   * POST /registrations/:registrationId/withdraw
   */
  async withdrawFromEvent(req, res, next) {
    try {
      const { registrationId } = req.params;
      const { reason } = req.body;
      const userId = req.user.id;

      const result = await withdrawalService.withdrawPlayer(registrationId, userId, reason);

      let message = 'Withdrawn successfully.';
      if (result.replacementWindowOpen && result.standbyCount > 0) {
        message = `Withdrawn successfully. The organizer has been notified and can choose to notify ${result.standbyCount} standby player(s).`;
      } else if (result.replacementWindowOpen) {
        message = 'Withdrawn successfully. No standby players are waiting.';
      } else {
        message = 'Withdrawn successfully. Replacement window is closed.';
      }

      res.status(200).json({
        success: true,
        message,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get standby list for an event
   * GET /events/:eventId/standby
   */
  async getStandbyList(req, res, next) {
    try {
      const { eventId } = req.params;

      const standbyList = await withdrawalService.getStandbyList(eventId);

      res.status(200).json({
        success: true,
        standbyList,
        count: standbyList.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Accept standby promotion
   * POST /events/:eventId/accept-spot
   */
  async acceptSpot(req, res, next) {
    try {
      const { eventId } = req.params;
      const userId = req.user.id;

      const result = await withdrawalService.acceptStandbySpot(eventId, userId);

      res.status(200).json({
        success: true,
        message: result.message,
        registration: result.registration
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject standby promotion
   * POST /events/:eventId/reject-spot
   */
  async rejectSpot(req, res, next) {
    try {
      const { eventId } = req.params;
      const userId = req.user.id;

      const result = await withdrawalService.rejectStandbySpot(eventId, userId);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Notify standby players about available spot (organizer only)
   * POST /events/:eventId/notify-standby
   */
  async notifyStandbyPlayers(req, res, next) {
    try {
      const { eventId } = req.params;

      console.log('=== NOTIFY STANDBY PLAYERS CONTROLLER ===');
      console.log(`EventId: ${eventId}`);
      console.log(`Called by user: ${req.user?.id}`);

      const result = await withdrawalService.notifyStandbyPlayers(eventId);

      console.log('✅ Notification result:', result);

      res.status(200).json({
        success: true,
        message: result.message,
        notifiedCount: result.notified
      });
    } catch (error) {
      console.error('❌ Error in notifyStandbyPlayers controller:', error);
      next(error);
    }
  }
}

module.exports = new WithdrawalController();
