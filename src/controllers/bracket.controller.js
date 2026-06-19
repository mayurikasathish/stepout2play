const bracketService = require('../services/bracket.service');

class BracketController {
  /**
   * Generate bracket for an event
   * POST /events/:eventId/generate-bracket
   */
  async generateBracket(req, res, next) {
    try {
      const { eventId } = req.params;
      const { bracketFormat, seedingMethod } = req.body;

      // Validation
      const errors = [];

      if (!bracketFormat || !['SINGLE_ELIMINATION', 'ROUND_ROBIN'].includes(bracketFormat)) {
        errors.push('bracketFormat must be either SINGLE_ELIMINATION or ROUND_ROBIN');
      }

      if (!seedingMethod || !['REGISTRATION_ORDER', 'RANDOM', 'MANUAL'].includes(seedingMethod)) {
        errors.push('seedingMethod must be REGISTRATION_ORDER, RANDOM, or MANUAL');
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          errors
        });
      }

      const result = await bracketService.generateBracket(eventId, bracketFormat, seedingMethod);

      res.status(201).json({
        success: true,
        message: 'Bracket generated successfully',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get bracket for an event
   * GET /events/:eventId/bracket
   */
  async getBracket(req, res, next) {
    try {
      const { eventId } = req.params;

      const bracket = await bracketService.getBracket(eventId);

      res.status(200).json({
        success: true,
        ...bracket
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete bracket for an event
   * DELETE /events/:eventId/bracket
   */
  async deleteBracket(req, res, next) {
    try {
      const { eventId } = req.params;

      const result = await bracketService.deleteBracket(eventId);

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update match result
   * PATCH /matches/:matchId/result
   */
  async updateMatchResult(req, res, next) {
    try {
      const { matchId } = req.params;
      const { winnerId, score } = req.body;

      // Validation
      if (!winnerId) {
        return res.status(400).json({
          success: false,
          error: 'winnerId is required'
        });
      }

      const match = await bracketService.updateMatchResult(matchId, winnerId, score);

      res.status(200).json({
        success: true,
        message: 'Match result updated successfully',
        match
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BracketController();
