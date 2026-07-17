const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDuplicateRegistrations() {
  console.log('🔧 Fixing duplicate registrations...\n');

  const tournament = await prisma.tournament.findFirst({
    where: { name: 'Summer Championship 2026' },
    include: {
      events: {
        include: {
          registrations: {
            where: { status: 'CONFIRMED' },
            orderBy: { createdAt: 'asc' }
          }
        }
      }
    }
  });

  for (const event of tournament.events) {
    console.log(`\n📋 ${event.name}:`);

    const seenPlayers = new Set();
    const toDelete = [];

    for (const reg of event.registrations) {
      const players = [reg.userId, reg.partnerId].filter(Boolean);

      // Check if any player already seen
      const isDuplicate = players.some(p => seenPlayers.has(p));

      if (isDuplicate) {
        toDelete.push(reg.id);
        console.log(`  ❌ Removing duplicate: Registration ${reg.id}`);
      } else {
        // Mark these players as seen
        players.forEach(p => seenPlayers.add(p));
      }
    }

    if (toDelete.length > 0) {
      await prisma.registration.deleteMany({
        where: { id: { in: toDelete } }
      });
      console.log(`  ✅ Deleted ${toDelete.length} duplicate registrations`);
    } else {
      console.log(`  ✅ No duplicates found`);
    }
  }

  console.log('\n✅ Duplicate registrations fixed!');
  await prisma.$disconnect();
}

fixDuplicateRegistrations().catch(console.error);
