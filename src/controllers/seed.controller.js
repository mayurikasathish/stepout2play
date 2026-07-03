const seedService = require('../services/seed.service');

class SeedController {
  /**
   * Generate seeds based on ratings
   * GET /events/:eventId/generate-seeds
   */
  async generateSeeds(req, res, next) {
    try {
      const { eventId } = req.params;

      const result = await seedService.generateSeeds(eventId);

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Apply seeds to event
   * POST /events/:eventId/apply-seeds
   */
  async applySeeds(req, res, next) {
    try {
      const { eventId } = req.params;
      const { seeds } = req.body; // Array of { registrationId, seedNumber }

      if (!seeds || !Array.isArray(seeds)) {
        return res.status(400).json({
          success: false,
          error: 'Seeds array is required'
        });
      }

      const result = await seedService.applySeeds(eventId, seeds);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clear all seeds
   * DELETE /events/:eventId/seeds
   */
  async clearSeeds(req, res, next) {
    try {
      const { eventId } = req.params;

      const result = await seedService.clearSeeds(eventId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SeedController();
