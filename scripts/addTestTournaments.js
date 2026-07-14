const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addTestTournaments() {
  try {
    console.log('Adding test tournaments with valid dates and coordinates...');

    // City coordinates
    const cities = {
      'Bengaluru': { lat: 12.9716, lng: 77.5946 },
      'Mumbai': { lat: 19.0760, lng: 72.8777 },
      'Delhi': { lat: 28.6139, lng: 77.2090 },
      'Hyderabad': { lat: 17.3850, lng: 78.4867 }
    };

    // Update existing Mumbai tournament
    const mumbaiTournament = await prisma.tournament.findFirst({
      where: { city: 'Mumbai' }
    });

    if (mumbaiTournament) {
      const today = new Date();
      const newRegDeadline = new Date(today);
      newRegDeadline.setDate(today.getDate() + 10);

      const newStartDate = new Date(newRegDeadline);
      newStartDate.setDate(newRegDeadline.getDate() + 2);

      const newEndDate = new Date(newStartDate);
      newEndDate.setDate(newStartDate.getDate() + 5);

      await prisma.tournament.update({
        where: { id: mumbaiTournament.id },
        data: {
          latitude: cities.Mumbai.lat,
          longitude: cities.Mumbai.lng,
          registrationDeadline: newRegDeadline,
          startDate: newStartDate,
          endDate: newEndDate
        }
      });

      console.log(`✓ Updated Mumbai tournament: ${mumbaiTournament.name}`);
    }

    // Get an organization to use for new tournaments
    const org = await prisma.organization.findFirst();

    if (!org) {
      console.log('No organization found. Please create an organization first.');
      return;
    }

    console.log(`Using organization: ${org.name}`);

    // Add more test tournaments in Bengaluru
    const today = new Date();

    const newTournaments = [
      {
        name: 'Bengaluru Open Championships',
        city: 'Bengaluru',
        venueName: 'Kanteerava Indoor Stadium',
        sport: 'badminton',
        sportType: 'single',
        sports: ['badminton'],
        daysUntilReg: 5,
        duration: 3
      },
      {
        name: 'City League Tournament',
        city: 'Bengaluru',
        venueName: 'Malleswaram Sports Complex',
        sport: 'tennis',
        sportType: 'single',
        sports: ['tennis'],
        daysUntilReg: 12,
        duration: 4
      },
      {
        name: 'Weekend Badminton Cup',
        city: 'Bengaluru',
        venueName: 'KSLTA Courts',
        sport: 'badminton',
        sportType: 'single',
        sports: ['badminton'],
        daysUntilReg: 3,
        duration: 2
      }
    ];

    for (const tournamentData of newTournaments) {
      const regDeadline = new Date(today);
      regDeadline.setDate(today.getDate() + tournamentData.daysUntilReg);

      const startDate = new Date(regDeadline);
      startDate.setDate(regDeadline.getDate() + 2);

      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + tournamentData.duration);

      const cityCoords = cities[tournamentData.city];

      // Check if tournament already exists
      const existing = await prisma.tournament.findFirst({
        where: { name: tournamentData.name }
      });

      if (existing) {
        console.log(`⊘ Tournament "${tournamentData.name}" already exists, skipping`);
        continue;
      }

      const tournament = await prisma.tournament.create({
        data: {
          organizationId: org.id,
          name: tournamentData.name,
          sport: tournamentData.sport,
          sportType: tournamentData.sportType,
          sports: tournamentData.sports,
          city: tournamentData.city,
          venueName: tournamentData.venueName,
          latitude: cityCoords.lat,
          longitude: cityCoords.lng,
          registrationDeadline: regDeadline,
          startDate: startDate,
          endDate: endDate,
          status: 'OPEN',
          format: 'KNOCKOUT'
        }
      });

      console.log(`✓ Created: ${tournament.name}`);
      console.log(`  City: ${tournament.city}`);
      console.log(`  Registration deadline: ${tournament.registrationDeadline}`);
      console.log(`  Coordinates: ${tournament.latitude}, ${tournament.longitude}`);
      console.log('');
    }

    console.log('✓ All test tournaments added successfully!');
  } catch (error) {
    console.error('Error adding tournaments:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addTestTournaments();
