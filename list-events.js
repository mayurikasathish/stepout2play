const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listEvents() {
  try {
    const events = await prisma.event.findMany({
      include: {
        tournament: true,
        _count: {
          select: {
            registrations: true
          }
        }
      }
    });

    console.log(`\nFound ${events.length} total events:\n`);

    events.forEach(event => {
      console.log(`Event: "${event.name}"`);
      console.log(`  Tournament: ${event.tournament.name}`);
      console.log(`  Sport ID: ${event.sportId || '(none)'}`);
      console.log(`  Scoring Type: ${event.scoringType || '(none)'}`);
      console.log(`  Best Of: ${event.bestOf || '(none)'}`);
      console.log(`  Points Per Set: ${event.pointsPerSet || '(none)'}`);
      console.log(`  Registrations: ${event._count.registrations}`);
      console.log(`  ID: ${event.id}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listEvents();
