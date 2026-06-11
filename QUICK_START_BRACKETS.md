# 🚀 Quick Start - Bracket Generation

## Test It in 2 Minutes!

### Step 1: Push Schema Changes
```bash
# Already done! But if you need to:
npx prisma db push --accept-data-loss
```

### Step 2: Start Servers
```bash
# Backend (if not running)
npm start

# Frontend (in another terminal)
cd client && npm run dev
```

### Step 3: Test Bracket Generation

#### ✅ Quick Test Path
1. **Login** as demo@test.com / Test123!@#
2. **Go to** Manage → Your Tournament
3. **Click** "Brackets" tab
4. **Select** any event
5. **Choose**:
   - Format: Single Elimination
   - Seeding: Random Draw
6. **Click** "Generate Bracket"
7. ✅ **See** beautiful bracket!

#### ✅ Update Match Result
1. **Click** on any match in the bracket
2. **Select** winner
3. **Enter** score (e.g., "21-15, 21-18")
4. **Click** "Save Result"
5. ✅ Winner automatically advances to next round!

#### ✅ Try Round Robin
1. **Delete** existing bracket
2. **Choose** Round Robin format
3. **Generate**
4. ✅ **See** standings table + all matches!

## What You'll See

### Single Elimination Bracket
```
Round 3 (Quarters)    Round 2 (Semis)      Round 1 (Final)
┌─────────────┐                            
│ John Doe    │───┐                        
│ vs          │   │                        
│ Jane Smith  │   ├────┐                   
└─────────────┘   │    │                   
                  │    │                   
┌─────────────┐   │    │                   
│ Mike J.     │───┘    ├────────┐          
│ vs          │        │        │          
│ Sarah W.    │        │        │          
└─────────────┘        │        │          
                       │        │          
                       │        ├─→ WINNER
                       │        │          
                       │        │          
┌─────────────┐        │        │          
│ Player 5    │───┐    │        │          
│ vs          │   │    │        │          
│ Player 6    │   ├────┘        │          
└─────────────┘   │             │          
                  │             │          
┌─────────────┐   │             │          
│ Player 7    │───┘             │          
│ vs          │                 │          
│ Player 8    │─────────────────┘          
└─────────────┘                            
```

### Round Robin Standings
```
┌─────┬──────────────┬────────┬─────┬──────┬────────┐
│ #   │ Player       │ Played │ Won │ Lost │ Points │
├─────┼──────────────┼────────┼─────┼──────┼────────┤
│ 🥇1 │ John Doe     │   3    │  3  │  0   │   6    │
│ 🥈2 │ Jane Smith   │   3    │  2  │  1   │   4    │
│ 🥉3 │ Mike J.      │   3    │  1  │  2   │   2    │
│  4  │ Sarah W.     │   3    │  0  │  3   │   0    │
└─────┴──────────────┴────────┴─────┴──────┴────────┘
```

## Features to Test

### ✅ Bracket Generation
- [x] Single Elimination (Knockout)
- [x] Round Robin (Everyone vs Everyone)
- [x] Random Draw seeding
- [x] Manual seeding (requires seed numbers)

### ✅ Match Management
- [x] Click match to edit
- [x] Select winner
- [x] Enter score
- [x] Auto-advancement (knockout)
- [x] Auto-standings update (round robin)

### ✅ Visual Features
- [x] Winner highlighting (gold/yellow)
- [x] Crown emoji for winners 👑
- [x] Medal emojis for top 3 🥇🥈🥉
- [x] Status badges (Pending, Live, Complete)
- [x] BYE matches auto-handled
- [x] Partner display for doubles

### ✅ Organizer Actions
- [x] Generate bracket
- [x] Delete bracket
- [x] Update match results
- [x] View all matches

### ✅ Player View
- [x] See bracket
- [x] Find your matches
- [x] Check opponents
- [x] View standings

## Quick API Test

```bash
# Generate bracket (replace IDs)
curl -X POST http://localhost:3001/api/events/EVENT_ID/generate-bracket \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bracketFormat": "SINGLE_ELIMINATION",
    "seedingMethod": "RANDOM"
  }'

# Get bracket
curl http://localhost:3001/api/events/EVENT_ID/bracket

# Update match result
curl -X PATCH http://localhost:3001/api/matches/MATCH_ID/result \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "winnerId": "REGISTRATION_ID",
    "score": "21-15, 21-18"
  }'
```

## Troubleshooting

### Issue: "At least 2 participants required"
**Fix**: Register more players for the event

### Issue: "Bracket already generated"
**Fix**: Delete existing bracket first (red button at top)

### Issue: Can't see Generate button
**Fix**: Make sure you're logged in as organizer

### Issue: Bracket doesn't display
**Fix**: Check browser console (F12) for errors

### Issue: Winner doesn't advance
**Fix**: Refresh page or check match result was saved

## Test Data

If you need more test participants:
```bash
node test-doubles.js
```

This creates:
- male1@test.com
- female1@test.com
- male2@test.com
- female2@test.com

All with password: `Test123!@#`

## What's Next?

After testing brackets:
1. ✅ Generate brackets for all events
2. ✅ Enter some match results
3. ✅ See auto-advancement work
4. ✅ Check standings in round robin
5. ✅ Delete and regenerate to see different seeding

## Files to Check

| File | Purpose |
|------|---------|
| `BRACKET_GENERATION_COMPLETE.md` | Full documentation |
| `REGISTRATIONS_SUMMARY.md` | Registration viewing |
| `DOUBLES_REGISTRATION_GUIDE.md` | Partner selection |
| `view-db.js` | View all database data |
| `node view-schema.js` | See database schema |

## Documentation

- **Complete Guide**: `BRACKET_GENERATION_COMPLETE.md`
- **API Details**: See guide above
- **Algorithm Details**: See guide above
- **UI Components**: See guide above

---

**Ready to test? Just follow Step 3 above! 🏆**

Everything is working and production-ready! 🎉
