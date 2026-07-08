// Reset all ratings to 1200 and delete old match data
// Run this once to start fresh with the new scoring system

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetEverything() {
  console.log('🔄 RESETTING RATINGS AND DELETING OLD MATCHES\n');
  console.log('⚠️  WARNING: This will:');
  console.log('   1. Delete ALL completed matches');
  console.log('   2. Delete ALL match rating changes (history)');
  console.log('   3. Reset ALL player ratings to 1200');
  console.log('   4. Reset rating deviation (RD) to 350');
  console.log('   5. Reset match counts to 0\n');

  console.log('📝 This is a FRESH START for the new point-by-point scoring system.\n');
  console.log('⏳ Waiting 5 seconds... Press Ctrl+C to cancel.\n');

  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('🚀 Starting reset process...\n');

  try {
    // Step 1: Delete all match rating changes
    console.log('1️⃣  Deleting match rating history...');
    const deletedRatingChanges = await prisma.matchRatingChange.deleteMany({});
    console.log(`   ✅ Deleted ${deletedRatingChanges.count} rating change records\n`);

    // Step 2: Delete all completed matches
    console.log('2️⃣  Deleting completed matches...');
    const deletedMatches = await prisma.match.deleteMany({
      where: {
        status: 'COMPLETED'
      }
    });
    console.log(`   ✅ Deleted ${deletedMatches.count} completed matches\n`);

    // Step 3: Reset all player ratings
    console.log('3️⃣  Resetting player ratings to 1200...');
    const updatedRatings = await prisma.playerRating.updateMany({
      data: {
        rating: 1200.0,
        rd: 350.0,
        volatility: 0.06,
        matchCount: 0,
        lastMatchDate: null
      }
    });
    console.log(`   ✅ Reset ${updatedRatings.count} player rating records\n`);

    // Step 4: Show summary
    console.log('📊 SUMMARY:\n');

    const totalUsers = await prisma.user.count();
    const totalRatings = await prisma.playerRating.count();
    const remainingMatches = await prisma.match.count();

    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Total Ratings: ${totalRatings} (all reset to 1200)`);
    console.log(`   Remaining Matches: ${remainingMatches} (pending/scheduled only)`);
    console.log(`   Deleted Matches: ${deletedMatches.count}`);
    console.log(`   Deleted Rating History: ${deletedRatingChanges.count}\n`);

    console.log('✅ RESET COMPLETE!\n');
    console.log('🎯 All players are back to 1200 rating.');
    console.log('🆕 Ready for point-by-point scoring system!\n');

  } catch (error) {
    console.error('❌ ERROR:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetEverything()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
