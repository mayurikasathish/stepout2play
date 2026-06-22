const prisma = require('../lib/prisma');
const { parseScore } = require('../utils/scoreParser');

class BracketService {
  // ─────────────────────────────────────────────────────────────────
  // PUBLIC: Generate bracket (routes to single-elim or round robin)
  // ─────────────────────────────────────────────────────────────────
  async generateBracket(eventId, bracketFormat, seedingMethod, options = {}) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: {
          where: { status: 'CONFIRMED', isWithdrawn: false },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
            partner: { select: { id: true, firstName: true, lastName: true, email: true } }
          },
          orderBy: { createdAt: 'asc' }
        },
        matches: true
      }
    });

    if (!event) {
      const error = new Error('Event not found');
      error.statusCode = 404;
      throw error;
    }

    if (event.bracketGenerated) {
      const error = new Error('Bracket already generated for this event. Delete existing bracket first.');
      error.statusCode = 400;
      throw error;
    }

    const participantCount = event.registrations.length;
    const isTeamEvent = event.format === 'DOUBLES' || event.format === 'MIXED_DOUBLES';
    const entityLabel = isTeamEvent ? 'teams' : 'participants';

    if (participantCount < 2) {
      const error = new Error(`At least 2 ${entityLabel} required to generate bracket`);
      error.statusCode = 400;
      throw error;
    }

    // Apply seeding
    let seededParticipants;
    if (seedingMethod === 'MANUAL') {
      seededParticipants = this.applySeedingManual(event.registrations);
    } else if (seedingMethod === 'RANDOM') {
      seededParticipants = this.applySeedingRandom(event.registrations);
    } else if (seedingMethod === 'SNAKE') {
      seededParticipants = this.applySeedingSnake(event.registrations, options.groupSize || 4);
    } else {
      seededParticipants = event.registrations; // REGISTRATION_ORDER
    }

    if (bracketFormat === 'ROUND_ROBIN') {
      return await this.generateRoundRobinBracket(eventId, seededParticipants, seedingMethod, options);
    }

    if (bracketFormat === 'SINGLE_ELIMINATION') {
      return await this.generateSingleEliminationFlow(eventId, seededParticipants, seedingMethod, participantCount);
    }

    if (bracketFormat === 'LEAGUE_CUM_KNOCKOUT') {
      return await this.generateHybridBracket(eventId, seededParticipants, seedingMethod, options);
    }

    const error = new Error('bracketFormat must be SINGLE_ELIMINATION, ROUND_ROBIN, or LEAGUE_CUM_KNOCKOUT');
    error.statusCode = 400;
    throw error;
  }

  // ─────────────────────────────────────────────────────────────────
  // ROUND ROBIN: Main generator
  // ─────────────────────────────────────────────────────────────────
  async generateRoundRobinBracket(eventId, participants, seedingMethod, options) {
    const participantCount = participants.length;
    // Default group size: aim for groups of 4, min 3
    const groupSize = options.groupSize
      ? parseInt(options.groupSize)
      : participantCount <= 6 ? participantCount : 4;

    const groupCount = Math.ceil(participantCount / groupSize);

    // Divide participants into groups using round-robin distribution
    // This ensures even distribution: for 55 players in 7 groups → 6 groups of 8, 1 group of 7
    const groups = Array.from({ length: groupCount }, (_, i) => ({
      name: `Group ${String.fromCharCode(65 + i)}`, // A, B, C...
      participants: []
    }));

    // Use snake seeding only if explicitly requested, otherwise use round-robin distribution
    if (seedingMethod === 'SNAKE') {
      // Snake distribution: zigzag pattern to avoid clustering strong seeds
      participants.forEach((p, idx) => {
        const groupIdx = this._snakeIndex(idx, groupCount);
        groups[groupIdx].participants.push(p);
      });
    } else {
      // Round-robin distribution: fill groups evenly (1→A, 2→B, 3→C, ..., 8→A, 9→B...)
      participants.forEach((p, idx) => {
        const groupIdx = idx % groupCount;
        groups[groupIdx].participants.push(p);
      });
    }

    await prisma.$transaction(async (tx) => {
      let globalMatchNumber = 1;

      for (const groupDef of groups) {
        // Create Group record
        const group = await tx.group.create({
          data: {
            eventId,
            name: groupDef.name,
            status: 'PENDING'
          }
        });

        // Create standings rows for each participant in this group
        await tx.groupStanding.createMany({
          data: groupDef.participants.map(p => ({
            id: require('crypto').randomUUID(),
            groupId: group.id,
            registrationId: p.id
          }))
        });

        // Generate round-robin fixtures using the rotation algorithm
        // For N participants: N-1 rounds, each round has floor(N/2) matches
        const fixtures = this._generateRoundRobinFixtures(groupDef.participants);

        for (let roundIdx = 0; roundIdx < fixtures.length; roundIdx++) {
          const round = fixtures[roundIdx];
          for (let matchIdx = 0; matchIdx < round.length; matchIdx++) {
            const [p1, p2] = round[matchIdx];
            await tx.match.create({
              data: {
                eventId,
                groupId: group.id,
                roundNumber: roundIdx + 1,
                matchNumber: globalMatchNumber++,
                bracketPosition: `${group.name}-R${roundIdx + 1}-M${matchIdx + 1}`,
                participant1Id: p1 ? p1.id : null,
                participant2Id: p2 ? p2.id : null,
                status: (p1 && p2) ? 'READY' : 'PENDING',
                nextMatchId: null,
                feedsPosition: null,
                isByeMatch: false,
                isWalkover: false
              }
            });
          }
        }
      }

      // Update event metadata
      await tx.event.update({
        where: { id: eventId },
        data: {
          bracketGenerated: true,
          bracketFormat: 'ROUND_ROBIN',
          seedingMethod,
          groupCount,
          groupSize,
          totalRounds: groups[0] ? this._rrRounds(groups[0].participants.length) : 0
        }
      });
    });

    // Calculate actual group sizes for return
    const actualGroupSizes = groups.map(g => g.participants.length);
    const minGroupSize = Math.min(...actualGroupSizes);
    const maxGroupSize = Math.max(...actualGroupSizes);

    return {
      bracketFormat: 'ROUND_ROBIN',
      seedingMethod,
      participants: participantCount,
      groupCount,
      groupSize: `${minGroupSize}${minGroupSize !== maxGroupSize ? `-${maxGroupSize}` : ''} per group`
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // HYBRID: League-cum-Knockout (Group Stage + Knockout)
  // ─────────────────────────────────────────────────────────────────
  async generateHybridBracket(eventId, participants, seedingMethod, options) {
    const participantCount = participants.length;
    const groupCount = options.groupCount || 4;
    const advanceCount = options.advanceCount || 2;
    const hasBronzeMatch = options.hasBronzeMatch !== false; // default true

    // Validation
    const minParticipants = groupCount * 2;
    if (participantCount < minParticipants) {
      const error = new Error(`Need at least ${minParticipants} participants for ${groupCount} groups (minimum 2 per group)`);
      error.statusCode = 400;
      throw error;
    }

    const knockoutSize = groupCount * advanceCount;
    if (!Number.isInteger(Math.log2(knockoutSize))) {
      const error = new Error(
        `Knockout participants (${knockoutSize}) must be a power of 2. ` +
        `Try ${groupCount} groups × ${Math.pow(2, Math.ceil(Math.log2(groupCount)))} qualifiers, or adjust group count.`
      );
      error.statusCode = 400;
      throw error;
    }

    // Phase 1: Create groups and group stage matches (same as round robin)
    const groups = Array.from({ length: groupCount }, (_, i) => ({
      name: `Group ${String.fromCharCode(65 + i)}`,
      participants: []
    }));

    // Distribute participants to groups
    if (seedingMethod === 'SNAKE') {
      participants.forEach((p, idx) => {
        const groupIdx = this._snakeIndex(idx, groupCount);
        groups[groupIdx].participants.push(p);
      });
    } else {
      participants.forEach((p, idx) => {
        const groupIdx = idx % groupCount;
        groups[groupIdx].participants.push(p);
      });
    }

    await prisma.$transaction(async (tx) => {
      let globalMatchNumber = 1;

      // Create groups and group stage matches
      for (const groupDef of groups) {
        const group = await tx.group.create({
          data: {
            eventId,
            name: groupDef.name,
            status: 'PENDING'
          }
        });

        await tx.groupStanding.createMany({
          data: groupDef.participants.map(p => ({
            id: require('crypto').randomUUID(),
            groupId: group.id,
            registrationId: p.id
          }))
        });

        const fixtures = this._generateRoundRobinFixtures(groupDef.participants);

        for (let roundIdx = 0; roundIdx < fixtures.length; roundIdx++) {
          const round = fixtures[roundIdx];
          for (let matchIdx = 0; matchIdx < round.length; matchIdx++) {
            const [p1, p2] = round[matchIdx];
            await tx.match.create({
              data: {
                eventId,
                groupId: group.id,
                roundNumber: roundIdx + 1,
                matchNumber: globalMatchNumber++,
                bracketPosition: `${group.name}-R${roundIdx + 1}-M${matchIdx + 1}`,
                participant1Id: p1 ? p1.id : null,
                participant2Id: p2 ? p2.id : null,
                status: (p1 && p2) ? 'READY' : 'PENDING',
                nextMatchId: null,
                feedsPosition: null,
                isByeMatch: false,
                isWalkover: false
              }
            });
          }
        }
      }

      // Phase 2: Create knockout bracket structure (empty, to be filled after group stage)
      const knockoutRounds = Math.log2(knockoutSize);
      const knockoutMatches = [];
      const maxGroupRound = groups.reduce((max, g) => Math.max(max, this._rrRounds(g.participants.length)), 0);

      for (let round = 1; round <= knockoutRounds; round++) {
        const matchesInRound = Math.pow(2, knockoutRounds - round);
        for (let matchNum = 1; matchNum <= matchesInRound; matchNum++) {
          let nextMatchId = null;
          let feedsPosition = null;

          if (round < knockoutRounds) {
            const nextRound = round + 1;
            const nextMatchNumber = Math.ceil(matchNum / 2);
            nextMatchId = `KO-R${nextRound}-M${nextMatchNumber}`;
            feedsPosition = (matchNum % 2 === 1) ? 1 : 2;
          }

          knockoutMatches.push({
            eventId,
            groupId: null, // knockout matches have no group
            roundNumber: maxGroupRound + round, // start after group rounds
            matchNumber: globalMatchNumber++,
            bracketPosition: `KO-R${round}-M${matchNum}`,
            participant1Id: null,
            participant2Id: null,
            winnerId: null,
            score: null,
            status: 'PENDING',
            nextMatchId,
            feedsPosition,
            isByeMatch: false,
            isWalkover: false,
            completedAt: null
          });
        }
      }

      // Create bronze match if requested
      if (hasBronzeMatch) {
        knockoutMatches.push({
          eventId,
          groupId: null,
          roundNumber: maxGroupRound + knockoutRounds, // same round as final
          matchNumber: globalMatchNumber++,
          bracketPosition: 'Bronze',
          participant1Id: null,
          participant2Id: null,
          winnerId: null,
          score: null,
          status: 'PENDING',
          nextMatchId: null,
          feedsPosition: null,
          isByeMatch: false,
          isWalkover: false,
          completedAt: null
        });
      }

      // Insert knockout matches and resolve nextMatchId references
      const createdMatches = [];
      for (const matchData of knockoutMatches) {
        const { nextMatchId, ...rest } = matchData;
        const created = await tx.match.create({ data: rest });
        createdMatches.push({ ...created, nextMatchKey: nextMatchId });
      }

      const matchKeyToId = new Map();
      createdMatches.forEach(m => {
        const key = m.bracketPosition;
        matchKeyToId.set(key, m.id);
      });

      for (const match of createdMatches) {
        if (match.nextMatchKey && matchKeyToId.has(match.nextMatchKey)) {
          const nextMatchId = matchKeyToId.get(match.nextMatchKey);
          await tx.match.update({
            where: { id: match.id },
            data: { nextMatchId }
          });
        }
      }

      // Update event metadata
      const groupStageRounds = groups[0] ? this._rrRounds(groups[0].participants.length) : 0;
      await tx.event.update({
        where: { id: eventId },
        data: {
          bracketGenerated: true,
          bracketFormat: 'LEAGUE_CUM_KNOCKOUT',
          seedingMethod,
          groupCount,
          groupSize: Math.ceil(participantCount / groupCount),
          advanceCount,
          hasBronzeMatch,
          totalRounds: groupStageRounds + knockoutRounds + (hasBronzeMatch ? 1 : 0),
          totalSlots: knockoutSize,
          byeCount: 0
        }
      });
    });

    return {
      bracketFormat: 'LEAGUE_CUM_KNOCKOUT',
      seedingMethod,
      participants: participantCount,
      groupCount,
      advanceCount,
      knockoutParticipants: knockoutSize,
      hasBronzeMatch
    };
  }

  // Round-robin rotation scheduling algorithm
  // Returns: array of rounds, each round is array of [p1, p2] pairs
  _generateRoundRobinFixtures(participants) {
    const n = participants.length;
    // If odd number, add a BYE placeholder
    const list = n % 2 === 0 ? [...participants] : [...participants, null];
    const size = list.length;
    const rounds = size - 1;
    const fixtures = [];

    const rotatable = list.slice(1); // everything except the first (fixed) participant

    for (let round = 0; round < rounds; round++) {
      const roundFixtures = [];
      const current = [list[0], ...rotatable];

      for (let i = 0; i < size / 2; i++) {
        const p1 = current[i];
        const p2 = current[size - 1 - i];
        if (p1 !== null && p2 !== null) {
          roundFixtures.push([p1, p2]);
        }
      }
      fixtures.push(roundFixtures);

      // Rotate: move last element to front of rotatable
      rotatable.unshift(rotatable.pop());
    }

    return fixtures;
  }

  // Number of rounds for N participants in round robin
  _rrRounds(n) {
    return n % 2 === 0 ? n - 1 : n;
  }

  // Snake index: distributes participants across groups in zigzag
  // e.g. 6 participants, 3 groups: 0→0, 1→1, 2→2, 3→2, 4→1, 5→0
  _snakeIndex(idx, groupCount) {
    const cycle = groupCount * 2 - 2;
    const pos = idx % cycle;
    return pos < groupCount ? pos : cycle - pos;
  }

  // ─────────────────────────────────────────────────────────────────
  // ROUND ROBIN: Update match result + recalculate standings
  // ─────────────────────────────────────────────────────────────────
  async updateRoundRobinMatchResult(matchId, winnerId, score) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { event: true }
    });

    if (!match) {
      const error = new Error('Match not found');
      error.statusCode = 404;
      throw error;
    }

    if (!match.groupId) {
      // Not a group match — delegate to single elim handler
      return this.updateMatchResult(matchId, winnerId, score);
    }

    // Score is mandatory for round robin (for tie-breaking)
    if (!score || score.trim() === '') {
      const error = new Error('Score is required for round robin matches (needed for tie-breaking)');
      error.statusCode = 400;
      throw error;
    }

    // Parse score to get games/points and determine winner
    let scoreData;
    try {
      scoreData = parseScore(score, match.participant1Id, match.participant2Id);
    } catch (parseError) {
      const error = new Error(`Invalid score format: ${parseError.message}`);
      error.statusCode = 400;
      throw error;
    }

    // Use parsed winner if winnerId not provided
    const actualWinnerId = winnerId || scoreData.winnerId;

    // Validate winner
    if (actualWinnerId && actualWinnerId !== match.participant1Id && actualWinnerId !== match.participant2Id) {
      const error = new Error('Winner must be one of the match participants');
      error.statusCode = 400;
      throw error;
    }

    const isDraw = !actualWinnerId; // null winnerId = draw

    await prisma.$transaction(async (tx) => {
      // Update match
      await tx.match.update({
        where: { id: matchId },
        data: {
          winnerId: actualWinnerId || null,
          score,
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });

      const loserId = actualWinnerId === match.participant1Id
        ? match.participant2Id
        : match.participant1Id;

      if (!isDraw && actualWinnerId) {
        // Win = 3 pts, Loss = 0 pts
        // Update winner standing
        await tx.groupStanding.updateMany({
          where: { groupId: match.groupId, registrationId: actualWinnerId },
          data: {
            wins: { increment: 1 },
            points: { increment: 3 },
            matchesPlayed: { increment: 1 },
            gamesWon: { increment: actualWinnerId === match.participant1Id ? scoreData.gamesWon1 : scoreData.gamesWon2 },
            gamesLost: { increment: actualWinnerId === match.participant1Id ? scoreData.gamesLost1 : scoreData.gamesLost2 },
            pointsFor: { increment: actualWinnerId === match.participant1Id ? scoreData.pointsFor1 : scoreData.pointsFor2 },
            pointsAgainst: { increment: actualWinnerId === match.participant1Id ? scoreData.pointsAgainst1 : scoreData.pointsAgainst2 }
          }
        });
        // Update loser standing
        await tx.groupStanding.updateMany({
          where: { groupId: match.groupId, registrationId: loserId },
          data: {
            losses: { increment: 1 },
            matchesPlayed: { increment: 1 },
            gamesWon: { increment: loserId === match.participant1Id ? scoreData.gamesWon1 : scoreData.gamesWon2 },
            gamesLost: { increment: loserId === match.participant1Id ? scoreData.gamesLost1 : scoreData.gamesLost2 },
            pointsFor: { increment: loserId === match.participant1Id ? scoreData.pointsFor1 : scoreData.pointsFor2 },
            pointsAgainst: { increment: loserId === match.participant1Id ? scoreData.pointsAgainst1 : scoreData.pointsAgainst2 }
          }
        });
      } else {
        // Draw = 1 pt each
        if (match.participant1Id) {
          await tx.groupStanding.updateMany({
            where: { groupId: match.groupId, registrationId: match.participant1Id },
            data: {
              draws: { increment: 1 },
              points: { increment: 1 },
              matchesPlayed: { increment: 1 },
              gamesWon: { increment: scoreData.gamesWon1 },
              gamesLost: { increment: scoreData.gamesLost1 },
              pointsFor: { increment: scoreData.pointsFor1 },
              pointsAgainst: { increment: scoreData.pointsAgainst1 }
            }
          });
        }
        if (match.participant2Id) {
          await tx.groupStanding.updateMany({
            where: { groupId: match.groupId, registrationId: match.participant2Id },
            data: {
              draws: { increment: 1 },
              points: { increment: 1 },
              matchesPlayed: { increment: 1 },
              gamesWon: { increment: scoreData.gamesWon2 },
              gamesLost: { increment: scoreData.gamesLost2 },
              pointsFor: { increment: scoreData.pointsFor2 },
              pointsAgainst: { increment: scoreData.pointsAgainst2 }
            }
          });
        }
      }

      // Check if all group matches are done → mark group COMPLETED
      const pendingMatches = await tx.match.count({
        where: { groupId: match.groupId, status: { not: 'COMPLETED' } }
      });
      if (pendingMatches === 0) {
        await tx.group.update({
          where: { id: match.groupId },
          data: { status: 'COMPLETED' }
        });
      } else {
        // Mark IN_PROGRESS if not already
        await tx.group.updateMany({
          where: { id: match.groupId, status: 'PENDING' },
          data: { status: 'IN_PROGRESS' }
        });
      }
    });

    return await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        participant1: { include: { user: true, partner: true } },
        participant2: { include: { user: true, partner: true } },
        winner: { include: { user: true, partner: true } }
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // GET bracket (handles both formats)
  // ─────────────────────────────────────────────────────────────────
  async getBracket(eventId) {
    // First fetch the event without groups to check bracketFormat safely
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        matches: {
          include: {
            participant1: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } }, partner: { select: { id: true, firstName: true, lastName: true, email: true } } } },
            participant2: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } }, partner: { select: { id: true, firstName: true, lastName: true, email: true } } } },
            winner: { include: { user: { select: { id: true, firstName: true, lastName: true } }, partner: { select: { id: true, firstName: true, lastName: true } } } }
          },
          orderBy: [{ roundNumber: 'asc' }, { matchNumber: 'asc' }]
        }
      }
    });

    if (!event) {
      const error = new Error('Event not found');
      error.statusCode = 404;
      throw error;
    }

    // Only fetch groups if this is a round robin or hybrid bracket AND migration has run
    let groups = [];
    if (event.bracketFormat === 'ROUND_ROBIN' || event.bracketFormat === 'LEAGUE_CUM_KNOCKOUT') {
      try {
        groups = await prisma.group.findMany({
          where: { eventId },
          include: {
            standings: {
              include: {
                registration: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } }, partner: { select: { id: true, firstName: true, lastName: true } } } }
              },
              orderBy: [{ points: 'desc' }, { wins: 'desc' }]
            },
            matches: {
              include: {
                participant1: { include: { user: { select: { id: true, firstName: true, lastName: true } }, partner: { select: { id: true, firstName: true, lastName: true } } } },
                participant2: { include: { user: { select: { id: true, firstName: true, lastName: true } }, partner: { select: { id: true, firstName: true, lastName: true } } } },
                winner: { include: { user: { select: { id: true, firstName: true, lastName: true } } } }
              },
              orderBy: [{ roundNumber: 'asc' }, { matchNumber: 'asc' }]
            }
          },
          orderBy: { name: 'asc' }
        });
      } catch (groupErr) {
        // Migration not yet applied — return empty groups, frontend handles gracefully
        console.warn('Groups table not available yet (migration pending):', groupErr.message);
        groups = [];
      }
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
        byeCount: event.byeCount,
        groupCount: event.groupCount || null,
        groupSize: event.groupSize || null,
        advanceCount: event.advanceCount || null,
        hasBronzeMatch: event.hasBronzeMatch || false
      },
      matches: event.matches,
      groups
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // DELETE bracket (handles both formats)
  // ─────────────────────────────────────────────────────────────────
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

    await prisma.$transaction(async (tx) => {
      await tx.match.deleteMany({ where: { eventId } });
      // Groups cascade-delete their standings via FK
      // Wrapped in try/catch in case migration hasn't been applied yet
      try {
        await tx.group.deleteMany({ where: { eventId } });
      } catch (groupErr) {
        console.warn('Groups table not available yet (migration pending) — skipping group delete:', groupErr.message);
      }

      // Reset event metadata — try with all columns first, fall back without new ones
      try {
        await tx.event.update({
          where: { id: eventId },
          data: {
            bracketGenerated: false, bracketFormat: null, seedingMethod: null,
            totalSlots: null, totalRounds: null, byeCount: null,
            groupCount: null, groupSize: null, advanceCount: null, hasBronzeMatch: null
          }
        });
      } catch (colErr) {
        // New columns don't exist yet — reset without them
        await tx.event.update({
          where: { id: eventId },
          data: {
            bracketGenerated: false, bracketFormat: null, seedingMethod: null,
            totalSlots: null, totalRounds: null, byeCount: null
          }
        });
      }
    });

    return { message: 'Bracket deleted successfully' };
  }

  // ─────────────────────────────────────────────────────────────────
  // SINGLE ELIMINATION (unchanged logic, refactored into sub-method)
  // ─────────────────────────────────────────────────────────────────
  async generateSingleEliminationFlow(eventId, seededParticipants, seedingMethod, participantCount) {
    const { matches, totalSlots, totalRounds, byeCount } =
      this.generateSingleEliminationBracket(seededParticipants, eventId);

    await prisma.$transaction(async (tx) => {
      const createdMatches = [];
      for (const matchData of matches) {
        const { nextMatchId, ...rest } = matchData;
        const created = await tx.match.create({ data: rest });
        createdMatches.push({ ...created, nextMatchKey: nextMatchId });
      }

      const matchKeyToId = new Map();
      createdMatches.forEach(m => matchKeyToId.set(`${m.roundNumber}-${m.matchNumber}`, m.id));

      for (const match of createdMatches) {
        if (match.nextMatchKey && typeof match.nextMatchKey === 'string' && match.nextMatchKey.includes('-')) {
          const nextMatchId = matchKeyToId.get(match.nextMatchKey);
          if (nextMatchId) {
            await tx.match.update({ where: { id: match.id }, data: { nextMatchId } });
            match.nextMatchId = nextMatchId;
          }
        }
      }

      for (const match of createdMatches) {
        if (match.status === 'BYE' && match.winnerId && match.feedsPosition && match.nextMatchId) {
          const updateData = match.feedsPosition === 1
            ? { participant1Id: match.winnerId }
            : { participant2Id: match.winnerId };
          await tx.match.update({ where: { id: match.nextMatchId }, data: updateData });
          const nextMatch = await tx.match.findUnique({ where: { id: match.nextMatchId } });
          if (nextMatch.participant1Id && nextMatch.participant2Id) {
            await tx.match.update({ where: { id: nextMatch.id }, data: { status: 'READY' } });
          }
        }
      }

      await tx.event.update({
        where: { id: eventId },
        data: { bracketGenerated: true, bracketFormat: 'SINGLE_ELIMINATION', seedingMethod, totalSlots, totalRounds, byeCount }
      });
    });

    return { matchesCreated: matches.length, bracketFormat: 'SINGLE_ELIMINATION', seedingMethod, participants: participantCount, totalSlots, totalRounds, byeCount };
  }

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

  generateSingleEliminationBracket(participants, eventId) {
    const participantCount = participants.length;
    const totalSlots = Math.pow(2, Math.ceil(Math.log2(participantCount)));
    const totalRounds = Math.log2(totalSlots);
    const byeCount = totalSlots - participantCount;
    const seedingOrder = this.generateStandardSeeding(totalSlots);
    const matchesMap = new Map();
    const matches = [];

    for (let round = 1; round <= totalRounds; round++) {
      const matchesInRound = Math.pow(2, round - 1);
      for (let matchNum = 1; matchNum <= matchesInRound; matchNum++) {
        let nextMatchId = null;
        let feedsPosition = null;
        if (round > 1) {
          const nextRound = round - 1;
          const nextMatchNumber = Math.ceil(matchNum / 2);
          nextMatchId = `${nextRound}-${nextMatchNumber}`;
          feedsPosition = (matchNum % 2 === 1) ? 1 : 2;
        }
        const match = {
          eventId, roundNumber: round, matchNumber: matchNum,
          bracketPosition: `R${round}-M${matchNum}`,
          participant1Id: null, participant2Id: null, winnerId: null,
          score: null, status: 'PENDING', nextMatchId, feedsPosition,
          isByeMatch: false, isWalkover: false, completedAt: null
        };
        matchesMap.set(`${round}-${matchNum}`, match);
        matches.push(match);
      }
    }

    const matchIdMap = new Map();
    matches.forEach(m => matchIdMap.set(`${m.roundNumber}-${m.matchNumber}`, m));

    const firstRound = totalRounds;
    const firstRoundMatches = Math.pow(2, firstRound - 1);

    for (let matchNum = 1; matchNum <= firstRoundMatches; matchNum++) {
      const match = matchIdMap.get(`${firstRound}-${matchNum}`);
      const seed1Position = (matchNum - 1) * 2;
      const seed2Position = seed1Position + 1;
      const seed1 = seedingOrder[seed1Position];
      const seed2 = seedingOrder[seed2Position];
      if (seed1 <= participantCount) match.participant1Id = participants[seed1 - 1].id;
      if (seed2 <= participantCount) match.participant2Id = participants[seed2 - 1].id;

      if (match.participant1Id && !match.participant2Id) {
        match.isByeMatch = true; match.status = 'BYE';
        match.winnerId = match.participant1Id; match.completedAt = new Date();
      } else if (!match.participant1Id && match.participant2Id) {
        match.isByeMatch = true; match.status = 'BYE';
        match.winnerId = match.participant2Id; match.completedAt = new Date();
      } else if (match.participant1Id && match.participant2Id) {
        match.status = 'READY';
      }
    }
    return { matches, totalSlots, totalRounds, byeCount };
  }

  // ─────────────────────────────────────────────────────────────────
  // SEEDING METHODS
  // ─────────────────────────────────────────────────────────────────
  applySeedingManual(registrations) {
    // Validate that all participants have seed numbers
    const withoutSeeds = registrations.filter(r => r.seedNumber === null || r.seedNumber === undefined);

    if (withoutSeeds.length > 0) {
      const error = new Error(
        `Manual seeding requires all participants to have seed numbers. ` +
        `${withoutSeeds.length} participant(s) are missing seed numbers. ` +
        `Please set seed numbers in the Registrations tab first.`
      );
      error.statusCode = 400;
      throw error;
    }

    // Check for duplicate seed numbers
    const seedNumbers = registrations.map(r => r.seedNumber).filter(s => s !== null);
    const uniqueSeeds = new Set(seedNumbers);
    if (uniqueSeeds.size !== seedNumbers.length) {
      const error = new Error('Duplicate seed numbers found. Each participant must have a unique seed number.');
      error.statusCode = 400;
      throw error;
    }

    return [...registrations].sort((a, b) => a.seedNumber - b.seedNumber);
  }

  applySeedingRandom(registrations) {
    const participants = [...registrations];
    for (let i = participants.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [participants[i], participants[j]] = [participants[j], participants[i]];
    }
    return participants;
  }

  // Snake seeding: distributes strongest seeds to different groups
  // Input already ordered by registration/manual seed; snake just reorders
  // for group assignment (called inside generateRoundRobinBracket)
  applySeedingSnake(registrations, groupCount) {
    // For snake seeding, keep original order — actual distribution is done
    // by _snakeIndex() during group assignment in generateRoundRobinBracket
    return [...registrations];
  }

  // ─────────────────────────────────────────────────────────────────
  // SINGLE ELIM: Update match result + advance winner
  // ─────────────────────────────────────────────────────────────────
  async updateMatchResult(matchId, winnerId, score) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { event: true, participant1: true, participant2: true }
    });

    if (!match) {
      const error = new Error('Match not found');
      error.statusCode = 404;
      throw error;
    }

    // If this is a group match, delegate to round robin handler
    if (match.groupId) {
      return this.updateRoundRobinMatchResult(matchId, winnerId, score);
    }

    if (winnerId !== match.participant1Id && winnerId !== match.participant2Id) {
      const error = new Error('Winner must be one of the match participants');
      error.statusCode = 400;
      throw error;
    }

    await prisma.$transaction(async (tx) => {
      await tx.match.update({
        where: { id: matchId },
        data: { winnerId, score, status: 'COMPLETED', completedAt: new Date() }
      });
      if (match.nextMatchId) {
        await this.advanceWinnerInBracket(tx, match, winnerId);
      }
    });

    return await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        participant1: { include: { user: true, partner: true } },
        participant2: { include: { user: true, partner: true } },
        winner: { include: { user: true, partner: true } }
      }
    });
  }

  async advanceWinnerInBracket(tx, match, winnerId) {
    if (!match.nextMatchId) return;
    const nextMatch = await tx.match.findUnique({ where: { id: match.nextMatchId } });
    if (!nextMatch) return;

    const updateData = match.feedsPosition === 1
      ? { participant1Id: winnerId }
      : { participant2Id: winnerId };

    await tx.match.update({ where: { id: nextMatch.id }, data: updateData });

    const updatedNext = await tx.match.findUnique({ where: { id: nextMatch.id } });
    if (updatedNext.participant1Id && updatedNext.participant2Id && updatedNext.status === 'PENDING') {
      await tx.match.update({ where: { id: updatedNext.id }, data: { status: 'READY' } });
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // SEED NUMBERS (unchanged)
  // ─────────────────────────────────────────────────────────────────
  async updateSeedNumbers(eventId, seeds) {
    const event = await prisma.event.findUnique({ where: { id: eventId }, include: { registrations: true } });
    if (!event) {
      const error = new Error('Event not found');
      error.statusCode = 404;
      throw error;
    }
    if (event.bracketGenerated) {
      const error = new Error('Cannot update seed numbers after bracket has been generated');
      error.statusCode = 400;
      throw error;
    }
    const seedNumbers = seeds.map(s => s.seedNumber);
    const uniqueSeeds = new Set(seedNumbers);
    if (uniqueSeeds.size !== seedNumbers.length) {
      const error = new Error('Duplicate seed numbers found');
      error.statusCode = 400;
      throw error;
    }
    await prisma.$transaction(
      seeds.map(({ registrationId, seedNumber }) =>
        prisma.registration.update({ where: { id: registrationId }, data: { seedNumber } })
      )
    );
    return { updated: seeds.length };
  }
}

module.exports = new BracketService();
