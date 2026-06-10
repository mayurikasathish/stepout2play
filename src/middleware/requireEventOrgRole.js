const prisma = require('../lib/prisma');

/**
 * Middleware factory that checks the user has the required role in the event's tournament's organization.
 * The event ID is read from req.params.eventId.
 *
 * Usage:
 *   router.get('/events/:eventId/registrations', authenticate, requireEventOrgRole(['OWNER', 'ADMIN']), handler)
 */
const requireEventOrgRole = (roles) => async (req, res, next) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({ success: false, error: 'Missing event ID' });
    }

    // Get event with tournament and organization
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        tournament: {
          select: { organizationId: true }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    // Check user's membership in the organization
    const membership = await prisma.orgMember.findUnique({
      where: {
        userId_orgId: { userId: req.user.id, orgId: event.tournament.organizationId }
      }
    });

    if (!membership || !roles.includes(membership.role)) {
      return res.status(403).json({ success: false, error: 'You do not have permission to do this' });
    }

    // Attach membership and orgId to req
    req.membership = membership;
    req.eventOrgId = event.tournament.organizationId;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = requireEventOrgRole;
