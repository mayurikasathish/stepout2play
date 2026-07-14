const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateBengaluruTournaments() {
  try {
    console.log('Updating Bengaluru tournaments with coordinates and valid dates...');

    // Bengaluru coordinates (city center - MG Road area)
    const bengaluruLat = 12.9716;
    const bengaluruLng = 77.5946;

    // Get all tournaments in Bengaluru
    const bengaluruTournaments = await prisma.tournament.findMany({
      where: {
        city: 'Bengaluru'
      }
    });

    console.log(`Found ${bengaluruTournaments.length} tournaments in Bengaluru`);

    for (const tournament of bengaluruTournaments) {
      console.log(`\nUpdating: ${tournament.name}`);
      console.log(`  Current registration deadline: ${tournament.registrationDeadline}`);
      console.log(`  Current start date: ${tournament.startDate}`);
      console.log(`  Current lat/lng: ${tournament.latitude} / ${tournament.longitude}`);

      // Calculate new dates relative to today (July 14, 2026)
      const today = new Date();
      const newRegDeadline = new Date(today);
      newRegDeadline.setDate(today.getDate() + 7); // 7 days from now

      const newStartDate = new Date(newRegDeadline);
      newStartDate.setDate(newRegDeadline.getDate() + 3); // 3 days after registration deadline

      const newEndDate = new Date(newStartDate);
      newEndDate.setDate(newStartDate.getDate() + 7); // 7 days tournament duration

      await prisma.tournament.update({
        where: { id: tournament.id },
        data: {
          latitude: bengaluruLat,
          longitude: bengaluruLng,
          registrationDeadline: newRegDeadline,
          startDate: newStartDate,
          endDate: newEndDate
        }
      });

      console.log(`  ✓ Updated with:`);
      console.log(`    - Coordinates: ${bengaluruLat}, ${bengaluruLng}`);
      console.log(`    - Registration deadline: ${newRegDeadline.toISOString()}`);
      console.log(`    - Start date: ${newStartDate.toISOString()}`);
      console.log(`    - End date: ${newEndDate.toISOString()}`);
    }

    console.log('\n✓ All Bengaluru tournaments updated successfully!');
  } catch (error) {
    console.error('Error updating tournaments:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateBengaluruTournaments();
