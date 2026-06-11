# Registrations View - Organizer Dashboard

## Overview

A beautiful, comprehensive registration management system for tournament organizers to view, search, filter, and export participant data.

## Features

### 📊 Statistics Dashboard
- **Total Registrations**: Count of all registration entries
- **Total Participants**: Actual player count (includes partners for doubles)
- **Singles Breakdown**: Number of singles registrations
- **Doubles/Mixed Breakdown**: Number of doubles/mixed doubles registrations

### 🔍 Search & Filter
- **Search**: Find participants by name or email (searches both primary and partner)
- **Event Filter**: Filter by specific event
- **Format Filter**: Filter by Singles, Doubles, or Mixed Doubles
- **Group By**: View registrations grouped by Event or Format

### 📥 Export Functionality
- Export to CSV format
- Includes all registration details:
  - Event name and format
  - Player and partner details
  - Contact information
  - Registration date
  - Status

### 📋 Registration Details Display
For each registration, view:
- **Player Information**: Name, email, profile picture initials
- **Partner Information** (for doubles): Name, email, profile picture initials
- **Registration Date**: When they registered
- **Status**: Confirmed/Cancelled
- **Event Details**: Name, format, category, gender requirements

### 🎨 Visual Design
- **Grouped by Event**: See all registrations per event with count badges
- **Grouped by Format**: See all singles together, all doubles together, etc.
- **Color-coded avatars**: Primary player (blue), Partner (green)
- **Hover effects**: Interactive table rows
- **Responsive design**: Works on mobile, tablet, and desktop

## How to Use

### Step 1: Navigate to Tournament Management
1. Login as organizer
2. Go to "Manage" page
3. Click on your tournament
4. Click "Registrations" tab

### Step 2: View Statistics
The top cards show:
- Total number of registrations
- Total number of individual participants
- Breakdown by format

### Step 3: Search & Filter
Use the toolbar to:
- **Search bar**: Type player name or email
- **Event dropdown**: Select specific event or "All Events"
- **Format dropdown**: Filter by format or "All Formats"
- **Group dropdown**: Change how data is organized

### Step 4: Review Registrations
Each group shows:
- Event/Format name in header
- Registration count badge
- Table with all participants
- Player avatars and contact info
- Registration dates
- Status badges

### Step 5: Export Data
Click "Export CSV" button to download:
- All filtered registrations
- Opens in Excel/Google Sheets
- Use for:
  - Printing participant lists
  - Email communications
  - Record keeping
  - Sharing with co-organizers

## Backend Implementation

### New Files
None - uses existing service structure

### Modified Files

**Backend:**
1. `src/services/tournament.service.js`
   - Added `getTournamentRegistrations(tournamentId)` method
   - Fetches all registrations across all events
   - Includes user, partner, and event details

2. `src/controllers/tournament.controller.js`
   - Added `getTournamentRegistrations()` controller method
   - Returns formatted registration data

3. `src/routes/tournament.routes.js`
   - Added `GET /tournaments/:id/registrations` route
   - Protected with authentication middleware

**Frontend:**
1. `client/src/components/RegistrationsView.jsx` (NEW - 600+ lines)
   - Complete registration viewing component
   - Search, filter, export functionality
   - Beautiful table layout

2. `client/src/pages/TournamentManagePage.jsx`
   - Imported and integrated RegistrationsView
   - Replaced placeholder with actual component

## API Endpoint

### Get Tournament Registrations
```http
GET /api/tournaments/:id/registrations
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "registrations": [
    {
      "id": "reg-uuid",
      "userId": "user-uuid",
      "eventId": "event-uuid",
      "partnerId": "partner-uuid",
      "status": "CONFIRMED",
      "createdAt": "2026-06-11T12:00:00.000Z",
      "user": {
        "id": "user-uuid",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "gender": "Male",
        "dob": "1995-05-15"
      },
      "partner": {
        "id": "partner-uuid",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@example.com",
        "gender": "Female",
        "dob": "1998-03-20"
      },
      "event": {
        "id": "event-uuid",
        "name": "Mixed Doubles Open",
        "format": "MIXED_DOUBLES",
        "category": "Open",
        "gender": null
      }
    }
  ]
}
```

## Component Props

### RegistrationsView
```jsx
<RegistrationsView 
  tournamentId={string} // Required: Tournament ID
/>
```

## State Management

The component manages:
- `events`: List of all events in tournament
- `registrations`: All registration data
- `loading`: Loading state
- `searchTerm`: Search input value
- `selectedEvent`: Currently selected event filter
- `selectedFormat`: Currently selected format filter
- `groupBy`: How to group data (event/format)

## Data Grouping Logic

### Group by Event
```javascript
{
  "Men's Singles Open": {
    event: { name, format, category, gender },
    registrations: [...]
  },
  "Mixed Doubles U19": {
    event: { name, format, category, gender },
    registrations: [...]
  }
}
```

### Group by Format
```javascript
{
  "Singles": {
    format: "SINGLES",
    registrations: [...]
  },
  "Mixed Doubles": {
    format: "MIXED_DOUBLES",
    registrations: [...]
  }
}
```

## CSV Export Format

Columns:
1. Event Name
2. Event Format
3. Player Name
4. Player Email
5. Partner Name (blank for singles)
6. Partner Email (blank for singles)
7. Registration Date
8. Status

Example:
```csv
"Event Name","Event Format","Player Name","Player Email","Partner Name","Partner Email","Registration Date","Status"
"Mixed Doubles Open","Mixed Doubles","John Doe","john@example.com","Jane Smith","jane@example.com","6/11/2026","CONFIRMED"
"Men's Singles Open","Singles","Mike Johnson","mike@example.com","","","6/11/2026","CONFIRMED"
```

## Responsive Design

**Desktop (>1024px):**
- Full table layout
- 4-column stats grid
- All filters in single row

**Tablet (768px - 1024px):**
- Scrollable table
- 2-column stats grid
- Filters wrap to 2 rows

**Mobile (<768px):**
- Vertical scrolling
- 1-column stats grid
- Stacked filters
- Simplified table view

## Testing

### Test Scenario 1: View All Registrations
1. Navigate to tournament with registrations
2. Click "Registrations" tab
3. Should see all registrations grouped by event
4. Stats cards should show correct counts

### Test Scenario 2: Search Functionality
1. Type player name in search bar
2. Table should filter to matching players
3. Try typing partner name - should also work
4. Try typing email - should work

### Test Scenario 3: Event Filter
1. Select specific event from dropdown
2. Should only show registrations for that event
3. Stats cards should update
4. Select "All Events" to reset

### Test Scenario 4: Format Filter
1. Select "Singles" from format dropdown
2. Should only show singles registrations
3. Select "Doubles" - only doubles
4. Select "Mixed Doubles" - only mixed doubles

### Test Scenario 5: Group By
1. Change from "Group by Event" to "Group by Format"
2. Data should reorganize
3. Same registrations, different grouping

### Test Scenario 6: Export CSV
1. Click "Export CSV" button
2. CSV file should download
3. Open in Excel/Google Sheets
4. Should see all filtered data

### Test Scenario 7: No Registrations
1. Go to tournament with no registrations
2. Should see empty state message
3. No errors

### Test Scenario 8: Doubles Display
1. View doubles/mixed doubles registration
2. Should see primary player
3. Should see partner below with "+" indicator
4. Both should have contact info

## Visual Elements

### Stats Cards
```
┌─────────────────────┐  ┌─────────────────────┐
│ Total Registrations │  │ Total Participants  │
│        42          │  │        67          │
└─────────────────────┘  └─────────────────────┘
```

### Registration Table
```
┌──────────────────────────────────────────────────────────┐
│ Event Name: Mixed Doubles Open              Count: 5     │
├─────┬────────────────┬──────────┬────────────┬──────────┤
│  #  │ Player(s)      │ Contact  │ Date       │ Status   │
├─────┼────────────────┼──────────┼────────────┼──────────┤
│  1  │ 👤 John Doe    │ john@... │ Jun 11     │ ✓ Conf.  │
│     │  + Jane Smith  │ jane@... │            │          │
└─────┴────────────────┴──────────┴────────────┴──────────┘
```

## Performance

- ✅ Single API call loads all data
- ✅ Client-side filtering (instant response)
- ✅ Efficient Prisma queries with selective fields
- ✅ No unnecessary re-renders
- ✅ Optimized for 100+ registrations

## Security

- ✅ Authentication required
- ✅ Organizer-only access (middleware enforced)
- ✅ No sensitive data exposed (only necessary fields)
- ✅ CORS protection
- ✅ SQL injection protection (Prisma)

## Future Enhancements

1. **Email Integration**
   - Send bulk emails to participants
   - Custom templates
   - Email specific events

2. **Advanced Filters**
   - Filter by registration date range
   - Filter by participant gender
   - Filter by participant age

3. **Printing**
   - Print-optimized view
   - Bracket-ready participant lists
   - Check-in sheets

4. **Communication Hub**
   - In-app messaging
   - Announcements to all participants
   - Event-specific notifications

5. **Analytics**
   - Registration timeline graph
   - Demographic breakdown
   - Popular events analysis

6. **Bulk Actions**
   - Bulk status updates
   - Bulk refunds
   - Bulk event moves

## Common Issues

### Issue: Stats don't match
**Cause**: Stats count registrations vs participants
**Solution**: 
- Registrations = number of entries
- Participants = actual players (1 for singles, 2 for doubles)

### Issue: Can't see registrations
**Cause**: Not an organizer
**Solution**: Must be OWNER or ADMIN of tournament's organization

### Issue: Search not working
**Cause**: Searching wrong field
**Solution**: Search works on names and emails of both primary and partner

### Issue: CSV not downloading
**Cause**: Browser blocking download
**Solution**: Check browser popup blocker settings

## Code Structure

```
RegistrationsView.jsx
├── State Management
│   ├── events
│   ├── registrations
│   ├── filters
│   └── search
├── Data Loading
│   └── loadData() - Fetches events & registrations
├── Filtering Logic
│   ├── Search filter
│   ├── Event filter
│   └── Format filter
├── Grouping Logic
│   ├── Group by Event
│   └── Group by Format
├── Export Logic
│   └── handleExportCSV() - Generates CSV
└── UI Components
    ├── Stats Cards (4)
    ├── Filters Bar
    └── Registration Groups
        └── Registration Table
```

## Best Practices

1. **Always provide search**: Let organizers find specific participants quickly
2. **Show partner info clearly**: Make doubles registrations obvious
3. **Use visual hierarchy**: Group headers, table structure
4. **Export everything**: Give organizers full data access
5. **Responsive design**: Mobile organizers need access too
6. **Loading states**: Show spinners during data load
7. **Empty states**: Clear message when no data
8. **Error handling**: Graceful failures with messages

## Summary

The Registration View provides organizers with:
- ✅ Complete visibility into all registrations
- ✅ Powerful search and filtering
- ✅ Beautiful, organized presentation
- ✅ Easy data export
- ✅ Responsive design
- ✅ Fast performance

Ready for production use! 🎉
