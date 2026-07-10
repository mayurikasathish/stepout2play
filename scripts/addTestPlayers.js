const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Realistic player names
const maleNames = [
  { firstName: 'Arjun', lastName: 'Sharma' },
  { firstName: 'Rahul', lastName: 'Patel' },
  { firstName: 'Vikram', lastName: 'Singh' },
  { firstName: 'Aditya', lastName: 'Kumar' },
  { firstName: 'Rohan', lastName: 'Mehta' },
  { firstName: 'Karan', lastName: 'Reddy' },
  { firstName: 'Siddharth', lastName: 'Gupta' },
  { firstName: 'Nikhil', lastName: 'Verma' },
  { firstName: 'Aarav', lastName: 'Joshi' },
  { firstName: 'Dev', lastName: 'Kapoor' },
  { firstName: 'Ishaan', lastName: 'Nair' },
  { firstName: 'Veer', lastName: 'Shah' },
  { firstName: 'Arnav', lastName: 'Desai' },
  { firstName: 'Ayaan', lastName: 'Rao' },
  { firstName: 'Reyansh', lastName: 'Iyer' },
];

const femaleNames = [
  { firstName: 'Priya', lastName: 'Sharma' },
  { firstName: 'Ananya', lastName: 'Patel' },
  { firstName: 'Diya', lastName: 'Singh' },
  { firstName: 'Isha', lastName: 'Kumar' },
  { firstName: 'Aanya', lastName: 'Mehta' },
  { firstName: 'Navya', lastName: 'Reddy' },
  { firstName: 'Saanvi', lastName: 'Gupta' },
  { firstName: 'Kiara', lastName: 'Verma' },
  { firstName: 'Myra', lastName: 'Joshi' },
  { firstName: 'Aadhya', lastName: 'Kapoor' },
  { firstName: 'Riya', lastName: 'Nair' },
  { firstName: 'Kavya', lastName: 'Shah' },
  { firstName: 'Tara', lastName: 'Desai' },
  { firstName: 'Siya', lastName: 'Rao' },
  { firstName: 'Zara', lastName: 'Iyer' },
];

const teamNames = [
  'Thunder Smash',
  'Ace Warriors',
  'Net Ninjas',
  'Power Duo',
  'Shuttle Masters',
  'Victory Vibes',
  'Smash Bros',
  'Dynamic Duo',
  'Court Kings',
  'Rally Rangers',
  'Spin Doctors',
  'Drop Shot Pros',
  'Game Changers',
  'Match Point',
  'Final Strike'
];

async function main() {
  console.log('🔍 Finding events...');

  // Find the events
  const badmintonSingles = await prisma.event.findFirst({
    where: {
      name: { contains: 'Badminton', mode: 'insensitive' },
      format: 'SINGLES',
      gender: 'Men'
    },
    include: { tournament: true }
  });

  const tennisSingles = await prisma.event.findFirst({
    where: {
      name: { contains: 'Tennis', mode: 'insensitive' },
      format: 'SINGLES',
      gender: 'Men'
    },
    include: { tournament: true }
  });

  const badmintonMixed = await prisma.event.findFirst({
    where: {
      name: { contains: 'Badminton', mode: 'insensitive' },
      format: 'MIXED_DOUBLES'
    },
    include: { tournament: true }
  });

  if (!badmintonSingles) {
    console.log('❌ Men\'s Singles Badminton Mania event not found');
  } else {
    console.log(`✅ Found: ${badmintonSingles.name} (${badmintonSingles.id})`);
  }

  if (!tennisSingles) {
    console.log('❌ Men\'s Singles Tennis Mania event not found');
  } else {
    console.log(`✅ Found: ${tennisSingles.name} (${tennisSingles.id})`);
  }

  if (!badmintonMixed) {
    console.log('❌ Mixed Doubles Badminton Mania event not found');
  } else {
    console.log(`✅ Found: ${badmintonMixed.name} (${badmintonMixed.id})`);
  }

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Add 15 players to Badminton Singles
  if (badmintonSingles) {
    console.log('\n📝 Adding 15 players to Men\'s Singles Badminton Mania...');

    for (let i = 0; i < 15; i++) {
      const name = maleNames[i];
      const email = `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}.badminton@test.com`;

      try {
        // Create user
        const user = await prisma.user.create({
          data: {
            email,
            passwordHash: hashedPassword,
            firstName: name.firstName,
            lastName: name.lastName,
            dob: new Date(1995 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
            gender: 'Male',
            phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`
          }
        });

        // Get player ID
        const { getNextPlayerId } = require('../src/utils/playerIdGenerator');
        const playerId = await getNextPlayerId(badmintonSingles.id);

        // Register for event
        await prisma.registration.create({
          data: {
            userId: user.id,
            eventId: badmintonSingles.id,
            playerId,
            status: 'CONFIRMED',
            registrationOrder: i + 1
          }
        });

        console.log(`  ✓ ${name.firstName} ${name.lastName} (${playerId})`);
      } catch (error) {
        console.log(`  ✗ ${name.firstName} ${name.lastName}: ${error.message}`);
      }
    }
  }

  // Add 15 players to Tennis Singles
  if (tennisSingles) {
    console.log('\n📝 Adding 15 players to Men\'s Singles Tennis Mania...');

    for (let i = 0; i < 15; i++) {
      const name = maleNames[i];
      const email = `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}.tennis@test.com`;

      try {
        // Create user
        const user = await prisma.user.create({
          data: {
            email,
            passwordHash: hashedPassword,
            firstName: name.firstName,
            lastName: name.lastName,
            dob: new Date(1995 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
            gender: 'Male',
            phone: `97${Math.floor(10000000 + Math.random() * 90000000)}`
          }
        });

        // Get player ID
        const { getNextPlayerId } = require('../src/utils/playerIdGenerator');
        const playerId = await getNextPlayerId(tennisSingles.id);

        // Register for event
        await prisma.registration.create({
          data: {
            userId: user.id,
            eventId: tennisSingles.id,
            playerId,
            status: 'CONFIRMED',
            registrationOrder: i + 1
          }
        });

        console.log(`  ✓ ${name.firstName} ${name.lastName} (${playerId})`);
      } catch (error) {
        console.log(`  ✗ ${name.firstName} ${name.lastName}: ${error.message}`);
      }
    }
  }

  // Add 15 teams to Mixed Doubles Badminton
  if (badmintonMixed) {
    console.log('\n📝 Adding 15 teams to Mixed Doubles Badminton Mania...');

    for (let i = 0; i < 15; i++) {
      const maleName = maleNames[i];
      const femaleName = femaleNames[i];
      const teamName = teamNames[i];
      const maleEmail = `${maleName.firstName.toLowerCase()}.${maleName.lastName.toLowerCase()}.mixed@test.com`;
      const femaleEmail = `${femaleName.firstName.toLowerCase()}.${femaleName.lastName.toLowerCase()}.mixed@test.com`;

      try {
        // Create male player
        const maleUser = await prisma.user.create({
          data: {
            email: maleEmail,
            passwordHash: hashedPassword,
            firstName: maleName.firstName,
            lastName: maleName.lastName,
            dob: new Date(1995 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
            gender: 'Male',
            phone: `96${Math.floor(10000000 + Math.random() * 90000000)}`
          }
        });

        // Create female player
        const femaleUser = await prisma.user.create({
          data: {
            email: femaleEmail,
            passwordHash: hashedPassword,
            firstName: femaleName.firstName,
            lastName: femaleName.lastName,
            dob: new Date(1995 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
            gender: 'Female',
            phone: `95${Math.floor(10000000 + Math.random() * 90000000)}`
          }
        });

        // Get player ID
        const { getNextPlayerId } = require('../src/utils/playerIdGenerator');
        const playerId = await getNextPlayerId(badmintonMixed.id);

        // Register team (register male user with female as partner)
        await prisma.registration.create({
          data: {
            userId: maleUser.id,
            eventId: badmintonMixed.id,
            partnerId: femaleUser.id,
            teamName: teamName,
            playerId,
            status: 'CONFIRMED',
            registrationOrder: i + 1
          }
        });

        console.log(`  ✓ ${teamName}: ${maleName.firstName} ${maleName.lastName} & ${femaleName.firstName} ${femaleName.lastName} (${playerId})`);
      } catch (error) {
        console.log(`  ✗ ${teamName}: ${error.message}`);
      }
    }
  }

  console.log('\n✅ Done!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
