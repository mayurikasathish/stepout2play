const prisma = require('../lib/prisma');

/**
 * Middleware factory that checks the user has the required role in the match's tournament's organization.
 * The match ID is read from req.params.matchId.
 *
 * Usage:
 *   router.patch('/matches/:matchId/result', authenticate, requireMatchOrgRole(['OWNER', 'ADMIN']), handler)
 */
const requireMatchOrgRole = (roles) => async (req, res, next) => {
  try {
    const { matchId } = req.params;

    if (!matchId) {
      return res.status(400).json({ success: false, error: 'Missing match ID' });
    }

    // Get match with event, tournament and organization
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        event: {
          include: {
            tournament: {
              select: { organizationId: true }
            }
          }
        }
      }
    });

    if (!match) {
      return res.status(404).json({ success: false, error: 'Match not found' });
    }

    // Check user's membership in the organization
    const membership = await prisma.orgMember.findUnique({
      where: {
        userId_orgId: { userId: req.user.id, orgId: match.event.tournament.organizationId }
      }
    });

    if (!membership || !roles.includes(membership.role)) {
      return res.status(403).json({ success: false, error: 'You do not have permission to do this' });
    }

    // Attach membership and orgId to req
    req.membership = membership;
    req.matchOrgId = match.event.tournament.organizationId;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = requireMatchOrgRole;
