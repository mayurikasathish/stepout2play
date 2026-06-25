const prisma = require('../lib/prisma');
const { deleteImage } = require('../config/cloudinary');

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

      // Update user with new profile picture URL
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { profilePicture: req.file.path },
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

      // Update organization with new logo URL
      const updatedOrganization = await prisma.organization.update({
        where: { id: organizationId },
        data: { logoUrl: req.file.path },
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
}

const controller = new UploadController();

module.exports = {
  uploadProfilePicture: controller.uploadProfilePicture.bind(controller),
  deleteProfilePicture: controller.deleteProfilePicture.bind(controller),
  uploadOrganizationLogo: controller.uploadOrganizationLogo.bind(controller),
  deleteOrganizationLogo: controller.deleteOrganizationLogo.bind(controller)
};
