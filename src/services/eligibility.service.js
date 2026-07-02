/**
 * Eligibility Service
 * Handles age and gender verification for event registration
 */

class EligibilityService {
  /**
   * Parse category string to extract age requirements
   * Examples: "U19", "U15", "Veterans 40+", "Open", "30-45"
   */
  parseAgeRequirements(category) {
    if (!category) {
      return { type: 'OPEN', min: null, max: null };
    }

    const categoryLower = category.toLowerCase().trim();

    // Open category - no restrictions
    if (categoryLower.includes('open')) {
      return { type: 'OPEN', min: null, max: null };
    }

    // Under age (U19, U15, U13, etc)
    const underMatch = categoryLower.match(/u(\d+)/);
    if (underMatch) {
      const maxAge = parseInt(underMatch[1]);
      return { type: 'UNDER', min: null, max: maxAge };
    }

    // Veterans/Seniors (40+, 50+, 60+, etc) or just "40+", "50+"
    // Match patterns: "Veterans 40+", "40+", "Seniors 50+", etc.
    const veteransMatch = categoryLower.match(/(?:(?:veterans?|seniors?)\s*)?(\d+)\+/);
    if (veteransMatch) {
      const minAge = parseInt(veteransMatch[1]);
      return { type: 'VETERANS', min: minAge, max: null };
    }

    // Age range (30-45, 35-50, etc)
    const rangeMatch = categoryLower.match(/(\d+)\s*-\s*(\d+)/);
    if (rangeMatch) {
      const minAge = parseInt(rangeMatch[1]);
      const maxAge = parseInt(rangeMatch[2]);
      return { type: 'RANGE', min: minAge, max: maxAge };
    }

    // If we can't parse it, treat as open
    return { type: 'OPEN', min: null, max: null };
  }

  /**
   * Calculate age on a specific date
   */
  calculateAge(dateOfBirth, onDate) {
    const dob = new Date(dateOfBirth);
    const checkDate = new Date(onDate);

    let age = checkDate.getFullYear() - dob.getFullYear();
    const monthDiff = checkDate.getMonth() - dob.getMonth();

    // Adjust if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && checkDate.getDate() < dob.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Check if user meets age requirements for the event
   */
  checkAgeEligibility(userDob, eventCategory, tournamentStartDate) {
    if (!userDob) {
      return {
        eligible: false,
        reason: 'Date of birth not set in profile. Please update your profile.'
      };
    }

    const ageReqs = this.parseAgeRequirements(eventCategory);

    // Open category - always eligible
    if (ageReqs.type === 'OPEN') {
      return { eligible: true };
    }

    const age = this.calculateAge(userDob, tournamentStartDate);

    // Under age category (U19, U15, etc)
    if (ageReqs.type === 'UNDER') {
      if (age <= ageReqs.max) {
        return { eligible: true };
      }
      return {
        eligible: false,
        reason: `This event is for players ${ageReqs.max} years and under. You will be ${age} years old on the tournament date.`
      };
    }

    // Veterans category (40+, 50+, etc)
    if (ageReqs.type === 'VETERANS') {
      if (age >= ageReqs.min) {
        return { eligible: true };
      }
      return {
        eligible: false,
        reason: `This event is for players ${ageReqs.min} years and older. You will be ${age} years old on the tournament date.`
      };
    }

    // Age range (30-45, etc)
    if (ageReqs.type === 'RANGE') {
      if (age >= ageReqs.min && age <= ageReqs.max) {
        return { eligible: true };
      }
      return {
        eligible: false,
        reason: `This event is for players aged ${ageReqs.min}-${ageReqs.max}. You will be ${age} years old on the tournament date.`
      };
    }

    return { eligible: true };
  }

  /**
   * Check if user meets gender requirements for the event
   */
  checkGenderEligibility(userGender, eventGender) {
    if (!userGender) {
      return {
        eligible: false,
        reason: 'Gender not set in profile. Please update your profile.'
      };
    }

    // No gender restriction on event - allow any gender
    if (!eventGender || eventGender === 'Mixed' || eventGender === 'Any' || eventGender.toLowerCase() === 'any') {
      return { eligible: true };
    }

    // Normalize for comparison
    const userGenderNorm = userGender.toLowerCase();
    const eventGenderNorm = eventGender.toLowerCase();

    // Check if genders match
    if (
      (eventGenderNorm === 'men' && userGenderNorm === 'male') ||
      (eventGenderNorm === 'women' && userGenderNorm === 'female') ||
      (eventGenderNorm === 'male' && userGenderNorm === 'male') ||
      (eventGenderNorm === 'female' && userGenderNorm === 'female')
    ) {
      return { eligible: true };
    }

    return {
      eligible: false,
      reason: `This event is for ${eventGender} only.`
    };
  }

  /**
   * Comprehensive eligibility check
   */
  async checkEligibility(userId, eventId) {
    const prisma = require('../lib/prisma');

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dob: true,
        gender: true
      }
    });

    if (!user) {
      return {
        eligible: false,
        reasons: ['User not found']
      };
    }

    // Fetch event with tournament
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
        reasons: ['Event not found']
      };
    }

    const reasons = [];

    // Check age eligibility
    const ageCheck = this.checkAgeEligibility(
      user.dob,
      event.category,
      event.tournament.startDate
    );
    if (!ageCheck.eligible) {
      reasons.push(ageCheck.reason);
    }

    // Check gender eligibility
    const genderCheck = this.checkGenderEligibility(user.gender, event.gender);
    if (!genderCheck.eligible) {
      reasons.push(genderCheck.reason);
    }

    // Check if already registered (and not cancelled)
    const existingRegistration = await prisma.registration.findFirst({
      where: {
        eventId: eventId,
        userId: userId,
        status: 'CONFIRMED'
      }
    });

    if (existingRegistration) {
      reasons.push('You are already registered for this event.');
    }

    return {
      eligible: reasons.length === 0,
      reasons: reasons,
      userAge: user.dob ? this.calculateAge(user.dob, event.tournament.startDate) : null,
      eventCategory: event.category,
      eventGender: event.gender
    };
  }
}

module.exports = new EligibilityService();
