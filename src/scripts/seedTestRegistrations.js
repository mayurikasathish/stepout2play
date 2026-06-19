const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedTestRegistrations(eventId, count = 50) {
  console.log(`Creating ${count} test registrations for event ${eventId}...`);

  try {
    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true, format: true }
    });

    if (!event) {
      console.error('Event not found!');
      process.exit(1);
    }

    console.log(`Event: ${event.name} (${event.format})`);

    // Create test users and registrations
    const registrations = [];
    for (let i = 1; i <= count; i++) {
      // Create user
      const user = await prisma.user.create({
        data: {
          firstName: `TestPlayer`,
          lastName: `${i}`,
          email: `testplayer${i}@test.com`,
          passwordHash: 'dummy', // Won't be used for login
          authProvider: 'local',
          onboardingComplete: true
        }
      });

      // Create registration
      const registration = await prisma.registration.create({
        data: {
          userId: user.id,
          eventId: eventId,
          status: 'CONFIRMED'
        }
      });

      registrations.push(registration);

      if (i % 10 === 0) {
        console.log(`  Created ${i}/${count} registrations...`);
      }
    }

    console.log(`✅ Successfully created ${count} test registrations!`);
    console.log('You can now generate a bracket for this event.');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get eventId from command line
const eventId = process.argv[2];
const count = parseInt(process.argv[3]) || 50;

if (!eventId) {
  console.error('Usage: node seedTestRegistrations.js <eventId> [count]');
  console.error('Example: node seedTestRegistrations.js abc-123-def 50');
  process.exit(1);
}

seedTestRegistrations(eventId, count);
