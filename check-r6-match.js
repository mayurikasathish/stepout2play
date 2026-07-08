// Check why R6 M3 has participants but is PENDING

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMatch() {
  console.log('🔍 Looking for R6 M3 match...\n');

  // Find matches with R6 in bracket position
  const r6Matches = await prisma.match.findMany({
    where: {
      bracketPosition: { contains: 'R6' }
    },
    include: {
      participant1: { include: { user: true } },
      participant2: { include: { user: true } },
      event: {
        include: {
          tournament: true
        }
      }
    },
    orderBy: { matchNumber: 'asc' }
  });

  console.log(`📊 Found ${r6Matches.length} R6 matches:\n`);

  for (const match of r6Matches) {
    const p1Name = match.participant1 ? `${match.participant1.user.firstName} ${match.participant1.user.lastName}` : 'Empty';
    const p2Name = match.participant2 ? `${match.participant2.user.firstName} ${match.participant2.user.lastName}` : 'Empty';

    console.log(`Match #${match.matchNumber} (${match.bracketPosition})`);
    console.log(`  Status: ${match.status}`);
    console.log(`  P1: ${p1Name}`);
    console.log(`  P2: ${p2Name}`);
    console.log(`  Tournament: ${match.event.tournament.name}`);
    console.log(`  Format: ${match.event.bracketFormat}`);
    console.log(`  Created: ${match.createdAt}`);
    console.log(`  Updated: ${match.updatedAt}\n`);
  }

  // Check if it's the problematic match
  const problematic = r6Matches.find(m =>
    m.matchNumber === 3 &&
    m.participant1Id &&
    m.participant2Id &&
    m.status === 'PENDING'
  );

  if (problematic) {
    console.log('🎯 Found the problematic match!\n');
    console.log('Why is it PENDING with both participants?');
    console.log('Possible reasons:');
    console.log('1. Manual assignment after bracket generation');
    console.log('2. Bug in bracket advancement logic');
    console.log('3. Status not updated after winner advanced from previous round\n');

    // Check if there are previous matches that feed into this one
    const previousMatches = await prisma.match.findMany({
      where: {
        eventId: problematic.eventId,
        nextMatchId: problematic.id
      }
    });

    console.log(`Previous matches feeding into R6 M3: ${previousMatches.length}`);
    for (const pm of previousMatches) {
      console.log(`  - Match #${pm.matchNumber} (${pm.bracketPosition}) - Status: ${pm.status}, Winner: ${pm.winnerId ? 'Set' : 'None'}`);
    }
  } else {
    console.log('✅ No problematic PENDING+participants R6 matches found!');
  }

  await prisma.$disconnect();
}

checkMatch().catch(console.error);
