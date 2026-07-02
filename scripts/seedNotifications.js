const prisma = require('../src/lib/prisma');

async function seedNotifications() {
  try {
    console.log('🌱 Seeding notifications and live feed...');

    // Get a user to send notifications to
    const users = await prisma.user.findMany({ take: 2 });

    if (users.length === 0) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }

    const user1 = users[0];
    const user2 = users.length > 1 ? users[1] : users[0];

    console.log(`📧 Creating notifications for ${user1.firstName} ${user1.lastName}...`);

    // Create sample notifications
    const notifications = [
      {
        userId: user1.id,
        type: 'ORG_INVITE',
        title: 'Organization Invitation',
        message: `${user2.firstName} ${user2.lastName} invited you to join Mumbai Sports Club`,
        data: { orgId: 'sample-org-id', role: 'MEMBER' },
        actionUrl: '/manage',
        actionText: 'View Invitation',
        icon: 'user-group',
        priority: 'HIGH',
        read: false
      },
      {
        userId: user1.id,
        type: 'MATCH_SOON',
        title: 'Match Starting Soon',
        message: 'Your match in Men\'s Singles starts at 3:00 PM today',
        data: { eventName: 'Men\'s Singles', matchTime: '3:00 PM' },
        actionUrl: '/matches',
        actionText: 'View Schedule',
        icon: 'clock',
        priority: 'HIGH',
        read: false
      },
      {
        userId: user1.id,
        type: 'STANDBY_PROMOTED',
        title: 'Promoted from Standby!',
        message: 'You\'ve been promoted from standby for Mixed Doubles Championship',
        data: { eventName: 'Mixed Doubles' },
        actionUrl: '/matches',
        actionText: 'View Event',
        icon: 'trophy',
        priority: 'HIGH',
        read: false
      },
      {
        userId: user1.id,
        type: 'REG_DEADLINE_SOON',
        title: 'Registration Closing Soon',
        message: 'Registration for Summer Championship closes tomorrow at 5 PM',
        data: { tournamentName: 'Summer Championship', deadline: 'Tomorrow 5 PM' },
        actionUrl: '/browse',
        actionText: 'Register Now',
        icon: 'clock',
        priority: 'MEDIUM',
        read: false
      },
      {
        userId: user1.id,
        type: 'BRACKET_READY',
        title: 'Bracket Published',
        message: 'The bracket for Winter Open 2026 is now available',
        data: { tournamentName: 'Winter Open 2026' },
        actionUrl: '/browse',
        actionText: 'View Bracket',
        icon: 'trophy',
        priority: 'MEDIUM',
        read: true
      },
      {
        userId: user1.id,
        type: 'MATCH_RESULT',
        title: 'Match Result Updated',
        message: 'Your match result has been recorded: You won 21-15, 21-18',
        data: { score: '21-15, 21-18', result: 'won' },
        actionUrl: '/matches',
        actionText: 'View Details',
        icon: 'trophy',
        priority: 'LOW',
        read: true
      }
    ];

    for (const notif of notifications) {
      await prisma.notification.create({ data: notif });
      console.log(`  ✅ Created: ${notif.title}`);
    }

    console.log('\n📰 Creating live feed items...');

    // Create sample live feed items
    const feedItems = [
      {
        actorId: user2.id,
        type: 'TOURNAMENT_CREATED',
        title: 'New Tournament',
        message: `created a new tournament: Mumbai Open 2026 in Mumbai`,
        targetId: 'sample-tournament-1',
        targetType: 'tournament',
        visibility: 'public'
      },
      {
        actorId: user1.id,
        type: 'PLAYER_REGISTERED',
        title: 'New Registration',
        message: 'registered for Men\'s Singles Championship',
        targetId: 'sample-tournament-2',
        targetType: 'tournament',
        visibility: 'public'
      },
      {
        actorId: user2.id,
        type: 'MATCH_WON',
        title: 'Match Won',
        message: 'won a match in Doubles Championship (21-15, 21-12)',
        targetId: 'sample-tournament-3',
        targetType: 'tournament',
        visibility: 'public'
      },
      {
        actorId: user1.id,
        type: 'PLAYER_REGISTERED',
        title: 'New Registration',
        message: 'registered for Mixed Doubles Open',
        targetId: 'sample-tournament-4',
        targetType: 'tournament',
        visibility: 'public'
      },
      {
        actorId: user2.id,
        type: 'TOURNAMENT_CREATED',
        title: 'New Tournament',
        message: 'created a new tournament: Badminton League in Pune',
        targetId: 'sample-tournament-5',
        targetType: 'tournament',
        visibility: 'public'
      }
    ];

    for (const item of feedItems) {
      await prisma.liveFeedItem.create({ data: item });
      console.log(`  ✅ Created: ${item.message}`);
    }

    console.log('\n✨ Seeding complete!');
    console.log(`\n📊 Summary:`);
    console.log(`   - ${notifications.length} notifications created`);
    console.log(`   - ${feedItems.length} live feed items created`);
    console.log(`   - User: ${user1.firstName} ${user1.lastName} (${user1.email})`);
    console.log(`\n🎯 Now go to the dashboard to see them!`);

  } catch (error) {
    console.error('❌ Error seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedNotifications();
