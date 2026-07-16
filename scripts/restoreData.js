const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function restoreData() {
  try {
    console.log('🔄 Restoring data from backup...\n');

    // Read backup file
    const data = JSON.parse(fs.readFileSync('./data-export.json', 'utf-8'));

    // Restore users
    console.log(`Restoring ${data.users.length} users...`);
    for (const user of data.users) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {},
        create: user
      });
    }
    console.log('✅ Users restored\n');

    // Restore organizations
    if (data.organizations) {
      console.log(`Restoring ${data.organizations.length} organizations...`);
      for (const org of data.organizations) {
        await prisma.organization.upsert({
          where: { id: org.id },
          update: {},
          create: org
        });
      }
      console.log('✅ Organizations restored\n');
    }

    // Restore tournaments
    if (data.tournaments) {
      console.log(`Restoring ${data.tournaments.length} tournaments...`);
      for (const tournament of data.tournaments) {
        await prisma.tournament.upsert({
          where: { id: tournament.id },
          update: {},
          create: tournament
        });
      }
      console.log('✅ Tournaments restored\n');
    }

    console.log('🎉 Data restoration complete!');

  } catch (error) {
    console.error('❌ Error restoring data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

restoreData();
