const prisma = require('../src/lib/prisma');

async function cleanTestData() {
  try {
    console.log('🧹 Cleaning test notifications and live feed data...');

    // Delete all notifications
    const deletedNotifs = await prisma.notification.deleteMany({});
    console.log(`  ✅ Deleted ${deletedNotifs.count} notifications`);

    // Delete all live feed items
    const deletedFeed = await prisma.liveFeedItem.deleteMany({});
    console.log(`  ✅ Deleted ${deletedFeed.count} live feed items`);

    console.log('\n✨ Cleanup complete!');
    console.log('All test data has been removed.');
    console.log('New notifications and feed items will be created from real user actions.');

  } catch (error) {
    console.error('❌ Error cleaning data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanTestData();
