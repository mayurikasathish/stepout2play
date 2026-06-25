const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const requireOrgRole = require('../middleware/requireOrgRole');
const { createOrg, getMyOrgs, getOrg, getOrgPublic, updateOrg, deleteOrg, inviteMember, getOrgTournaments, discoverOrgs, followOrg, unfollowOrg, requestJoin, getJoinRequests, acceptJoinRequest, rejectJoinRequest } = require('../controllers/org.controller');
const tournamentController = require('../controllers/tournament.controller');

router.post('/', authenticate, createOrg);
router.get('/discover', authenticate, discoverOrgs);
router.get('/:idOrSlug/public', getOrgPublic);
router.get('/', authenticate, getMyOrgs);
router.get('/:orgId', authenticate, getOrg);
router.patch('/:orgId', authenticate, requireOrgRole(['OWNER', 'ADMIN']), updateOrg);
router.delete('/:orgId', authenticate, requireOrgRole(['OWNER']), deleteOrg);
router.get('/:orgId/tournaments', authenticate, getOrgTournaments);
router.post('/:orgId/members', authenticate, requireOrgRole(['OWNER', 'ADMIN']), inviteMember);
router.post('/:orgId/follow', authenticate, followOrg);
router.delete('/:orgId/follow', authenticate, unfollowOrg);
router.post('/:orgId/join-request', authenticate, requestJoin);
router.get('/:orgId/join-requests', authenticate, requireOrgRole(['OWNER', 'ADMIN']), getJoinRequests);
router.post('/:orgId/join-requests/:requestId/accept', authenticate, requireOrgRole(['OWNER', 'ADMIN']), acceptJoinRequest);
router.post('/:orgId/join-requests/:requestId/reject', authenticate, requireOrgRole(['OWNER', 'ADMIN']), rejectJoinRequest);

// Tournament routes under organization
router.post(
  '/:orgId/tournaments',
  authenticate,
  requireOrgRole(['OWNER', 'ADMIN']),
  tournamentController.createTournament.bind(tournamentController)
);

module.exports = router;