const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function fullRestore() {
  try {
    console.log('🔄 FULL DATA RESTORATION STARTING...\n');

    // Read backup file
    const data = JSON.parse(fs.readFileSync('./data-export.json', 'utf-8'));

    // 1. Users
    console.log(`📥 Restoring ${data.users.length} users...`);
    for (const user of data.users) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: user,
        create: user
      });
    }
    console.log('✅ Users restored\n');

    // 2. Organizations
    console.log(`📥 Restoring ${data.organizations.length} organizations...`);
    for (const org of data.organizations) {
      await prisma.organization.upsert({
        where: { id: org.id },
        update: org,
        create: org
      });
    }
    console.log('✅ Organizations restored\n');

    // 3. Org Members
    console.log(`📥 Restoring ${data.orgMembers.length} org members...`);
    for (const member of data.orgMembers) {
      await prisma.orgMember.upsert({
        where: { id: member.id },
        update: member,
        create: member
      });
    }
    console.log('✅ Org Members restored\n');

    // 4. Tournaments
    console.log(`📥 Restoring ${data.tournaments.length} tournaments...`);
    for (const tournament of data.tournaments) {
      await prisma.tournament.upsert({
        where: { id: tournament.id },
        update: tournament,
        create: tournament
      });
    }
    console.log('✅ Tournaments restored\n');

    // 5. Events
    console.log(`📥 Restoring ${data.events.length} events...`);
    for (const event of data.events) {
      await prisma.event.upsert({
        where: { id: event.id },
        update: event,
        create: event
      });
    }
    console.log('✅ Events restored\n');

    // 6. Groups
    if (data.groups) {
      console.log(`📥 Restoring ${data.groups.length} groups...`);
      for (const group of data.groups) {
        await prisma.group.upsert({
          where: { id: group.id },
          update: group,
          create: group
        });
      }
      console.log('✅ Groups restored\n');
    }

    // 7. Registrations
    console.log(`📥 Restoring ${data.registrations.length} registrations...`);
    for (const reg of data.registrations) {
      await prisma.registration.upsert({
        where: { id: reg.id },
        update: reg,
        create: reg
      });
    }
    console.log('✅ Registrations restored\n');

    // 8. Group Standings
    if (data.groupStandings) {
      console.log(`📥 Restoring ${data.groupStandings.length} group standings...`);
      for (const standing of data.groupStandings) {
        await prisma.groupStanding.upsert({
          where: { id: standing.id },
          update: standing,
          create: standing
        });
      }
      console.log('✅ Group Standings restored\n');
    }

    // 9. Matches
    console.log(`📥 Restoring ${data.matches.length} matches...`);
    for (const match of data.matches) {
      await prisma.match.upsert({
        where: { id: match.id },
        update: match,
        create: match
      });
    }
    console.log('✅ Matches restored\n');

    // Summary
    console.log('🎉🎉🎉 COMPLETE DATA RESTORATION SUCCESSFUL! 🎉🎉🎉\n');
    console.log('Summary:');
    console.log(`  ✅ ${data.users.length} users`);
    console.log(`  ✅ ${data.organizations.length} organizations`);
    console.log(`  ✅ ${data.orgMembers.length} org members`);
    console.log(`  ✅ ${data.tournaments.length} tournaments`);
    console.log(`  ✅ ${data.events.length} events`);
    console.log(`  ✅ ${data.registrations.length} registrations`);
    console.log(`  ✅ ${data.matches.length} matches`);
    if (data.groups) console.log(`  ✅ ${data.groups.length} groups`);
    if (data.groupStandings) console.log(`  ✅ ${data.groupStandings.length} group standings`);

  } catch (error) {
    console.error('❌ ERROR RESTORING DATA:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fullRestore();
