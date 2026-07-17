const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSports() {
  console.log('🎾 Checking Sports and Events...\n');

  const sports = await prisma.sport.findMany();
  console.log('All Sports:');
  sports.forEach(s => console.log(`  - ${s.name} (ID: ${s.id})`));

  const events = await prisma.event.findMany({
    where: {
      tournament: { name: 'Summer Championship 2026' }
    },
    select: { id: true, name: true, sportId: true }
  });

  console.log('\n📋 Events sportIds:');
  events.forEach(e => console.log(`  - ${e.name}: sportId = ${e.sportId || 'NULL'}`));

  await prisma.$disconnect();
}

checkSports().catch(console.error);
