#!/usr/bin/env node
/**
 * Test script for Doubles/Mixed Doubles registration
 * Run with: node test-doubles.js
 */

const prisma = require('./src/lib/prisma');
const bcrypt = require('bcrypt');

async function createTestUsers() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║      DOUBLES REGISTRATION TEST SETUP                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    await prisma.$connect();
    console.log('✅ Database connected\n');

    // Create Male User 1
    const passwordHash = await bcrypt.hash('Test123!@#', 10);

    const maleUser1 = await prisma.user.upsert({
      where: { email: 'male1@test.com' },
      update: {},
      create: {
        email: 'male1@test.com',
        passwordHash,
        firstName: 'John',
        lastName: 'Doe',
        gender: 'Male',
        dob: new Date('1995-01-15'),
        onboardingComplete: true,
        primaryRole: 'PLAYER',
        sports: ['Badminton']
      }
    });
    console.log('✅ Created Male User 1:', maleUser1.email);

    // Create Female User 1
    const femaleUser1 = await prisma.user.upsert({
      where: { email: 'female1@test.com' },
      update: {},
      create: {
        email: 'female1@test.com',
        passwordHash,
        firstName: 'Jane',
        lastName: 'Smith',
        gender: 'Female',
        dob: new Date('1998-03-20'),
        onboardingComplete: true,
        primaryRole: 'PLAYER',
        sports: ['Badminton']
      }
    });
    console.log('✅ Created Female User 1:', femaleUser1.email);

    // Create Male User 2
    const maleUser2 = await prisma.user.upsert({
      where: { email: 'male2@test.com' },
      update: {},
      create: {
        email: 'male2@test.com',
        passwordHash,
        firstName: 'Mike',
        lastName: 'Johnson',
        gender: 'Male',
        dob: new Date('2010-06-10'), // Too young for Open
        onboardingComplete: true,
        primaryRole: 'PLAYER',
        sports: ['Badminton']
      }
    });
    console.log('✅ Created Male User 2 (Age Issue):', maleUser2.email);

    // Create Female User 2
    const femaleUser2 = await prisma.user.upsert({
      where: { email: 'female2@test.com' },
      update: {},
      create: {
        email: 'female2@test.com',
        passwordHash,
        firstName: 'Sarah',
        lastName: 'Williams',
        gender: 'Female',
        dob: new Date('1992-09-05'),
        onboardingComplete: true,
        primaryRole: 'PLAYER',
        sports: ['Badminton']
      }
    });
    console.log('✅ Created Female User 2:', femaleUser2.email);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('TEST USERS SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('1. male1@test.com / Test123!@#');
    console.log('   - Name: John Doe');
    console.log('   - Gender: Male');
    console.log('   - Age: ~31 years');
    console.log('   - Use for: Mixed Doubles with female1@test.com\n');

    console.log('2. female1@test.com / Test123!@#');
    console.log('   - Name: Jane Smith');
    console.log('   - Gender: Female');
    console.log('   - Age: ~28 years');
    console.log('   - Use for: Mixed Doubles with male1@test.com\n');

    console.log('3. male2@test.com / Test123!@#');
    console.log('   - Name: Mike Johnson');
    console.log('   - Gender: Male');
    console.log('   - Age: ~16 years (too young for Open)');
    console.log('   - Use for: Testing age restrictions\n');

    console.log('4. female2@test.com / Test123!@#');
    console.log('   - Name: Sarah Williams');
    console.log('   - Gender: Female');
    console.log('   - Age: ~34 years');
    console.log('   - Use for: Women\'s Doubles\n');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('TEST SCENARIOS');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('✓ Mixed Doubles (Success):');
    console.log('  Login as: male1@test.com');
    console.log('  Partner: female1@test.com');
    console.log('  Expected: Both eligible ✅\n');

    console.log('✗ Mixed Doubles (Gender Mismatch):');
    console.log('  Login as: male1@test.com');
    console.log('  Partner: male2@test.com');
    console.log('  Expected: Not eligible - same gender ❌\n');

    console.log('✗ Mixed Doubles (Age Issue):');
    console.log('  Login as: female1@test.com');
    console.log('  Partner: male2@test.com (16 years old)');
    console.log('  Expected: May be eligible if event allows U19 ⚠️\n');

    console.log('✓ Women\'s Doubles (Success):');
    console.log('  Login as: female1@test.com');
    console.log('  Partner: female2@test.com');
    console.log('  Expected: Both eligible ✅\n');

    console.log('✗ Women\'s Doubles (Gender Mismatch):');
    console.log('  Login as: female1@test.com');
    console.log('  Partner: male1@test.com');
    console.log('  Expected: Not eligible - wrong gender ❌\n');

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('✅ Test setup complete!\n');
    console.log('Next steps:');
    console.log('1. Start the backend: npm start');
    console.log('2. Start the frontend: cd client && npm run dev');
    console.log('3. Login with one of the test accounts');
    console.log('4. Navigate to a tournament with Doubles/Mixed Doubles events');
    console.log('5. Try registering with different partners\n');

    await prisma.$disconnect();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createTestUsers();
