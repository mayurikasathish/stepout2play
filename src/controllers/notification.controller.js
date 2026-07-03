const notificationService = require('../services/notification.service');

class NotificationController {
  /**
   * Get current user's notifications
   * GET /notifications
   */
  async getNotifications(req, res, next) {
    try {
      const userId = req.user.id;
      const { unreadOnly, limit } = req.query;

      const notifications = await notificationService.getUserNotifications(userId, {
        unreadOnly: unreadOnly === 'true',
        limit: limit ? parseInt(limit) : 50
      });

      res.status(200).json({
        success: true,
        notifications
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get unread count
   * GET /notifications/unread-count
   */
  async getUnreadCount(req, res, next) {
    try {
      const userId = req.user.id;
      const count = await notificationService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        count
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark notification as read
   * PATCH /notifications/:id/read
   */
  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await notificationService.markAsRead(id, userId);

      res.status(200).json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark all notifications as read
   * PATCH /notifications/read-all
   */
  async markAllAsRead(req, res, next) {
    try {
      const userId = req.user.id;

      await notificationService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete notification
   * DELETE /notifications/:id
   */
  async deleteNotification(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await notificationService.deleteNotification(id, userId);

      res.status(200).json({
        success: true,
        message: 'Notification deleted'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clear all notifications
   * DELETE /notifications/clear-all
   */
  async clearAll(req, res, next) {
    try {
      const userId = req.user.id;

      await notificationService.clearAllNotifications(userId);

      res.status(200).json({
        success: true,
        message: 'All notifications cleared'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
