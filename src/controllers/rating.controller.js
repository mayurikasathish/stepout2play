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
}

module.exports = new RatingController();
