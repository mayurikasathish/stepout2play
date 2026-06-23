const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

const prisma = new PrismaClient()

async function exportData() {
  console.log('📦 Exporting data from local database...')

  const data = {
    users: await prisma.user.findMany(),
    organizations: await prisma.organization.findMany(),
    orgMembers: await prisma.orgMember.findMany(),
    tournaments: await prisma.tournament.findMany(),
    events: await prisma.event.findMany(),
    registrations: await prisma.registration.findMany(),
    matches: await prisma.match.findMany(),
    groups: await prisma.group.findMany(),
    groupStandings: await prisma.groupStanding.findMany(),
  }

  fs.writeFileSync('data-export.json', JSON.stringify(data, null, 2))

  console.log('✅ Data exported successfully!')
  console.log(`   Users: ${data.users.length}`)
  console.log(`   Organizations: ${data.organizations.length}`)
  console.log(`   Tournaments: ${data.tournaments.length}`)
  console.log(`   Events: ${data.events.length}`)
  console.log(`   Registrations: ${data.registrations.length}`)
  console.log('📄 Saved to: data-export.json')

  await prisma.$disconnect()
}

exportData().catch(console.error)
