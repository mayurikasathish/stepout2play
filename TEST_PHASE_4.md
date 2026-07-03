# 🧪 Phase 4 Testing Guide

## Quick Test Steps

### 1. Check Your Profile Ratings
```
1. Open http://localhost:5173
2. Login to your account
3. Go to Profile page
4. Scroll to "Player Ratings" section
5. ✅ You should see ratings for all 6 sports (1200 each)
```

---

### 2. Create a Test Match
```
1. Go to a tournament as organizer
2. Create an event (Singles or Doubles)
3. Register 2 players (or 2 teams for doubles)
4. Generate bracket (any format - Single Elim or Round Robin)
```

---

### 3. Submit Match Result
```
1. Go to Bracket view
2. Click on a match
3. Enter score (e.g., "21-15, 21-18")
4. Select winner
5. Submit
```

---

### 4. Check Rating Changes in Bracket
```
1. Bracket should reload automatically
2. Look at the completed match
3. ✅ Under winner's name: Green "+15 (1215)"
4. ✅ Under loser's name: Red "-8 (1192)"
```

**Example Display:**
```
┌─────────────────────┐
│ Match 1             │
├─────────────────────┤
│ John Doe        [W] │
│ +15 (1215)          │ ← Green text
├─────────────────────┤
│ Jane Smith          │
│ -8 (1192)           │ ← Red text
└─────────────────────┘
Score: 21-15, 21-18
```

---

### 5. Check Updated Profile
```
1. Go to winner's profile page
2. Scroll to "Player Ratings"
3. ✅ Rating changed: 1200 → 1215
4. ✅ Matches Played: 0 → 1
5. ✅ Last Match Date: Today's date
6. ✅ Uncertainty: ±350 → ~±330
```

---

### 6. Submit More Matches
```
1. Submit 3-4 more matches
2. Watch ratings diverge:
   - Winners: 1215 → 1228 → 1240
   - Losers: 1185 → 1172 → 1160
3. Check bracket - all rating changes visible
```

---

## Expected Behavior

### ✅ Brackets
- Green "+X" for rating increases
- Red "-X" for rating decreases
- New rating in parentheses: (1215)
- Shows for COMPLETED matches only

### ✅ Profile
- Rating updates immediately in database
- Refresh page to see new values
- Match count increments
- Last match date updates
- RD (uncertainty) decreases

### ✅ Doubles
- All 4 players get rating updates
- Each player calculated individually
- Partner ratings averaged for opponent strength

---

## Backend Logs to Check

Look for these in your terminal:

```
✅ Created new rating for user abc-123 in sport badminton: 1200
🎾 Processing singles match result for event def-456
✅ Updated rating for user abc-123 in badminton: 1215 (±330)
📊 Rating changes: {...}
```

---

## Common Issues

### "No rating changes showing in bracket"
- Check browser console for errors
- Verify match has `ratingChanges` in API response:
  ```bash
  curl http://localhost:3001/api/events/EVENT_ID/bracket
  ```
- Look for `ratingChanges: []` in match object

### "Profile still shows 1200"
- Hard refresh the page (Ctrl+Shift+R)
- Check database directly:
  ```sql
  SELECT * FROM player_ratings WHERE userId = 'YOUR_USER_ID';
  ```

### "Rating changes not saving"
- Check server logs for errors
- Verify glicko2 package installed:
  ```bash
  npm list glicko2
  ```

---

## Test Scenarios

### Scenario 1: Singles Match
```
Player A (1200) vs Player B (1200)
Winner: Player A

Expected:
- A: ~1215 (+15)
- B: ~1185 (-15)
```

### Scenario 2: Upset Victory
```
Player A (1400) vs Player B (1200)
Winner: Player B (underdog wins!)

Expected:
- B: Big gain (~+25)
- A: Small loss (~-10)
```

### Scenario 3: Expected Victory
```
Player A (1400) vs Player B (1200)
Winner: Player A (favorite wins)

Expected:
- A: Small gain (~+5)
- B: Small loss (~-5)
```

### Scenario 4: Doubles Match
```
Team 1: A (1200) + B (1250) = Avg 1225
Team 2: C (1180) + D (1220) = Avg 1200
Winner: Team 1

Expected:
- A: ~+12
- B: ~+8
- C: ~-8
- D: ~-10
```

---

## Success Criteria

✅ Initial ratings created (1200 for all sports)  
✅ Ratings update after match submission  
✅ Rating changes visible in bracket (green/red)  
✅ Profile shows updated ratings  
✅ Match count increments  
✅ RD decreases with more matches  
✅ Doubles works (all 4 players updated)  
✅ Round Robin works  
✅ Backend logs show rating calculations  

---

## Next Steps After Testing

Once everything works:

1. **Test with real users** - Multiple matches, different sports
2. **Verify accuracy** - Rating changes make sense
3. **Check performance** - No slowdowns with rating calculations
4. **Move to Phase 2** - Implement automatic seeding!

---

**Ready to test!** 🚀

Open your app and submit a match - watch the magic happen! ✨
