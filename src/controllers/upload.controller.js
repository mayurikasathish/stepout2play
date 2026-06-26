const prisma = require('../lib/prisma');
const { deleteImage, uploadToCloudinary } = require('../config/cloudinary');

class UploadController {
  /**
   * Upload user profile picture
   * POST /users/:userId/profile-picture
   */
  async uploadProfilePicture(req, res, next) {
    try {
      const { userId } = req.params;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      // Get the user's old profile picture to delete it
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { profilePicture: true }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Delete old image from Cloudinary if exists
      if (user.profilePicture) {
        const publicId = user.profilePicture.split('/').slice(-2).join('/').split('.')[0];
        await deleteImage(publicId);
      }

      // Upload to Cloudinary using the official SDK
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'stepout2play/profiles',
        transformation: [
          { width: 500, height: 500, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      });

      // Update user with new profile picture URL
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { profilePicture: result.secure_url },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profilePicture: true
        }
      });

      res.status(200).json({
        success: true,
        message: 'Profile picture uploaded successfully',
        user: updatedUser
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload organization logo
   * POST /organizations/:organizationId/logo
   */
  async uploadOrganizationLogo(req, res, next) {
    try {
      const { organizationId } = req.params;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      // Get the organization's old logo to delete it
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { logoUrl: true }
      });

      if (!organization) {
        return res.status(404).json({
          success: false,
          error: 'Organization not found'
        });
      }

      // Delete old logo from Cloudinary if exists
      if (organization.logoUrl) {
        const publicId = organization.logoUrl.split('/').slice(-2).join('/').split('.')[0];
        await deleteImage(publicId);
      }

      // Upload to Cloudinary using the official SDK
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'stepout2play/organizations/logos',
        transformation: [
          { width: 400, height: 400, crop: 'fit' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      });

      // Update organization with new logo URL
      const updatedOrganization = await prisma.organization.update({
        where: { id: organizationId },
        data: { logoUrl: result.secure_url },
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true
        }
      });

      res.status(200).json({
        success: true,
        message: 'Organization logo uploaded successfully',
        organization: updatedOrganization
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user profile picture
   * DELETE /users/:userId/profile-picture
   */
  async deleteProfilePicture(req, res, next) {
    try {
      const { userId } = req.params;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { profilePicture: true }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      if (user.profilePicture) {
        const publicId = user.profilePicture.split('/').slice(-2).join('/').split('.')[0];
        await deleteImage(publicId);
      }

      await prisma.user.update({
        where: { id: userId },
        data: { profilePicture: null }
      });

      res.status(200).json({
        success: true,
        message: 'Profile picture deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete organization logo
   * DELETE /organizations/:organizationId/logo
   */
  async deleteOrganizationLogo(req, res, next) {
    try {
      const { organizationId } = req.params;

      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { logoUrl: true }
      });

      if (!organization) {
        return res.status(404).json({
          success: false,
          error: 'Organization not found'
        });
      }

      if (organization.logoUrl) {
        const publicId = organization.logoUrl.split('/').slice(-2).join('/').split('.')[0];
        await deleteImage(publicId);
      }

      await prisma.organization.update({
        where: { id: organizationId },
        data: { logoUrl: null }
      });

      res.status(200).json({
        success: true,
        message: 'Organization logo deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload organization banner
   * POST /organizations/:organizationId/banner
   */
  async uploadOrganizationBanner(req, res, next) {
    try {
      const { organizationId } = req.params;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { bannerImageUrl: true }
      });

      if (!organization) {
        return res.status(404).json({
          success: false,
          error: 'Organization not found'
        });
      }

      // Delete old banner if exists
      if (organization.bannerImageUrl) {
        const publicId = organization.bannerImageUrl.split('/').slice(-2).join('/').split('.')[0];
        await deleteImage(publicId);
      }

      // Upload to Cloudinary using the official SDK
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'stepout2play/banners',
        transformation: [
          { width: 1920, height: 600, crop: 'fill' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      });

      const updatedOrganization = await prisma.organization.update({
        where: { id: organizationId },
        data: { bannerImageUrl: result.secure_url },
        select: {
          id: true,
          name: true,
          bannerImageUrl: true
        }
      });

      res.status(200).json({
        success: true,
        message: 'Banner uploaded successfully',
        organization: updatedOrganization
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload gallery photos for organization
   * POST /organizations/:organizationId/gallery
   */
  async uploadGalleryPhotos(req, res, next) {
    try {
      const { organizationId } = req.params;

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files uploaded'
        });
      }

      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { photoGallery: true }
      });

      if (!organization) {
        return res.status(404).json({
          success: false,
          error: 'Organization not found'
        });
      }

      // Upload all photos to Cloudinary in parallel
      const uploadPromises = req.files.map(file =>
        uploadToCloudinary(file.buffer, {
          folder: 'stepout2play/galleries',
          transformation: [
            { width: 1200, height: 800, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        })
      );

      const uploadResults = await Promise.all(uploadPromises);
      const newPhotoUrls = uploadResults.map(result => result.secure_url);

      // Add to existing gallery
      const updatedOrganization = await prisma.organization.update({
        where: { id: organizationId },
        data: {
          photoGallery: [...organization.photoGallery, ...newPhotoUrls]
        },
        select: {
          id: true,
          name: true,
          photoGallery: true
        }
      });

      res.status(200).json({
        success: true,
        message: 'Gallery photos uploaded successfully',
        organization: updatedOrganization
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a gallery photo
   * DELETE /organizations/:organizationId/gallery/:photoIndex
   */
  async deleteGalleryPhoto(req, res, next) {
    try {
      const { organizationId, photoIndex } = req.params;
      const index = parseInt(photoIndex);

      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { photoGallery: true }
      });

      if (!organization) {
        return res.status(404).json({
          success: false,
          error: 'Organization not found'
        });
      }

      if (index < 0 || index >= organization.photoGallery.length) {
        return res.status(400).json({
          success: false,
          error: 'Invalid photo index'
        });
      }

      const photoUrl = organization.photoGallery[index];
      const publicId = photoUrl.split('/').slice(-2).join('/').split('.')[0];
      await deleteImage(publicId);

      // Remove from array
      const updatedGallery = organization.photoGallery.filter((_, i) => i !== index);

      await prisma.organization.update({
        where: { id: organizationId },
        data: { photoGallery: updatedGallery }
      });

      res.status(200).json({
        success: true,
        message: 'Gallery photo deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

const controller = new UploadController();

module.exports = {
  uploadProfilePicture: controller.uploadProfilePicture.bind(controller),
  deleteProfilePicture: controller.deleteProfilePicture.bind(controller),
  uploadOrganizationLogo: controller.uploadOrganizationLogo.bind(controller),
  deleteOrganizationLogo: controller.deleteOrganizationLogo.bind(controller),
  uploadOrganizationBanner: controller.uploadOrganizationBanner.bind(controller),
  uploadGalleryPhotos: controller.uploadGalleryPhotos.bind(controller),
  deleteGalleryPhoto: controller.deleteGalleryPhoto.bind(controller)
};
