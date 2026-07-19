const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteNainaRegistration() {
  try {
    console.log('🗑️  Deleting all registrations for Naina Agarwal...\n');

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

    // Delete all registrations
    const result = await prisma.registration.deleteMany({
      where: {
        userId: naina.id
      }
    });

    console.log(`✅ Deleted ${result.count} registration(s) for Naina`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteNainaRegistration();
