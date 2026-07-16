const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fillSummerChampionship() {
  try {
    console.log('🏆 Filling Summer Championship 2026 with test registrations...\n');

    // Find the tournament
    const tournament = await prisma.tournament.findFirst({
      where: {
        name: {
          contains: 'Summer Championship',
          mode: 'insensitive'
        }
      },
      include: {
        events: {
          include: {
            registrations: true
          }
        }
      }
    });

    if (!tournament) {
      console.log('❌ Summer Championship 2026 not found');
      return;
    }

    console.log(`Found tournament: ${tournament.name}`);
    console.log(`Tournament ID: ${tournament.id}\n`);

    // Get existing users
    const existingUsers = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        gender: true,
        email: true
      }
    });

    console.log(`📊 Existing users: ${existingUsers.length}\n`);

    // Separate by gender
    const maleUsers = existingUsers.filter(u => u.gender === 'Male');
    const femaleUsers = existingUsers.filter(u => u.gender === 'Female');

    console.log(`Male users: ${maleUsers.length}`);
    console.log(`Female users: ${femaleUsers.length}\n`);

    // Create additional test users if needed
    const totalNeeded = 40; // Enough for all events
    const maleNeeded = Math.max(0, 25 - maleUsers.length);
    const femaleNeeded = Math.max(0, 15 - femaleUsers.length);

    console.log(`Creating ${maleNeeded} male and ${femaleNeeded} female test users...\n`);

    // Use a dummy hash for test users (they won't actually log in)
    const hashedPassword = '$2a$10$dummyhashfortestusersonly';

    // Create male users
    for (let i = 0; i < maleNeeded; i++) {
      const user = await prisma.user.create({
        data: {
          firstName: `TestMale`,
          lastName: `${maleUsers.length + i + 1}`,
          email: `testmale${maleUsers.length + i + 1}@test.com`,
          passwordHash: hashedPassword,
          gender: 'Male',
          dob: new Date('1995-01-01'),
          onboardingComplete: true
        }
      });
      maleUsers.push(user);
      console.log(`  ✓ Created ${user.firstName} ${user.lastName}`);
    }

    // Create female users
    for (let i = 0; i < femaleNeeded; i++) {
      const user = await prisma.user.create({
        data: {
          firstName: `TestFemale`,
          lastName: `${femaleUsers.length + i + 1}`,
          email: `testfemale${femaleUsers.length + i + 1}@test.com`,
          passwordHash: hashedPassword,
          gender: 'Female',
          dob: new Date('1995-01-01'),
          onboardingComplete: true
        }
      });
      femaleUsers.push(user);
      console.log(`  ✓ Created ${user.firstName} ${user.lastName}`);
    }

    console.log('\n📝 Filling events with registrations...\n');

    // Process each event
    for (const event of tournament.events) {
      console.log(`\n🎯 Event: ${event.name} (${event.format})`);
      console.log(`   Max: ${event.maxParticipants || 'unlimited'}`);
      console.log(`   Current: ${event.registrations.length}`);

      if (!event.maxParticipants) {
        console.log('   ⚠️  Skipping (no max participants set)');
        continue;
      }

      const needed = event.maxParticipants - event.registrations.length;
      if (needed <= 0) {
        console.log('   ✓ Already full');
        continue;
      }

      // Get existing registration user IDs to avoid duplicates
      const existingUserIds = new Set(event.registrations.map(r => r.userId));

      if (event.format === 'SINGLES') {
        // For singles, determine gender requirement
        let availableUsers = [];
        if (event.name.toLowerCase().includes('men') && event.name.toLowerCase().includes('women')) {
          // If it says both, use all users
          availableUsers = [...existingUsers];
        } else if (event.name.toLowerCase().includes('men') || event.gender === 'Male') {
          availableUsers = [...maleUsers];
        } else if (event.name.toLowerCase().includes('women') || event.gender === 'Female') {
          availableUsers = [...femaleUsers];
        } else {
          // Default to all users if gender not specified
          availableUsers = [...existingUsers];
        }

        // Filter out already registered users
        availableUsers = availableUsers.filter(u => !existingUserIds.has(u.id));

        const toRegister = Math.min(needed, availableUsers.length);
        console.log(`   Registering ${toRegister} participants...`);

        for (let i = 0; i < toRegister; i++) {
          const user = availableUsers[i];
          await prisma.registration.create({
            data: {
              userId: user.id,
              eventId: event.id,
              status: 'CONFIRMED',
              createdAt: new Date()
            }
          });
          console.log(`     ✓ ${user.firstName} ${user.lastName}`);
        }

      } else if (event.format === 'DOUBLES') {
        // For doubles, need pairs of same gender
        let availableUsers = [];
        if (event.name.toLowerCase().includes('men') && event.name.toLowerCase().includes('women')) {
          availableUsers = [...existingUsers];
        } else if (event.name.toLowerCase().includes('men') || event.gender === 'Male') {
          availableUsers = [...maleUsers];
        } else if (event.name.toLowerCase().includes('women') || event.gender === 'Female') {
          availableUsers = [...femaleUsers];
        } else {
          availableUsers = [...existingUsers];
        }

        // Filter out already registered users
        availableUsers = availableUsers.filter(u => !existingUserIds.has(u.id));

        // Need pairs (2 users per team) - note that "needed" is number of TEAMS not users
        const teamsNeeded = needed;
        const usersNeeded = teamsNeeded * 2;
        const pairsCanMake = Math.floor(Math.min(usersNeeded, availableUsers.length) / 2);

        console.log(`   Registering ${pairsCanMake} teams (${pairsCanMake * 2} users)...`);

        for (let i = 0; i < pairsCanMake; i++) {
          const user1 = availableUsers[i * 2];
          const user2 = availableUsers[i * 2 + 1];

          await prisma.registration.create({
            data: {
              userId: user1.id,
              partnerId: user2.id,
              eventId: event.id,
              status: 'CONFIRMED',
              teamName: `Team ${user1.lastName}-${user2.lastName}`,
              createdAt: new Date()
            }
          });

          await prisma.registration.create({
            data: {
              userId: user2.id,
              partnerId: user1.id,
              eventId: event.id,
              status: 'CONFIRMED',
              teamName: `Team ${user1.lastName}-${user2.lastName}`,
              createdAt: new Date()
            }
          });

          console.log(`     ✓ Team: ${user1.firstName} ${user1.lastName} & ${user2.firstName} ${user2.lastName}`);
        }

      } else if (event.format === 'MIXED_DOUBLES') {
        // For mixed doubles, need male-female pairs
        const availableMales = maleUsers.filter(u => !existingUserIds.has(u.id));
        const availableFemales = femaleUsers.filter(u => !existingUserIds.has(u.id));

        const teamsNeeded = needed;
        const pairsCanMake = Math.min(teamsNeeded, availableMales.length, availableFemales.length);

        console.log(`   Registering ${pairsCanMake} mixed teams...`);

        for (let i = 0; i < pairsCanMake; i++) {
          const male = availableMales[i];
          const female = availableFemales[i];

          await prisma.registration.create({
            data: {
              userId: male.id,
              partnerId: female.id,
              eventId: event.id,
              status: 'CONFIRMED',
              teamName: `Team ${male.lastName}-${female.lastName}`,
              createdAt: new Date()
            }
          });

          await prisma.registration.create({
            data: {
              userId: female.id,
              partnerId: male.id,
              eventId: event.id,
              status: 'CONFIRMED',
              teamName: `Team ${male.lastName}-${female.lastName}`,
              createdAt: new Date()
            }
          });

          console.log(`     ✓ Team: ${male.firstName} ${male.lastName} & ${female.firstName} ${female.lastName}`);
        }
      }
    }

    console.log('\n\n✅ Summer Championship 2026 filled successfully!');
    console.log('\n📊 Final Summary:');

    // Get updated event stats
    const updatedTournament = await prisma.tournament.findUnique({
      where: { id: tournament.id },
      include: {
        events: {
          include: {
            _count: {
              select: {
                registrations: true
              }
            }
          }
        }
      }
    });

    updatedTournament.events.forEach(event => {
      const count = event._count.registrations;
      const max = event.maxParticipants || 'unlimited';
      const percentage = event.maxParticipants ? Math.round((count / event.maxParticipants) * 100) : 0;
      console.log(`  ${event.name}: ${count}/${max} (${percentage}%)`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fillSummerChampionship();
