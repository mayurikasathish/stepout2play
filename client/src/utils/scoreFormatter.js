/**
 * Format match score for display
 * Handles both old string format ("21-19, 21-18") and new JSON format
 * @param {string|object} score - Score data
 * @returns {string} - Formatted score string
 */
export const formatMatchScore = (score) => {
  if (!score) return ''

  // Try to parse if it's a stringified JSON FIRST (most common case now)
  if (typeof score === 'string') {
    // Check if it looks like JSON (starts with { or [)
    const trimmed = score.trim()
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(score)
        if (parsed.sets && Array.isArray(parsed.sets)) {
          return parsed.sets
            .map(set => `${set.player1Score}-${set.player2Score}`)
            .join(', ')
        }
      } catch (e) {
        // Not valid JSON, continue to other checks
      }
    }
    // If it's not JSON, assume it's old format "21-19, 21-18"
    return score
  }

  // If it's already a JSON object (new format from OCR)
  if (typeof score === 'object' && score.sets) {
    // Format: "21-18, 21-5" (just the scores, clean and simple)
    return score.sets
      .map(set => `${set.player1Score}-${set.player2Score}`)
      .join(', ')
  }

  return String(score)
}

/**
 * Format score with set numbers (more detailed)
 * @param {string|object} score - Score data
 * @returns {string} - Formatted score with set labels
 */
export const formatMatchScoreDetailed = (score) => {
  if (!score) return ''

  if (typeof score === 'string') {
    return score
  }

  if (typeof score === 'object' && score.sets) {
    return score.sets
      .map((set, idx) => `Set ${idx + 1}: ${set.player1Score}-${set.player2Score}`)
      .join(' • ')
  }

  try {
    const parsed = typeof score === 'string' ? JSON.parse(score) : score
    if (parsed.sets) {
      return parsed.sets
        .map((set, idx) => `Set ${idx + 1}: ${set.player1Score}-${set.player2Score}`)
        .join(' • ')
    }
  } catch (e) {
    return String(score)
  }

  return String(score)
}
