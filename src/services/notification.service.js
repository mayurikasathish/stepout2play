const prisma = require('../lib/prisma');

class NotificationService {
  /**
   * Create a notification
   */
  async createNotification({
    userId,
    type,
    title,
    message,
    data = null,
    actionUrl = null,
    actionText = null,
    icon = null,
    priority = 'MEDIUM'
  }) {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data,
        actionUrl,
        actionText,
        icon,
        priority
      }
    });
  }

  /**
   * Get user's notifications
   */
  async getUserNotifications(userId, { unreadOnly = false, limit = 50 } = {}) {
    const where = { userId };
    if (unreadOnly) {
      where.read = false;
    }

    return await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    return await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId
      },
      data: {
        read: true
      }
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    return await prisma.notification.updateMany({
      where: {
        userId,
        read: false
      },
      data: {
        read: true
      }
    });
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId) {
    return await prisma.notification.count({
      where: {
        userId,
        read: false
      }
    });
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId, userId) {
    return await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId
      }
    });
  }
}

module.exports = new NotificationService();
