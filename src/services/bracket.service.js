const prisma = require('../lib/prisma');

class BracketService {
  /**
   * Generate bracket for an event
   * @param {string} eventId - Event ID
   * @param {string} bracketFormat - SINGLE_ELIMINATION or ROUND_ROBIN
   * @param {string} seedingMethod - RANDOM or MANUAL
   */
  async generateBracket(eventId, bracketFormat, seedingMethod) {
    // Get event with registrations
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: {
          where: { status: 'CONFIRMED' },
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

    // Check minimum participants
    if (event.registrations.length < 2) {
      const error = new Error('At least 2 participants required to generate bracket');
      error.statusCode = 400;
      throw error;
    }

    // Apply seeding
    let seededParticipants = [];
    if (seedingMethod === 'MANUAL') {
      seededParticipants = this.applySeedingManual(event.registrations);
    } else {
      seededParticipants = this.applySeedingRandom(event.registrations);
    }

    // Generate matches based on format
    let matches = [];
    if (bracketFormat === 'SINGLE_ELIMINATION') {
      matches = this.generateSingleEliminationMatches(seededParticipants, eventId);
    } else if (bracketFormat === 'ROUND_ROBIN') {
      matches = this.generateRoundRobinMatches(seededParticipants, eventId);
    }

    // Create matches in database
    const createdMatches = await prisma.match.createMany({
      data: matches
    });

    // Update event to mark bracket as generated
    await prisma.event.update({
      where: { id: eventId },
      data: {
        bracketGenerated: true,
        bracketFormat,
        seedingMethod
      }
    });

    return {
      matchesCreated: createdMatches.count,
      bracketFormat,
      seedingMethod,
      participants: seededParticipants.length
    };
  }

  /**
   * Apply manual seeding (uses seedNumber from registration)
   */
  applySeedingManual(registrations) {
    // Sort by seedNumber (nulls last)
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
   * Generate Single Elimination bracket
   * Round numbers: 1 = Finals, 2 = Semifinals, 3 = Quarterfinals, etc.
   */
  generateSingleEliminationMatches(participants, eventId) {
    const n = participants.length;

    // Find next power of 2 (bracket size)
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(n)));
    const numByes = bracketSize - n;

    // Calculate number of rounds
    const numRounds = Math.log2(bracketSize);

    const matches = [];

    // First round
    const firstRoundMatches = bracketSize / 2;
    let participantIndex = 0;

    for (let matchNum = 0; matchNum < firstRoundMatches; matchNum++) {
      const match = {
        eventId,
        roundNumber: numRounds, // First round (highest number)
        matchNumber: matchNum + 1,
        participant1Id: null,
        participant2Id: null,
        status: 'PENDING'
      };

      // Assign participants or create BYE
      if (participantIndex < participants.length) {
        match.participant1Id = participants[participantIndex].id;
        participantIndex++;
      }

      if (participantIndex < participants.length) {
        match.participant2Id = participants[participantIndex].id;
        participantIndex++;
      }

      // If only one participant, it's a BYE
      if (match.participant1Id && !match.participant2Id) {
        match.status = 'BYE';
        match.winnerId = match.participant1Id;
      }

      matches.push(match);
    }

    // Create placeholder matches for subsequent rounds
    for (let round = numRounds - 1; round >= 1; round--) {
      const matchesInRound = Math.pow(2, round - 1);
      for (let matchNum = 0; matchNum < matchesInRound; matchNum++) {
        matches.push({
          eventId,
          roundNumber: round,
          matchNumber: matchNum + 1,
          participant1Id: null,
          participant2Id: null,
          status: 'PENDING'
        });
      }
    }

    return matches;
  }

  /**
   * Generate Round Robin bracket
   * Every participant plays every other participant once
   */
  generateRoundRobinMatches(participants, eventId) {
    const n = participants.length;
    const matches = [];
    let matchNumber = 0;

    // Round-robin: everyone plays everyone else once
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        matchNumber++;
        matches.push({
          eventId,
          roundNumber: 1, // Round robin uses single round
          matchNumber,
          participant1Id: participants[i].id,
          participant2Id: participants[j].id,
          status: 'PENDING'
        });
      }
    }

    return matches;
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

    // Delete all matches
    await prisma.match.deleteMany({
      where: { eventId }
    });

    // Reset bracket fields
    await prisma.event.update({
      where: { id: eventId },
      data: {
        bracketGenerated: false,
        bracketFormat: null,
        seedingMethod: null
      }
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
        seedingMethod: event.seedingMethod
      },
      matches: event.matches
    };
  }

  /**
   * Update match result
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

    // Update match
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        winnerId,
        score,
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    // If single elimination, advance winner to next round
    if (match.event.bracketFormat === 'SINGLE_ELIMINATION') {
      await this.advanceWinnerInBracket(match, winnerId);
    }

    return updatedMatch;
  }

  /**
   * Advance winner to next round in single elimination
   */
  async advanceWinnerInBracket(match, winnerId) {
    if (match.roundNumber === 1) {
      // Finals - no next match
      return;
    }

    const nextRound = match.roundNumber - 1;
    const nextMatchNumber = Math.ceil(match.matchNumber / 2);

    // Determine if winner goes to participant1 or participant2 slot
    const isOddMatch = match.matchNumber % 2 === 1;

    // Find next match
    const nextMatch = await prisma.match.findFirst({
      where: {
        eventId: match.eventId,
        roundNumber: nextRound,
        matchNumber: nextMatchNumber
      }
    });

    if (nextMatch) {
      // Update next match with winner
      await prisma.match.update({
        where: { id: nextMatch.id },
        data: isOddMatch
          ? { participant1Id: winnerId }
          : { participant2Id: winnerId }
      });
    }
  }
}

module.exports = new BracketService();
