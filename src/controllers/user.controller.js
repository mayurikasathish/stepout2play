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
          state: true,
          locality: true,
          latitude: true,
          longitude: true,
          bio: true,
          sports: true,
          primaryRole: true,
          profilePicture: true,
          gender: true,
          dob: true,
          phone: true,
          isProfilePrivate: true,
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
      const viewerId = req.user?.id; // May be undefined if not authenticated

      const player = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          city: true,
          state: true,
          locality: true,
          latitude: true,
          longitude: true,
          bio: true,
          sports: true,
          primaryRole: true,
          profilePicture: true,
          gender: true,
          dob: true,
          phone: true,
          createdAt: true,
          isProfilePrivate: true,
        },
      });

      if (!player) {
        return res.status(404).json({
          success: false,
          error: 'Player not found',
        });
      }

      // Check if viewer is following (only if authenticated and not viewing own profile)
      let isFollowing = false;
      if (viewerId && viewerId !== id) {
        const follow = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: viewerId,
              followingId: id,
            },
          },
        });
        isFollowing = follow?.status === 'accepted';
      }

      res.status(200).json({
        success: true,
        player: {
          ...player,
          matchesPlayed: 0, // Placeholder
          isFollowing, // Send this to frontend
        },
      });
    } catch (error) {
      console.error('Error fetching player:', error);
      next(error);
    }
  }

  /**
   * Update user's profile privacy setting
   * PATCH /users/profile-privacy
   */
  async updateProfilePrivacy(req, res, next) {
    try {
      const userId = req.user.id;
      const { isProfilePrivate } = req.body;

      if (typeof isProfilePrivate !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'isProfilePrivate must be a boolean',
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isProfilePrivate },
        select: {
          id: true,
          isProfilePrivate: true,
        },
      });

      res.status(200).json({
        success: true,
        message: `Profile is now ${isProfilePrivate ? 'private' : 'public'}`,
        user: updatedUser,
      });
    } catch (error) {
      console.error('Error updating profile privacy:', error);
      next(error);
    }
  }
}

module.exports = new UserController();
