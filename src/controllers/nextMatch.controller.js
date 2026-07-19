const prisma = require('../lib/prisma');

class NextMatchController {
  /**
   * GET /api/users/:userId/next-match
   * Get the next upcoming scheduled match for a user
   */
  async getNextMatch(req, res, next) {
    try {
      const { userId } = req.params;

      // Find next upcoming match
      const nextMatch = await prisma.match.findFirst({
        where: {
          OR: [
            { participant1: { userId } },
            { participant2: { userId } }
          ],
          status: {
            in: ['READY', 'PENDING']
          },
          scheduledAt: {
            not: null,
            gt: new Date()
          },
          // Only from published brackets
          event: {
            bracketPublished: true
          }
        },
        include: {
          participant1: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true }
              },
              partner: {
                select: { id: true, firstName: true, lastName: true }
              }
            }
          },
          participant2: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true }
              },
              partner: {
                select: { id: true, firstName: true, lastName: true }
              }
            }
          },
          event: {
            select: {
              id: true,
              name: true,
              format: true,
              tournament: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          scheduledAt: 'asc'
        }
      });

      if (!nextMatch) {
        return res.json({
          success: true,
          nextMatch: null
        });
      }

      // Determine opponent
      const isPlayer1 = nextMatch.participant1?.userId === userId;
      const opponent = isPlayer1 ? nextMatch.participant2 : nextMatch.participant1;

      const opponentName = opponent
        ? `${opponent.user.firstName} ${opponent.user.lastName}`
        : 'TBD';

      // Add partner if doubles/mixed
      const opponentWithPartner = opponent?.partner
        ? `${opponentName} / ${opponent.partner.firstName} ${opponent.partner.lastName}`
        : opponentName;

      res.json({
        success: true,
        nextMatch: {
          matchId: nextMatch.id,
          scheduledAt: nextMatch.scheduledAt,
          courtName: nextMatch.courtName,
          eventName: nextMatch.event.name,
          eventFormat: nextMatch.event.format,
          tournamentName: nextMatch.event.tournament.name,
          tournamentId: nextMatch.event.tournament.id,
          opponent: opponentWithPartner,
          bracketPosition: nextMatch.bracketPosition
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NextMatchController();
