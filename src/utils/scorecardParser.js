/**
 * Scorecard Parser Utility
 * Extracts structured score data from Sarvam AI OCR output
 */

/**
 * Strip HTML/Markdown tags and extract plain text
 * Preserves hyphens and colons in score contexts (e.g., "21-19", "ID:")
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
  cleaned = cleaned.replace(/_/g, ' ');    // Remove italic _ (but preserve underscores as spaces)

  // Remove markdown table pipes
  cleaned = cleaned.replace(/\|/g, ' ');

  // Remove table dividers (----) but preserve hyphens in scores (21-19)
  // Only remove sequences of 3+ dashes/colons
  cleaned = cleaned.replace(/[-:]{3,}/g, ' ');

  // Remove extra whitespace but preserve single spaces
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
 * Uses multiple fallback patterns for robustness
 * @param {string} text - OCR text
 * @returns {string[]} - Array of player IDs found [player1, player2]
 */
function extractPlayerIds(text) {
  const plainText = stripHtmlTags(text);

  console.log('🔍 Extracting Player IDs from text (first 500 chars):', plainText.substring(0, 500));

  // Multiple patterns in order of specificity (try most specific first)
  const player1Patterns = [
    /PLAYER\s+1\s+ID[:\s]+P\s*(\d)\s*(\d)\s*(\d)/i,           // "PLAYER 1 ID P031" or "P 0 3 1"
    /PLAYER\s+1\s+ID[:\s]+P\s*(\d{2,4})/i,                    // "PLAYER 1 ID P031" (2-4 digits together)
    /PLAYER\s*1[:\s]+P\s*(\d{2,4})/i,                         // "PLAYER 1: P031" (without "ID")
    /P1[:\s]+P\s*(\d{2,4})/i,                                 // "P1: P031" (short form)
    /Player\s*1[:\s]*P\s*(\d{2,4})/i,                         // "Player 1 P031" (case variation)
    /PLAYER\s+ONE\s+ID[:\s]+P\s*(\d{2,4})/i,                  // "PLAYER ONE ID P031"
    /PLAYER\s*1[^P]*P\s*(\d{2,4})/i                           // Very loose: "PLAYER 1" ... "P031" (anything in between)
  ];

  const player2Patterns = [
    /PLAYER\s+2\s+ID[:\s]+P\s*(\d)\s*(\d)\s*(\d)/i,
    /PLAYER\s+2\s+ID[:\s]+P\s*(\d{2,4})/i,
    /PLAYER\s*2[:\s]+P\s*(\d{2,4})/i,
    /P2[:\s]+P\s*(\d{2,4})/i,
    /Player\s*2[:\s]*P\s*(\d{2,4})/i,
    /PLAYER\s+TWO\s+ID[:\s]+P\s*(\d{2,4})/i,
    /PLAYER\s*2[^P]*P\s*(\d{2,4})/i                           // Very loose: "PLAYER 2" ... "P031"
  ];

  const playerIds = [];

  // Extract Player 1 ID using fallback patterns
  for (const pattern of player1Patterns) {
    const match = plainText.match(pattern);
    if (match) {
      let playerId;
      if (match.length === 4) {
        // Three separate digit groups (pattern with \d)\s*(\d)\s*(\d))
        playerId = 'P' + match[1] + match[2] + match[3];
      } else {
        // Single digit group (pattern with \d{2,4})
        const digits = match[1].padStart(3, '0'); // Normalize to 3 digits (P31 → P031)
        playerId = 'P' + digits;
      }
      playerIds.push(playerId);
      console.log(`✅ Found Player 1 ID: ${playerId} (pattern matched)`);
      break; // Found it, stop trying patterns
    }
  }

  // Extract Player 2 ID using fallback patterns
  for (const pattern of player2Patterns) {
    const match = plainText.match(pattern);
    if (match) {
      let playerId;
      if (match.length === 4) {
        playerId = 'P' + match[1] + match[2] + match[3];
      } else {
        const digits = match[1].padStart(3, '0');
        playerId = 'P' + digits;
      }
      playerIds.push(playerId);
      console.log(`✅ Found Player 2 ID: ${playerId} (pattern matched)`);
      break;
    }
  }

  console.log('🔍 Player ID extraction result:', playerIds.length === 2 ? 'SUCCESS' : 'INCOMPLETE');

  return playerIds;
}

/**
 * Extract scores near SET labels (more reliable for verbose OCR output)
 * Looks for patterns like "SET 1" followed by two numbers
 * Uses multiple fallback patterns for robustness
 * @param {string} text - Plain text
 * @returns {Object[]} - Array of set objects
 */
function extractScoresFromSets(text) {
  const setsMap = new Map(); // Use Map to deduplicate by set number

  // Multiple patterns to handle different OCR formatting
  const setPatterns = [
    // Pattern 1: Standard "SET 1 PLAYER 1 21 PLAYER 2 19" (with PLAYER labels)
    /SET\s+(\d+)[^]*?PLAYER\s+1[^]*?(\d{1,2})[^]*?PLAYER\s+2[^]*?(\d{1,2})/gi,

    // Pattern 2: Compact "SET 1 21 19" or "SET 1: 21-19" (without PLAYER labels)
    /SET\s+(\d+)[:\s]+(\d{1,2})\s*[-\s]\s*(\d{1,2})/gi,

    // Pattern 3: Table format "| SET 1 | 21 | 19 |"
    /SET\s+(\d+)\s*\|\s*(\d{1,2})\s*\|\s*(\d{1,2})/gi,

    // Pattern 4: "Set 1" with various spacing "Set 1 P1: 21 P2: 19"
    /SET\s+(\d+)[^]*?P1[:\s]+(\d{1,2})[^]*?P2[:\s]+(\d{1,2})/gi
  ];

  // Try each pattern
  for (const setPattern of setPatterns) {
    let match;
    const tempMatches = [];

    while ((match = setPattern.exec(text)) !== null) {
      const setNum = parseInt(match[1]);
      const player1Score = parseInt(match[2]);
      const player2Score = parseInt(match[3]);

      // Validate: sets 1-5, scores 0-30, at least one score >= 15 (realistic badminton)
      // Skip sets where both scores are 0 (indicates unplayed/blank set)
      if (setNum >= 1 && setNum <= 5 &&                      // Support best of 3 or 5
          player1Score >= 0 && player1Score <= 30 &&
          player2Score >= 0 && player2Score <= 30 &&
          !(player1Score === 0 && player2Score === 0) && // Skip 0-0 (blank)
          (player1Score >= 15 || player2Score >= 15)) {   // At least one realistic score

        tempMatches.push({ setNum, player1Score, player2Score });
      }
    }

    // If this pattern found valid matches, use them
    if (tempMatches.length > 0) {
      console.log(`✅ Found ${tempMatches.length} set(s) using pattern match`);
      tempMatches.forEach(({ setNum, player1Score, player2Score }) => {
        if (!setsMap.has(setNum)) {
          setsMap.set(setNum, { player1Score, player2Score });
        }
      });

      // If we found all 3 sets or at least 1 set, stop trying patterns
      if (setsMap.size >= 1) {
        break;
      }
    }
  }

  // Convert map to array, sorted by set number
  const results = Array.from(setsMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([_, scores]) => scores);

  console.log(`📊 Extracted ${results.length} set score(s)`);

  return results;
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

  // Determine winner (best of 3 or best of 5)
  // Note: It's OK if remaining sets are blank - if Player 1 wins first 2/3 sets, match is over
  let player1Wins = 0;
  let player2Wins = 0;

  sets.forEach(set => {
    if (set.player1Score > set.player2Score) player1Wins++;
    else if (set.player2Score > set.player1Score) player2Wins++;
  });

  const winnerId = player1Wins > player2Wins ? playerIds[0] : playerIds[1];

  // Determine required sets to win based on total sets found
  // If 3 sets → best of 3 (need 2 to win)
  // If 4-5 sets → best of 5 (need 3 to win)
  const totalSets = sets.length;
  const setsNeededToWin = totalSets >= 4 ? 3 : 2; // Best of 5 needs 3, best of 3 needs 2

  // Validate that we have a clear winner
  if (player1Wins < setsNeededToWin && player2Wins < setsNeededToWin) {
    return {
      success: false,
      error: `Incomplete match: Player 1 won ${player1Wins} set(s), Player 2 won ${player2Wins} set(s). Need at least ${setsNeededToWin} sets won to determine winner (best of ${totalSets >= 4 ? 5 : 3}).`,
      playerIds,
      sets
    };
  }

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
