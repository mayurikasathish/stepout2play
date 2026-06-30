/**
 * Backfill Player IDs Script
 * Run this once to assign player IDs to all existing registrations
 *
 * Usage: node scripts/backfill-player-ids.js
 */

const { backfillAllPlayerIds } = require('../src/utils/playerIdGenerator');

async function main() {
  try {
    await backfillAllPlayerIds();
    console.log('\n🎉 Success! All player IDs have been assigned.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during backfill:', error);
    process.exit(1);
  }
}

main();
