/**
 * Scorecard Parser Utility
 * Extracts structured score data from Sarvam AI OCR output
 */

/**
 * Strip HTML/Markdown tags and extract plain text
 * @param {string} text - HTML or Markdown text from OCR
 * @returns {string} - Plain text only
 */
function stripHtmlTags(text) {
  if (!text) return '';

  // Remove HTML tags
  let cleaned = text.replace(/<[^>]*>/g, ' ');

  // Remove markdown formatting (bold, italic, etc.)
  cleaned = cleaned.replace(/\*\*/g, '');  // Remove bold **
  cleaned = cleaned.replace(/\*/g, '');    // Remove italic *
  cleaned = cleaned.replace(/__/g, '');    // Remove bold __
  cleaned = cleaned.replace(/_/g, '');     // Remove italic _

  // Remove markdown table syntax
  cleaned = cleaned.replace(/\|/g, ' ');
  cleaned = cleaned.replace(/[-:]+/g, ' ');

  // Remove extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Extract all numbers from text
 * @param {string} text - Text containing numbers
 * @returns {number[]} - Array of numbers found
 */
function extractNumbers(text) {
  const plainText = stripHtmlTags(text);
  const matches = plainText.match(/\d+/g);
  return matches ? matches.map(Number) : [];
}

/**
 * Extract player IDs from scorecard text
 * Looks specifically for "PLAYER 1 ID" and "PLAYER 2 ID" sections
 * @param {string} text - OCR text
 * @returns {string[]} - Array of player IDs found [player1, player2]
 */
function extractPlayerIds(text) {
  const plainText = stripHtmlTags(text);

  // More flexible pattern to handle various OCR formats:
  // - "PLAYER 1 ID P031"
  // - "PLAYER 1 ID: P031"
  // - "PLAYER 1 ID P 0 3 1" (with spaces between digits)
  const player1Pattern = /PLAYER\s+1\s+ID[:\s]+P\s*(\d)\s*(\d)\s*(\d)/i;
  const player2Pattern = /PLAYER\s+2\s+ID[:\s]+P\s*(\d)\s*(\d)\s*(\d)/i;

  const player1Match = plainText.match(player1Pattern);
  const player2Match = plainText.match(player2Pattern);

  const playerIds = [];
  if (player1Match) {
    // Reconstruct P + 3 digits (handles "P 0 3 1" or "P031")
    const playerId = 'P' + player1Match[1] + player1Match[2] + player1Match[3];
    playerIds.push(playerId);
  }
  if (player2Match) {
    const playerId = 'P' + player2Match[1] + player2Match[2] + player2Match[3];
    playerIds.push(playerId);
  }

  console.log('🔍 Looking for player IDs in text...');
  console.log('Found player IDs:', playerIds);

  return playerIds;
}

/**
 * Extract scores near SET labels (more reliable for verbose OCR output)
 * Looks for patterns like "SET 1" followed by two numbers
 * @param {string} text - Plain text
 * @returns {Object[]} - Array of set objects
 */
function extractScoresFromSets(text) {
  const setsMap = new Map(); // Use Map to deduplicate by set number

  // Match SET 1, SET 2, SET 3 followed by numbers
  // Pattern: "SET 1" ... "PLAYER 1" ... number ... "PLAYER 2" ... number
  const setPattern = /SET\s+(\d+)[^]*?PLAYER\s+1[^]*?(\d{1,2})[^]*?PLAYER\s+2[^]*?(\d{1,2})/gi;

  let match;
  while ((match = setPattern.exec(text)) !== null) {
    const setNum = parseInt(match[1]);
    const player1Score = parseInt(match[2]);
    const player2Score = parseInt(match[3]);

    // Only accept sets 1, 2, 3 and scores 0-30
    if (setNum >= 1 && setNum <= 3 && player1Score <= 30 && player2Score <= 30) {
      // Store by set number to deduplicate (keeps first match for each set)
      if (!setsMap.has(setNum)) {
        setsMap.set(setNum, { player1Score, player2Score });
      }
    }
  }

  // Convert map to array, sorted by set number
  return Array.from(setsMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([_, scores]) => scores);
}

/**
 * Parse badminton scorecard from OCR text
 * Expected format:
 * - Player IDs: P001, P002
 * - Scores: SET 1: 21 - 19, SET 2: 18 - 21, SET 3: 21 - 18
 *
 * @param {string} ocrText - Raw OCR output from Sarvam AI
 * @returns {Object} - Parsed scorecard data
 */
function parseBadmintonScorecard(ocrText) {
  const plainText = stripHtmlTags(ocrText);

  console.log('🔍 Parsing scorecard text (first 1000 chars):', plainText.substring(0, 1000));

  // Extract player IDs
  const playerIds = extractPlayerIds(plainText);

  console.log('Found player IDs:', playerIds);

  // Basic validation
  if (playerIds.length < 2) {
    return {
      success: false,
      error: 'Could not find both player IDs (expected P001, P002, etc.)',
      playerIds
    };
  }

  // Extract scores using SET-based parsing
  const sets = extractScoresFromSets(plainText);

  console.log('Found sets:', sets);

  if (sets.length === 0) {
    return {
      success: false,
      error: 'Could not extract scores from SET sections',
      playerIds
    };
  }

  // Determine winner (best of 3)
  let player1Wins = 0;
  let player2Wins = 0;

  sets.forEach(set => {
    if (set.player1Score > set.player2Score) player1Wins++;
    else if (set.player2Score > set.player1Score) player2Wins++;
  });

  const winnerId = player1Wins > player2Wins ? playerIds[0] : playerIds[1];

  return {
    success: true,
    player1Id: playerIds[0],
    player2Id: playerIds[1],
    sets,
    winnerId,
    player1Wins,
    player2Wins
  };
}

module.exports = {
  stripHtmlTags,
  extractNumbers,
  extractPlayerIds,
  parseBadmintonScorecard
};
