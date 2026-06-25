const prisma = require('../lib/prisma');

class UserController {
  /**
   * Get all players for the explore players page
   * GET /users/players
   */
  async getPlayers(req, res, next) {
    try {
      const players = await prisma.user.findMany({
        where: {
          onboardingComplete: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          city: true,
          bio: true,
          sports: true,
          primaryRole: true,
          profilePicture: true,
          // TODO: Add match count when match schema is ready
          // _count: {
          //   select: { matches: true }
          // }
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Format response with match count placeholder
      const formattedPlayers = players.map(player => ({
        ...player,
        matchesPlayed: 0, // Placeholder until match tracking is implemented
        skillLevel: player.sports?.[0]?.level || null, // Get first sport's level if available
      }));

      res.status(200).json({
        success: true,
        players: formattedPlayers,
      });
    } catch (error) {
      console.error('Error fetching players:', error);
      next(error);
    }
  }

  /**
   * Get a single player profile by ID
   * GET /users/players/:id
   */
  async getPlayerById(req, res, next) {
    try {
      const { id } = req.params;

      const player = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          city: true,
          bio: true,
          sports: true,
          primaryRole: true,
          profilePicture: true,
          createdAt: true,
          // TODO: Add match history when ready
        },
      });

      if (!player) {
        return res.status(404).json({
          success: false,
          error: 'Player not found',
        });
      }

      res.status(200).json({
        success: true,
        player: {
          ...player,
          matchesPlayed: 0, // Placeholder
        },
      });
    } catch (error) {
      console.error('Error fetching player:', error);
      next(error);
    }
  }
}

module.exports = new UserController();
