// Script to fix matches that have both participants but are still PENDING
// Run this once to fix existing brackets

require('dotenv').config(); // Load .env file

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPendingMatches() {
  console.log('🔍 Finding matches with both participants but PENDING status...');

  const pendingMatches = await prisma.match.findMany({
    where: {
      status: 'PENDING',
      participant1Id: { not: null },
      participant2Id: { not: null }
    },
    include: {
      participant1: { include: { user: true } },
      participant2: { include: { user: true } },
      event: { include: { tournament: true } }
    }
  });

  console.log(`\n📊 Found ${pendingMatches.length} matches to fix:\n`);

  for (const match of pendingMatches) {
    console.log(`  Match #${match.matchNumber} (${match.bracketPosition})`);
    console.log(`    ${match.event.tournament.name} - ${match.event.name}`);
    console.log(`    ${match.participant1.user.firstName} vs ${match.participant2.user.firstName}`);
    console.log(`    Status: PENDING → READY\n`);
  }

  if (pendingMatches.length === 0) {
    console.log('✅ No matches need fixing!');
    process.exit(0);
  }

  console.log('⚠️  This will update these matches to READY status.');
  console.log('📝 Press Ctrl+C to cancel, or wait 3 seconds to proceed...\n');

  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('🔧 Updating matches...\n');

  let updated = 0;
  for (const match of pendingMatches) {
    await prisma.match.update({
      where: { id: match.id },
      data: { status: 'READY' }
    });
    updated++;
    console.log(`  ✅ Match #${match.matchNumber} updated to READY`);
  }

  console.log(`\n🎉 Successfully updated ${updated} matches!`);
  console.log('✅ All matches with both participants are now READY.\n');

  await prisma.$disconnect();
  process.exit(0);
}

fixPendingMatches().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
