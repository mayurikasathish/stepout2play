const bracketService = require('../services/bracket.service');
const { LiveFeedHelpers, NotificationHelpers } = require('../utils/notificationHelpers');
const prisma = require('../lib/prisma');

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

      res.status(201).json({ success: true, message: 'Bracket generated successfully. Review and publish when ready.', ...result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /events/:eventId/publish-bracket
   */
  async publishBracket(req, res, next) {
    try {
      const { eventId } = req.params;

      // Mark bracket as published
      await prisma.event.update({
        where: { id: eventId },
        data: { bracketPublished: true }
      });

      // Send notifications to all participants
      const registrations = await prisma.registration.findMany({
        where: { eventId },
        include: {
          user: true,
          event: {
            include: {
              tournament: true
            }
          }
        }
      });

      for (const reg of registrations) {
        await NotificationHelpers.sendBracketReady({
          userId: reg.userId,
          tournamentName: reg.event.tournament.name,
          tournamentId: reg.event.tournamentId,
          eventId: reg.eventId
        });
      }

      res.status(200).json({
        success: true,
        message: `Bracket published successfully. ${registrations.length} players notified.`
      });
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
      const { winnerId, score, pointHistory } = req.body;

      console.log('🔥 updateMatchResult called:', { matchId, winnerId, score, hasPointHistory: !!pointHistory });

      // winnerId is optional for round robin (draw support)
      const match = await bracketService.updateMatchResult(matchId, winnerId || null, score, pointHistory);

      // Create live feed item when match is won
      if (winnerId) {
        try {
          const winnerReg = await prisma.registration.findUnique({
            where: { id: winnerId },
            include: {
              user: true,
              event: {
                include: {
                  tournament: true
                }
              }
            }
          });

          if (winnerReg) {
            await LiveFeedHelpers.playerWonMatch({
              actorId: winnerReg.userId,
              eventName: winnerReg.event.name,
              tournamentId: winnerReg.event.tournamentId
            });
          }
        } catch (feedError) {
          console.error('Error creating live feed item:', feedError);
          // Don't fail the match update if feed fails
        }
      }

      res.status(200).json({ success: true, message: 'Match result updated successfully', match });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /matches/:matchId/status
   * Update match status (READY, IN_PROGRESS, etc.)
   */
  async updateMatchStatus(req, res, next) {
    try {
      const { matchId } = req.params;
      const { status } = req.body;

      const validStatuses = ['PENDING', 'READY', 'IN_PROGRESS', 'COMPLETED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }

      const match = await prisma.match.update({
        where: { id: matchId },
        data: { status }
      });

      res.status(200).json({
        success: true,
        message: `Match status updated to ${status}`,
        match
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /matches/:matchId/live-score
   * Update live score during match (auto-save every point)
   */
  async updateLiveScore(req, res, next) {
    try {
      const { matchId } = req.params;
      const { pointHistory, currentScore, currentSet } = req.body;

      // Verify match is IN_PROGRESS
      const existingMatch = await prisma.match.findUnique({
        where: { id: matchId },
        select: { status: true }
      });

      if (!existingMatch) {
        return res.status(404).json({
          success: false,
          error: 'Match not found'
        });
      }

      if (existingMatch.status !== 'IN_PROGRESS') {
        return res.status(400).json({
          success: false,
          error: 'Can only update score for IN_PROGRESS matches'
        });
      }

      // Update match with live score
      const match = await prisma.match.update({
        where: { id: matchId },
        data: {
          pointHistory,
          // Optionally store current score for quick display
          // score field will be updated on finalize
        }
      });

      res.status(200).json({
        success: true,
        message: 'Live score updated',
        match
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /matches/:matchId/start
   * Manually start a match - set status to IN_PROGRESS
   */
  async startMatch(req, res, next) {
    try {
      const { matchId } = req.params;

      // Get match with event details to check permissions
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          event: {
            include: {
              tournament: {
                include: { organization: true }
              }
            }
          }
        }
      });

      if (!match) {
        return res.status(404).json({ success: false, error: 'Match not found' });
      }

      // Check if user has permission (org owner/admin)
      const userOrgMembership = await prisma.orgMember.findUnique({
        where: {
          userId_orgId: {
            userId: req.user.id,
            orgId: match.event.tournament.organizationId
          }
        }
      });

      if (!userOrgMembership || !['OWNER', 'ADMIN'].includes(userOrgMembership.role)) {
        return res.status(403).json({ success: false, error: 'Only tournament organizers can start matches' });
      }

      // Update match status
      const updatedMatch = await prisma.match.update({
        where: { id: matchId },
        data: {
          status: 'IN_PROGRESS',
          actualStartTime: new Date()
        },
        include: {
          event: true,
          participant1: { include: { user: true, partner: true } },
          participant2: { include: { user: true, partner: true } }
        }
      });

      res.status(200).json({
        success: true,
        message: 'Match started successfully',
        match: updatedMatch
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /matches/:matchId/complete
   * Manually complete a match - set status to COMPLETED
   */
  async completeMatch(req, res, next) {
    try {
      const { matchId } = req.params;

      // Get match with event details
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          event: {
            include: {
              tournament: {
                include: { organization: true }
              }
            }
          }
        }
      });

      if (!match) {
        return res.status(404).json({ success: false, error: 'Match not found' });
      }

      // Check permissions
      const userOrgMembership = await prisma.orgMember.findUnique({
        where: {
          userId_orgId: {
            userId: req.user.id,
            orgId: match.event.tournament.organizationId
          }
        }
      });

      if (!userOrgMembership || !['OWNER', 'ADMIN'].includes(userOrgMembership.role)) {
        return res.status(403).json({ success: false, error: 'Only tournament organizers can complete matches' });
      }

      // Update match status
      const updatedMatch = await prisma.match.update({
        where: { id: matchId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        },
        include: {
          event: true,
          participant1: { include: { user: true, partner: true } },
          participant2: { include: { user: true, partner: true } }
        }
      });

      res.status(200).json({
        success: true,
        message: 'Match completed successfully',
        match: updatedMatch
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /matches/:matchId/cancel
   * Cancel a match - set status to CANCELLED
   */
  async cancelMatch(req, res, next) {
    try {
      const { matchId } = req.params;

      // Get match with event details
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
          event: {
            include: {
              tournament: {
                include: { organization: true }
              }
            }
          }
        }
      });

      if (!match) {
        return res.status(404).json({ success: false, error: 'Match not found' });
      }

      // Check permissions
      const userOrgMembership = await prisma.orgMember.findUnique({
        where: {
          userId_orgId: {
            userId: req.user.id,
            orgId: match.event.tournament.organizationId
          }
        }
      });

      if (!userOrgMembership || !['OWNER', 'ADMIN'].includes(userOrgMembership.role)) {
        return res.status(403).json({ success: false, error: 'Only tournament organizers can cancel matches' });
      }

      // Update match status
      const updatedMatch = await prisma.match.update({
        where: { id: matchId },
        data: {
          status: 'CANCELLED'
        },
        include: {
          event: true,
          participant1: { include: { user: true, partner: true } },
          participant2: { include: { user: true, partner: true } }
        }
      });

      res.status(200).json({
        success: true,
        message: 'Match cancelled successfully',
        match: updatedMatch
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BracketController();
