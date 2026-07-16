const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateCourtsBySport() {
  try {
    console.log('🔄 Migrating existing tournaments to courtsBySport format...\n');

    // Get all tournaments
    const tournaments = await prisma.tournament.findMany({
      select: {
        id: true,
        name: true,
        sport: true,
        sports: true,
        sportType: true,
        courtsAvailable: true,
        courtsBySport: true
      }
    });

    console.log(`📊 Found ${tournaments.length} tournaments\n`);

    for (const tournament of tournaments) {
      // Skip if already migrated
      if (tournament.courtsBySport) {
        console.log(`⏭️  Skipping "${tournament.name}" - already has courtsBySport`);
        continue;
      }

      const courtCount = tournament.courtsAvailable || 4; // Default to 4
      const courtsBySport = {};

      // Determine which sports this tournament has
      const tournamentSports = tournament.sportType === 'multi' && tournament.sports?.length > 0
        ? tournament.sports
        : [tournament.sport]; // Fallback to legacy sport field

      // Generate courts for each sport
      for (const sportId of tournamentSports) {
        const sportName = getSportName(sportId);
        const courts = [];

        for (let i = 1; i <= courtCount; i++) {
          courts.push(`${sportName} Court ${i}`);
        }

        courtsBySport[sportId] = courts;
      }

      // Update tournament
      await prisma.tournament.update({
        where: { id: tournament.id },
        data: { courtsBySport }
      });

      console.log(`✅ Migrated "${tournament.name}"`);
      console.log(`   Sports: ${tournamentSports.join(', ')}`);
      console.log(`   Courts per sport: ${courtCount}`);
      Object.keys(courtsBySport).forEach(sport => {
        console.log(`   ${sport}: ${courtsBySport[sport].join(', ')}`);
      });
      console.log('');
    }

    console.log('\n✅ Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function getSportName(sportId) {
  const names = {
    'badminton': 'Badminton',
    'table-tennis': 'Table Tennis',
    'tennis': 'Tennis',
    'squash': 'Squash',
    'pickleball': 'Pickleball',
    'padel': 'Padel'
  };
  return names[sportId] || sportId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
}

migrateCourtsBySport();
