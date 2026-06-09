const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const requireOrgRole = require('../middleware/requireOrgRole');
const { createOrg, getMyOrgs, getOrg, inviteMember } = require('../controllers/org.controller');

router.post('/', authenticate, createOrg);
router.get('/', authenticate, getMyOrgs);
router.get('/:orgId', authenticate, getOrg);
router.post('/:orgId/members', authenticate, requireOrgRole(['OWNER', 'ADMIN']), inviteMember);

module.exports = router;