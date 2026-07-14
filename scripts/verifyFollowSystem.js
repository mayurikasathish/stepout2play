const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyFollowSystem() {
  try {
    console.log('🔍 Verifying Follow System Setup\n');
    console.log('='.repeat(60));

    // 1. Check user privacy settings
    const totalUsers = await prisma.user.count();
    const privateUsers = await prisma.user.count({
      where: { isProfilePrivate: true }
    });
    const publicUsers = totalUsers - privateUsers;

    console.log('\n📊 USER PRIVACY SETTINGS');
    console.log('-'.repeat(60));
    console.log(`Total users: ${totalUsers}`);
    console.log(`Private accounts: ${privateUsers} (${Math.round(privateUsers/totalUsers*100)}%)`);
    console.log(`Public accounts: ${publicUsers} (${Math.round(publicUsers/totalUsers*100)}%)`);

    // 2. Check follow relationships
    const totalFollows = await prisma.follow.count();
    const acceptedFollows = await prisma.follow.count({
      where: { status: 'accepted' }
    });
    const pendingFollows = await prisma.follow.count({
      where: { status: 'pending' }
    });

    console.log('\n🔗 FOLLOW RELATIONSHIPS');
    console.log('-'.repeat(60));
    console.log(`Total follows: ${totalFollows}`);
    console.log(`Accepted: ${acceptedFollows}`);
    console.log(`Pending: ${pendingFollows}`);

    // 3. Show some example private accounts
    const privateAccounts = await prisma.user.findMany({
      where: { isProfilePrivate: true },
      select: {
        firstName: true,
        lastName: true,
        email: true
      },
      take: 5
    });

    console.log('\n🔒 SAMPLE PRIVATE ACCOUNTS (first 5)');
    console.log('-'.repeat(60));
    privateAccounts.forEach((user, i) => {
      console.log(`${i + 1}. ${user.firstName} ${user.lastName} - ${user.email}`);
    });

    // 4. Show some example public accounts
    const publicAccounts = await prisma.user.findMany({
      where: { isProfilePrivate: false },
      select: {
        firstName: true,
        lastName: true,
        email: true
      },
      take: 5
    });

    console.log('\n🌍 SAMPLE PUBLIC ACCOUNTS (first 5)');
    console.log('-'.repeat(60));
    publicAccounts.forEach((user, i) => {
      console.log(`${i + 1}. ${user.firstName} ${user.lastName} - ${user.email}`);
    });

    // 5. Check notifications
    const followNotifications = await prisma.notification.count({
      where: {
        type: {
          in: ['FOLLOW_REQUEST', 'NEW_FOLLOWER', 'FOLLOW_ACCEPTED']
        }
      }
    });

    console.log('\n📬 FOLLOW-RELATED NOTIFICATIONS');
    console.log('-'.repeat(60));
    console.log(`Total follow notifications: ${followNotifications}`);

    console.log('\n✅ SYSTEM STATUS: READY FOR TESTING');
    console.log('='.repeat(60));
    console.log('\nNext steps:');
    console.log('1. Start the frontend and backend servers');
    console.log('2. Login to the app');
    console.log('3. Go to Players page');
    console.log('4. Try following:');
    console.log('   - Public accounts → Button should show "Following"');
    console.log('   - Private accounts → Button should show "Requested"');
    console.log('5. Check Notifications tab for follow requests');
    console.log('6. Accept/Reject requests from notifications');
    console.log('\n');

  } catch (error) {
    console.error('Error verifying follow system:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyFollowSystem();
