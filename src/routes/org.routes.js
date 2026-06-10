const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const requireOrgRole = require('../middleware/requireOrgRole');
const { createOrg, getMyOrgs, getOrg, updateOrg, deleteOrg, inviteMember, getOrgTournaments } = require('../controllers/org.controller');
const tournamentController = require('../controllers/tournament.controller');

router.post('/', authenticate, createOrg);
router.get('/', authenticate, getMyOrgs);
router.get('/:orgId', authenticate, getOrg);
router.patch('/:orgId', authenticate, requireOrgRole(['OWNER', 'ADMIN']), updateOrg);
router.delete('/:orgId', authenticate, requireOrgRole(['OWNER']), deleteOrg);
router.get('/:orgId/tournaments', authenticate, getOrgTournaments);
router.post('/:orgId/members', authenticate, requireOrgRole(['OWNER', 'ADMIN']), inviteMember);

// Tournament routes under organization
router.post(
  '/:orgId/tournaments',
  authenticate,
  requireOrgRole(['OWNER', 'ADMIN']),
  tournamentController.createTournament.bind(tournamentController)
);

module.exports = router;