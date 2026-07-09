const ratingService = require('../services/rating.service');

class RatingController {
  /**
   * Get user's ratings for all sports
   * GET /ratings/:userId
   */
  async getUserRatings(req, res, next) {
    try {
      const { userId } = req.params;

      const ratings = await ratingService.getUserRatings(userId);

      res.status(200).json({
        success: true,
        ratings
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's rating for a specific sport
   * GET /ratings/:userId/:sportId
   */
  async getUserRatingForSport(req, res, next) {
    try {
      const { userId, sportId } = req.params;

      const rating = await ratingService.getUserRatingForSport(userId, sportId);

      res.status(200).json({
        success: true,
        rating
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get leaderboard for a sport
   * GET /leaderboard/:sportId
   */
  async getLeaderboard(req, res, next) {
    try {
      const { sportId } = req.params;
      const limit = parseInt(req.query.limit) || 50;

      const leaderboard = await ratingService.getLeaderboard(sportId, limit);

      res.status(200).json({
        success: true,
        leaderboard,
        count: leaderboard.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get rating statistics for a sport
   * GET /ratings/stats/:sportId
   */
  async getRatingStats(req, res, next) {
    try {
      const { sportId } = req.params;

      const stats = await ratingService.getRatingStats(sportId);

      res.status(200).json({
        success: true,
        stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get rating history for a user in a specific sport
   * GET /ratings/:userId/:sportId/history
   */
  async getRatingHistory(req, res, next) {
    try {
      const { userId, sportId } = req.params;

      const prisma = require('../lib/prisma');

      // Get all rating changes for this user and sport, ordered by date
      const ratingChanges = await prisma.matchRatingChange.findMany({
        where: {
          userId,
          sportId
        },
        orderBy: {
          createdAt: 'asc'
        },
        select: {
          newRating: true,
          ratingChange: true,
          createdAt: true,
          match: {
            select: {
              id: true,
              completedAt: true
            }
          }
        }
      });

      // Transform into graph data points
      const history = ratingChanges.map(change => ({
        rating: Math.round(change.newRating),
        change: Math.round(change.ratingChange),
        date: change.createdAt,
        matchId: change.match.id
      }));

      // Add starting point (1200) if there's history
      if (history.length > 0) {
        const firstChange = ratingChanges[0];
        const startingRating = Math.round(firstChange.newRating - firstChange.ratingChange);
        history.unshift({
          rating: startingRating,
          change: 0,
          date: new Date(ratingChanges[0].createdAt.getTime() - 1000), // 1 second before first match
          matchId: null
        });
      }

      res.status(200).json({
        success: true,
        history,
        count: history.length
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RatingController();
