const prisma = require('./src/lib/prisma');

async function testNotification() {
  console.log('=== TESTING STANDBY NOTIFICATION ===\n');

  // 1. Find an event with standby players
  console.log('Step 1: Looking for events with standby players...');
  const events = await prisma.event.findMany({
    include: {
      _count: {
        select: {
          registrations: {
            where: {
              isStandby: true,
              status: 'STANDBY',
              isWithdrawn: false
            }
          }
        }
      },
      tournament: {
        select: {
          name: true
        }
      }
    }
  });

  console.log(`Found ${events.length} total events`);

  const eventsWithStandby = events.filter(e => e._count.registrations > 0);
  console.log(`Found ${eventsWithStandby.length} events with standby players:\n`);

  eventsWithStandby.forEach(e => {
    console.log(`  - Event ID: ${e.id}, Name: ${e.name}, Standby count: ${e._count.registrations}, Tournament: ${e.tournament.name}`);
  });

  if (eventsWithStandby.length === 0) {
    console.log('\n❌ No events with standby players found!');
    console.log('\nTo test, you need to:');
    console.log('1. Register some players for an event');
    console.log('2. Make sure maxParticipants is set and reached');
    console.log('3. Register more players (they become standby)');
    return;
  }

  // 2. Get details of first event with standby
  const testEvent = eventsWithStandby[0];
  console.log(`\n=== Using Event: ${testEvent.name} (ID: ${testEvent.id}) ===\n`);

  console.log('Step 2: Fetching standby players...');
  const standbyPlayers = await prisma.registration.findMany({
    where: {
      eventId: testEvent.id,
      isStandby: true,
      status: 'STANDBY',
      isWithdrawn: false
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      }
    },
    orderBy: {
      standbyPosition: 'asc'
    }
  });

  console.log(`Found ${standbyPlayers.length} standby players:\n`);
  standbyPlayers.forEach(p => {
    console.log(`  #${p.standbyPosition}: ${p.user.firstName} ${p.user.lastName} (${p.user.email}) - User ID: ${p.user.id}`);
  });

  // 3. Check email configuration
  console.log('\n\nStep 3: Checking email configuration...');
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST || '❌ NOT SET');
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT || '❌ NOT SET');
  console.log('EMAIL_USER:', process.env.EMAIL_USER || '❌ NOT SET');
  console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ SET' : '❌ NOT SET');

  // 4. Check notification system
  console.log('\n\nStep 4: Checking notification database...');
  const recentNotifications = await prisma.notification.findMany({
    take: 5,
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      user: {
        select: {
          email: true
        }
      }
    }
  });

  console.log(`Recent notifications (last 5):\n`);
  if (recentNotifications.length === 0) {
    console.log('  No notifications found in database');
  } else {
    recentNotifications.forEach(n => {
      console.log(`  - ${n.type}: ${n.title} → ${n.user.email} (${n.createdAt.toISOString()})`);
    });
  }

  console.log('\n\n=== TEST SUMMARY ===');
  console.log(`✅ Found ${eventsWithStandby.length} event(s) with standby players`);
  console.log(`✅ Event "${testEvent.name}" has ${standbyPlayers.length} standby player(s)`);
  console.log(`Email configured: ${process.env.EMAIL_HOST ? '✅ YES' : '❌ NO'}`);
  console.log(`Notifications in DB: ${recentNotifications.length}`);

  console.log('\n\n=== HOW TO TEST ===');
  console.log(`\n1. Via API (with auth token):`);
  console.log(`   curl -X POST http://localhost:3001/api/events/${testEvent.id}/notify-standby \\`);
  console.log(`     -H "Authorization: Bearer YOUR_TOKEN"`);

  console.log(`\n2. Via UI:`);
  console.log(`   - Log in as tournament organizer`);
  console.log(`   - Go to Tournament Management → Registrations`);
  console.log(`   - Click "Notify Standby Players" button`);

  console.log(`\n3. Watch server console for:`);
  console.log(`   === NOTIFY STANDBY PLAYERS CONTROLLER ===`);
  console.log(`   Found X standby players`);
  console.log(`   📬 Creating notification for user...`);
  console.log(`   📧 Generating standby email...`);

  console.log(`\n4. Check as standby player (${standbyPlayers[0]?.user.email}):`);
  console.log(`   - Log in to app`);
  console.log(`   - Click bell icon 🔔`);
  console.log(`   - Should see: "🎾 Spot Available!"`);

  await prisma.$disconnect();
}

testNotification().catch(console.error);
