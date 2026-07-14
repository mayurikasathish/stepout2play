const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupPrivateAccounts() {
  try {
    console.log('Setting up private accounts...\n');

    // Get all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isProfilePrivate: true
      }
    });

    console.log(`Total users: ${allUsers.length}\n`);

    // Set every alternate user to private (for testing)
    let privateCount = 0;
    let publicCount = 0;

    for (let i = 0; i < allUsers.length; i++) {
      const user = allUsers[i];
      const shouldBePrivate = i % 2 === 0; // Every alternate user is private

      await prisma.user.update({
        where: { id: user.id },
        data: { isProfilePrivate: shouldBePrivate }
      });

      if (shouldBePrivate) {
        privateCount++;
        console.log(`🔒 ${user.firstName} ${user.lastName} (${user.email}) - PRIVATE`);
      } else {
        publicCount++;
        console.log(`🌍 ${user.firstName} ${user.lastName} (${user.email}) - PUBLIC`);
      }
    }

    console.log(`\n✓ Setup complete!`);
    console.log(`  Private accounts: ${privateCount}`);
    console.log(`  Public accounts: ${publicCount}`);
    console.log('\nNow when you follow:');
    console.log('  - Public accounts → Button shows "Following" immediately');
    console.log('  - Private accounts → Button shows "Requested" and user gets a follow request');
  } catch (error) {
    console.error('Error setting up private accounts:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupPrivateAccounts();
