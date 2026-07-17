const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateDoublesRatings() {
  try {
    console.log('🔄 Migrating player ratings to add category field...\n');

    // Step 1: Add category column with default value (done via SQL)
    console.log('Step 1: Adding category column...');
    await prisma.$executeRaw`ALTER TABLE player_ratings ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'SINGLES'`;
    console.log('✅ Category column added\n');

    // Step 2: Add category to match_rating_changes
    console.log('Step 2: Adding category to match_rating_changes...');
    await prisma.$executeRaw`ALTER TABLE match_rating_changes ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'SINGLES'`;
    console.log('✅ Category column added to match_rating_changes\n');

    // Step 3: Update all existing ratings to SINGLES
    console.log('Step 3: Setting all existing ratings to SINGLES...');
    const updateResult = await prisma.$executeRaw`UPDATE player_ratings SET category = 'SINGLES' WHERE category IS NULL OR category = ''`;
    console.log(`✅ Updated ${updateResult} ratings\n`);

    // Step 4: Drop old unique constraint
    console.log('Step 4: Dropping old unique constraint...');
    await prisma.$executeRaw`ALTER TABLE player_ratings DROP CONSTRAINT IF EXISTS player_ratings_userId_sportId_key`;
    console.log('✅ Old constraint dropped\n');

    // Step 5: Create new unique constraint
    console.log('Step 5: Creating new unique constraint...');
    await prisma.$executeRaw`ALTER TABLE player_ratings ADD CONSTRAINT player_ratings_userId_sportId_category_key UNIQUE ("userId", "sportId", category)`;
    console.log('✅ New constraint created\n');

    // Step 6: Add index on category
    console.log('Step 6: Adding index on category...');
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS player_ratings_category_idx ON player_ratings(category)`;
    console.log('✅ Index created\n');

    console.log('✅ Migration complete!');
    console.log('\nNext steps:');
    console.log('1. Run: npx prisma generate');
    console.log('2. Restart backend server');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateDoublesRatings();
