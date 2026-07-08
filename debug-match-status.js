// Debug script to check what's actually in the database

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugMatch() {
  console.log('🔍 Checking R6 M3 match in database...\n');

  // Find the R6 M3 match
  const match = await prisma.match.findFirst({
    where: {
      bracketPosition: { contains: 'R6' },
      matchNumber: 3
    },
    include: {
      participant1: {
        include: {
          user: { select: { firstName: true, lastName: true } }
        }
      },
      participant2: {
        include: {
          user: { select: { firstName: true, lastName: true } }
        }
      },
      event: {
        include: {
          tournament: { select: { name: true } }
        }
      }
    }
  });

  if (!match) {
    console.log('❌ No R6 M3 match found!');
    console.log('\nLet me search for all R6 matches...\n');

    const r6Matches = await prisma.match.findMany({
      where: {
        bracketPosition: { contains: 'R6' }
      },
      include: {
        participant1: { include: { user: { select: { firstName: true, lastName: true } } } },
        participant2: { include: { user: { select: { firstName: true, lastName: true } } } }
      },
      orderBy: { matchNumber: 'asc' }
    });

    console.log(`Found ${r6Matches.length} R6 matches:`);
    for (const m of r6Matches) {
      const p1 = m.participant1 ? `${m.participant1.user.firstName} ${m.participant1.user.lastName}` : 'EMPTY';
      const p2 = m.participant2 ? `${m.participant2.user.firstName} ${m.participant2.user.lastName}` : 'EMPTY';
      console.log(`  M${m.matchNumber}: ${m.status} | P1: ${p1} | P2: ${p2}`);
    }

    await prisma.$disconnect();
    return;
  }

  // Display match details
  console.log('📋 MATCH DETAILS:\n');
  console.log(`Match Number: ${match.matchNumber}`);
  console.log(`Bracket Position: ${match.bracketPosition}`);
  console.log(`Status: ${match.status} ${match.status === 'PENDING' ? '← THIS IS THE PROBLEM!' : ''}`);
  console.log(`Tournament: ${match.event.tournament.name}`);
  console.log(`Event: ${match.event.name}\n`);

  console.log('👥 PARTICIPANTS:\n');

  if (match.participant1Id) {
    const p1 = match.participant1;
    console.log(`P1 ID: ${match.participant1Id}`);
    console.log(`P1 Name: ${p1.user.firstName} ${p1.user.lastName}`);
    console.log(`P1 Player ID: ${p1.playerId}\n`);
  } else {
    console.log(`P1: EMPTY (no participant1Id)\n`);
  }

  if (match.participant2Id) {
    const p2 = match.participant2;
    console.log(`P2 ID: ${match.participant2Id}`);
    console.log(`P2 Name: ${p2.user.firstName} ${p2.user.lastName}`);
    console.log(`P2 Player ID: ${p2.playerId}\n`);
  } else {
    console.log(`P2: EMPTY (no participant2Id)\n`);
  }

  // Check the issue
  console.log('🔍 DIAGNOSIS:\n');

  if (match.participant1Id && match.participant2Id) {
    if (match.status === 'PENDING') {
      console.log('❌ PROBLEM CONFIRMED:');
      console.log('   - Both participants ARE assigned');
      console.log('   - Status is PENDING (shows as "Wait")');
      console.log('   - Should be READY\n');
      console.log('💡 SOLUTION:');
      console.log('   Run this SQL to fix it:\n');
      console.log(`   UPDATE matches SET status = 'READY' WHERE id = '${match.id}';\n`);
      console.log('   Or manually update in the database.');
    } else {
      console.log(`✅ Status is ${match.status} - this is correct!`);
      console.log('   The issue might be on the frontend.');
      console.log('   Try refreshing your browser with Ctrl+Shift+R (hard refresh)');
    }
  } else {
    console.log('⚠️  One or both participants are MISSING in the database!');
    console.log('   The UI might be showing cached/incorrect data.');
    console.log('   Refresh your browser with Ctrl+Shift+R');
  }

  await prisma.$disconnect();
}

debugMatch().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
