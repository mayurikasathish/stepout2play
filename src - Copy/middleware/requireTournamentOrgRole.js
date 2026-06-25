const prisma = require('../lib/prisma');

/**
 * Middleware factory that checks the user has the required role in the tournament's organization.
 * The tournament ID is read from req.params.tournamentId.
 *
 * Usage:
 *   router.post('/tournaments/:tournamentId/events', authenticate, requireTournamentOrgRole(['OWNER', 'ADMIN']), handler)
 */
const requireTournamentOrgRole = (roles) => async (req, res, next) => {
  try {
    const { tournamentId } = req.params;

    if (!tournamentId) {
      return res.status(400).json({ success: false, error: 'Missing tournament ID' });
    }

    // Get tournament with organization
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { organizationId: true }
    });

    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    // Check user's membership in the organization
    const membership = await prisma.orgMember.findUnique({
      where: {
        userId_orgId: { userId: req.user.id, orgId: tournament.organizationId }
      }
    });

    if (!membership || !roles.includes(membership.role)) {
      return res.status(403).json({ success: false, error: 'You do not have permission to do this' });
    }

    // Attach membership and orgId to req so downstream controllers can use it
    req.membership = membership;
    req.tournamentOrgId = tournament.organizationId;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = requireTournamentOrgRole;
