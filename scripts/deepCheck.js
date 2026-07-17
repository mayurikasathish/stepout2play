const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deepCheck() {
  console.log('🔍 DEEP INVESTIGATION...\n');

  // 1. Check tournament schedule table
  const schedules = await prisma.tournamentSchedule.findMany({
    where: {
      tournament: { name: 'Summer Championship 2026' }
    },
    include: {
      event: { select: { name: true } },
      match: { select: { bracketPosition: true, status: true } },
      court: { select: { name: true } }
    }
  });

  console.log('1️⃣ SCHEDULE TABLE:');
  console.log('   Total scheduled matches:', schedules.length);

  if (schedules.length > 0) {
    console.log('\n   First 10 schedules:');
    schedules.slice(0, 10).forEach(s => {
      console.log(`     - ${s.event.name}: ${s.match.bracketPosition} on ${s.date} at ${s.time} on ${s.court.name}`);
    });
  }

  // 2. Check matches table
  const allMatches = await prisma.match.findMany({
    where: {
      event: {
        tournament: { name: 'Summer Championship 2026' }
      }
    },
    select: {
      id: true,
      eventId: true,
      bracketPosition: true,
      status: true,
      participant1Id: true,
      participant2Id: true,
      groupId: true
    }
  });

  console.log('\n2️⃣ MATCHES TABLE:');
  console.log('   Total matches:', allMatches.length);
  console.log('   Ready matches:', allMatches.filter(m => m.status === 'READY').length);
  console.log('   Pending matches:', allMatches.filter(m => m.status === 'PENDING').length);
  console.log('   NULL participant matches:', allMatches.filter(m => !m.participant1Id || !m.participant2Id).length);

  // 3. Check by event
  const events = await prisma.event.findMany({
    where: {
      tournament: { name: 'Summer Championship 2026' }
    },
    include: {
      _count: {
        select: {
          matches: true,
          schedules: true
        }
      }
    }
  });

  console.log('\n3️⃣ BY EVENT:');
  events.forEach(e => {
    console.log(`\n   ${e.name}:`);
    console.log(`     - Total matches: ${e._count.matches}`);
    console.log(`     - Scheduled: ${e._count.schedules}`);
    console.log(`     - bracketGenerated: ${e.bracketGenerated}`);
    console.log(`     - bracketFormat: ${e.bracketFormat}`);
    console.log(`     - leaguePhaseScheduled: ${e.leaguePhaseScheduled || false}`);
    console.log(`     - knockoutPhaseScheduled: ${e.knockoutPhaseScheduled || false}`);
  });

  // 4. Check Women's singles specifically
  const womensSingles = await prisma.event.findFirst({
    where: { name: "Women's singles mania" },
    include: {
      groups: {
        include: {
          _count: {
            select: { matches: true, standings: true }
          }
        }
      }
    }
  });

  if (womensSingles) {
    console.log('\n4️⃣ WOMEN\'S SINGLES (LEAGUE_CUM_KNOCKOUT):');
    console.log(`   Groups: ${womensSingles.groups.length}`);
    womensSingles.groups.forEach(g => {
      console.log(`     - ${g.name}: ${g._count.standings} players, ${g._count.matches} matches`);
    });
  }

  await prisma.$disconnect();
}

deepCheck().catch(console.error);
