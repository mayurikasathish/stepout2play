const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const { uploadProfilePicture, uploadOrganizationLogo } = require('../config/cloudinary');
const { authenticateToken } = require('../middleware/authenticate');

// User profile picture routes
router.post(
  '/users/:userId/profile-picture',
  authenticateToken,
  uploadProfilePicture.single('profilePicture'),
  uploadController.uploadProfilePicture
);

router.delete(
  '/users/:userId/profile-picture',
  authenticateToken,
  uploadController.deleteProfilePicture
);

// Organization logo routes
router.post(
  '/organizations/:organizationId/logo',
  authenticateToken,
  uploadOrganizationLogo.single('logo'),
  uploadController.uploadOrganizationLogo
);

router.delete(
  '/organizations/:organizationId/logo',
  authenticateToken,
  uploadController.deleteOrganizationLogo
);

module.exports = router;
