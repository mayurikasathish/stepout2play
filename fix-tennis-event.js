const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixTennisEvent() {
  try {
    const sportsService = require('./src/services/sports.service');
    const tennisRules = sportsService.getSportById('tennis');

    console.log('Fixing the Tennis event...\n');

    // Update the "men single" event in "french open" tournament
    const result = await prisma.event.update({
      where: {
        id: 'd5278195-905b-4aa6-98a3-f1c469c9c10b'
      },
      data: {
        sportId: 'tennis',
        scoringType: 'game-set-match',
        scoringRules: tennisRules.rules,
        bestOf: tennisRules.rules.bestOf,
        pointsPerSet: null, // Tennis doesn't use pointsPerSet
        goldenPoint: false
      }
    });

    console.log('✅ Successfully updated event:');
    console.log(`   Name: ${result.name}`);
    console.log(`   Sport: ${result.sportId}`);
    console.log(`   Scoring Type: ${result.scoringType}`);
    console.log(`   Best Of: ${result.bestOf} sets`);
    console.log('\n✅ Your Tennis event is now ready for live scoring!');
    console.log('   Refresh your browser and click "Update Score" on any match.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTennisEvent();
