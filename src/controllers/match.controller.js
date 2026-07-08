const prisma = require('../lib/prisma');

class MatchController {
  /**
   * GET /matches/live
   * Get all currently IN_PROGRESS matches
   */
  async getLiveMatches(req, res, next) {
    try {
      const matches = await prisma.match.findMany({
        where: {
          status: 'IN_PROGRESS'
        },
        include: {
          event: {
            include: {
              tournament: {
                include: {
                  organization: true
                }
              }
            }
          },
          participant1: {
            include: {
              user: { select: { firstName: true, lastName: true } },
              partner: { select: { firstName: true, lastName: true } }
            }
          },
          participant2: {
            include: {
              user: { select: { firstName: true, lastName: true } },
              partner: { select: { firstName: true, lastName: true } }
            }
          }
        },
        orderBy: [
          { scheduledAt: 'asc' },
          { matchNumber: 'asc' }
        ]
      });

      // Add sport data (sportId is just a string like "badminton", "table-tennis")
      const matchesWithSport = matches.map(match => {
        if (match.event?.sportId) {
          return {
            ...match,
            event: {
              ...match.event,
              sport: {
                id: match.event.sportId,
                name: match.event.sportId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
              }
            }
          };
        }
        return match;
      });

      res.status(200).json({
        success: true,
        matches: matchesWithSport
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /matches/upcoming
   * Get matches starting soon (scheduled within next 30 minutes)
   */
  async getUpcomingMatches(req, res, next) {
    try {
      const now = new Date();
      const thirtyMinsFromNow = new Date(now.getTime() + 30 * 60 * 1000);

      const matches = await prisma.match.findMany({
        where: {
          status: {
            in: ['PENDING', 'READY']  // Matches not yet started
          },
          scheduledAt: {
            gte: now,
            lte: thirtyMinsFromNow
          }
        },
        include: {
          event: {
            include: {
              tournament: {
                include: {
                  organization: true
                }
              }
            }
          },
          participant1: {
            include: {
              user: true,
              partner: true
            }
          },
          participant2: {
            include: {
              user: true,
              partner: true
            }
          }
        },
        orderBy: {
          scheduledAt: 'asc'
        }
      });

      res.status(200).json({
        success: true,
        matches
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /matches/recent
   * Get recently completed matches (last 2 hours)
   */
  async getRecentMatches(req, res, next) {
    try {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

      const matches = await prisma.match.findMany({
        where: {
          status: 'COMPLETED',
          completedAt: {
            gte: twoHoursAgo
          }
        },
        include: {
          event: {
            include: {
              tournament: {
                include: {
                  organization: true
                }
              }
            }
          },
          participant1: {
            include: {
              user: true,
              partner: true
            }
          },
          participant2: {
            include: {
              user: true,
              partner: true
            }
          }
        },
        orderBy: {
          completedAt: 'desc'
        },
        take: 20  // Limit to last 20 matches
      });

      res.status(200).json({
        success: true,
        matches
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MatchController();
