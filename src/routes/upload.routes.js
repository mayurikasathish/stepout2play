const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const { uploadProfilePicture, uploadOrganizationLogo, uploadBanner, uploadGallery } = require('../config/cloudinary');
const authenticate = require('../middleware/authenticate');

// User profile picture routes
router.post(
  '/users/:userId/profile-picture',
  authenticate,
  uploadProfilePicture.single('profilePicture'),
  uploadController.uploadProfilePicture
);

router.delete(
  '/users/:userId/profile-picture',
  authenticate,
  uploadController.deleteProfilePicture
);

// Organization logo routes
router.post(
  '/organizations/:organizationId/logo',
  authenticate,
  uploadOrganizationLogo.single('logo'),
  uploadController.uploadOrganizationLogo
);

router.delete(
  '/organizations/:organizationId/logo',
  authenticate,
  uploadController.deleteOrganizationLogo
);

// Organization banner routes
router.post(
  '/organizations/:organizationId/banner',
  authenticate,
  uploadBanner.single('banner'),
  uploadController.uploadOrganizationBanner
);

// Organization gallery routes
router.post(
  '/organizations/:organizationId/gallery',
  authenticate,
  uploadGallery.array('photos', 10), // Max 10 photos at once
  uploadController.uploadGalleryPhotos
);

router.delete(
  '/organizations/:organizationId/gallery/:photoIndex',
  authenticate,
  uploadController.deleteGalleryPhoto
);

module.exports = router;
