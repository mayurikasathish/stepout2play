const authService = require('../services/auth.service');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
async function authenticate(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'No authorization token provided',
      });
    }

    // Check Bearer token format
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        error: 'Invalid authorization format. Expected: Bearer <token>',
      });
    }

    const token = parts[1];

    // Verify token
    const decoded = authService.verifyToken(token);

    // Load user from database
    const user = await authService.getUserById(decoded.userId);

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    if (error.statusCode === 401) {
      return res.status(401).json({
        success: false,
        error: error.message,
      });
    }

    next(error);
  }
}

module.exports = authenticate;
