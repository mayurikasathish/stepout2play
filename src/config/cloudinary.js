const cloudinary = require('cloudinary').v2;
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

// Use memory storage for multer - we'll upload to Cloudinary manually in the controller
const memoryStorage = multer.memoryStorage();

// File filter function to validate file types
const createFileFilter = (allowedFormats) => {
  return (req, file, cb) => {
    const allowedMimeTypes = allowedFormats.map(format => {
      switch (format) {
        case 'jpg':
        case 'jpeg':
          return 'image/jpeg';
        case 'png':
          return 'image/png';
        case 'webp':
          return 'image/webp';
        case 'svg':
          return 'image/svg+xml';
        default:
          return `image/${format}`;
      }
    });

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed formats: ${allowedFormats.join(', ')}`), false);
    }
  };
};

// Create Multer instances with memory storage
const uploadProfilePicture = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: createFileFilter(['jpg', 'jpeg', 'png', 'webp'])
});

const uploadOrganizationLogo = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: createFileFilter(['jpg', 'jpeg', 'png', 'webp', 'svg'])
});

const uploadBanner = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for banners
  },
  fileFilter: createFileFilter(['jpg', 'jpeg', 'png', 'webp'])
});

const uploadGallery = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: createFileFilter(['jpg', 'jpeg', 'png', 'webp'])
});

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = async (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(buffer);
  });
};

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
  uploadToCloudinary,
  deleteImage
};
