const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AchievementService {
  /**
   * Create achievement(s) for event completion
   * @param {String} eventId
   * @param {Array} placements - [{ userId, position }]
   */
  async createAchievements(eventId, placements) {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { tournamentId: true }
      });

      if (!event) {
        console.log(`⚠️ Event ${eventId} not found, skipping achievements`);
        return [];
      }

      const achievements = await Promise.all(
        placements.map(({ userId, position }) =>
          prisma.achievement.create({
            data: {
              userId,
              tournamentId: event.tournamentId,
              eventId,
              position,
              wonAt: new Date()
            }
          })
        )
      );

      console.log(`🏆 Created ${achievements.length} achievements for event ${eventId}`);
      return achievements;
    } catch (error) {
      console.error('⚠️ Error creating achievements:', error.message);
      throw error;
    }
  }

  /**
   * Get all achievements for a user
   */
  async getUserAchievements(userId) {
    const achievements = await prisma.achievement.findMany({
      where: { userId },
      include: {
        tournament: {
          select: {
            name: true,
            startDate: true
          }
        },
        event: {
          select: {
            name: true,
            sportId: true,
            format: true
          }
        }
      },
      orderBy: { wonAt: 'desc' }
    });

    return achievements;
  }

  /**
   * Get achievement summary (counts by position)
   */
  async getUserAchievementSummary(userId) {
    const achievements = await prisma.achievement.findMany({
      where: { userId },
      select: { position: true }
    });

    const summary = {
      gold: achievements.filter(a => a.position === 1).length,
      silver: achievements.filter(a => a.position === 2).length,
      bronze: achievements.filter(a => a.position === 3).length,
      total: achievements.length
    };

    return summary;
  }
}

module.exports = new AchievementService();
