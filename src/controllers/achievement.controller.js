const achievementService = require('../services/achievement.service');

class AchievementController {
  /**
   * GET /api/users/:userId/achievements
   * Get all achievements for a user
   */
  async getUserAchievements(req, res) {
    try {
      const { userId } = req.params;
      const achievements = await achievementService.getUserAchievements(userId);
      res.json({ success: true, achievements });
    } catch (error) {
      console.error('Error fetching achievements:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to fetch achievements'
      });
    }
  }

  /**
   * GET /api/users/:userId/achievements/summary
   * Get achievement summary (counts) for a user
   */
  async getUserAchievementSummary(req, res) {
    try {
      const { userId } = req.params;
      const summary = await achievementService.getUserAchievementSummary(userId);
      res.json({ success: true, summary });
    } catch (error) {
      console.error('Error fetching achievement summary:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to fetch achievement summary'
      });
    }
  }
}

module.exports = new AchievementController();
