const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setEventPriorities() {
  try {
    console.log('🎯 Setting event priorities...\n');

    const events = await prisma.event.findMany({
      include: {
        _count: {
          select: { registrations: true }
        }
      }
    });

    for (const event of events) {
      // Set priority based on event name
      let priority = 'medium';

      const name = event.name.toLowerCase();

      // Singles events = high priority
      if (name.includes('singles')) {
        priority = 'high';
      }
      // Doubles events = medium priority
      else if (name.includes('doubles')) {
        priority = 'medium';
      }
      // Everything else = low priority
      else {
        priority = 'low';
      }

      await prisma.event.update({
        where: { id: event.id },
        data: { priority }
      });

      console.log(`✓ ${event.name} → ${priority.toUpperCase()} priority`);
    }

    console.log('\n✅ All event priorities set!');

  } catch (error) {
    console.error('Error setting priorities:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setEventPriorities();
