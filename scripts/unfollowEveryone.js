const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function unfollowEveryone() {
  try {
    console.log('Deleting all follow relationships...');

    const result = await prisma.follow.deleteMany({});

    console.log(`✓ Deleted ${result.count} follow relationships`);
    console.log('Everyone has been unfollowed!');
  } catch (error) {
    console.error('Error unfollowing everyone:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

unfollowEveryone();
