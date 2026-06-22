const bracketService = require('../services/bracket.service');

class BracketController {
  /**
   * POST /events/:eventId/generate-bracket
   * Body: { bracketFormat, seedingMethod, groupSize?, groupCount?, advanceCount?, hasBronzeMatch? }
   */
  async generateBracket(req, res, next) {
    try {
      const { eventId } = req.params;
      const { bracketFormat, seedingMethod, groupSize, groupCount, advanceCount, hasBronzeMatch } = req.body;

      const errors = [];

      if (!bracketFormat || !['SINGLE_ELIMINATION', 'ROUND_ROBIN', 'LEAGUE_CUM_KNOCKOUT'].includes(bracketFormat)) {
        errors.push('bracketFormat must be SINGLE_ELIMINATION, ROUND_ROBIN, or LEAGUE_CUM_KNOCKOUT');
      }

      if (!seedingMethod || !['REGISTRATION_ORDER', 'RANDOM', 'MANUAL', 'SNAKE'].includes(seedingMethod)) {
        errors.push('seedingMethod must be REGISTRATION_ORDER, RANDOM, MANUAL, or SNAKE');
      }

      if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
      }

      const options = {};
      if (groupSize) options.groupSize = groupSize;
      if (groupCount) options.groupCount = groupCount;
      if (advanceCount) options.advanceCount = advanceCount;
      if (hasBronzeMatch !== undefined) options.hasBronzeMatch = hasBronzeMatch;

      const result = await bracketService.generateBracket(eventId, bracketFormat, seedingMethod, options);

      res.status(201).json({ success: true, message: 'Bracket generated successfully', ...result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /events/:eventId/bracket
   */
  async getBracket(req, res, next) {
    try {
      const { eventId } = req.params;
      const bracket = await bracketService.getBracket(eventId);
      res.status(200).json({ success: true, ...bracket });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /events/:eventId/bracket
   */
  async deleteBracket(req, res, next) {
    try {
      const { eventId } = req.params;
      const result = await bracketService.deleteBracket(eventId);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /events/:eventId/seed-numbers
   */
  async updateSeedNumbers(req, res, next) {
    try {
      const { eventId } = req.params;
      const { seeds } = req.body;
      if (!seeds || !Array.isArray(seeds)) {
        return res.status(400).json({ success: false, error: 'seeds array is required' });
      }
      const result = await bracketService.updateSeedNumbers(eventId, seeds);
      res.status(200).json({ success: true, message: 'Seed numbers updated successfully', ...result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /matches/:matchId/result
   * Works for both single-elimination and round-robin matches.
   * For round robin: winnerId can be null to record a draw.
   */
  async updateMatchResult(req, res, next) {
    try {
      const { matchId } = req.params;
      const { winnerId, score } = req.body;

      // winnerId is optional for round robin (draw support)
      const match = await bracketService.updateMatchResult(matchId, winnerId || null, score);

      res.status(200).json({ success: true, message: 'Match result updated successfully', match });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BracketController();
