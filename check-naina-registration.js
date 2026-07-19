const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNainaRegistrations() {
  try {
    console.log('🔍 Finding all registrations for Naina Agarwal...\n');

    // Find Naina
    const naina = await prisma.user.findFirst({
      where: {
        firstName: 'Naina',
        lastName: 'Agarwal'
      }
    });

    if (!naina) {
      console.log('❌ Naina Agarwal not found');
      return;
    }

    console.log(`✅ Found Naina: ${naina.firstName} ${naina.lastName} (${naina.id})\n`);

    // Find all registrations
    const registrations = await prisma.registration.findMany({
      where: {
        userId: naina.id
      },
      include: {
        event: {
          include: {
            tournament: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📋 Total registrations: ${registrations.length}\n`);

    if (registrations.length === 0) {
      console.log('No registrations found for Naina');
      return;
    }

    registrations.forEach((reg, index) => {
      console.log(`${index + 1}. ${reg.event.name}`);
      console.log(`   Tournament: ${reg.event.tournament.name}`);
      console.log(`   Status: ${reg.status}`);
      console.log(`   Is Standby: ${reg.isStandby}`);
      console.log(`   Standby Position: ${reg.standbyPosition}`);
      console.log(`   Is Withdrawn: ${reg.isWithdrawn}`);
      console.log(`   Created: ${reg.createdAt}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNainaRegistrations();
