const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

const prisma = new PrismaClient()

async function importData() {
  console.log('📦 Importing data to production database...')

  const data = JSON.parse(fs.readFileSync('data-export.json', 'utf8'))

  // Import in order (respecting foreign keys)
  console.log('👥 Importing users...')
  for (const user of data.users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: user,
      create: user,
    })
  }
  console.log(`   ✅ ${data.users.length} users`)

  console.log('🏢 Importing organizations...')
  for (const org of data.organizations) {
    await prisma.organization.upsert({
      where: { id: org.id },
      update: org,
      create: org,
    })
  }
  console.log(`   ✅ ${data.organizations.length} organizations`)

  console.log('👤 Importing org members...')
  for (const member of data.orgMembers) {
    await prisma.orgMember.upsert({
      where: { id: member.id },
      update: member,
      create: member,
    })
  }
  console.log(`   ✅ ${data.orgMembers.length} members`)

  console.log('🏆 Importing tournaments...')
  for (const tournament of data.tournaments) {
    await prisma.tournament.upsert({
      where: { id: tournament.id },
      update: tournament,
      create: tournament,
    })
  }
  console.log(`   ✅ ${data.tournaments.length} tournaments`)

  console.log('🎯 Importing events...')
  for (const event of data.events) {
    await prisma.event.upsert({
      where: { id: event.id },
      update: event,
      create: event,
    })
  }
  console.log(`   ✅ ${data.events.length} events`)

  console.log('📝 Importing registrations...')
  for (const reg of data.registrations) {
    await prisma.registration.upsert({
      where: { id: reg.id },
      update: reg,
      create: reg,
    })
  }
  console.log(`   ✅ ${data.registrations.length} registrations`)

  console.log('📊 Importing groups...')
  for (const group of data.groups) {
    await prisma.group.upsert({
      where: { id: group.id },
      update: group,
      create: group,
    })
  }
  console.log(`   ✅ ${data.groups.length} groups`)

  console.log('🎮 Importing matches...')
  for (const match of data.matches) {
    await prisma.match.upsert({
      where: { id: match.id },
      update: match,
      create: match,
    })
  }
  console.log(`   ✅ ${data.matches.length} matches`)

  console.log('📈 Importing group standings...')
  for (const standing of data.groupStandings) {
    await prisma.groupStanding.upsert({
      where: { id: standing.id },
      update: standing,
      create: standing,
    })
  }
  console.log(`   ✅ ${data.groupStandings.length} standings`)

  console.log('\n🎉 All data imported successfully!')
  await prisma.$disconnect()
}

importData().catch((error) => {
  console.error('❌ Error importing data:', error)
  process.exit(1)
})
