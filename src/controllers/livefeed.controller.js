const liveFeedService = require('../services/livefeed.service');

class LiveFeedController {
  /**
   * Get user's personalized feed
   * GET /live-feed
   */
  async getUserFeed(req, res, next) {
    try {
      const userId = req.user.id;
      const { limit } = req.query;

      const feed = await liveFeedService.getUserFeed(userId, {
        limit: limit ? parseInt(limit) : 50
      });

      res.status(200).json({
        success: true,
        feed
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get global feed
   * GET /live-feed/global
   */
  async getGlobalFeed(req, res, next) {
    try {
      const { limit } = req.query;

      const feed = await liveFeedService.getGlobalFeed({
        limit: limit ? parseInt(limit) : 50
      });

      res.status(200).json({
        success: true,
        feed
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LiveFeedController();
