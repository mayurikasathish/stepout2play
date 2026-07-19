const prisma = require('../lib/prisma');

class FollowController {
  /**
   * Follow a user (or send follow request if private)
   * POST /follows
   * Body: { followingId }
   */
  async followUser(req, res, next) {
    try {
      const followerId = req.user.id;
      const { followingId } = req.body;

      if (!followingId) {
        return res.status(400).json({
          success: false,
          error: 'followingId is required',
        });
      }

      if (followerId === followingId) {
        return res.status(400).json({
          success: false,
          error: 'You cannot follow yourself',
        });
      }

      // Check if already following
      const existing = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          error: existing.status === 'accepted'
            ? 'Already following this user'
            : 'Follow request already sent',
        });
      }

      // Check if target user has private profile
      const targetUser = await prisma.user.findUnique({
        where: { id: followingId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          isProfilePrivate: true
        },
      });

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      const follower = await prisma.user.findUnique({
        where: { id: followerId },
        select: { firstName: true, lastName: true },
      });

      // Create follow with appropriate status
      const status = targetUser.isProfilePrivate ? 'pending' : 'accepted';

      const follow = await prisma.follow.create({
        data: {
          followerId,
          followingId,
          status,
        },
      });

      // Create notification
      const notificationType = targetUser.isProfilePrivate
        ? 'FOLLOW_REQUEST'
        : 'NEW_FOLLOWER';

      const notification = await prisma.notification.create({
        data: {
          userId: followingId,
          type: notificationType,
          title: targetUser.isProfilePrivate
            ? 'New Follow Request'
            : 'New Follower',
          message: targetUser.isProfilePrivate
            ? `${follower.firstName} ${follower.lastName} wants to follow you`
            : `${follower.firstName} ${follower.lastName} started following you`,
          actionUrl: `/players/${followerId}`,
          actionText: 'View Profile',
          data: { followId: follow.id, followerId },
        },
      });

      res.status(201).json({
        success: true,
        message: targetUser.isProfilePrivate
          ? 'Follow request sent'
          : 'Successfully followed',
        follow,
        notification,
      });
    } catch (error) {
      console.error('Error following user:', error);
      next(error);
    }
  }

  /**
   * Unfollow a user
   * DELETE /follows/:userId
   */
  async unfollowUser(req, res, next) {
    try {
      const followerId = req.user.id;
      const { userId: followingId } = req.params;

      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      if (!follow) {
        return res.status(404).json({
          success: false,
          error: 'Follow relationship not found',
        });
      }

      await prisma.follow.delete({
        where: {
          id: follow.id,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Successfully unfollowed',
      });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      next(error);
    }
  }

  /**
   * Accept a follow request
   * PATCH /follows/:followId/accept
   */
  async acceptFollowRequest(req, res, next) {
    try {
      const userId = req.user.id;
      const { followId } = req.params;

      const follow = await prisma.follow.findUnique({
        where: { id: followId },
        include: {
          follower: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            },
          },
        },
      });

      if (!follow) {
        return res.status(404).json({
          success: false,
          error: 'Follow request not found',
        });
      }

      if (follow.followingId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to accept this request',
        });
      }

      if (follow.status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: 'Follow request already processed',
        });
      }

      const updatedFollow = await prisma.follow.update({
        where: { id: followId },
        data: { status: 'accepted' },
      });

      // Notify the requester that their request was accepted
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true },
      });

      await prisma.notification.create({
        data: {
          userId: follow.followerId,
          type: 'FOLLOW_ACCEPTED',
          title: 'Follow Request Accepted',
          message: `${currentUser.firstName} ${currentUser.lastName} accepted your follow request`,
          actionUrl: `/players/${userId}`,
          actionText: 'View Profile',
        },
      });

      res.status(200).json({
        success: true,
        message: 'Follow request accepted',
        follow: updatedFollow,
      });
    } catch (error) {
      console.error('Error accepting follow request:', error);
      next(error);
    }
  }

  /**
   * Reject a follow request
   * PATCH /follows/:followId/reject
   */
  async rejectFollowRequest(req, res, next) {
    try {
      const userId = req.user.id;
      const { followId } = req.params;

      const follow = await prisma.follow.findUnique({
        where: { id: followId },
      });

      if (!follow) {
        return res.status(404).json({
          success: false,
          error: 'Follow request not found',
        });
      }

      if (follow.followingId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to reject this request',
        });
      }

      if (follow.status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: 'Follow request already processed',
        });
      }

      // Delete the follow instead of updating status
      await prisma.follow.delete({
        where: { id: followId },
      });

      res.status(200).json({
        success: true,
        message: 'Follow request rejected',
      });
    } catch (error) {
      console.error('Error rejecting follow request:', error);
      next(error);
    }
  }

  /**
   * Get users that the current user is following
   * GET /follows/following
   */
  async getFollowing(req, res, next) {
    try {
      const userId = req.user.id;

      const following = await prisma.follow.findMany({
        where: {
          followerId: userId,
          status: 'accepted',
        },
        select: {
          followingId: true,
        },
      });

      const followingIds = following.map(f => f.followingId);

      res.status(200).json({
        success: true,
        followingIds,
      });
    } catch (error) {
      console.error('Error fetching following:', error);
      next(error);
    }
  }

  /**
   * Get follow status for a specific user
   * GET /follows/status/:userId
   */
  async getFollowStatus(req, res, next) {
    try {
      const followerId = req.user.id;
      const { userId: followingId } = req.params;

      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      res.status(200).json({
        success: true,
        isFollowing: follow?.status === 'accepted',
        isPending: follow?.status === 'pending',
        follow,
      });
    } catch (error) {
      console.error('Error checking follow status:', error);
      next(error);
    }
  }

  /**
   * Get "Your Circle" - detailed info about people you follow
   * GET /follows/circle
   */
  async getCircle(req, res, next) {
    try {
      const userId = req.user.id;

      // Get all users the current user is following (accepted only)
      const following = await prisma.follow.findMany({
        where: {
          followerId: userId,
          status: 'accepted',
        },
        include: {
          following: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
              city: true,
              state: true,
              sports: true,
              bio: true,
              primaryRole: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const followingUsers = following.map(f => f.following);
      const followingIds = followingUsers.map(u => u.id);

      // Get their recent registrations
      const recentRegistrations = await prisma.registration.findMany({
        where: {
          userId: { in: followingIds },
          status: 'CONFIRMED',
          isWithdrawn: false,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
            },
          },
          event: {
            include: {
              tournament: {
                select: {
                  id: true,
                  name: true,
                  startDate: true,
                  city: true,
                  state: true,
                  venueName: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20,
      });

      // Get their recent achievements
      const recentAchievements = await prisma.achievement.findMany({
        where: {
          userId: { in: followingIds },
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
            },
          },
          tournament: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
            },
          },
          event: {
            select: {
              id: true,
              name: true,
              format: true,
            },
          },
        },
        orderBy: {
          wonAt: 'desc',
        },
        take: 20,
      });

      // Get their ratings across sports
      const ratings = await prisma.playerRating.findMany({
        where: {
          userId: { in: followingIds },
        },
        orderBy: {
          rating: 'desc',
        },
      });

      // Group ratings by user
      const ratingsByUser = {};
      ratings.forEach(r => {
        if (!ratingsByUser[r.userId]) {
          ratingsByUser[r.userId] = [];
        }
        ratingsByUser[r.userId].push({
          sportId: r.sportId,
          rating: Math.round(r.rating),
          matchCount: r.matchCount,
        });
      });

      // Get live feed items from people you follow
      const feedItems = await prisma.liveFeedItem.findMany({
        where: {
          actorId: { in: followingIds },
        },
        include: {
          actor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 30,
      });

      // Enhance user data with ratings
      const enhancedUsers = followingUsers.map(user => ({
        ...user,
        ratings: ratingsByUser[user.id] || [],
      }));

      res.status(200).json({
        success: true,
        data: {
          following: enhancedUsers,
          recentRegistrations,
          recentAchievements,
          feedItems,
          stats: {
            followingCount: followingUsers.length,
            totalActivities: recentRegistrations.length + recentAchievements.length + feedItems.length,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching circle:', error);
      next(error);
    }
  }
}

module.exports = new FollowController();
