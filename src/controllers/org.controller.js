const prisma = require('../lib/prisma');
const { NotificationHelpers } = require('../utils/notificationHelpers');
const notificationService = require('../services/notification.service');

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
  const { name, logoUrl, contactPerson, contactEmail, contactPhone, location, description, sports, socialLinks } = req.body;

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
      data: {
        name: name.trim(),
        slug,
        logoUrl,
        contactPerson: contactPerson?.trim() || null,
        contactEmail: contactEmail?.trim() || null,
        contactPhone: contactPhone?.trim() || null,
        location: location?.trim() || null,
        description: description?.trim() || null,
        sports: sports || [],
        socialLinks: socialLinks || null
      }
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
        description: org.description,
        bannerImageUrl: org.bannerImageUrl,
        photoGallery: org.photoGallery,
        motto: org.motto,
        aboutUs: org.aboutUs,
        joinUsInfo: org.joinUsInfo,
        membershipFee: org.membershipFee,
        location: org.location,
        contactEmail: org.contactEmail,
        contactPhone: org.contactPhone,
        instagramUrl: org.instagramUrl,
        facebookUrl: org.facebookUrl,
        twitterUrl: org.twitterUrl,
        websiteUrl: org.websiteUrl,
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
    contactPerson,
    contactEmail,
    contactPhone,
    location,
    description,
    sports,
    socialLinks,
    membershipFee,
    instagramUrl,
    facebookUrl,
    twitterUrl,
    websiteUrl,
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
  if (contactPerson !== undefined) updateData.contactPerson = contactPerson || null;
  if (contactEmail !== undefined) updateData.contactEmail = contactEmail || null;
  if (contactPhone !== undefined) updateData.contactPhone = contactPhone || null;
  if (location !== undefined) updateData.location = location || null;
  if (description !== undefined) updateData.description = description || null;
  if (sports !== undefined) updateData.sports = sports || [];
  if (socialLinks !== undefined) updateData.socialLinks = socialLinks;
  if (membershipFee !== undefined) updateData.membershipFee = membershipFee || null;
  if (instagramUrl !== undefined) updateData.instagramUrl = instagramUrl || null;
  if (facebookUrl !== undefined) updateData.facebookUrl = facebookUrl || null;
  if (twitterUrl !== undefined) updateData.twitterUrl = twitterUrl || null;
  if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl || null;
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
            role: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
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

      // Get all owners
      const owners = org.members
        .filter(m => m.role === 'OWNER')
        .map(m => ({
          id: m.user.id,
          firstName: m.user.firstName,
          lastName: m.user.lastName,
          fullName: `${m.user.firstName} ${m.user.lastName}`
        }));

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        logoUrl: org.logoUrl,
        description: org.description,
        sports: org.sports,
        contactPerson: org.contactPerson,
        contactPhone: org.contactPhone,
        contactEmail: org.contactEmail,
        location: org.location,
        socialLinks: org.socialLinks,
        website: org.website,
        memberCount: org.members.length,
        tournamentCount: org.tournaments.length,
        owners: owners,
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

    // Get org details for notification
    const org = await prisma.organization.findUnique({
      where: { id: request.orgId }
    });

    // Create org member, update request status, and create notification in a transaction
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

      // Create notification for the user
      await tx.notification.create({
        data: {
          userId: request.userId,
          type: 'ORG_JOIN_APPROVED',
          title: 'Join Request Accepted! 🎉',
          message: `Your request to join ${org?.name || 'the organization'} has been accepted. Welcome to the team!`,
          icon: '🎉',
          actionUrl: `/orgs/${request.orgId}`,
          actionText: 'View Organization',
          data: {
            orgId: request.orgId,
            orgName: org?.name
          }
        }
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

    // Get org details for notification
    const org = await prisma.organization.findUnique({
      where: { id: request.orgId }
    });

    // Update request status and create notification
    await prisma.$transaction(async (tx) => {
      await tx.orgJoinRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED' }
      });

      // Create notification for the user
      await tx.notification.create({
        data: {
          userId: request.userId,
          type: 'ORG_JOIN_REJECTED',
          title: 'Join Request Update',
          message: `Your request to join ${org?.name || 'the organization'} was not approved at this time.`,
          icon: '📋',
          data: {
            orgId: request.orgId,
            orgName: org?.name
          }
        }
      });
    });

    res.json({ success: true, message: 'Join request rejected' });
  } catch (error) {
    next(error);
  }
};

// POST /orgs/:orgId/invite — Send invitation to a user
const sendInvitation = async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const { userId, role, message } = req.body;

    if (!userId || !role) {
      return res.status(400).json({ success: false, error: 'userId and role are required' });
    }

    // Check if user exists
    const invitee = await prisma.user.findUnique({ where: { id: userId } });
    if (!invitee) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check if already a member
    const existingMember = await prisma.orgMember.findUnique({
      where: { userId_orgId: { userId, orgId } }
    });
    if (existingMember) {
      return res.status(400).json({ success: false, error: 'User is already a member' });
    }

    // Check if invitation already exists
    const existingInvite = await prisma.orgInvitation.findUnique({
      where: { orgId_inviteeId: { orgId, inviteeId: userId } }
    });
    if (existingInvite && existingInvite.status === 'PENDING') {
      return res.status(400).json({ success: false, error: 'Invitation already sent' });
    }

    // Delete old declined/expired invites
    if (existingInvite) {
      await prisma.orgInvitation.delete({ where: { id: existingInvite.id } });
    }

    // Get org name first
    const org = await prisma.organization.findUnique({
      where: { id: orgId }
    });

    // Create invitation (expires in 7 days)
    const invitation = await prisma.orgInvitation.create({
      data: {
        orgId,
        inviterId: req.user.id,
        inviteeId: userId,
        role: role.toUpperCase(),
        message,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // Send notification to invitee
    try {
      await NotificationHelpers.sendOrgInvitation({
        inviteeId: userId,
        inviterName: `${req.user.firstName} ${req.user.lastName}`,
        orgName: org?.name || 'an organization',
        orgId: orgId,
        role: role.toUpperCase()
      });
    } catch (notifError) {
      console.error('Error sending invitation notification:', notifError);
      // Don't fail the invitation if notification fails
    }

    res.status(201).json({ success: true, invitation });
  } catch (err) {
    next(err);
  }
};

// GET /orgs/invitations/received — Get invitations received by current user
const getReceivedInvitations = async (req, res, next) => {
  try {
    const invitations = await prisma.orgInvitation.findMany({
      where: {
        inviteeId: req.user.id,
        status: 'PENDING'
      },
      include: {
        organization: {
          select: { id: true, name: true, slug: true, logoUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch inviter details
    const invitationsWithInviters = await Promise.all(
      invitations.map(async (inv) => {
        const inviter = await prisma.user.findUnique({
          where: { id: inv.inviterId },
          select: { id: true, firstName: true, lastName: true }
        });
        return { ...inv, inviter };
      })
    );

    res.json({ success: true, invitations: invitationsWithInviters });
  } catch (err) {
    next(err);
  }
};

// POST /orgs/invitations/:invitationId/accept — Accept invitation
const acceptInvitation = async (req, res, next) => {
  try {
    const { invitationId } = req.params;

    const invitation = await prisma.orgInvitation.findUnique({
      where: { id: invitationId }
    });

    if (!invitation) {
      return res.status(404).json({ success: false, error: 'Invitation not found' });
    }

    if (invitation.inviteeId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    if (invitation.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Invitation already processed' });
    }

    // Check expiry
    if (invitation.expiresAt && new Date() > invitation.expiresAt) {
      await prisma.orgInvitation.update({
        where: { id: invitationId },
        data: { status: 'EXPIRED' }
      });
      return res.status(400).json({ success: false, error: 'Invitation expired' });
    }

    // Get org and inviter details
    const org = await prisma.organization.findUnique({
      where: { id: invitation.orgId }
    });

    const inviter = await prisma.user.findUnique({
      where: { id: invitation.inviterId }
    });

    // Add user to org and update invitation
    await prisma.$transaction([
      prisma.orgMember.create({
        data: {
          userId: invitation.inviteeId,
          orgId: invitation.orgId,
          role: invitation.role
        }
      }),
      prisma.orgInvitation.update({
        where: { id: invitationId },
        data: { status: 'ACCEPTED' }
      })
    ]);

    // Notify the inviter that their invitation was accepted
    try {
      await notificationService.createNotification({
        userId: invitation.inviterId,
        type: 'INVITE_ACCEPTED',
        title: 'Invitation Accepted',
        message: `${req.user.firstName} ${req.user.lastName} accepted your invitation to join ${org?.name || 'your organization'}`,
        data: { orgId: invitation.orgId, inviteeId: invitation.inviteeId },
        actionUrl: `/manage/org/${invitation.orgId}`,
        actionText: 'View Organization',
        icon: 'user-group',
        priority: 'MEDIUM'
      });
    } catch (notifError) {
      console.error('Error sending acceptance notification:', notifError);
    }

    res.json({ success: true, message: 'Invitation accepted' });
  } catch (err) {
    next(err);
  }
};

// POST /orgs/invitations/:invitationId/decline — Decline invitation
const declineInvitation = async (req, res, next) => {
  try {
    const { invitationId } = req.params;

    const invitation = await prisma.orgInvitation.findUnique({
      where: { id: invitationId }
    });

    if (!invitation) {
      return res.status(404).json({ success: false, error: 'Invitation not found' });
    }

    if (invitation.inviteeId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    await prisma.orgInvitation.update({
      where: { id: invitationId },
      data: { status: 'DECLINED' }
    });

    res.json({ success: true, message: 'Invitation declined' });
  } catch (err) {
    next(err);
  }
};

// GET /orgs/check-name — check if organization name already exists
const checkOrgName = async (req, res) => {
  const { name } = req.query;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'Name is required' });
  }

  try {
    const existing = await prisma.organization.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        }
      }
    });

    return res.json({
      success: true,
      exists: !!existing
    });
  } catch (error) {
    console.error('Error checking org name:', error);
    return res.status(500).json({ success: false, error: 'Failed to check organization name' });
  }
};

module.exports = { createOrg, getMyOrgs, getOrg, getOrgPublic, updateOrg, deleteOrg, inviteMember, getOrgTournaments, discoverOrgs, followOrg, unfollowOrg, requestJoin, getJoinRequests, acceptJoinRequest, rejectJoinRequest, sendInvitation, getReceivedInvitations, acceptInvitation, declineInvitation, checkOrgName };