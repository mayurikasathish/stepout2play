const Glicko2 = require('glicko2');
const prisma = require('../lib/prisma');

/**
 * Glicko-2 Rating Service
 *
 * Handles rating calculations after match results
 * Uses glicko2 npm package for accurate calculations
 */
class GlickoService {
  constructor() {
    // Initialize Glicko-2 settings
    // tau: system volatility constant (0.5 is standard)
    // rating: base rating (1500 in glicko2 scale, we convert to/from 1200 scale)
    // rd: rating deviation (350 default)
    // vol: volatility (0.06 default)
    this.settings = {
      tau: 0.5,
      rating: 1500,      // Glicko-2 default (we'll convert)
      rd: 350,
      vol: 0.06
    };

    this.ranking = new Glicko2.Glicko2(this.settings);
  }

  /**
   * Convert our 1200-base rating to Glicko-2's 1500-base scale
   * Our scale: 1200 base
   * Glicko-2 scale: 1500 base
   */
  toGlickoScale(rating) {
    return rating + 300;
  }

  /**
   * Convert Glicko-2's 1500-base scale back to our 1200-base
   */
  fromGlickoScale(rating) {
    return rating - 300;
  }

  /**
   * Calculate new ratings after a match
   *
   * @param {Object} player1 - { userId, rating, rd, volatility, isWinner }
   * @param {Object} player2 - { userId, rating, rd, volatility, isWinner }
   * @param {string} sportId - Sport identifier
   * @returns {Promise<Object>} - { player1NewRating, player2NewRating }
   */
  async calculateMatchRatings(player1, player2, sportId) {
    // Create Glicko-2 player objects (convert to Glicko scale)
    const glickoPlayer1 = this.ranking.makePlayer(
      this.toGlickoScale(player1.rating),
      player1.rd,
      player1.volatility
    );

    const glickoPlayer2 = this.ranking.makePlayer(
      this.toGlickoScale(player2.rating),
      player2.rd,
      player2.volatility
    );

    // Record the match result
    // 1 = player1 wins, 0 = player2 wins
    const result = player1.isWinner ? 1 : 0;

    this.ranking.addResult(glickoPlayer1, glickoPlayer2, result);

    // Update ratings
    this.ranking.updateRatings();

    // Convert back to our scale and return
    return {
      player1: {
        userId: player1.userId,
        oldRating: player1.rating,
        newRating: this.fromGlickoScale(glickoPlayer1.getRating()),
        oldRd: player1.rd,
        newRd: glickoPlayer1.getRd(),
        oldVolatility: player1.volatility,
        newVolatility: glickoPlayer1.getVol(),
        ratingChange: this.fromGlickoScale(glickoPlayer1.getRating()) - player1.rating
      },
      player2: {
        userId: player2.userId,
        oldRating: player2.rating,
        newRating: this.fromGlickoScale(glickoPlayer2.getRating()),
        oldRd: player2.rd,
        newRd: glickoPlayer2.getRd(),
        oldVolatility: player2.volatility,
        newVolatility: glickoPlayer2.getVol(),
        ratingChange: this.fromGlickoScale(glickoPlayer2.getRating()) - player2.rating
      }
    };
  }

  /**
   * Calculate ratings for doubles match
   * Average opponent team's ratings and calculate individually for each player
   *
   * @param {Object} team1 - { player1: {...}, player2: {...}, isWinner: true/false }
   * @param {Object} team2 - { player1: {...}, player2: {...}, isWinner: true/false }
   * @param {string} sportId
   * @returns {Promise<Object>} - All 4 players' new ratings
   */
  async calculateDoublesRatings(team1, team2, sportId) {
    // Calculate average opponent ratings
    const team1AvgRating = (team1.player1.rating + team1.player2.rating) / 2;
    const team1AvgRd = (team1.player1.rd + team1.player2.rd) / 2;
    const team1AvgVol = (team1.player1.volatility + team1.player2.volatility) / 2;

    const team2AvgRating = (team2.player1.rating + team2.player2.rating) / 2;
    const team2AvgRd = (team2.player1.rd + team2.player2.rd) / 2;
    const team2AvgVol = (team2.player1.volatility + team2.player2.volatility) / 2;

    // Create virtual opponent players with average ratings
    const virtualOpponent1 = {
      userId: 'virtual-team2',
      rating: team2AvgRating,
      rd: team2AvgRd,
      volatility: team2AvgVol,
      isWinner: team2.isWinner
    };

    const virtualOpponent2 = {
      userId: 'virtual-team1',
      rating: team1AvgRating,
      rd: team1AvgRd,
      volatility: team1AvgVol,
      isWinner: team1.isWinner
    };

    // Calculate for each player against virtual opponent average
    const team1Player1Result = await this.calculateMatchRatings(
      { ...team1.player1, isWinner: team1.isWinner },
      virtualOpponent1,
      sportId
    );

    const team1Player2Result = await this.calculateMatchRatings(
      { ...team1.player2, isWinner: team1.isWinner },
      virtualOpponent1,
      sportId
    );

    const team2Player1Result = await this.calculateMatchRatings(
      { ...team2.player1, isWinner: team2.isWinner },
      virtualOpponent2,
      sportId
    );

    const team2Player2Result = await this.calculateMatchRatings(
      { ...team2.player2, isWinner: team2.isWinner },
      virtualOpponent2,
      sportId
    );

    return {
      team1: {
        player1: team1Player1Result.player1,
        player2: team1Player2Result.player1
      },
      team2: {
        player1: team2Player1Result.player1,
        player2: team2Player2Result.player1
      }
    };
  }

  /**
   * Update player ratings in database after match
   *
   * @param {string} userId
   * @param {string} sportId
   * @param {Object} newRatings - { newRating, newRd, newVolatility }
   * @returns {Promise<PlayerRating>}
   */
  async updatePlayerRating(userId, sportId, { newRating, newRd, newVolatility }) {
    const updated = await prisma.playerRating.update({
      where: {
        userId_sportId: {
          userId,
          sportId
        }
      },
      data: {
        rating: newRating,
        rd: newRd,
        volatility: newVolatility,
        matchCount: { increment: 1 },
        lastMatchDate: new Date()
      }
    });

    console.log(`✅ Updated rating for user ${userId} in ${sportId}: ${Math.round(newRating)} (±${Math.round(newRd)})`);

    return updated;
  }

  /**
   * Save rating change to database
   */
  async saveRatingChange(matchId, userId, sportId, ratingData) {
    await prisma.matchRatingChange.create({
      data: {
        matchId,
        userId,
        sportId,
        oldRating: ratingData.oldRating,
        newRating: ratingData.newRating,
        ratingChange: ratingData.ratingChange,
        oldRd: ratingData.oldRd,
        newRd: ratingData.newRd,
        oldVolatility: ratingData.oldVolatility,
        newVolatility: ratingData.newVolatility
      }
    });
  }

  /**
   * Process match result and update all players' ratings
   *
   * @param {Object} matchData
   * @returns {Promise<Object>} - Rating changes for all players
   */
  async processMatchResult(matchData) {
    const {
      matchId,
      eventId,
      sportId,
      matchType, // 'singles' or 'doubles'
      winner,    // { userId, partnerId? }
      loser,     // { userId, partnerId? }
      score      // For future: weight matches by score difference
    } = matchData;

    console.log(`🎾 Processing ${matchType} match result for event ${eventId}`);

    if (matchType === 'singles') {
      // Singles match: 1v1
      const winnerRating = await this.getOrCreateRating(winner.userId, sportId);
      const loserRating = await this.getOrCreateRating(loser.userId, sportId);

      const result = await this.calculateMatchRatings(
        { ...winnerRating, userId: winner.userId, isWinner: true },
        { ...loserRating, userId: loser.userId, isWinner: false },
        sportId
      );

      // Update both players in database
      await this.updatePlayerRating(winner.userId, sportId, {
        newRating: result.player1.newRating,
        newRd: result.player1.newRd,
        newVolatility: result.player1.newVolatility
      });

      await this.updatePlayerRating(loser.userId, sportId, {
        newRating: result.player2.newRating,
        newRd: result.player2.newRd,
        newVolatility: result.player2.newVolatility
      });

      // Save rating changes
      await this.saveRatingChange(matchId, winner.userId, sportId, result.player1);
      await this.saveRatingChange(matchId, loser.userId, sportId, result.player2);

      return {
        matchType: 'singles',
        winner: result.player1,
        loser: result.player2
      };

    } else if (matchType === 'doubles') {
      // Doubles match: 2v2
      const team1Player1Rating = await this.getOrCreateRating(winner.userId, sportId);
      const team1Player2Rating = await this.getOrCreateRating(winner.partnerId, sportId);
      const team2Player1Rating = await this.getOrCreateRating(loser.userId, sportId);
      const team2Player2Rating = await this.getOrCreateRating(loser.partnerId, sportId);

      const result = await this.calculateDoublesRatings(
        {
          player1: { ...team1Player1Rating, userId: winner.userId },
          player2: { ...team1Player2Rating, userId: winner.partnerId },
          isWinner: true
        },
        {
          player1: { ...team2Player1Rating, userId: loser.userId },
          player2: { ...team2Player2Rating, userId: loser.partnerId },
          isWinner: false
        },
        sportId
      );

      // Update all 4 players in database
      await this.updatePlayerRating(winner.userId, sportId, {
        newRating: result.team1.player1.newRating,
        newRd: result.team1.player1.newRd,
        newVolatility: result.team1.player1.newVolatility
      });

      await this.updatePlayerRating(winner.partnerId, sportId, {
        newRating: result.team1.player2.newRating,
        newRd: result.team1.player2.newRd,
        newVolatility: result.team1.player2.newVolatility
      });

      await this.updatePlayerRating(loser.userId, sportId, {
        newRating: result.team2.player1.newRating,
        newRd: result.team2.player1.newRd,
        newVolatility: result.team2.player1.newVolatility
      });

      await this.updatePlayerRating(loser.partnerId, sportId, {
        newRating: result.team2.player2.newRating,
        newRd: result.team2.player2.newRd,
        newVolatility: result.team2.player2.newVolatility
      });

      // Save rating changes for all 4 players
      await this.saveRatingChange(matchId, winner.userId, sportId, result.team1.player1);
      await this.saveRatingChange(matchId, winner.partnerId, sportId, result.team1.player2);
      await this.saveRatingChange(matchId, loser.userId, sportId, result.team2.player1);
      await this.saveRatingChange(matchId, loser.partnerId, sportId, result.team2.player2);

      return {
        matchType: 'doubles',
        team1: result.team1,
        team2: result.team2
      };
    }

    throw new Error(`Unsupported match type: ${matchType}`);
  }

  /**
   * Get or create player rating (helper method)
   */
  async getOrCreateRating(userId, sportId) {
    let rating = await prisma.playerRating.findUnique({
      where: {
        userId_sportId: { userId, sportId }
      }
    });

    if (!rating) {
      rating = await prisma.playerRating.create({
        data: {
          userId,
          sportId,
          rating: 1200.0,
          rd: 350.0,
          volatility: 0.06,
          matchCount: 0
        }
      });
    }

    return rating;
  }
}

module.exports = new GlickoService();
