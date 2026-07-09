# Profile Page Testing Guide

## How to Test Everything Updates After a Match

### Step 1: Go to a Tournament with Matches
1. Navigate to **Browse Tournaments** or **Manage** (if you're an organizer)
2. Find a tournament with an event you're registered in
3. Go to the **Bracket View** for that event

### Step 2: Mark a Match as Live
1. Find a match where you're a participant (should show your name)
2. Click the match card
3. Click **"Mark as Live"** button
4. The match status changes to IN_PROGRESS (red dot appears)

### Step 3: Score the Match Point-by-Point
1. Click the match card again
2. **Universal Score Modal** opens
3. Click **"+ Point"** buttons to score (e.g., Badminton to 21-19, Table Tennis to 11-9)
4. Watch the sets increment automatically
5. When a player wins enough sets, **Match Winner banner** appears
6. Click **"Finalize Match"**

### Step 4: Check Profile Updates
Go to **Profile Page** and verify these updates:

#### ✅ **Sport Ratings** (Top right)
- Rating should change from 1200 → new rating (winner goes up, loser goes down)
- **Matches** count increases by 1
- **Last Match** shows today's date

#### ✅ **Rating Progress Graph**
- New dot appears on the graph
- Line extends to show the rating change
- Tooltip shows: date, new rating, change (+15 or -15)

#### ✅ **Career Highlights** (Below ratings)
- **Matches**: +1
- **Wins**: +1 (if you won)
- **Win Rate**: Recalculated percentage
- **Titles**: +1 (if you won a FINALS match, roundNumber=1)
- **Streak**: Updates to show W1, W2, W3... or L1, L2, etc.
- **Peak Rating**: Shows highest rating ever
- **Best Rank**: Shows your best rank across all sports (e.g., #5)

#### ✅ **Activity Heatmap**
- Today's square gets darker/colored
- Hover shows: "Dec 15: 1 match" (or 2, 3+ if you play more)

#### ✅ **Recent Matches** (Table at bottom)
- New row appears at the top
- Shows: **W/L badge**, **Sport**, **Opponent name**, **Score**, **Tournament**, **Date** ("Today")
- Filter by sport to see only that sport's matches

---

## Quick Test Scenario

**Fastest way to see everything update:**

1. **Create a test tournament** (as organizer)
2. **Register 2 users** (yourself + friend/test account)
3. **Generate bracket** (single elimination)
4. **Mark match as live**
5. **Score it quickly**: Click +Point until someone wins (11-0 for Table Tennis is fastest)
6. **Finalize**
7. **Go to Profile** → Everything updated!

---

## What Updates Real-Time vs. What Needs Refresh

### Auto-Updates (No Refresh Needed):
- Ratings grid (fetches on load)
- Career stats (fetches on load)
- Activity heatmap (fetches on load)
- Recent matches (fetches on load)

### Manual Refresh Needed:
- If you're already on the profile page, **refresh the page** to see new match data
- Graph auto-loads when you switch sports

---

## Expected Rating Changes

Starting from **1200 base rating**:

### First Match:
- **Winner**: ~1200 → 1215 (+15)
- **Loser**: ~1200 → 1185 (-15)

### After 10 Matches (example):
- **Good player (8-2)**: ~1200 → 1280
- **Average player (5-5)**: ~1200 → 1200
- **Struggling player (2-8)**: ~1200 → 1120

### Ranking Example:
If 5 players play matches in Badminton:
- Player A: 1285 → **Rank #1**
- Player B: 1245 → **Rank #2**
- Player C: 1220 → **Rank #3**
- You: 1215 → **Rank #4** ✅ (Shows in Best Rank)
- Player E: 1185 → **Rank #5**

**Best Rank** shows the BEST rank across ALL sports (lowest number = highest rank)

---

## Troubleshooting

### "No ratings showing"
- Make sure you've completed at least 1 match
- Check browser console for errors
- Verify match status is COMPLETED (not IN_PROGRESS)

### "Rank shows —"
- This happens if you're the only player in that sport
- Play matches with others to establish ranks

### "Graph not showing"
- Need at least 2 matches for a meaningful graph
- Try clicking different sport tabs

### "Heatmap all empty"
- Need completed matches
- Only shows last 365 days

---

## Database Check (Optional)

If you want to verify data is saving:

```sql
-- Check your ratings
SELECT * FROM "PlayerRating" WHERE "userId" = 'your-user-id';

-- Check rating changes (match history)
SELECT * FROM "MatchRatingChange" WHERE "userId" = 'your-user-id' ORDER BY "createdAt" DESC LIMIT 10;

-- Check completed matches
SELECT * FROM "Match" WHERE status = 'COMPLETED' ORDER BY "completedAt" DESC LIMIT 10;
```

---

## Success Criteria ✅

After playing 1 match, you should see:
- [x] Rating changed from 1200
- [x] New dot on graph
- [x] Career stats updated (+1 match, win rate calculated)
- [x] Streak shows (W1 or L1)
- [x] Heatmap has today colored
- [x] Recent matches shows the match
- [x] Best rank shows a number (if multiple players exist)

**If all checked = System working perfectly!** 🎉
