const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary (skip if credentials not set or are placeholders)
const hasValidCredentials =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET &&
  !process.env.CLOUDINARY_CLOUD_NAME.includes('your_') &&
  !process.env.CLOUDINARY_API_KEY.includes('your_');

if (hasValidCredentials) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('Cloudinary configured successfully');
} else {
  console.warn('Cloudinary credentials not set - image upload will not work');
}

// Configure Multer Storage for different upload types
let profilePictureStorage, organizationLogoStorage, bannerStorage, galleryStorage;
let uploadProfilePicture, uploadOrganizationLogo, uploadBanner, uploadGallery;

if (hasValidCredentials) {
  // Profile Pictures
  profilePictureStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'stepout2play/profiles',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    }
  });

  // Organization Logos
  organizationLogoStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'stepout2play/organizations/logos',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
      transformation: [
        { width: 400, height: 400, crop: 'fit' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    }
  });

  // Banners (org banners, tournament banners, etc)
  bannerStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'stepout2play/banners',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        { width: 1920, height: 600, crop: 'fill' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    }
  });

  // Photo Galleries
  galleryStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'stepout2play/galleries',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        { width: 1200, height: 800, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    }
  });

  // Create Multer instances
  uploadProfilePicture = multer({
    storage: profilePictureStorage,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  });

  uploadOrganizationLogo = multer({
    storage: organizationLogoStorage,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  });

  uploadBanner = multer({
    storage: bannerStorage,
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit for banners
    }
  });

  uploadGallery = multer({
    storage: galleryStorage,
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit
    }
  });
} else {
  // Dummy multer instances when Cloudinary is not configured
  const memoryStorage = multer.memoryStorage();
  uploadProfilePicture = multer({ storage: memoryStorage });
  uploadOrganizationLogo = multer({ storage: memoryStorage });
  uploadBanner = multer({ storage: memoryStorage });
  uploadGallery = multer({ storage: memoryStorage });
}

// Helper function to delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    return false;
  }
};

module.exports = {
  cloudinary,
  uploadProfilePicture,
  uploadOrganizationLogo,
  uploadBanner,
  uploadGallery,
  deleteImage
};
