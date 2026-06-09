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

module.exports = { createOrg, getMyOrgs, getOrg, inviteMember };