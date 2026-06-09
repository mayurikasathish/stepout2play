const authService = require('../services/auth.service');
const prisma = require('../lib/prisma');

class AuthController {
  /**
   * Register a new user
   * POST /auth/register
   */
  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName } = req.body;

      const errors = [];

      if (!email || typeof email !== 'string') {
        errors.push('Email is required');
      } else if (!this.isValidEmail(email)) {
        errors.push('Email is invalid');
      }

      if (!password || typeof password !== 'string') {
        errors.push('Password is required');
      } else if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
      } else if (!this.isStrongPassword(password)) {
        errors.push('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
      }

      if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
        errors.push('First name is required');
      }

      if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) {
        errors.push('Last name is required');
      }

      if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
      }

      const { user, token } = await authService.register({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      res.status(201).json({ success: true, data: { user, token } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * POST /auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const errors = [];
      if (!email || typeof email !== 'string') errors.push('Email is required');
      if (!password || typeof password !== 'string') errors.push('Password is required');

      if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
      }

      const { user, token } = await authService.login({
        email: email.trim(),
        password,
      });

      res.status(200).json({ success: true, data: { user, token } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current authenticated user WITH org context
   * GET /auth/me
   */
  async getMe(req, res, next) {
    try {
      // Fetch the full user + their org memberships from DB
      // req.user only has basic fields (set by authenticate middleware)
      // so we do a fresh DB query here to get everything
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          onboardingComplete: true,
          dob: true,
          gender: true,
          orgMemberships: {
            include: {
              org: {
                select: { id: true, name: true, slug: true, logoUrl: true }
              }
            }
          }
        }
      });

      // Shape org memberships into a cleaner format for the frontend
      const orgs = user.orgMemberships.map(m => ({
        id: m.org.id,
        name: m.org.name,
        slug: m.org.slug,
        logoUrl: m.org.logoUrl,
        myRole: m.role
      }));

      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          onboardingComplete: user.onboardingComplete,
          dob: user.dob,
          gender: user.gender,
        },
        context: {
          orgs,
          isOrganizer: orgs.length > 0
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark onboarding as complete (for "join as player" path)
   * PATCH /auth/onboarding
   */
  async completeOnboarding(req, res, next) {
    try {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { onboardingComplete: true }
      });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isStrongPassword(password) {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  }
}

module.exports = new AuthController();