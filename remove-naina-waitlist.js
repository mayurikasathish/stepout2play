const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeNainaFromWaitlist() {
  try {
    console.log('🔍 Finding Naina Agarwal...');

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

    console.log(`✅ Found Naina: ${naina.firstName} ${naina.lastName} (${naina.id})`);

    // Find Women's Singles Mania event
    console.log('\n🔍 Finding Women\'s Singles Mania event...');

    const event = await prisma.event.findFirst({
      where: {
        name: {
          contains: 'Women',
          mode: 'insensitive'
        }
      },
      include: {
        tournament: {
          select: {
            name: true
          }
        }
      }
    });

    if (!event) {
      console.log('❌ Women\'s Singles event not found');
      return;
    }

    console.log(`✅ Found event: ${event.name} in ${event.tournament.name}`);

    // Find Naina's registration for this event
    const registration = await prisma.registration.findFirst({
      where: {
        userId: naina.id,
        eventId: event.id
      }
    });

    if (!registration) {
      console.log('❌ Naina is not registered for this event');
      return;
    }

    console.log(`\n📋 Found registration:`);
    console.log(`   ID: ${registration.id}`);
    console.log(`   Status: ${registration.status}`);
    console.log(`   Is Standby: ${registration.isStandby}`);
    console.log(`   Standby Position: ${registration.standbyPosition}`);

    // Delete the registration
    console.log('\n🗑️  Deleting registration...');
    await prisma.registration.delete({
      where: {
        id: registration.id
      }
    });

    console.log('✅ Successfully removed Naina from the waitlist!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeNainaFromWaitlist();
