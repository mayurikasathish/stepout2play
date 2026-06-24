const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateTennisEvents() {
  try {
    console.log('Searching for existing Tennis/Padel events...\n');

    // Find all events where sportId is tennis or padel OR name contains tennis/padel
    const allEvents = await prisma.event.findMany({
      where: {
        OR: [
          {
            sportId: {
              in: ['tennis', 'padel']
            }
          },
          {
            name: {
              contains: 'tennis',
              mode: 'insensitive'
            }
          },
          {
            name: {
              contains: 'padel',
              mode: 'insensitive'
            }
          }
        ]
      },
      include: {
        tournament: true
      }
    });

    console.log(`Found ${allEvents.length} potential Tennis/Padel events\n`);

    if (allEvents.length === 0) {
      console.log('No Tennis/Padel events found.');
      return;
    }

    const sportsService = require('./src/services/sports.service');
    const tennisRules = sportsService.getSportById('tennis');
    const padelRules = sportsService.getSportById('padel');

    let updatedCount = 0;

    for (const event of allEvents) {
      console.log(`Processing: "${event.name}" (${event.sportId || 'no sportId'})`);

      // Determine which sport this is
      let sportRules = null;
      let sportId = event.sportId;

      if (sportId === 'tennis') {
        sportRules = tennisRules;
      } else if (sportId === 'padel') {
        sportRules = padelRules;
      } else if (event.name.toLowerCase().includes('tennis')) {
        sportRules = tennisRules;
        sportId = 'tennis';
      } else if (event.name.toLowerCase().includes('padel')) {
        sportRules = padelRules;
        sportId = 'padel';
      }

      if (sportRules) {
        await prisma.event.update({
          where: { id: event.id },
          data: {
            sportId: sportId,
            scoringType: 'game-set-match',
            scoringRules: sportRules.rules,
            bestOf: sportRules.rules.bestOf,
            pointsPerSet: null, // Tennis/Padel don't use pointsPerSet
            goldenPoint: sportId === 'padel' ? (event.goldenPoint || false) : false
          }
        });
        console.log(`  ✅ Updated to ${sportId} with game-set-match scoring\n`);
        updatedCount++;
      } else {
        console.log(`  ⏭️  Skipped (not a tennis/padel event)\n`);
      }
    }

    console.log(`\n✅ Successfully updated ${updatedCount} events!`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTennisEvents();
