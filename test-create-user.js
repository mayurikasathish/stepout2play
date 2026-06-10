const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestUser() {
  const email = 'test@example.com';
  const password = 'Test@1234';

  // Hash the password
  const passwordHash = await bcrypt.hash(password, 10);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (existingUser) {
    console.log('User already exists!');
    console.log('Email:', email);
    console.log('Password:', password);
    return;
  }

  // Create user
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      firstName: 'Test',
      lastName: 'User',
    }
  });

  console.log('Test user created successfully!');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('User ID:', user.id);
}

createTestUser()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
