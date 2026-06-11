#!/usr/bin/env node
/**
 * Database Viewer Script
 * Run with: node view-db.js
 *
 * Shows all tables and data in your Prisma database
 */

const prisma = require('./src/lib/prisma');

async function viewDatabase() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║          DATABASE VIEWER - StepOut2Play                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');
    console.log('Database URL:', process.env.DATABASE_URL?.replace(/:[^:]*@/, ':****@') || 'Not found');
    console.log('═'.repeat(60), '\n');

    // ═══ USERS ═══
    console.log('📊 USERS TABLE');
    console.log('─'.repeat(60));
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        authProvider: true,
        onboardingComplete: true,
        primaryRole: true,
        sports: true,
        createdAt: true,
        _count: {
          select: {
            registrations: true,
            orgMemberships: true
          }
        }
      }
    });

    if (users.length === 0) {
      console.log('  No users found\n');
    } else {
      users.forEach((u, i) => {
        console.log(`\n  User ${i + 1}:`);
        console.log(`    ID: ${u.id}`);
        console.log(`    Name: ${u.firstName} ${u.lastName}`);
        console.log(`    Email: ${u.email}`);
        console.log(`    Auth Provider: ${u.authProvider}`);
        console.log(`    Onboarding: ${u.onboardingComplete ? '✅ Complete' : '⏳ Pending'}`);
        console.log(`    Primary Role: ${u.primaryRole || 'Not set'}`);
        console.log(`    Sports: ${u.sports.length > 0 ? u.sports.join(', ') : 'None'}`);
        console.log(`    Organizations: ${u._count.orgMemberships}`);
        console.log(`    Registrations: ${u._count.registrations}`);
        console.log(`    Created: ${u.createdAt.toISOString()}`);
      });
      console.log(`\n  Total: ${users.length} user(s)\n`);
    }

    // ═══ ORGANIZATIONS ═══
    console.log('═'.repeat(60));
    console.log('🏢 ORGANIZATIONS TABLE');
    console.log('─'.repeat(60));
    const orgs = await prisma.organization.findMany({
      include: {
        _count: {
          select: {
            members: true,
            tournaments: true
          }
        }
      }
    });

    if (orgs.length === 0) {
      console.log('  No organizations found\n');
    } else {
      orgs.forEach((o, i) => {
        console.log(`\n  Organization ${i + 1}:`);
        console.log(`    ID: ${o.id}`);
        console.log(`    Name: ${o.name}`);
        console.log(`    Slug: ${o.slug}`);
        console.log(`    Logo: ${o.logoUrl || 'None'}`);
        console.log(`    Members: ${o._count.members}`);
        console.log(`    Tournaments: ${o._count.tournaments}`);
        console.log(`    Created: ${o.createdAt.toISOString()}`);
      });
      console.log(`\n  Total: ${orgs.length} organization(s)\n`);
    }

    // ═══ TOURNAMENTS ═══
    console.log('═'.repeat(60));
    console.log('🏆 TOURNAMENTS TABLE');
    console.log('─'.repeat(60));
    const tournaments = await prisma.tournament.findMany({
      include: {
        organization: {
          select: { name: true }
        },
        _count: {
          select: { events: true }
        }
      }
    });

    if (tournaments.length === 0) {
      console.log('  No tournaments found\n');
    } else {
      tournaments.forEach((t, i) => {
        console.log(`\n  Tournament ${i + 1}:`);
        console.log(`    ID: ${t.id}`);
        console.log(`    Name: ${t.name}`);
        console.log(`    Organization: ${t.organization.name}`);
        console.log(`    Sport: ${t.sport}`);
        console.log(`    Status: ${t.status}`);
        console.log(`    Format: ${t.format}`);
        console.log(`    Location: ${t.venueName}, ${t.city}`);
        console.log(`    Start Date: ${t.startDate.toISOString().split('T')[0]}`);
        console.log(`    Registration Deadline: ${t.registrationDeadline.toISOString().split('T')[0]}`);
        console.log(`    Events: ${t._count.events}`);
        console.log(`    Entry Fee: ${t.entryFee ? `$${t.entryFee}` : 'Free'}`);
      });
      console.log(`\n  Total: ${tournaments.length} tournament(s)\n`);
    }

    // ═══ EVENTS ═══
    console.log('═'.repeat(60));
    console.log('🎯 EVENTS TABLE');
    console.log('─'.repeat(60));
    const events = await prisma.event.findMany({
      include: {
        tournament: {
          select: { name: true }
        },
        _count: {
          select: { registrations: true }
        }
      }
    });

    if (events.length === 0) {
      console.log('  No events found\n');
    } else {
      events.forEach((e, i) => {
        console.log(`\n  Event ${i + 1}:`);
        console.log(`    ID: ${e.id}`);
        console.log(`    Name: ${e.name}`);
        console.log(`    Tournament: ${e.tournament.name}`);
        console.log(`    Format: ${e.format}`);
        console.log(`    Category: ${e.category || 'N/A'}`);
        console.log(`    Gender: ${e.gender || 'N/A'}`);
        console.log(`    Max Participants: ${e.maxParticipants || 'Unlimited'}`);
        console.log(`    Registrations: ${e._count.registrations}`);
        console.log(`    Fee: ${e.registrationFee ? `$${e.registrationFee}` : 'Free'}`);
      });
      console.log(`\n  Total: ${events.length} event(s)\n`);
    }

    // ═══ REGISTRATIONS ═══
    console.log('═'.repeat(60));
    console.log('📝 REGISTRATIONS TABLE');
    console.log('─'.repeat(60));
    const registrations = await prisma.registration.findMany({
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true }
        },
        event: {
          select: { name: true }
        },
        partner: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    if (registrations.length === 0) {
      console.log('  No registrations found\n');
    } else {
      registrations.forEach((r, i) => {
        console.log(`\n  Registration ${i + 1}:`);
        console.log(`    ID: ${r.id}`);
        console.log(`    User: ${r.user.firstName} ${r.user.lastName} (${r.user.email})`);
        console.log(`    Event: ${r.event.name}`);
        console.log(`    Partner: ${r.partner ? `${r.partner.firstName} ${r.partner.lastName}` : 'None (Singles)'}`);
        console.log(`    Status: ${r.status}`);
        console.log(`    Registered: ${r.createdAt.toISOString()}`);
      });
      console.log(`\n  Total: ${registrations.length} registration(s)\n`);
    }

    console.log('═'.repeat(60));
    console.log('\n✅ Database scan complete!\n');

    await prisma.$disconnect();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:', error);
  }

  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  viewDatabase();
}

module.exports = viewDatabase;
