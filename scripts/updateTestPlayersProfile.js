const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Indian cities with coordinates
const cities = [
  { city: 'Mumbai', state: 'Maharashtra', latitude: 19.0760, longitude: 72.8777 },
  { city: 'Bengaluru', state: 'Karnataka', latitude: 12.9716, longitude: 77.5946 },
  { city: 'Delhi', state: 'Delhi', latitude: 28.7041, longitude: 77.1025 },
  { city: 'Hyderabad', state: 'Telangana', latitude: 17.3850, longitude: 78.4867 },
  { city: 'Chennai', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707 },
  { city: 'Kolkata', state: 'West Bengal', latitude: 22.5726, longitude: 88.3639 },
  { city: 'Pune', state: 'Maharashtra', latitude: 18.5204, longitude: 73.8567 },
  { city: 'Ahmedabad', state: 'Gujarat', latitude: 23.0225, longitude: 72.5714 },
  { city: 'Jaipur', state: 'Rajasthan', latitude: 26.9124, longitude: 75.7873 },
  { city: 'Lucknow', state: 'Uttar Pradesh', latitude: 26.8467, longitude: 80.9462 }
];

const localities = {
  'Mumbai': ['Andheri', 'Bandra', 'Juhu', 'Powai', 'Worli'],
  'Bengaluru': ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'Jayanagar'],
  'Delhi': ['Connaught Place', 'Dwarka', 'Rohini', 'Saket', 'Vasant Kunj'],
  'Hyderabad': ['Banjara Hills', 'Jubilee Hills', 'Gachibowli', 'Madhapur', 'Hitech City'],
  'Chennai': ['T Nagar', 'Anna Nagar', 'Velachery', 'Adyar', 'Mylapore'],
  'Kolkata': ['Salt Lake', 'Park Street', 'Ballygunge', 'Alipore', 'New Town'],
  'Pune': ['Koregaon Park', 'Hinjewadi', 'Kothrud', 'Viman Nagar', 'Baner'],
  'Ahmedabad': ['Satellite', 'Vastrapur', 'Navrangpura', 'Maninagar', 'Bodakdev'],
  'Jaipur': ['Malviya Nagar', 'C Scheme', 'Vaishali Nagar', 'Raja Park', 'Mansarovar'],
  'Lucknow': ['Gomti Nagar', 'Hazratganj', 'Indira Nagar', 'Alambagh', 'Aliganj']
};

const sports = ['Badminton', 'Tennis', 'Table Tennis'];

const bios = [
  'Passionate about racquet sports and competitive play.',
  'Weekend warrior on the court.',
  'Love the thrill of competitive tournaments.',
  'Playing since childhood, competing for fun.',
  'Sports enthusiast and fitness lover.',
  'Always ready for a challenge on the court.',
  'Dedicated player striving to improve every day.',
  'Love the game, love the competition.',
  'Court is my happy place.',
  'Playing hard, winning harder.'
];

async function main() {
  console.log('🔍 Finding test players...');

  // Find all test players (those with @test.com emails)
  const testPlayers = await prisma.user.findMany({
    where: {
      email: {
        contains: '@test.com'
      }
    }
  });

  console.log(`✅ Found ${testPlayers.length} test players`);
  console.log('\n📝 Updating profiles with location, sports, bio, etc...');

  for (let i = 0; i < testPlayers.length; i++) {
    const player = testPlayers[i];

    // Pick random city
    const randomCity = cities[i % cities.length];
    const cityLocalities = localities[randomCity.city];
    const randomLocality = cityLocalities[Math.floor(Math.random() * cityLocalities.length)];

    // Pick 1-3 random sports
    const playerSports = [];
    const sportCount = 1 + Math.floor(Math.random() * 3); // 1-3 sports
    const shuffledSports = [...sports].sort(() => 0.5 - Math.random());
    for (let j = 0; j < sportCount; j++) {
      playerSports.push(shuffledSports[j]);
    }

    // Random bio
    const bio = bios[Math.floor(Math.random() * bios.length)];

    // Add small random offset to coordinates (0.01 to 0.05 degrees)
    const latOffset = (Math.random() * 0.04 + 0.01) * (Math.random() > 0.5 ? 1 : -1);
    const lonOffset = (Math.random() * 0.04 + 0.01) * (Math.random() > 0.5 ? 1 : -1);

    try {
      await prisma.user.update({
        where: { id: player.id },
        data: {
          city: randomCity.city,
          state: randomCity.state,
          locality: randomLocality,
          latitude: randomCity.latitude + latOffset,
          longitude: randomCity.longitude + lonOffset,
          sports: playerSports,
          bio: bio,
          onboardingComplete: true,
          primaryRole: 'PLAYER'
        }
      });

      console.log(`  ✓ ${player.firstName} ${player.lastName} - ${randomCity.city}, ${randomCity.state} (${randomLocality}) - ${playerSports.join(', ')}`);
    } catch (error) {
      console.log(`  ✗ ${player.firstName} ${player.lastName}: ${error.message}`);
    }
  }

  console.log('\n✅ All test players updated!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
