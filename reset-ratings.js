const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetAllRatings() {
  try {
    console.log('🔄 Resetting all player ratings...');

    // Update all player ratings to default values
    const result = await prisma.playerRating.updateMany({
      data: {
        rating: 1200.0,
        rd: 350.0,
        volatility: 0.0,
        matchCount: 0,
        lastMatchDate: null
      }
    });

    console.log(`✅ Successfully reset ${result.count} player ratings!`);
    console.log('   Rating: 1200.0');
    console.log('   RD: 350.0');
    console.log('   Volatility: 0.0');
    console.log('   Match Count: 0');
    console.log('   Last Match Date: null');

    // Also delete all match rating changes
    const deletedChanges = await prisma.matchRatingChange.deleteMany({});
    console.log(`🗑️  Deleted ${deletedChanges.count} rating change records`);

  } catch (error) {
    console.error('❌ Error resetting ratings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAllRatings();
