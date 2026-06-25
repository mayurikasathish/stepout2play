const prisma = require('../lib/prisma');
const eligibilityService = require('./eligibility.service');

class PartnerService {
  /**
   * Search for partner by email
   */
  async searchPartnerByEmail(email) {
    const partner = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        dob: true,
        gender: true,
        profilePicture: true
      }
    });

    if (!partner) {
      const error = new Error('No user found with this email address');
      error.statusCode = 404;
      throw error;
    }

    return partner;
  }

  /**
   * Verify partner eligibility for an event (including gender compatibility for mixed doubles)
   */
  async verifyPartnerEligibility(userId, partnerId, eventId) {
    // Get the user (person registering)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        dob: true,
        gender: true
      }
    });

    if (!user) {
      return {
        eligible: false,
        reasons: ['User not found'],
        user: null,
        partner: null
      };
    }

    // Get the partner
    const partner = await prisma.user.findUnique({
      where: { id: partnerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        dob: true,
        gender: true,
        profilePicture: true
      }
    });

    if (!partner) {
      return {
        eligible: false,
        reasons: ['Partner not found'],
        user: null,
        partner: null
      };
    }

    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            startDate: true
          }
        }
      }
    });

    if (!event) {
      return {
        eligible: false,
        reasons: ['Event not found'],
        user: null,
        partner: null
      };
    }

    const reasons = [];

    // Check if partner is already registered for this event (and not cancelled)
    const partnerRegistration = await prisma.registration.findFirst({
      where: {
        eventId,
        status: 'CONFIRMED',
        OR: [
          { userId: partnerId },
          { partnerId: partnerId }
        ]
      }
    });

    if (partnerRegistration) {
      reasons.push(`${partner.firstName} ${partner.lastName} is already registered for this event`);
    }

    // Check partner's age eligibility
    const partnerAgeCheck = eligibilityService.checkAgeEligibility(
      partner.dob,
      event.category,
      event.tournament.startDate
    );
    if (!partnerAgeCheck.eligible) {
      reasons.push(`Partner: ${partnerAgeCheck.reason}`);
    }

    // Check your age eligibility
    const userAgeCheck = eligibilityService.checkAgeEligibility(
      user.dob,
      event.category,
      event.tournament.startDate
    );
    if (!userAgeCheck.eligible) {
      reasons.push(`You: ${userAgeCheck.reason}`);
    }

    // For Mixed Doubles - check gender compatibility
    if (event.format === 'MIXED_DOUBLES') {
      if (!user.gender || !partner.gender) {
        reasons.push('Both players must have gender set in their profiles for Mixed Doubles');
      } else if (user.gender.toLowerCase() === partner.gender.toLowerCase()) {
        reasons.push('Mixed Doubles requires one male and one female player');
      }
    }

    // For regular Doubles - check gender requirements
    if (event.format === 'DOUBLES' && event.gender) {
      // Check user gender eligibility
      const userGenderCheck = eligibilityService.checkGenderEligibility(user.gender, event.gender);
      if (!userGenderCheck.eligible) {
        reasons.push(`You: ${userGenderCheck.reason}`);
      }

      // Check partner gender eligibility
      const partnerGenderCheck = eligibilityService.checkGenderEligibility(partner.gender, event.gender);
      if (!partnerGenderCheck.eligible) {
        reasons.push(`Partner: ${partnerGenderCheck.reason}`);
      }
    }

    // Calculate ages
    const userAge = user.dob ? eligibilityService.calculateAge(user.dob, event.tournament.startDate) : null;
    const partnerAge = partner.dob ? eligibilityService.calculateAge(partner.dob, event.tournament.startDate) : null;

    return {
      eligible: reasons.length === 0,
      reasons,
      user: {
        ...user,
        age: userAge
      },
      partner: {
        ...partner,
        age: partnerAge
      },
      event: {
        id: event.id,
        name: event.name,
        format: event.format,
        category: event.category,
        gender: event.gender,
        tournamentName: event.tournament.name
      }
    };
  }
}

module.exports = new PartnerService();
