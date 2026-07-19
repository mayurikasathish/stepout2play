const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function withdrawTestMale6() {
  try {
    console.log('🔍 Finding testmale6@test.com...');

    // Find the user
    const user = await prisma.user.findUnique({
      where: {
        email: 'testmale6@test.com'
      }
    });

    if (!user) {
      console.log('❌ testmale6@test.com not found');
      return;
    }

    console.log(`✅ Found user: ${user.firstName} ${user.lastName} (${user.id})`);

    // Find Women's Singles Mania event
    console.log('\n🔍 Finding Women\'s Singles Mania event...');

    const event = await prisma.event.findFirst({
      where: {
        name: {
          contains: 'Women',
          mode: 'insensitive'
        }
      },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            organizationId: true
          }
        }
      }
    });

    if (!event) {
      console.log('❌ Women\'s Singles event not found');
      return;
    }

    console.log(`✅ Found event: ${event.name} in ${event.tournament.name}`);

    // Find the registration
    const registration = await prisma.registration.findFirst({
      where: {
        userId: user.id,
        eventId: event.id,
        isWithdrawn: false
      }
    });

    if (!registration) {
      console.log('❌ Active registration not found for this user in this event');
      return;
    }

    console.log(`\n📋 Found registration:`);
    console.log(`   ID: ${registration.id}`);
    console.log(`   Status: ${registration.status}`);
    console.log(`   Is Standby: ${registration.isStandby}`);

    // Mark as withdrawn
    console.log('\n🚪 Withdrawing player...');
    await prisma.registration.update({
      where: {
        id: registration.id
      },
      data: {
        isWithdrawn: true,
        withdrawnAt: new Date(),
        status: 'WITHDRAWN'
      }
    });

    console.log('✅ Player withdrawn successfully!');

    // Find organizers to notify
    console.log('\n👥 Finding organizers...');
    const orgMembers = await prisma.orgMember.findMany({
      where: {
        orgId: event.tournament.organizationId,
        role: {
          in: ['OWNER', 'ADMIN']
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    console.log(`✅ Found ${orgMembers.length} organizer(s)`);

    // Create notifications for organizers
    console.log('\n📬 Creating notifications for organizers...');
    for (const member of orgMembers) {
      await prisma.notification.create({
        data: {
          userId: member.userId,
          type: 'WITHDRAWAL',
          title: 'Player Withdrawn',
          message: `${user.firstName} ${user.lastName} has withdrawn from ${event.name}`,
          data: {
            eventId: event.id,
            tournamentId: event.tournament.id,
            userId: user.id
          },
          actionUrl: `/tournaments/${event.tournament.id}/manage`,
          actionText: 'View Event',
          priority: 'MEDIUM'
        }
      });
      console.log(`   ✅ Notified: ${member.user.firstName} ${member.user.lastName}`);
    }

    // Check if there are standby players
    console.log('\n🔍 Checking for standby players...');
    const standbyPlayers = await prisma.registration.findMany({
      where: {
        eventId: event.id,
        status: 'STANDBY',
        isWithdrawn: false
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        standbyPosition: 'asc'
      }
    });

    console.log(`✅ Found ${standbyPlayers.length} player(s) on standby`);

    if (standbyPlayers.length > 0) {
      const nextPlayer = standbyPlayers[0];
      console.log(`\n🎯 Next in line: ${nextPlayer.user.firstName} ${nextPlayer.user.lastName} (Position ${nextPlayer.standbyPosition})`);

      // Notify the standby player
      console.log('📬 Creating notification for standby player...');
      await prisma.notification.create({
        data: {
          userId: nextPlayer.userId,
          type: 'SPOT_AVAILABLE',
          title: 'Spot Available!',
          message: `A spot has opened up in ${event.name}. Accept the spot to secure your place!`,
          data: {
            eventId: event.id,
            tournamentId: event.tournament.id,
            registrationId: nextPlayer.id
          },
          actionUrl: `/events/${event.id}/accept-spot`,
          actionText: 'Accept Spot',
          priority: 'HIGH'
        }
      });
      console.log(`   ✅ Notified: ${nextPlayer.user.firstName} ${nextPlayer.user.lastName}`);
    } else {
      console.log('\n⚠️  No standby players to notify');
    }

    console.log('\n✅ All done! Withdrawal complete and notifications sent.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

withdrawTestMale6();
