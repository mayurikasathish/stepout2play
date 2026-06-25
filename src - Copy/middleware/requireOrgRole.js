const prisma = require('../lib/prisma');

/**
 * Middleware factory that checks the user has the required role in the org.
 * The org ID is read from req.params.orgId.
 *
 * Usage:
 *   router.post('/orgs/:orgId/members', authenticate, requireOrgRole(['OWNER', 'ADMIN']), handler)
 */
const requireOrgRole = (roles) => async (req, res, next) => {
  try {
    const { orgId } = req.params;

    if (!orgId) {
      return res.status(400).json({ success: false, error: 'Missing organization ID' });
    }

    const membership = await prisma.orgMember.findUnique({
      where: {
        userId_orgId: { userId: req.user.id, orgId }
      }
    });

    if (!membership || !roles.includes(membership.role)) {
      return res.status(403).json({ success: false, error: 'You do not have permission to do this' });
    }

    // Attach membership to req so downstream controllers can use it without re-querying
    req.membership = membership;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = requireOrgRole;