const authService = require('../services/auth.service');

class OAuthController {
  /**
   * Handle successful Google OAuth callback
   */
  async googleCallback(req, res, next) {
    try {
      if (!req.user) {
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=authentication_failed`);
      }

      const token = authService.generateToken(req.user.id);

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      res.redirect(`${clientUrl}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      res.redirect(`${clientUrl}/login?error=authentication_failed`);
    }
  }
}

module.exports = new OAuthController();
