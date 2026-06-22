const express = require('express');
const router = express.Router();
const { uploadProfilePicture, uploadOrganizationLogo } = require('../config/cloudinary');
const { authenticateToken } = require('../middleware/auth');

// Upload profile picture
router.post('/profile-picture', authenticateToken, uploadProfilePicture.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }

    const imageUrl = req.file.path; // Cloudinary URL
    const publicId = req.file.filename; // Cloudinary public ID

    res.json({
      success: true,
      imageUrl,
      publicId,
      message: 'Profile picture uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ success: false, error: 'Failed to upload profile picture' });
  }
});

// Upload organization logo
router.post('/organization-logo', authenticateToken, uploadOrganizationLogo.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }

    const imageUrl = req.file.path;
    const publicId = req.file.filename;

    res.json({
      success: true,
      imageUrl,
      publicId,
      message: 'Organization logo uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading organization logo:', error);
    res.status(500).json({ success: false, error: 'Failed to upload organization logo' });
  }
});

module.exports = router;
