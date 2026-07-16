const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generateAllBrackets() {
  try {
    console.log('🎯 Generating brackets for all events...\n');

    // Get all events without brackets
    const events = await prisma.event.findMany({
      where: {
        bracketGenerated: false,
        tournament: { name: { contains: 'Summer' } }
      },
      include: {
        registrations: {
          where: {
            status: 'CONFIRMED',
            isStandby: false
          }
        }
      }
    });

    console.log(`Found ${events.length} events without brackets\n`);

    for (const event of events) {
      const participantCount = event.registrations.length;

      if (participantCount < 2) {
        console.log(`⏭️  Skipping "${event.name}" - only ${participantCount} participants`);
        continue;
      }

      console.log(`📊 Generating bracket for "${event.name}" (${participantCount} participants)...`);

      // Calculate bracket size (next power of 2)
      const bracketSize = Math.pow(2, Math.ceil(Math.log2(participantCount)));
      const totalRounds = Math.log2(bracketSize);
      const byeCount = bracketSize - participantCount;

      console.log(`   Bracket size: ${bracketSize}, Rounds: ${totalRounds}, Byes: ${byeCount}`);

      // Create matches for knockout bracket
      const matches = [];
      let matchNumber = 1;

      for (let round = totalRounds; round >= 1; round--) {
        const matchesInRound = Math.pow(2, round - 1);

        for (let i = 0; i < matchesInRound; i++) {
          matches.push({
            eventId: event.id,
            roundNumber: round,
            matchNumber: matchNumber++,
            status: 'PENDING',
            bracketPosition: `R${round}M${i + 1}`
          });
        }
      }

      // Create all matches
      await prisma.match.createMany({
        data: matches
      });

      // Mark bracket as generated
      await prisma.event.update({
        where: { id: event.id },
        data: {
          bracketGenerated: true,
          byeCount: byeCount,
          totalRounds: totalRounds,
          totalSlots: bracketSize
        }
      });

      console.log(`   ✅ Created ${matches.length} matches\n`);
    }

    console.log('✅ All brackets generated!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateAllBrackets();
