/**
 * Age validation utilities for event category restrictions
 */

/**
 * Parse age category string into min/max age restrictions
 * @param {string} category - Category string (e.g., "U19", "40+", "3+ U19", "Open")
 * @returns {{minAge: number|null, maxAge: number|null, isValid: boolean, error: string|null}}
 */
function parseAgeCategory(category) {
  if (!category || category.trim() === '' || category.toLowerCase() === 'open') {
    return { minAge: null, maxAge: null, isValid: true, error: null };
  }

  const trimmed = category.trim();

  // Pattern 1: U19 (Under 19 = ages 0-18)
  const underMatch = trimmed.match(/^U(\d+)$/i);
  if (underMatch) {
    const maxAge = parseInt(underMatch[1]) - 1; // U19 means 18 and below
    if (maxAge < 0 || maxAge > 150) {
      return { minAge: null, maxAge: null, isValid: false, error: 'Invalid age in U format (must be 1-150)' };
    }
    return { minAge: null, maxAge, isValid: true, error: null };
  }

  // Pattern 2: 40+ (40 and above)
  const plusMatch = trimmed.match(/^(\d+)\+$/);
  if (plusMatch) {
    const minAge = parseInt(plusMatch[1]);
    if (minAge < 0 || minAge > 150) {
      return { minAge: null, maxAge: null, isValid: false, error: 'Invalid age in + format (must be 0-150)' };
    }
    return { minAge, maxAge: null, isValid: true, error: null };
  }

  // Pattern 3: 3+ U19 (Ages 3 to 18, range)
  const rangeMatch = trimmed.match(/^(\d+)\+\s*U(\d+)$/i);
  if (rangeMatch) {
    const minAge = parseInt(rangeMatch[1]);
    const maxAge = parseInt(rangeMatch[2]) - 1; // U19 means 18 and below

    if (minAge < 0 || minAge > 150 || maxAge < 0 || maxAge > 150) {
      return { minAge: null, maxAge: null, isValid: false, error: 'Invalid age range (ages must be 0-150)' };
    }

    if (minAge > maxAge) {
      return { minAge: null, maxAge: null, isValid: false, error: `Invalid age range: minimum age (${minAge}) cannot be greater than maximum age (${maxAge})` };
    }

    return { minAge, maxAge, isValid: true, error: null };
  }

  // Invalid format
  return {
    minAge: null,
    maxAge: null,
    isValid: false,
    error: 'Invalid format. Use: U19, 40+, 3+ U19, or Open'
  };
}

/**
 * Calculate user's age from date of birth
 * @param {Date|string} dob - Date of birth
 * @returns {number} Age in years
 */
function calculateAge(dob) {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  // Adjust if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Check if user meets age requirements for an event
 * @param {Date|string} userDob - User's date of birth
 * @param {string} eventCategory - Event category string
 * @returns {{eligible: boolean, userAge: number, message: string|null}}
 */
function checkAgeEligibility(userDob, eventCategory) {
  if (!userDob) {
    return {
      eligible: false,
      userAge: null,
      message: 'Please complete your profile with date of birth to register'
    };
  }

  const userAge = calculateAge(userDob);
  const { minAge, maxAge, isValid, error } = parseAgeCategory(eventCategory);

  if (!isValid) {
    return {
      eligible: false,
      userAge,
      message: `Invalid event category: ${error}`
    };
  }

  // No restrictions (Open or empty)
  if (minAge === null && maxAge === null) {
    return { eligible: true, userAge, message: null };
  }

  // Check min age
  if (minAge !== null && userAge < minAge) {
    return {
      eligible: false,
      userAge,
      message: `You must be ${minAge} or older to register for this event (You are ${userAge})`
    };
  }

  // Check max age
  if (maxAge !== null && userAge > maxAge) {
    return {
      eligible: false,
      userAge,
      message: `You must be ${maxAge} or younger to register for this event (You are ${userAge})`
    };
  }

  return { eligible: true, userAge, message: null };
}

/**
 * Format age category for display
 * @param {string} category - Category string
 * @returns {string} Formatted display string
 */
function formatAgeCategory(category) {
  if (!category || category.trim() === '' || category.toLowerCase() === 'open') {
    return 'Open (All Ages)';
  }

  const { minAge, maxAge, isValid } = parseAgeCategory(category);

  if (!isValid) {
    return category; // Return as-is if invalid
  }

  if (minAge === null && maxAge !== null) {
    return `Under ${maxAge + 1}`;
  }

  if (minAge !== null && maxAge === null) {
    return `${minAge}+`;
  }

  if (minAge !== null && maxAge !== null) {
    return `Ages ${minAge}-${maxAge}`;
  }

  return 'Open (All Ages)';
}

module.exports = {
  parseAgeCategory,
  calculateAge,
  checkAgeEligibility,
  formatAgeCategory
};
