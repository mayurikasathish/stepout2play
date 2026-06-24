const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPadelEvent() {
  try {
    const padelEvents = await prisma.event.findMany({
      where: {
        sportId: 'padel'
      },
      select: {
        id: true,
        name: true,
        sportId: true,
        goldenPoint: true,
        scoringType: true,
        tournament: {
          select: {
            name: true
          }
        }
      }
    });

    console.log(`\nFound ${padelEvents.length} Padel events:\n`);

    padelEvents.forEach(event => {
      console.log(`Event: "${event.name}"`);
      console.log(`  Tournament: ${event.tournament.name}`);
      console.log(`  Sport ID: ${event.sportId}`);
      console.log(`  Scoring Type: ${event.scoringType}`);
      console.log(`  Golden Point: ${event.goldenPoint}`);
      console.log(`  ID: ${event.id}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPadelEvent();
