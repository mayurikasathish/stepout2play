/**
 * Score Validation Utility for Point-Based Sports
 * Validates scores for badminton, table tennis, squash, and pickleball
 */

/**
 * Validate a single game/set score based on sport-specific rules
 * @param {number} p1Score - Player 1 score
 * @param {number} p2Score - Player 2 score
 * @param {object} rules - Sport rules from sports-rules.json
 * @returns {object} { valid: boolean, error: string | null }
 */
function validateGameScore(p1Score, p2Score, rules) {
  const { pointsPerSet, minimumLead, maxPoints } = rules

  // Default deuceStartsAt to pointsPerSet - 1 if not provided (e.g., 20 for badminton/21)
  const deuceStartsAt = rules.deuceStartsAt ?? (pointsPerSet - 1)

  // Basic validation
  if (isNaN(p1Score) || isNaN(p2Score)) {
    return { valid: false, error: 'Both scores must be valid numbers' }
  }

  if (p1Score < 0 || p2Score < 0) {
    return { valid: false, error: 'Scores cannot be negative' }
  }

  const maxScore = Math.max(p1Score, p2Score)
  const minScore = Math.min(p1Score, p2Score)
  const scoreDiff = maxScore - minScore

  // Rule 1: At least one player must reach pointsPerSet
  if (maxScore < pointsPerSet) {
    return {
      valid: false,
      error: `At least one player must reach ${pointsPerSet} points`
    }
  }

  // Rule 2: Winner must lead by at least minimumLead
  if (scoreDiff < minimumLead) {
    return {
      valid: false,
      error: `Winner must lead by at least ${minimumLead} points`
    }
  }

  // Rule 3: Normal win (before deuce zone)
  // If loser has fewer than (deuceStartsAt) points, winner must have exactly pointsPerSet
  if (minScore < deuceStartsAt) {
    if (maxScore !== pointsPerSet) {
      return {
        valid: false,
        error: `Invalid score. If a player has fewer than ${deuceStartsAt} points, the winner must score exactly ${pointsPerSet} points`
      }
    }
    return { valid: true, error: null }
  }

  // Rule 4: Deuce situation (both players at deuceStartsAt or above)
  // Both scores must be >= deuceStartsAt for deuce to apply
  if (minScore >= deuceStartsAt) {
    // In deuce, score difference must be EXACTLY minimumLead (usually 2)
    // Cannot have 3-point lead (30-27) or 1-point lead (21-20)
    if (scoreDiff !== minimumLead) {
      return {
        valid: false,
        error: `Invalid score. After ${deuceStartsAt}-${deuceStartsAt}, the winner must lead by EXACTLY ${minimumLead} points (not ${scoreDiff})`
      }
    }

    // Check if maxPoints limit exists
    if (maxPoints !== null && maxPoints !== undefined) {
      // Sports with max points (badminton: 30, pickleball: 15)
      if (maxScore > maxPoints) {
        return {
          valid: false,
          error: `Maximum score is ${maxPoints} points`
        }
      }
    }

    // Valid deuce win
    return { valid: true, error: null }
  }

  // Rule 5: Invalid intermediate scores
  // If minScore is between deuceStartsAt and pointsPerSet, something's wrong
  if (minScore > deuceStartsAt && minScore < pointsPerSet) {
    return {
      valid: false,
      error: `Invalid score combination`
    }
  }

  return { valid: true, error: null }
}

/**
 * Get user-friendly error message for a sport
 * @param {string} sportId - Sport identifier (badminton, table-tennis, etc.)
 * @param {object} rules - Sport rules
 * @returns {string} Human-readable validation rules
 */
function getSportValidationHelp(sportId, rules) {
  const { pointsPerSet, minimumLead, maxPoints, deuceStartsAt } = rules

  const sportNames = {
    'badminton': 'Badminton',
    'table-tennis': 'Table Tennis',
    'squash': 'Squash',
    'pickleball': 'Pickleball'
  }

  const sportName = sportNames[sportId] || sportId

  if (maxPoints) {
    return `${sportName} scoring rules:
• A player wins at ${pointsPerSet} if the opponent has ${deuceStartsAt - 1} or fewer points
• After ${deuceStartsAt}-${deuceStartsAt}, play continues until one player leads by ${minimumLead} points
• Maximum possible score is ${maxPoints}-${maxPoints - minimumLead}`
  } else {
    return `${sportName} scoring rules:
• A player wins at ${pointsPerSet} if the opponent has ${deuceStartsAt - 1} or fewer points
• After ${deuceStartsAt}-${deuceStartsAt}, play continues until one player leads by ${minimumLead} points
• No maximum score limit (deuce can continue indefinitely)`
  }
}

/**
 * Validate complete match score string (e.g., "21-19, 21-18")
 * @param {string} scoreString - Complete score string
 * @param {object} rules - Sport rules
 * @returns {object} { valid: boolean, error: string | null, games: Array }
 */
function validateMatchScore(scoreString, rules) {
  if (!scoreString || typeof scoreString !== 'string') {
    return { valid: false, error: 'Score is required', games: [] }
  }

  const trimmedScore = scoreString.trim()
  if (trimmedScore === '') {
    return { valid: false, error: 'Score cannot be empty', games: [] }
  }

  // Split by comma or space
  const games = trimmedScore.split(/[,\s]+/).map(s => s.trim()).filter(Boolean)

  if (games.length === 0) {
    return { valid: false, error: 'No valid scores found', games: [] }
  }

  // Validate each game
  for (let i = 0; i < games.length; i++) {
    const game = games[i]
    const match = game.match(/^(\d+)-(\d+)$/)

    if (!match) {
      return {
        valid: false,
        error: `Invalid format in game ${i + 1}: "${game}". Use format like "21-19" or "11-9"`,
        games: []
      }
    }

    const p1Score = parseInt(match[1])
    const p2Score = parseInt(match[2])

    const validation = validateGameScore(p1Score, p2Score, rules)
    if (!validation.valid) {
      return {
        valid: false,
        error: `Game ${i + 1}: ${validation.error}`,
        games: []
      }
    }
  }

  return { valid: true, error: null, games }
}

/**
 * Generate example valid scores for a sport
 * @param {object} rules - Sport rules
 * @returns {Array<string>} Example valid scores
 */
function getExampleScores(rules) {
  const { pointsPerSet, minimumLead, maxPoints, deuceStartsAt } = rules
  const examples = [
    `${pointsPerSet}-${deuceStartsAt - 2}`, // Normal win
    `${pointsPerSet}-${deuceStartsAt - 1}`, // Close normal win
    `${deuceStartsAt + minimumLead}-${deuceStartsAt}`, // Deuce win
  ]

  if (maxPoints) {
    examples.push(`${maxPoints}-${maxPoints - minimumLead}`) // Max score win
  } else {
    examples.push(`${pointsPerSet + 5}-${pointsPerSet + 3}`) // Extended deuce
  }

  return examples
}

/**
 * Check if a score is in deuce situation
 * @param {number} p1Score - Player 1 score
 * @param {number} p2Score - Player 2 score
 * @param {object} rules - Sport rules
 * @returns {boolean}
 */
function isDeuceSituation(p1Score, p2Score, rules) {
  const { deuceStartsAt } = rules
  return p1Score >= deuceStartsAt && p2Score >= deuceStartsAt
}

module.exports = {
  validateGameScore,
  validateMatchScore,
  getSportValidationHelp,
  getExampleScores,
  isDeuceSituation
}
