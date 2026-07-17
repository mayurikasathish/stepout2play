# Cross-Event Tournament Scheduler

## 📦 Package Contents

This zip file contains all files related to the cross-event tournament scheduler system.

---

## 📁 File Structure

### Backend (API & Services)
- **`src/routes/tournamentScheduler.routes.js`** - API routes for scheduler endpoints
- **`src/controllers/tournamentScheduler.controller.js`** - Request handlers and response formatting
- **`src/services/tournamentScheduler.service.js`** - Core scheduling logic and algorithms

### Frontend (React Components)
- **`client/src/pages/TournamentSchedulerPage.jsx`** - Dedicated scheduler page (simplified, day view only)
- **`client/src/pages/TournamentManagePage.jsx`** - Tournament management page with integrated scheduler
- **`client/src/components/ScheduleGenerationModal.jsx`** - Modal for configuring schedule generation
- **`client/src/components/SchedulerCalendar.jsx`** - Day calendar view component
- **`client/src/components/ConflictPanel.jsx`** - Conflict detection and resolution panel
- **`client/src/components/EventsListSidebar.jsx`** - Events list sidebar
- **`client/src/components/ScheduleAnalytics.jsx`** - Analytics dashboard component

### Database & Scripts
- **`prisma/schema.prisma`** - Database schema with scheduler-related models
- **`scripts/migrateCourtsBySport.js`** - Migration script for multi-sport court management
- **`scripts/fixOverRegistrations.js`** - Fix events that exceed maxParticipants
- **`scripts/generateAllBrackets.js`** - Generate brackets for all events

---

## 🚀 Features Implemented

### Phase 1: Multi-Sport Court Management ✅
- Per-sport court configuration (e.g., Badminton Court 1, Table Tennis Court 1)
- Stored in `tournament.courtsBySport` JSON field
- Auto-scheduler respects sport-court mapping
- Migrated existing tournaments with no data loss

### Phase 2: League-Knockout Phase Management ✅
- Phase detection (league vs knockout)
- Separate scheduling for league and knockout phases
- Event tracking: `leaguePhaseScheduled`, `knockoutPhaseScheduled`
- Enforces dependency (knockout can't schedule before league)

### Phase 3: Simplified UI ✅
- Removed view selector (Day/Week/Event/Court/Player)
- Single day calendar view
- Removed advanced options and scheduling strategies
- Clean, focused interface

---

## 🔑 Key Database Fields

### Tournament Model
```javascript
{
  courtsBySport: Json // { "badminton": ["Court 1", "Court 2"], "table-tennis": ["Table 1"] }
  courtsAvailable: Int // Legacy fallback
  dailyStartTime: String // "09:00"
  dailyEndTime: String // "18:00"
  matchDuration: Int // 45 minutes
  breakDuration: Int // 15 minutes
  minRestTime: Int // 30 minutes
}
```

### Event Model
```javascript
{
  bracketGenerated: Boolean
  bracketPublished: Boolean
  sportId: String // "badminton", "table-tennis", etc.
  leaguePhaseScheduled: Boolean // Phase 2
  knockoutPhaseScheduled: Boolean // Phase 2
}
```

### Match Model
```javascript
{
  scheduledAt: DateTime
  courtNumber: Int
  courtName: String
  duration: Int
}
```

---

## 📊 API Endpoints

### Generate Schedule
```
POST /tournaments/:tournamentId/scheduler/generate
Body: {
  startDate: "2026-07-28",
  endDate: "2026-08-21",
  dailyStartTime: "09:00",
  dailyEndTime: "18:00",
  courtsBySport: {
    "badminton": ["Court 1", "Court 2"],
    "table-tennis": ["Table 1"]
  },
  matchDuration: 45,
  breakDuration: 15,
  minRestTime: 30,
  phase: "league" | "knockout" | null
}
```

### Save Schedule
```
POST /tournaments/:tournamentId/scheduler/save
Body: {
  schedule: [...],
  config: {...},
  phase: "league" | "knockout" | null
}
```

### Get Schedule
```
GET /tournaments/:tournamentId/scheduler/schedule
```

### Clear Schedule
```
DELETE /tournaments/:tournamentId/scheduler/schedule
```

---

## 🐛 Known Issues & Fixes Applied

### Fixed Issues:
1. ✅ View selector removed from both pages
2. ✅ Utilization threshold changed (90% → 40%)
3. ✅ Over-registered events moved to standby
4. ✅ Registration data includes status and isStandby fields
5. ✅ Console spam removed from modal

### Remaining Issues:
- ⚠️ Schedule generation returns "No unscheduled matches found" - needs investigation
- ⚠️ Matches may not be loading correctly from database

---

## 🛠️ Troubleshooting

### If schedule generation fails:

1. **Check brackets are generated:**
   ```bash
   node scripts/generateAllBrackets.js
   ```

2. **Check backend logs:**
   Look for console output showing:
   ```
   📊 Collecting matches from X events
     Event "...": X matches, bracketGenerated: true
   ✅ Collected X total matches
   ```

3. **Fix over-registrations:**
   ```bash
   node scripts/fixOverRegistrations.js
   ```

4. **Migrate court structure:**
   ```bash
   node scripts/migrateCourtsBySport.js
   ```

---

## 📝 Development Notes

- Default scheduling strategy: `hybrid` (hardcoded)
- Time slot granularity: 15 minutes
- Calendar always shows day view (simplified)
- Multi-sport tournaments fully supported
- Conflict detection active

---

## 🎯 Next Steps (Phase 4 - Not Implemented)

- Fix auto-scheduler priority sorting (finals first)
- Fix remaining bugs (#2, #3, #6, #8, #9, #11, #12, #14)
- Implement proper sport-court constraint checking
- Thorough testing with real data

---

**Last Updated:** July 17, 2026  
**Version:** 3.0 (Phase 1-3 Complete)
