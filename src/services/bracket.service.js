const prisma = require('../lib/prisma');

class BracketService {
  /**
   * Generate bracket for an event
   * @param {string} eventId - Event ID
   * @param {string} bracketFormat - SINGLE_ELIMINATION only for now
   * @param {string} seedingMethod - REGISTRATION_ORDER, RANDOM, or MANUAL
   */
  async generateBracket(eventId, bracketFormat, seedingMethod) {
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
          },
          orderBy: {
            createdAt: 'asc' // For REGISTRATION_ORDER seeding
          }
        },
        matches: true
      }
    });

    if (!event) {
      const error = new Error('Event not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if bracket already exists
    if (event.bracketGenerated) {
      const error = new Error('Bracket already generated for this event. Delete existing bracket first.');
      error.statusCode = 400;
      throw error;
    }

    // Check minimum participants (or teams for doubles/mixed doubles)
    const participantCount = event.registrations.length;
    const isTeamEvent = event.format === 'DOUBLES' || event.format === 'MIXED_DOUBLES';
    const entityLabel = isTeamEvent ? 'teams' : 'participants';

    if (participantCount < 2) {
      const error = new Error(`At least 2 ${entityLabel} required to generate bracket`);
      error.statusCode = 400;
      throw error;
    }

    // Only support SINGLE_ELIMINATION for Phase 2
    if (bracketFormat !== 'SINGLE_ELIMINATION') {
      const error = new Error('Only SINGLE_ELIMINATION bracket format is currently supported');
      error.statusCode = 400;
      throw error;
    }

    // Apply seeding
    let seededParticipants = [];
    if (seedingMethod === 'MANUAL') {
      seededParticipants = this.applySeedingManual(event.registrations);
    } else if (seedingMethod === 'RANDOM') {
      seededParticipants = this.applySeedingRandom(event.registrations);
    } else {
      // REGISTRATION_ORDER - already ordered by createdAt
      seededParticipants = event.registrations;
    }

    // Generate single elimination bracket
    const { matches, totalSlots, totalRounds, byeCount } =
      this.generateSingleEliminationBracket(seededParticipants, eventId);

    // Create matches in database using transaction
    await prisma.$transaction(async (tx) => {
      // Step 1: Create all matches without nextMatchId (we'll update these in step 2)
      // matchData.nextMatchId at this point is still the "round-matchNum" KEY STRING
      // (e.g. "2-1"), not a real ID — that's intentional, we resolve it below.
      const createdMatches = [];
      for (const matchData of matches) {
        const { nextMatchId, ...matchDataWithoutNext } = matchData;
        const created = await tx.match.create({
          data: matchDataWithoutNext
        });
        createdMatches.push({
          ...created,
          nextMatchKey: nextMatchId // the "round-matchNum" string, e.g. "2-1"
        });
      }

      // Step 2: Build a map of (roundNumber, matchNumber) -> actual match ID
      const matchKeyToId = new Map();
      createdMatches.forEach(match => {
        const key = `${match.roundNumber}-${match.matchNumber}`;
        matchKeyToId.set(key, match.id);
      });

      // Step 3: Update matches with correct nextMatchId references
      for (const match of createdMatches) {
        if (match.nextMatchKey && typeof match.nextMatchKey === 'string' && match.nextMatchKey.includes('-')) {
          const nextMatchId = matchKeyToId.get(match.nextMatchKey);
          if (nextMatchId) {
            await tx.match.update({
              where: { id: match.id },
              data: { nextMatchId }
            });
            // CRITICAL: Also update the match object in createdMatches array so Step 4 can use it
            match.nextMatchId = nextMatchId;
          }
        }
      }

      // Step 4: Auto-advance BYE winners to next round
      for (const match of createdMatches) {
        if (match.status === 'BYE' && match.winnerId && match.feedsPosition && match.nextMatchId) {
          const updateData = match.feedsPosition === 1
            ? { participant1Id: match.winnerId }
            : { participant2Id: match.winnerId };

          await tx.match.update({
            where: { id: match.nextMatchId },
            data: updateData
          });

          // Check if next match is now READY
          const nextMatch = await tx.match.findUnique({
            where: { id: match.nextMatchId }
          });
          if (nextMatch.participant1Id && nextMatch.participant2Id) {
            await tx.match.update({
              where: { id: nextMatch.id },
              data: { status: 'READY' }
            });
          }
        }
      }

      // Step 5: Update event metadata
      await tx.event.update({
        where: { id: eventId },
        data: {
          bracketGenerated: true,
          bracketFormat,
          seedingMethod,
          totalSlots,
          totalRounds,
          byeCount
        }
      });
    });

    return {
      matchesCreated: matches.length,
      bracketFormat,
      seedingMethod,
      participants: participantCount,
      totalSlots,
      totalRounds,
      byeCount
    };
  }

  /**
   * Generate standard tournament seeding order
   * Creates balanced bracket: [1, 8, 4, 5, 2, 7, 3, 6] for 8 slots
   * Ensures top seeds don't meet until later rounds
   */
  generateStandardSeeding(totalSlots) {
    const rounds = Math.log2(totalSlots);
    let seeds = [1];

    for (let round = 1; round <= rounds; round++) {
      const newSeeds = [];
      const nextSize = Math.pow(2, round) + 1;

      for (const seed of seeds) {
        newSeeds.push(seed);
        newSeeds.push(nextSize - seed);
      }

      seeds = newSeeds;
    }

    return seeds;
  }

  /**
   * Generate Single Elimination bracket with explicit progression
   */
  generateSingleEliminationBracket(participants, eventId) {
    const participantCount = participants.length;

    // Calculate bracket parameters
    const totalSlots = Math.pow(2, Math.ceil(Math.log2(participantCount)));
    const totalRounds = Math.log2(totalSlots);
    const byeCount = totalSlots - participantCount;

    // Generate standard seeding order
    const seedingOrder = this.generateStandardSeeding(totalSlots);

    // Create a map to store all matches by (roundNumber, matchNumber)
    const matchesMap = new Map();
    const matches = [];

    // Step 1: Create all matches.
    // nextMatchId is set to the "round-matchNum" KEY STRING (e.g. "2-1") here.
    // This string is resolved into a real DB id later, inside generateBracket's
    // transaction (Step 2/3 above). It must NOT be nulled out before that —
    // doing so was the bug that broke BYE auto-advancement and all later
    // winner-advancement, since every match ended up with nextMatchId = null
    // in the database.
    for (let round = 1; round <= totalRounds; round++) {
      const matchesInRound = Math.pow(2, round - 1);

      for (let matchNum = 1; matchNum <= matchesInRound; matchNum++) {
        const matchKey = `${round}-${matchNum}`;

        // Calculate progression
        let nextMatchId = null;
        let feedsPosition = null;

        if (round > 1) {
          // Not the finals, so there's a next match
          const nextRound = round - 1;
          const nextMatchNumber = Math.ceil(matchNum / 2);
          const nextMatchKey = `${nextRound}-${nextMatchNumber}`;

          // Store the key for now — resolved to a real UUID inside the
          // transaction in generateBracket()
          nextMatchId = nextMatchKey;
          feedsPosition = (matchNum % 2 === 1) ? 1 : 2; // Odd match → position 1, Even → position 2
        }

        const match = {
          eventId,
          roundNumber: round,
          matchNumber: matchNum,
          bracketPosition: `R${round}-M${matchNum}`,
          participant1Id: null,
          participant2Id: null,
          winnerId: null,
          score: null,
          status: 'PENDING',
          nextMatchId, // "round-matchNum" key string for now (e.g. "2-1"), or null for the final
          feedsPosition,
          isByeMatch: false,
          isWalkover: false,
          completedAt: null
        };

        matchesMap.set(matchKey, match);
        matches.push(match);
      }
    }

    // Build a lookup so we can assign participants in Step 3 below.
    // NOTE: previously this section also nulled out nextMatchId on every
    // match, which silently broke bracket progression entirely. That step
    // has been removed — nextMatchId must stay as the key string until
    // generateBracket()'s transaction resolves it to a real id.
    const matchIdMap = new Map(); // matchKey → actual match object
    matches.forEach(match => {
      const key = `${match.roundNumber}-${match.matchNumber}`;
      matchIdMap.set(key, match);
    });

    // Step 3: Assign participants to first round using seeding order
    const firstRound = totalRounds;
    const firstRoundMatches = Math.pow(2, firstRound - 1);

    for (let matchNum = 1; matchNum <= firstRoundMatches; matchNum++) {
      const matchKey = `${firstRound}-${matchNum}`;
      const match = matchIdMap.get(matchKey);

      // Get the two seed positions for this match
      const seed1Position = (matchNum - 1) * 2;
      const seed2Position = seed1Position + 1;

      const seed1 = seedingOrder[seed1Position];
      const seed2 = seedingOrder[seed2Position];

      // Assign participant1
      if (seed1 <= participantCount) {
        match.participant1Id = participants[seed1 - 1].id;
      }

      // Assign participant2
      if (seed2 <= participantCount) {
        match.participant2Id = participants[seed2 - 1].id;
      }

      // Check if this is a BYE match
      if (match.participant1Id && !match.participant2Id) {
        match.isByeMatch = true;
        match.status = 'BYE';
        match.winnerId = match.participant1Id;
        match.completedAt = new Date();
      } else if (!match.participant1Id && match.participant2Id) {
        // Should not happen with proper seeding, but handle it
        match.isByeMatch = true;
        match.status = 'BYE';
        match.winnerId = match.participant2Id;
        match.completedAt = new Date();
      } else if (match.participant1Id && match.participant2Id) {
        match.status = 'READY'; // Both participants known
      }
    }

    return { matches, totalSlots, totalRounds, byeCount };
  }

  /**
   * Apply manual seeding (uses seedNumber from registration)
   */
  applySeedingManual(registrations) {
    return [...registrations].sort((a, b) => {
      if (a.seedNumber === null) return 1;
      if (b.seedNumber === null) return -1;
      return a.seedNumber - b.seedNumber;
    });
  }

  /**
   * Apply random seeding (shuffle)
   */
  applySeedingRandom(registrations) {
    const participants = [...registrations];
    // Fisher-Yates shuffle
    for (let i = participants.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [participants[i], participants[j]] = [participants[j], participants[i]];
    }
    return participants;
  }

  /**
   * Delete bracket for an event
   */
  async deleteBracket(eventId) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { matches: true }
    });

    if (!event) {
      const error = new Error('Event not found');
      error.statusCode = 404;
      throw error;
    }

    if (!event.bracketGenerated) {
      const error = new Error('No bracket exists for this event');
      error.statusCode = 400;
      throw error;
    }

    // Delete all matches and reset event in transaction
    await prisma.$transaction(async (tx) => {
      await tx.match.deleteMany({
        where: { eventId }
      });

      await tx.event.update({
        where: { id: eventId },
        data: {
          bracketGenerated: false,
          bracketFormat: null,
          seedingMethod: null,
          totalSlots: null,
          totalRounds: null,
          byeCount: null
        }
      });
    });

    return { message: 'Bracket deleted successfully' };
  }

  /**
   * Get bracket for an event
   */
  async getBracket(eventId) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        matches: {
          include: {
            participant1: {
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
            },
            participant2: {
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
            },
            winner: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true
                  }
                },
                partner: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          },
          orderBy: [
            { roundNumber: 'desc' },
            { matchNumber: 'asc' }
          ]
        }
      }
    });

    if (!event) {
      const error = new Error('Event not found');
      error.statusCode = 404;
      throw error;
    }

    return {
      event: {
        id: event.id,
        name: event.name,
        format: event.format,
        bracketGenerated: event.bracketGenerated,
        bracketFormat: event.bracketFormat,
        seedingMethod: event.seedingMethod,
        totalSlots: event.totalSlots,
        totalRounds: event.totalRounds,
        byeCount: event.byeCount
      },
      matches: event.matches
    };
  }

  /**
   * Update match result and advance winner
   */
  async updateMatchResult(matchId, winnerId, score) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        event: true,
        participant1: true,
        participant2: true
      }
    });

    if (!match) {
      const error = new Error('Match not found');
      error.statusCode = 404;
      throw error;
    }

    // Validate winner is one of the participants
    if (winnerId !== match.participant1Id && winnerId !== match.participant2Id) {
      const error = new Error('Winner must be one of the match participants');
      error.statusCode = 400;
      throw error;
    }

    // Update match and advance winner in transaction
    await prisma.$transaction(async (tx) => {
      // Update current match
      await tx.match.update({
        where: { id: matchId },
        data: {
          winnerId,
          score,
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });

      // Advance winner to next match (if not finals)
      if (match.nextMatchId) {
        await this.advanceWinnerInBracket(tx, match, winnerId);
      }
    });

    // Return updated match
    return await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        participant1: {
          include: {
            user: true,
            partner: true
          }
        },
        participant2: {
          include: {
            user: true,
            partner: true
          }
        },
        winner: {
          include: {
            user: true,
            partner: true
          }
        }
      }
    });
  }

  /**
   * Advance winner to next round in single elimination
   * This uses the nextMatchId and feedsPosition fields
   */
  async advanceWinnerInBracket(tx, match, winnerId) {
    if (!match.nextMatchId) {
      // Finals - no next match
      return;
    }

    // Find next match using explicit nextMatchId
    const nextMatch = await tx.match.findUnique({
      where: { id: match.nextMatchId }
    });

    if (!nextMatch) {
      console.error(`Next match not found: ${match.nextMatchId}`);
      return;
    }

    // Determine which participant slot to fill based on feedsPosition
    const updateData = {};
    if (match.feedsPosition === 1) {
      updateData.participant1Id = winnerId;
    } else if (match.feedsPosition === 2) {
      updateData.participant2Id = winnerId;
    }

    // Update next match with winner
    await tx.match.update({
      where: { id: nextMatch.id },
      data: updateData
    });

    // Check if next match is now READY (both participants filled)
    const updatedNext = await tx.match.findUnique({
      where: { id: nextMatch.id }
    });

    if (updatedNext.participant1Id && updatedNext.participant2Id && updatedNext.status === 'PENDING') {
      await tx.match.update({
        where: { id: updatedNext.id },
        data: { status: 'READY' }
      });
    }
  }
}

module.exports = new BracketService();
