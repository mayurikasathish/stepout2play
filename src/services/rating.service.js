const prisma = require('../lib/prisma');

/**
 * Rating Service - Handles Glicko-2 player ratings
 *
 * Phase 1: Basic rating initialization and display
 * - Initialize ratings for new players (1200 base)
 * - Get player ratings per sport
 * - Display on profile page
 */
class RatingService {
  /**
   * Get or create a player's rating for a specific sport
   * @param {string} userId
   * @param {string} sportId
   * @returns {Promise<PlayerRating>}
   */
  async getOrCreateRating(userId, sportId) {
    // Try to find existing rating
    let rating = await prisma.playerRating.findUnique({
      where: {
        userId_sportId: {
          userId,
          sportId
        }
      }
    });

    // If doesn't exist, create with defaults
    if (!rating) {
      rating = await prisma.playerRating.create({
        data: {
          userId,
          sportId,
          rating: 1200.0,      // Base rating
          rd: 350.0,           // High uncertainty for new players
          volatility: 0.06,    // Standard volatility
          matchCount: 0
        }
      });

      console.log(`✅ Created new rating for user ${userId} in sport ${sportId}: 1200`);
    }

    return rating;
  }

  /**
   * Get all ratings for a user across all sports
   * @param {string} userId
   * @returns {Promise<PlayerRating[]>}
   */
  async getUserRatings(userId) {
    // Get all available sports
    const sportsService = require('./sports.service');
    const allSports = sportsService.getAllSports();

    // Get or create ratings for all sports
    const ratingsPromises = allSports.map(sport =>
      this.getOrCreateRating(userId, sport.id)
    );

    const ratings = await Promise.all(ratingsPromises);

    // Sort by rating descending
    return ratings.sort((a, b) => b.rating - a.rating);
  }

  /**
   * Get user's rating for a specific sport
   * Returns base rating (1200) if no rating exists yet
   * @param {string} userId
   * @param {string} sportId
   * @returns {Promise<number>}
   */
  async getUserRatingForSport(userId, sportId) {
    const rating = await this.getOrCreateRating(userId, sportId);
    return Math.round(rating.rating);
  }

  /**
   * Get leaderboard for a specific sport
   * @param {string} sportId
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  async getLeaderboard(sportId, limit = 50) {
    const ratings = await prisma.playerRating.findMany({
      where: {
        sportId,
        matchCount: {
          gte: 1  // Only show players who have played at least 1 match
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            city: true,
            profilePicture: true
          }
        }
      },
      orderBy: { rating: 'desc' },
      take: limit
    });

    return ratings.map((rating, index) => ({
      rank: index + 1,
      userId: rating.userId,
      name: `${rating.user.firstName} ${rating.user.lastName}`,
      city: rating.user.city,
      profilePicture: rating.user.profilePicture,
      rating: Math.round(rating.rating),
      matchCount: rating.matchCount,
      lastMatchDate: rating.lastMatchDate
    }));
  }

  /**
   * Initialize ratings for all players in an event
   * Useful when generating seeds
   * @param {string} eventId
   * @returns {Promise<void>}
   */
  async initializeEventPlayerRatings(eventId) {
    // Get event with sport info
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: {
          where: {
            status: 'CONFIRMED',
            isWithdrawn: false
          },
          select: {
            userId: true
          }
        }
      }
    });

    if (!event || !event.sportId) {
      throw new Error('Event not found or sport not specified');
    }

    // Create ratings for all players if they don't exist
    const promises = event.registrations.map(reg =>
      this.getOrCreateRating(reg.userId, event.sportId)
    );

    await Promise.all(promises);

    console.log(`✅ Initialized ratings for ${event.registrations.length} players in event ${eventId}`);
  }

  /**
   * Get rating statistics
   * @param {string} sportId
   * @returns {Promise<Object>}
   */
  async getRatingStats(sportId) {
    const ratings = await prisma.playerRating.findMany({
      where: {
        sportId,
        matchCount: { gte: 1 }
      }
    });

    if (ratings.length === 0) {
      return {
        count: 0,
        average: 1200,
        highest: 1200,
        lowest: 1200
      };
    }

    const ratingValues = ratings.map(r => r.rating);

    return {
      count: ratings.length,
      average: Math.round(ratingValues.reduce((a, b) => a + b, 0) / ratings.length),
      highest: Math.round(Math.max(...ratingValues)),
      lowest: Math.round(Math.min(...ratingValues))
    };
  }
}

module.exports = new RatingService();
