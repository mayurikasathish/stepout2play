const prisma = require('../lib/prisma');

class PlayerProfileController {
  /**
   * GET /api/users/:userId/profile-stats
   * Get comprehensive player profile stats
   */
  async getProfileStats(req, res, next) {
    try {
      const { userId } = req.params;

      // 1. Get all ratings for this user (per sport AND category)
      const playerRatings = await prisma.playerRating.findMany({
        where: { userId }
      });

      // 2. Group ratings by sport
      const sportGroups = {};

      for (const rating of playerRatings) {
        if (!sportGroups[rating.sportId]) {
          sportGroups[rating.sportId] = {
            singles: null,
            doubles: null,
            mixedDoubles: null
          };
        }

        const categoryKey = rating.category === 'SINGLES' ? 'singles'
          : rating.category === 'DOUBLES' ? 'doubles'
          : 'mixedDoubles';

        // Get stats for this category
        const categoryStats = await this._getCategoryStats(userId, rating);
        sportGroups[rating.sportId][categoryKey] = categoryStats;
      }

      // 3. Convert to array format
      const sportsStats = Object.entries(sportGroups).map(([sportId, categories]) => ({
        sportId,
        singles: categories.singles || { rating: 1200, wins: 0, losses: 0, rank: null, totalRankedPlayers: null, streak: null, matchCount: 0 },
        doubles: categories.doubles || { rating: 1200, wins: 0, losses: 0, rank: null, totalRankedPlayers: null, streak: null, matchCount: 0 },
        mixedDoubles: categories.mixedDoubles || { rating: 1200, wins: 0, losses: 0, rank: null, totalRankedPlayers: null, streak: null, matchCount: 0 }
      }));

      // 3. Calculate career stats
      const allMatches = await prisma.match.findMany({
        where: {
          status: 'COMPLETED',
          OR: [
            { participant1: { userId } },
            { participant2: { userId } }
          ]
        },
        include: {
          participant1: { include: { user: true } },
          participant2: { include: { user: true } },
          event: {
            include: {
              tournament: true
            }
          }
        }
      });

      let totalWins = 0;
      let totalLosses = 0;
      const uniqueTournaments = new Set();

      for (const match of allMatches) {
        const isPlayer1 = match.participant1?.userId === userId;
        const isWinner = match.winnerId === (isPlayer1 ? match.participant1Id : match.participant2Id);

        if (isWinner) totalWins++;
        else totalLosses++;

        uniqueTournaments.add(match.event.tournamentId);
      }

      // Count titles (finals wins where roundNumber = 1)
      const titles = allMatches.filter(match => {
        const isPlayer1 = match.participant1?.userId === userId;
        const isWinner = match.winnerId === (isPlayer1 ? match.participant1Id : match.participant2Id);
        return isWinner && match.roundNumber === 1; // Finals are round 1
      }).length;

      // Calculate current streak
      let currentStreak = 0;
      let streakType = null;
      const sortedAllMatches = allMatches.sort((a, b) =>
        new Date(b.completedAt) - new Date(a.completedAt)
      );

      for (const match of sortedAllMatches) {
        const isPlayer1 = match.participant1?.userId === userId;
        const isWinner = match.winnerId === (isPlayer1 ? match.participant1Id : match.participant2Id);

        if (streakType === null) {
          streakType = isWinner ? 'W' : 'L';
          currentStreak = 1;
        } else if ((isWinner && streakType === 'W') || (!isWinner && streakType === 'L')) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Get highest rating across all sports
      const allRatingChanges = await prisma.matchRatingChange.findMany({
        where: { userId },
        orderBy: { newRating: 'desc' },
        take: 1
      });
      const highestRating = allRatingChanges.length > 0
        ? Math.round(allRatingChanges[0].newRating)
        : 1200;

      // Calculate best rank across all sports (only if at least one sport has ranks)
      let bestRank = null;
      for (const sportStat of sportsStats) {
        if (sportStat.rank !== null) {
          if (bestRank === null || sportStat.rank < bestRank) {
            bestRank = sportStat.rank;
          }
        }
      }

      const totalMatches = totalWins + totalLosses;
      const winRate = totalMatches > 0 ? ((totalWins / totalMatches) * 100).toFixed(1) : 0;

      // Count sports played (sports with at least 1 match in any category)
      const sportsPlayed = sportsStats.filter(s =>
        s.singles.matchCount > 0 || s.doubles.matchCount > 0 || s.mixedDoubles.matchCount > 0
      ).length;

      // Calculate wins in last 10 matches (for Form metric)
      const last10Matches = sortedAllMatches.slice(0, 10);
      const last10Wins = last10Matches.filter(match => {
        const isPlayer1 = match.participant1?.userId === userId;
        const isWinner = match.winnerId === (isPlayer1 ? match.participant1Id : match.participant2Id);
        return isWinner;
      }).length;

      const careerStats = {
        totalMatches,
        wins: totalWins,
        losses: totalLosses,
        winRate: parseFloat(winRate),
        titles,
        tournamentsPlayed: uniqueTournaments.size,
        currentStreak: currentStreak > 0 ? `${streakType}${currentStreak}` : null,
        highestRating,
        bestRank: bestRank || null,
        sportsPlayed,
        last10Wins  // New field for Form calculation
      };

      res.status(200).json({
        success: true,
        sportsStats,
        careerStats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/:userId/match-history
   * Get detailed match history with opponent, tournament, score, rating change
   */
  async getMatchHistory(req, res, next) {
    try {
      const { userId } = req.params;
      const { sportId, limit = 50, offset = 0 } = req.query;

      const whereClause = {
        status: 'COMPLETED',
        OR: [
          { participant1: { userId } },
          { participant2: { userId } }
        ]
      };

      // Filter by sport if provided
      if (sportId) {
        whereClause.event = { sportId };
      }

      const matches = await prisma.match.findMany({
        where: whereClause,
        include: {
          participant1: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, profilePicture: true } },
              partner: { select: { id: true, firstName: true, lastName: true, profilePicture: true } }
            }
          },
          participant2: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, profilePicture: true } },
              partner: { select: { id: true, firstName: true, lastName: true, profilePicture: true } }
            }
          },
          event: {
            include: {
              tournament: { select: { id: true, name: true, city: true } }
            }
          }
        },
        orderBy: { completedAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      });

      // Get rating changes for these matches
      const matchIds = matches.map(m => m.id);
      const ratingChanges = await prisma.matchRatingChange.findMany({
        where: {
          matchId: { in: matchIds },
          userId
        }
      });

      const ratingChangeMap = {};
      ratingChanges.forEach(rc => {
        ratingChangeMap[rc.matchId] = rc.ratingChange;
      });

      // Format match history
      const matchHistory = matches.map(match => {
        const isPlayer1 = match.participant1?.userId === userId;
        const playerReg = isPlayer1 ? match.participant1 : match.participant2;
        const opponentReg = isPlayer1 ? match.participant2 : match.participant1;
        const isWinner = match.winnerId === playerReg?.id;

        // Format opponent name
        let opponentName = 'BYE';
        if (opponentReg?.user) {
          opponentName = `${opponentReg.user.firstName} ${opponentReg.user.lastName}`;
          if (opponentReg.partner) {
            opponentName += ` / ${opponentReg.partner.firstName} ${opponentReg.partner.lastName}`;
          }
        }

        return {
          matchId: match.id,
          opponent: opponentName,
          opponentId: opponentReg?.userId || null,
          opponentProfilePicture: opponentReg?.user?.profilePicture || null,
          tournament: match.event.tournament.name,
          tournamentId: match.event.tournament.id,
          city: match.event.tournament.city,
          score: match.score || '-',
          ratingChange: ratingChangeMap[match.id] ? Math.round(ratingChangeMap[match.id]) : 0,
          result: isWinner ? 'WIN' : 'LOSS',
          date: match.completedAt,
          sportId: match.event.sportId,
          format: match.event.format
        };
      });

      res.status(200).json({
        success: true,
        matchHistory,
        total: matchHistory.length,
        hasMore: matches.length === parseInt(limit)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/:userId/rating-history/:sportId
   * Get rating changes over time for a specific sport (for graph)
   */
  async getRatingHistory(req, res, next) {
    try {
      const { userId, sportId } = req.params;

      const ratingChanges = await prisma.matchRatingChange.findMany({
        where: {
          userId,
          sportId
        },
        orderBy: { createdAt: 'asc' },
        select: {
          newRating: true,
          createdAt: true,
          ratingChange: true
        }
      });

      // Get initial rating if no changes yet
      if (ratingChanges.length === 0) {
        const playerRating = await prisma.playerRating.findUnique({
          where: {
            userId_sportId: { userId, sportId }
          }
        });

        if (playerRating) {
          return res.status(200).json({
            success: true,
            ratingHistory: [{
              rating: Math.round(playerRating.rating),
              date: playerRating.createdAt,
              change: 0
            }]
          });
        }
      }

      const ratingHistory = ratingChanges.map(change => ({
        rating: Math.round(change.newRating),
        date: change.createdAt,
        change: Math.round(change.ratingChange)
      }));

      res.status(200).json({
        success: true,
        ratingHistory
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/:userId/activity-heatmap
   * Get activity heatmap data (matches per day for last 365 days)
   */
  async getActivityHeatmap(req, res, next) {
    try {
      const { userId } = req.params;

      // Get date 365 days ago
      const oneYearAgo = new Date();
      oneYearAgo.setDate(oneYearAgo.getDate() - 365);

      // Get all matches in the last year
      const matches = await prisma.match.findMany({
        where: {
          status: 'COMPLETED',
          completedAt: { gte: oneYearAgo },
          OR: [
            { participant1: { userId } },
            { participant2: { userId } }
          ]
        },
        select: {
          completedAt: true
        }
      });

      // Group by date
      const activityMap = {};
      matches.forEach(match => {
        const date = new Date(match.completedAt).toISOString().split('T')[0]; // YYYY-MM-DD
        activityMap[date] = (activityMap[date] || 0) + 1;
      });

      res.status(200).json({
        success: true,
        activity: activityMap,
        totalMatches: matches.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Helper method to get category stats
  async _getCategoryStats(userId, rating) {
    // Get matches for this sport AND category
    const eventFormat = rating.category === 'SINGLES' ? 'SINGLES'
      : rating.category === 'DOUBLES' ? 'DOUBLES'
      : 'MIXED_DOUBLES';

    const matches = await prisma.match.findMany({
      where: {
        status: 'COMPLETED',
        event: {
          sportId: rating.sportId,
          format: eventFormat
        },
        OR: [
          { participant1: { userId } },
          { participant2: { userId } }
        ]
      },
      include: {
        participant1: true,
        participant2: true
      },
      orderBy: { completedAt: 'desc' }
    });

    // Calculate wins, losses, streak
    let wins = 0;
    let losses = 0;
    let currentStreak = 0;
    let streakType = null;

    for (const match of matches) {
      const isPlayer1 = match.participant1?.userId === userId;
      const isWinner = match.winnerId === (isPlayer1 ? match.participant1Id : match.participant2Id);

      if (isWinner) {
        wins++;
        if (streakType === null) streakType = 'W';
        if (streakType === 'W') currentStreak++;
        else break;
      } else {
        losses++;
        if (streakType === null) streakType = 'L';
        if (streakType === 'L') currentStreak++;
        else break;
      }
    }

    // Calculate rank (per category per sport)
    let rank = null;
    let totalRankedPlayers = null;

    if (rating.matchCount > 0) {
      const playersWithMatches = await prisma.playerRating.count({
        where: {
          sportId: rating.sportId,
          category: rating.category,
          matchCount: { gt: 0 }
        }
      });

      if (playersWithMatches >= 2) {
        const higherRatedCount = await prisma.playerRating.count({
          where: {
            sportId: rating.sportId,
            category: rating.category,
            matchCount: { gt: 0 },
            rating: { gt: rating.rating }
          }
        });

        rank = higherRatedCount + 1;
        totalRankedPlayers = playersWithMatches;
      }
    }

    return {
      rating: Math.round(rating.rating),
      wins,
      losses,
      rank,
      totalRankedPlayers,
      streak: currentStreak > 0 ? `${streakType}${currentStreak}` : null,
      matchCount: rating.matchCount
    };
  }
}

module.exports = new PlayerProfileController();
