/**
 * Match Rating Change Model
 *
 * Stores rating changes after each match for display purposes
 * This is stored in-memory or can be added to Prisma schema later
 */

// For now, we'll add a simple table to track rating changes
// We can add this to Prisma schema if needed, but for Phase 4
// we'll just return the changes directly when fetching match details

module.exports = {
  // Future: Add Prisma model for MatchRatingChange
  // For now, we calculate on-the-fly from PlayerRating.lastMatchDate
};
