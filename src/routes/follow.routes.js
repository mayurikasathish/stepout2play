const express = require('express');
const followController = require('../controllers/follow.controller');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// All routes require authentication
router.post('/', authenticate, (req, res, next) => followController.followUser(req, res, next));
router.delete('/:userId', authenticate, (req, res, next) => followController.unfollowUser(req, res, next));
router.patch('/:followId/accept', authenticate, (req, res, next) => followController.acceptFollowRequest(req, res, next));
router.patch('/:followId/reject', authenticate, (req, res, next) => followController.rejectFollowRequest(req, res, next));
router.get('/following', authenticate, (req, res, next) => followController.getFollowing(req, res, next));
router.get('/circle', authenticate, (req, res, next) => followController.getCircle(req, res, next));
router.get('/status/:userId', authenticate, (req, res, next) => followController.getFollowStatus(req, res, next));

module.exports = router;
