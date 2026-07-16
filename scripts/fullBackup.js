const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function fullBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' +
                    new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups');
  const backupFile = path.join(backupDir, `database_backup_${timestamp}.json`);

  try {
    console.log('🔄 Starting full database backup...\n');

    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {}
    };

    // Backup all tables
    console.log('📦 Backing up Users...');
    backup.data.users = await prisma.user.findMany();
    console.log(`   ✓ ${backup.data.users.length} users`);

    console.log('📦 Backing up Organizations...');
    backup.data.organizations = await prisma.organization.findMany();
    console.log(`   ✓ ${backup.data.organizations.length} organizations`);

    console.log('📦 Backing up OrgMembers...');
    backup.data.orgMembers = await prisma.orgMember.findMany();
    console.log(`   ✓ ${backup.data.orgMembers.length} org members`);

    console.log('📦 Backing up OrgFollowers...');
    backup.data.orgFollowers = await prisma.orgFollower.findMany();
    console.log(`   ✓ ${backup.data.orgFollowers.length} org followers`);

    console.log('📦 Backing up Tournaments...');
    backup.data.tournaments = await prisma.tournament.findMany();
    console.log(`   ✓ ${backup.data.tournaments.length} tournaments`);

    console.log('📦 Backing up Events...');
    backup.data.events = await prisma.event.findMany();
    console.log(`   ✓ ${backup.data.events.length} events`);

    console.log('📦 Backing up Registrations...');
    backup.data.registrations = await prisma.registration.findMany();
    console.log(`   ✓ ${backup.data.registrations.length} registrations`);

    console.log('📦 Backing up Matches...');
    backup.data.matches = await prisma.match.findMany();
    console.log(`   ✓ ${backup.data.matches.length} matches`);

    console.log('📦 Backing up PlayerRatings...');
    backup.data.playerRatings = await prisma.playerRating.findMany();
    console.log(`   ✓ ${backup.data.playerRatings.length} player ratings`);

    console.log('📦 Backing up MatchRatingChanges...');
    backup.data.matchRatingChanges = await prisma.matchRatingChange.findMany();
    console.log(`   ✓ ${backup.data.matchRatingChanges.length} rating changes`);

    console.log('📦 Backing up Notifications...');
    backup.data.notifications = await prisma.notification.findMany();
    console.log(`   ✓ ${backup.data.notifications.length} notifications`);

    console.log('📦 Backing up LiveFeedItems...');
    backup.data.liveFeedItems = await prisma.liveFeedItem.findMany();
    console.log(`   ✓ ${backup.data.liveFeedItems.length} live feed items`);

    console.log('📦 Backing up Follows...');
    backup.data.follows = await prisma.follow.findMany();
    console.log(`   ✓ ${backup.data.follows.length} follows`);

    console.log('📦 Backing up Groups...');
    backup.data.groups = await prisma.group.findMany();
    console.log(`   ✓ ${backup.data.groups.length} groups`);

    console.log('📦 Backing up GroupStandings...');
    backup.data.groupStandings = await prisma.groupStanding.findMany();
    console.log(`   ✓ ${backup.data.groupStandings.length} group standings`);

    console.log('📦 Backing up OrgJoinRequests...');
    backup.data.orgJoinRequests = await prisma.orgJoinRequest.findMany();
    console.log(`   ✓ ${backup.data.orgJoinRequests.length} join requests`);

    console.log('📦 Backing up OrgInvitations...');
    backup.data.orgInvitations = await prisma.orgInvitation.findMany();
    console.log(`   ✓ ${backup.data.orgInvitations.length} invitations`);

    // Write backup to file
    console.log('\n💾 Writing backup to file...');
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

    const stats = fs.statSync(backupFile);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log('\n✅ Backup completed successfully!');
    console.log(`📁 File: ${backupFile}`);
    console.log(`📊 Size: ${fileSizeMB} MB`);
    console.log(`🕐 Timestamp: ${backup.timestamp}`);

    // Summary
    console.log('\n📊 Summary:');
    Object.keys(backup.data).forEach(table => {
      console.log(`   ${table}: ${backup.data[table].length} records`);
    });

    return backupFile;
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fullBackup()
  .then(file => {
    console.log(`\n✨ Backup saved to: ${file}`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed:', err);
    process.exit(1);
  });
