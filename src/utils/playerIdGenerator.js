/**
 * Player ID Generator Utility
 * Generates unique player IDs for tournament registrations
 * Format: P001, P002, P003, etc.
 */

const prisma = require('../lib/prisma');

/**
 * Generate player ID in format P001, P002, etc.
 * @param {number} number - The sequential number
 * @returns {string} - Formatted player ID
 */
function formatPlayerId(number) {
  return `P${number.toString().padStart(3, '0')}`;
}

/**
 * Get the next available player ID for an event
 * @param {string} eventId - Event UUID
 * @returns {Promise<string>} - Next available player ID
 */
async function getNextPlayerId(eventId) {
  // Get all registrations for this event with player IDs
  const registrations = await prisma.registration.findMany({
    where: { eventId, playerId: { not: null } },
    select: { playerId: true },
    orderBy: { playerId: 'desc' }
  });

  if (registrations.length === 0) {
    return 'P001';
  }

  // Extract the highest number
  const lastPlayerId = registrations[0].playerId;
  const lastNumber = parseInt(lastPlayerId.substring(1));

  return formatPlayerId(lastNumber + 1);
}

/**
 * Assign player IDs to all registrations in an event that don't have one
 * @param {string} eventId - Event UUID
 * @returns {Promise<number>} - Number of registrations updated
 */
async function assignPlayerIdsForEvent(eventId) {
  // Get all registrations without player IDs
  const registrations = await prisma.registration.findMany({
    where: {
      eventId,
      playerId: null
    },
    orderBy: [
      { seedNumber: 'asc' },  // Seeded players first
      { createdAt: 'asc' }    // Then by registration time
    ]
  });

  let count = 0;
  for (const registration of registrations) {
    const playerId = await getNextPlayerId(eventId);

    await prisma.registration.update({
      where: { id: registration.id },
      data: { playerId }
    });

    count++;
    console.log(`Assigned ${playerId} to registration ${registration.id}`);
  }

  return count;
}

/**
 * Backfill player IDs for ALL events in the system
 * Run this once to assign IDs to existing registrations
 */
async function backfillAllPlayerIds() {
  console.log('🔄 Starting player ID backfill...');

  // Get all events
  const events = await prisma.event.findMany({
    select: { id: true, name: true }
  });

  let totalUpdated = 0;

  for (const event of events) {
    console.log(`\n📋 Processing event: ${event.name} (${event.id})`);
    const count = await assignPlayerIdsForEvent(event.id);
    totalUpdated += count;
    console.log(`✅ Assigned ${count} player IDs for ${event.name}`);
  }

  console.log(`\n✨ Backfill complete! Total registrations updated: ${totalUpdated}`);
  return totalUpdated;
}

module.exports = {
  formatPlayerId,
  getNextPlayerId,
  assignPlayerIdsForEvent,
  backfillAllPlayerIds
};
