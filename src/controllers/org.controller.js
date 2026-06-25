const prisma = require('../lib/prisma');

// Utility: convert "NBC Sports Academy" → "nbc-sports-academy"
function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')   // remove special chars
    .replace(/\s+/g, '-')            // spaces to hyphens
    .replace(/-+/g, '-');            // collapse multiple hyphens
}

// POST /orgs — create a new organization
// The creating user automatically becomes OWNER
const createOrg = async (req, res) => {
  const { name, logoUrl } = req.body;

  if (!name || name.trim().length < 2) {
    return res.status(400).json({ success: false, error: 'Organization name is required' });
  }

  const baseSlug = generateSlug(name);

  // Slugs must be unique — if "nbc-sports" exists, try "nbc-sports-2" etc.
  let slug = baseSlug;
  let suffix = 2;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix++;
  }

  // Create org AND the owner membership in one transaction
  // A transaction means: both operations succeed, or neither does
  const org = await prisma.$transaction(async (tx) => {
    const newOrg = await tx.organization.create({
      data: { name: name.trim(), slug, logoUrl }
    });

    await tx.orgMember.create({
      data: {
        userId: req.user.id,
        orgId: newOrg.id,
        role: 'OWNER'
      }
    });

    return newOrg;
  });

  // Mark onboarding complete since they've created an org
  await prisma.user.update({
    where: { id: req.user.id },
    data: { onboardingComplete: true }
  });

  res.status(201).json({ success: true, org });
};

// GET /orgs — get all orgs the current user is a member of
const getMyOrgs = async (req, res) => {
  const memberships = await prisma.orgMember.findMany({
    where: { userId: req.user.id },
    include: {
      org: true  // join the organization data
    }
  });

  // Shape the response: return orgs with the user's role in each
  const orgs = memberships.map(m => ({
    ...m.org,
    myRole: m.role
  }));

  res.json({ success: true, orgs });
};

// GET /orgs/:orgId — get a single org (must be a member)
const getOrg = async (req, res) => {
  const { orgId } = req.params;

  const membership = await prisma.orgMember.findUnique({
    where: {
      userId_orgId: { userId: req.user.id, orgId }
    },
    include: { org: true }
  });

  if (!membership) {
    return res.status(404).json({ success: false, error: 'Organization not found' });
  }

  // Get all members of this org (for the org settings page)
  const members = await prisma.orgMember.findMany({
    where: { orgId },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true }
      }
    }
  });

  res.json({
    success: true,
    org: { ...membership.org, myRole: membership.role },
    members
  });
};

// GET /orgs/:idOrSlug/public — get org for public minisite (no auth required, but checks auth if present)
const getOrgPublic = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const userId = req.user?.id; // Optional auth

    // Try to find by ID first, then by slug
    let org = await prisma.organization.findUnique({
      where: { id: idOrSlug },
      include: {
        members: userId ? {
          select: { id: true, userId: true, role: true }
        } : {
          select: { id: true }
        },
        tournaments: {
          select: { id: true }
        }
      }
    });

    if (!org) {
      org = await prisma.organization.findUnique({
        where: { slug: idOrSlug },
        include: {
          members: userId ? {
            select: { id: true, userId: true, role: true }
          } : {
            select: { id: true }
          },
          tournaments: {
            select: { id: true }
          }
        }
      });
    }

    if (!org) {
      return res.status(404).json({ success: false, error: 'Organization not found' });
    }

    // Check if user is a member
    let userRole = null;
    if (userId) {
      const membership = org.members.find(m => m.userId === userId);
      userRole = membership ? membership.role : null;
    }

    // Return public org data with counts
    res.json({
      success: true,
      org: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        logoUrl: org.logoUrl,
        tagline: org.tagline,
        bannerImageUrl: org.bannerImageUrl,
        photoGallery: org.photoGallery,
        motto: org.motto,
        aboutUs: org.aboutUs,
        joinUsInfo: org.joinUsInfo,
        contactEmail: org.contactEmail,
        contactPhone: org.contactPhone,
        colorScheme: org.colorScheme,
        memberCount: org.members.length,
        tournamentCount: org.tournaments.length,
        userRole: userRole // OWNER, ADMIN, MEMBER, or null
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /orgs/:orgId/members — invite a user to the org by email
// Only OWNER or ADMIN can do this
const inviteMember = async (req, res) => {
  const { orgId } = req.params;
  const { email, role = 'MEMBER' } = req.body;

  if (!['MEMBER', 'ADMIN'].includes(role)) {
    return res.status(400).json({ success: false, error: 'Invalid role' });
  }

  // Find the user to invite
  const invitee = await prisma.user.findUnique({ where: { email } });
  if (!invitee) {
    return res.status(404).json({ success: false, error: 'No user found with that email' });
  }

  // Check they're not already a member
  const existing = await prisma.orgMember.findUnique({
    where: { userId_orgId: { userId: invitee.id, orgId } }
  });
  if (existing) {
    return res.status(409).json({ success: false, error: 'User is already a member' });
  }

  const member = await prisma.orgMember.create({
    data: { userId: invitee.id, orgId, role },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } }
    }
  });

  res.status(201).json({ success: true, member });
};

// PATCH /orgs/:orgId — update organization (OWNER or ADMIN only)
const updateOrg = async (req, res) => {
  const { orgId } = req.params;
  const {
    name,
    logoUrl,
    tagline,
    bannerImageUrl,
    photoGallery,
    motto,
    aboutUs,
    joinUsInfo,
    contactEmail,
    contactPhone,
    socialLinks,
    colorScheme
  } = req.body;

  const updateData = {};
  if (name !== undefined) {
    updateData.name = name.trim();
    // Regenerate slug if name changed
    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let suffix = 2;
    while (await prisma.organization.findFirst({ where: { slug, NOT: { id: orgId } } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }
    updateData.slug = slug;
  }
  if (logoUrl !== undefined) updateData.logoUrl = logoUrl || null;
  if (tagline !== undefined) updateData.tagline = tagline || null;
  if (bannerImageUrl !== undefined) updateData.bannerImageUrl = bannerImageUrl || null;
  if (photoGallery !== undefined) updateData.photoGallery = photoGallery;
  if (motto !== undefined) updateData.motto = motto || null;
  if (aboutUs !== undefined) updateData.aboutUs = aboutUs || null;
  if (joinUsInfo !== undefined) updateData.joinUsInfo = joinUsInfo || null;
  if (contactEmail !== undefined) updateData.contactEmail = contactEmail || null;
  if (contactPhone !== undefined) updateData.contactPhone = contactPhone || null;
  if (socialLinks !== undefined) updateData.socialLinks = socialLinks;
  if (colorScheme !== undefined) updateData.colorScheme = colorScheme;

  const org = await prisma.organization.update({
    where: { id: orgId },
    data: updateData
  });

  res.json({ success: true, organization: org });
};

// DELETE /orgs/:orgId — delete organization (OWNER only)
const deleteOrg = async (req, res) => {
  const { orgId } = req.params;

  // Delete cascades to tournaments, events, registrations, and members
  await prisma.organization.delete({
    where: { id: orgId }
  });

  res.json({ success: true, message: 'Organization deleted successfully' });
};

// GET /orgs/:orgId/tournaments — get all tournaments for an organization
const getOrgTournaments = async (req, res, next) => {
  try {
    const { orgId } = req.params;

    const tournaments = await prisma.tournament.findMany({
      where: { organizationId: orgId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true
          }
        },
        events: {
          select: {
            id: true,
            name: true,
            format: true,
            _count: {
              select: {
                registrations: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Add participant counts
    const tournamentsWithCounts = tournaments.map(tournament => {
      const totalRegistrations = tournament.events.reduce(
        (sum, event) => sum + event._count.registrations,
        0
      );

      return {
        ...tournament,
        participantCount: totalRegistrations
      };
    });

    res.json({ success: true, tournaments: tournamentsWithCounts });
  } catch (error) {
    next(error);
  }
};

// GET /orgs/discover — List all organizations for discovery page
const discoverOrgs = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    const orgs = await prisma.organization.findMany({
      include: {
        members: {
          select: {
            userId: true,
            role: true
          }
        },
        tournaments: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format organizations with member/tournament counts and user's role
    const orgsWithData = orgs.map(org => {
      // Find user's role in this organization
      const userMembership = userId ? org.members.find(m => m.userId === userId) : null;

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        logoUrl: org.logoUrl,
        memberCount: org.members.length,
        tournamentCount: org.tournaments.length,
        userRole: userMembership ? userMembership.role : null, // OWNER, ADMIN, MEMBER, or null
        createdAt: org.createdAt
      };
    });

    res.json({ success: true, orgs: orgsWithData });
  } catch (error) {
    next(error);
  }
};

// POST /orgs/:orgId/follow — follow an organization
const followOrg = async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const userId = req.user.id;

    // Check if org exists
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) {
      return res.status(404).json({ success: false, error: 'Organization not found' });
    }

    // Check if already following
    const existing = await prisma.orgFollower.findUnique({
      where: { userId_orgId: { userId, orgId } }
    });

    if (existing) {
      return res.status(400).json({ success: false, error: 'Already following this organization' });
    }

    await prisma.orgFollower.create({
      data: { userId, orgId }
    });

    res.json({ success: true, message: 'Organization followed successfully' });
  } catch (error) {
    next(error);
  }
};

// DELETE /orgs/:orgId/follow — unfollow an organization
const unfollowOrg = async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const userId = req.user.id;

    const follower = await prisma.orgFollower.findUnique({
      where: { userId_orgId: { userId, orgId } }
    });

    if (!follower) {
      return res.status(404).json({ success: false, error: 'Not following this organization' });
    }

    await prisma.orgFollower.delete({
      where: { id: follower.id }
    });

    res.json({ success: true, message: 'Organization unfollowed successfully' });
  } catch (error) {
    next(error);
  }
};

// POST /orgs/:orgId/join-request — request to join an organization
const requestJoin = async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const userId = req.user.id;
    const { role, email, reason, experience } = req.body;

    // Validate required fields
    if (!role || !email || !reason) {
      return res.status(400).json({ success: false, error: 'Role, email, and reason are required' });
    }

    if (!['MEMBER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Role must be MEMBER or ADMIN' });
    }

    // Check if org exists
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) {
      return res.status(404).json({ success: false, error: 'Organization not found' });
    }

    // Check if already a member
    const existingMember = await prisma.orgMember.findUnique({
      where: { userId_orgId: { userId, orgId } }
    });
    if (existingMember) {
      return res.status(400).json({ success: false, error: 'You are already a member of this organization' });
    }

    // Check if already has a pending request
    const existingRequest = await prisma.orgJoinRequest.findUnique({
      where: { userId_orgId: { userId, orgId } }
    });
    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        return res.status(400).json({ success: false, error: 'You already have a pending request for this organization' });
      }
      // Update existing rejected request
      const updated = await prisma.orgJoinRequest.update({
        where: { id: existingRequest.id },
        data: { role, email, reason, experience, status: 'PENDING' }
      });
      return res.json({ success: true, request: updated });
    }

    // Create new join request
    const request = await prisma.orgJoinRequest.create({
      data: {
        userId,
        orgId,
        role,
        email,
        reason,
        experience: experience || null
      }
    });

    res.json({ success: true, request });
  } catch (error) {
    next(error);
  }
};

// GET /orgs/:orgId/join-requests — get pending join requests (OWNER/ADMIN only)
const getJoinRequests = async (req, res, next) => {
  try {
    const { orgId } = req.params;

    const requests = await prisma.orgJoinRequest.findMany({
      where: {
        orgId,
        status: 'PENDING'
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get user details for each request
    const requestsWithUsers = await Promise.all(
      requests.map(async (req) => {
        const user = await prisma.user.findUnique({
          where: { id: req.userId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        });
        return {
          ...req,
          user
        };
      })
    );

    res.json({ success: true, requests: requestsWithUsers });
  } catch (error) {
    next(error);
  }
};

// POST /orgs/:orgId/join-requests/:requestId/accept — accept a join request (OWNER/ADMIN only)
const acceptJoinRequest = async (req, res, next) => {
  try {
    const { orgId, requestId } = req.params;

    const request = await prisma.orgJoinRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Request already processed' });
    }

    // Create org member and update request status in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.orgMember.create({
        data: {
          userId: request.userId,
          orgId: request.orgId,
          role: request.role
        }
      });

      await tx.orgJoinRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED' }
      });
    });

    res.json({ success: true, message: 'Join request accepted' });
  } catch (error) {
    next(error);
  }
};

// POST /orgs/:orgId/join-requests/:requestId/reject — reject a join request (OWNER/ADMIN only)
const rejectJoinRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;

    const request = await prisma.orgJoinRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Request already processed' });
    }

    await prisma.orgJoinRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' }
    });

    res.json({ success: true, message: 'Join request rejected' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrg, getMyOrgs, getOrg, getOrgPublic, updateOrg, deleteOrg, inviteMember, getOrgTournaments, discoverOrgs, followOrg, unfollowOrg, requestJoin, getJoinRequests, acceptJoinRequest, rejectJoinRequest };