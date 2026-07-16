const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupTestPlayers() {
  try {
    console.log('🧹 Starting cleanup of test player profiles...\n');

    // Find all users to review
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
        authProvider: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Total users found: ${allUsers.length}\n`);

    // Display all users
    console.log('All users in database:');
    console.log('─'.repeat(100));
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${user.createdAt.toLocaleString()}`);
      console.log(`   Auth: ${user.authProvider}`);
      console.log('');
    });

    // Identify potential test users (common test patterns)
    const testPatterns = [
      /test/i,
      /demo/i,
      /sample/i,
      /dummy/i,
      /player\d+/i,
      /@test\./i,
      /@example\./i,
      /@demo\./i,
    ];

    const potentialTestUsers = allUsers.filter(user => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const email = user.email.toLowerCase();
      return testPatterns.some(pattern =>
        pattern.test(fullName) || pattern.test(email)
      );
    });

    if (potentialTestUsers.length > 0) {
      console.log('\n🎯 Potential test users identified:');
      console.log('─'.repeat(100));
      potentialTestUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - ID: ${user.id}`);
      });

      console.log('\n🗑️  Deleting test users...\n');

      const deleteIds = potentialTestUsers.map(u => u.id);

      // Delete related data first
      console.log('Deleting registrations...');
      const regResult = await prisma.registration.deleteMany({
        where: {
          OR: [
            { userId: { in: deleteIds } },
            { partnerId: { in: deleteIds } }
          ]
        }
      });
      console.log(`  ✓ Deleted ${regResult.count} registrations`);

      console.log('Deleting player ratings...');
      const ratingResult = await prisma.playerRating.deleteMany({
        where: { userId: { in: deleteIds } }
      });
      console.log(`  ✓ Deleted ${ratingResult.count} player ratings`);

      console.log('Deleting follows...');
      const followResult = await prisma.follow.deleteMany({
        where: {
          OR: [
            { followerId: { in: deleteIds } },
            { followingId: { in: deleteIds } }
          ]
        }
      });
      console.log(`  ✓ Deleted ${followResult.count} follows`);

      console.log('Deleting org memberships...');
      const memberResult = await prisma.orgMember.deleteMany({
        where: { userId: { in: deleteIds } }
      });
      console.log(`  ✓ Deleted ${memberResult.count} org memberships`);

      console.log('Deleting live feed items...');
      const feedResult = await prisma.liveFeedItem.deleteMany({
        where: { actorId: { in: deleteIds } }
      });
      console.log(`  ✓ Deleted ${feedResult.count} live feed items`);

      console.log('Deleting notifications...');
      const notifResult = await prisma.notification.deleteMany({
        where: { userId: { in: deleteIds } }
      });
      console.log(`  ✓ Deleted ${notifResult.count} notifications`);

      // Delete the users
      console.log('Deleting users...');
      const result = await prisma.user.deleteMany({
        where: { id: { in: deleteIds } }
      });

      console.log(`\n✅ Successfully deleted ${result.count} test user(s)!`);
      console.log('🎉 Cleanup complete!\n');
    } else {
      console.log('\n✅ No obvious test users found with common patterns.');
      console.log('💡 You can manually specify user IDs to delete if needed.\n');
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// If you want to delete specific users by ID, uncomment and add IDs here:
/*
async function deleteSpecificUsers() {
  const userIdsToDelete = [
    // 'user-id-1',
    // 'user-id-2',
  ];

  if (userIdsToDelete.length === 0) {
    console.log('No user IDs specified.');
    return;
  }

  try {
    // Delete related data first
    await prisma.registration.deleteMany({
      where: {
        OR: [
          { userId: { in: userIdsToDelete } },
          { partnerId: { in: userIdsToDelete } }
        ]
      }
    });

    await prisma.playerRating.deleteMany({
      where: { userId: { in: userIdsToDelete } }
    });

    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: { in: userIdsToDelete } },
          { followingId: { in: userIdsToDelete } }
        ]
      }
    });

    await prisma.orgMember.deleteMany({
      where: { userId: { in: userIdsToDelete } }
    });

    await prisma.liveFeedItem.deleteMany({
      where: { actorId: { in: userIdsToDelete } }
    });

    await prisma.notification.deleteMany({
      where: { userId: { in: userIdsToDelete } }
    });

    const result = await prisma.user.deleteMany({
      where: { id: { in: userIdsToDelete } }
    });

    console.log(`✅ Deleted ${result.count} user(s) successfully!`);
  } catch (error) {
    console.error('❌ Error deleting users:', error);
  } finally {
    await prisma.$disconnect();
  }
}
*/

cleanupTestPlayers();
// Uncomment to use: deleteSpecificUsers();
