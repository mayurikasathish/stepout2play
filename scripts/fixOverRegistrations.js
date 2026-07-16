const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixOverRegistrations() {
  try {
    console.log('🔍 Checking for over-registered events...\n');

    // Get all events with their registrations
    const events = await prisma.event.findMany({
      where: {
        maxParticipants: { not: null }
      },
      include: {
        registrations: {
          where: {
            status: 'CONFIRMED',
            isStandby: false
          },
          orderBy: {
            createdAt: 'desc' // Most recent first
          }
        }
      }
    });

    for (const event of events) {
      const confirmedCount = event.registrations.length;

      if (confirmedCount > event.maxParticipants) {
        console.log(`⚠️  Event "${event.name}": ${confirmedCount}/${event.maxParticipants} (OVER by ${confirmedCount - event.maxParticipants})`);

        // Move excess registrations to STANDBY
        const excessCount = confirmedCount - event.maxParticipants;
        const toStandby = event.registrations.slice(0, excessCount); // Most recent ones go to standby

        for (let i = 0; i < toStandby.length; i++) {
          await prisma.registration.update({
            where: { id: toStandby[i].id },
            data: {
              isStandby: true,
              standbyPosition: i + 1
            }
          });
        }

        console.log(`   ✅ Moved ${excessCount} registrations to standby\n`);
      } else {
        console.log(`✓  Event "${event.name}": ${confirmedCount}/${event.maxParticipants}`);
      }
    }

    console.log('\n✅ Fix complete!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixOverRegistrations();
