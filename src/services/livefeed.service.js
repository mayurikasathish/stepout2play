const prisma = require('../lib/prisma');

class LiveFeedService {
  /**
   * Create a live feed item
   */
  async createFeedItem({
    actorId,
    type,
    title,
    message,
    data = null,
    targetId = null,
    targetType = null,
    visibility = 'public'
  }) {
    return await prisma.liveFeedItem.create({
      data: {
        actorId,
        type,
        title,
        message,
        data,
        targetId,
        targetType,
        visibility
      }
    });
  }

  /**
   * Get live feed for user
   * Based on: city, sports, visibility
   */
  async getUserFeed(userId, { limit = 50 } = {}) {
    // Get user info to filter by city and sports
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        city: true,
        sports: true
      }
    });

    // For now, get all public feed items
    // TODO: Filter by user's city, sports, followers in future
    const feedItems = await prisma.liveFeedItem.findMany({
      where: {
        visibility: 'public'
      },
      include: {
        actor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return feedItems;
  }

  /**
   * Get global feed (trending, popular)
   */
  async getGlobalFeed({ limit = 50 } = {}) {
    return await prisma.liveFeedItem.findMany({
      where: {
        visibility: 'public'
      },
      include: {
        actor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }
}

module.exports = new LiveFeedService();
