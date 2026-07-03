const prisma = require('../lib/prisma');
const ratingService = require('./rating.service');

/**
 * Seed Generation Service
 *
 * Generates automatic seeding based on Glicko-2 ratings
 */
class SeedService {
  /**
   * Generate seeds for an event based on player ratings
   *
   * @param {string} eventId
   * @returns {Promise<Array>} - Sorted array of players with seed numbers
   */
  async generateSeeds(eventId) {
    // Get event with registrations
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: {
          where: {
            status: 'CONFIRMED',
            isWithdrawn: false
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            partner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (!event.sportId) {
      throw new Error('Event does not have a sport assigned. Cannot generate ratings-based seeds.');
    }

    if (event.bracketGenerated) {
      throw new Error('Bracket already generated. Cannot change seeds after bracket generation.');
    }

    const isDoubles = event.format === 'DOUBLES' || event.format === 'MIXED_DOUBLES';

    // Get ratings for all players
    const playersWithRatings = [];

    for (const registration of event.registrations) {
      let avgRating;
      let playerName;

      if (isDoubles) {
        // For doubles: average both players' ratings
        const player1Rating = await ratingService.getUserRatingForSport(
          registration.userId,
          event.sportId
        );
        const player2Rating = await ratingService.getUserRatingForSport(
          registration.partnerId,
          event.sportId
        );

        avgRating = Math.round((player1Rating + player2Rating) / 2);
        playerName = `${registration.user.firstName} ${registration.user.lastName} / ${registration.partner.firstName} ${registration.partner.lastName}`;
      } else {
        // For singles: just player's rating
        avgRating = await ratingService.getUserRatingForSport(
          registration.userId,
          event.sportId
        );
        playerName = `${registration.user.firstName} ${registration.user.lastName}`;
      }

      playersWithRatings.push({
        registrationId: registration.id,
        userId: registration.userId,
        partnerId: registration.partnerId,
        playerName,
        rating: avgRating,
        currentSeedNumber: registration.seedNumber
      });
    }

    // Sort by rating (highest first)
    playersWithRatings.sort((a, b) => b.rating - a.rating);

    // Assign seed numbers
    const seeds = playersWithRatings.map((player, index) => ({
      ...player,
      suggestedSeedNumber: index + 1
    }));

    return {
      eventId,
      eventName: event.name,
      sportId: event.sportId,
      format: event.format,
      totalPlayers: seeds.length,
      seeds
    };
  }

  /**
   * Apply generated seeds to registrations
   *
   * @param {string} eventId
   * @param {Array} seeds - Array of { registrationId, seedNumber }
   * @returns {Promise<Object>}
   */
  async applySeeds(eventId, seeds) {
    // Verify event exists and bracket not generated
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.bracketGenerated) {
      throw new Error('Cannot change seeds after bracket has been generated');
    }

    // Update all seed numbers in a transaction
    await prisma.$transaction(
      seeds.map(seed =>
        prisma.registration.update({
          where: { id: seed.registrationId },
          data: { seedNumber: seed.seedNumber }
        })
      )
    );

    console.log(`✅ Applied ${seeds.length} seeds to event ${eventId}`);

    return {
      success: true,
      message: `Successfully applied seeds to ${seeds.length} registrations`,
      eventId
    };
  }

  /**
   * Clear all seeds for an event
   *
   * @param {string} eventId
   * @returns {Promise<Object>}
   */
  async clearSeeds(eventId) {
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      throw new Error('Event not found');
    }

    if (event.bracketGenerated) {
      throw new Error('Cannot clear seeds after bracket has been generated');
    }

    await prisma.registration.updateMany({
      where: { eventId },
      data: { seedNumber: null }
    });

    console.log(`✅ Cleared all seeds for event ${eventId}`);

    return {
      success: true,
      message: 'Seeds cleared successfully',
      eventId
    };
  }
}

module.exports = new SeedService();
