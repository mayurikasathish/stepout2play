/**
 * Score Parser Utility
 * Parses tennis-style scores and calculates games won/lost and points for/against
 */

/**
 * Parse score string and determine winner with game/point stats
 * Supports formats:
 * - "6-4, 6-3" (sets)
 * - "21-19, 21-18" (points for badminton)
 * - "6-4 6-3" (space separated)
 * - "2-1" (simple games)
 *
 * Returns: {
 *   winnerId: string,
 *   gamesWon1: number,
 *   gamesLost1: number,
 *   pointsFor1: number,
 *   pointsAgainst1: number,
 *   gamesWon2: number,
 *   gamesLost2: number,
 *   pointsFor2: number,
 *   pointsAgainst2: number
 * }
 */
function parseScore(score, participant1Id, participant2Id) {
  if (!score || typeof score !== 'string') {
    throw new Error('Score is required and must be a valid string')
  }

  const trimmedScore = score.trim()

  if (trimmedScore === '') {
    throw new Error('Score cannot be empty')
  }

  // Split by comma or space to get sets/games
  const sets = trimmedScore.split(/[,\s]+/).map(s => s.trim()).filter(Boolean)

  if (sets.length === 0) {
    throw new Error('Invalid score format. Expected format: "6-4, 6-3" or "21-19, 21-18"')
  }

  let player1Sets = 0
  let player2Sets = 0
  let player1TotalGames = 0 // Count of games/sets won
  let player2TotalGames = 0 // Count of games/sets won
  let player1TotalPoints = 0 // Sum of all points scored
  let player2TotalPoints = 0 // Sum of all points scored

  // Parse each set/game
  for (const set of sets) {
    const match = set.match(/^(\d+)-(\d+)$/)
    if (!match) {
      throw new Error(`Invalid score format in "${set}". Expected format: "6-4" or "21-19"`)
    }

    const score1 = parseInt(match[1])
    const score2 = parseInt(match[2])

    // Count points scored in this game
    player1TotalPoints += score1
    player2TotalPoints += score2

    // Determine game/set winner and increment games won count
    if (score1 > score2) {
      player1Sets++
      player1TotalGames++ // Winner gets +1 game won
    } else if (score2 > score1) {
      player2Sets++
      player2TotalGames++ // Winner gets +1 game won
    }
    // If equal, it's a draw set (rare but possible in some formats)
    // In draw, both get +1 game (or handle as needed)
    else {
      player1TotalGames++
      player2TotalGames++
    }
  }

  // Determine overall winner
  let winnerId
  if (player1Sets > player2Sets) {
    winnerId = participant1Id
  } else if (player2Sets > player1Sets) {
    winnerId = participant2Id
  } else {
    // If sets are equal, use total games/points
    if (player1TotalGames > player2TotalGames) {
      winnerId = participant1Id
    } else if (player2TotalGames > player1TotalGames) {
      winnerId = participant2Id
    } else {
      // Exact tie - rare but handle it
      throw new Error('Score is a perfect tie. Please enter a deciding factor or declare a draw.')
    }
  }

  return {
    winnerId,
    // Games = number of sets/games won (not points scored!)
    gamesWon1: player1TotalGames,  // How many games/sets player 1 won
    gamesLost1: player2TotalGames, // How many games/sets player 2 won (= player 1 lost)
    pointsFor1: player1TotalPoints, // Total points scored by player 1
    pointsAgainst1: player2TotalPoints, // Total points scored by player 2
    gamesWon2: player2TotalGames,  // How many games/sets player 2 won
    gamesLost2: player1TotalGames, // How many games/sets player 1 won (= player 2 lost)
    pointsFor2: player2TotalPoints,
    pointsAgainst2: player1TotalPoints
  }
}

/**
 * Validate score format
 */
function validateScoreFormat(score) {
  if (!score || typeof score !== 'string') {
    return { valid: false, error: 'Score is required' }
  }

  const trimmedScore = score.trim()
  const sets = trimmedScore.split(/[,\s]+/).map(s => s.trim()).filter(Boolean)

  if (sets.length === 0) {
    return { valid: false, error: 'Score cannot be empty' }
  }

  for (const set of sets) {
    const match = set.match(/^(\d+)-(\d+)$/)
    if (!match) {
      return {
        valid: false,
        error: `Invalid format "${set}". Use format like "6-4, 6-3" or "21-19, 21-18"`
      }
    }
  }

  return { valid: true }
}

module.exports = {
  parseScore,
  validateScoreFormat
}
