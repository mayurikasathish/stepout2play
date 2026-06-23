const sportsService = require('../services/sports.service');

class SportsController {
  /**
   * Get all available sports
   * GET /sports
   */
  async getAllSports(req, res, next) {
    try {
      const sports = sportsService.getAllSports();

      res.status(200).json({
        success: true,
        sports,
        count: sports.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a specific sport by ID
   * GET /sports/:sportId
   */
  async getSportById(req, res, next) {
    try {
      const { sportId } = req.params;
      const sport = sportsService.getSportById(sportId);

      if (!sport) {
        return res.status(404).json({
          success: false,
          error: `Sport with ID "${sportId}" not found`
        });
      }

      res.status(200).json({
        success: true,
        sport
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get scoring rules for a sport
   * GET /sports/:sportId/rules
   */
  async getScoringRules(req, res, next) {
    try {
      const { sportId } = req.params;
      const rules = sportsService.getScoringRules(sportId);

      res.status(200).json({
        success: true,
        ...rules
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      next(error);
    }
  }
}

module.exports = new SportsController();
