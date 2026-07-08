# 🎮 Player Profile Feature - Setup & Testing Guide

## ✅ What Was Built:

### **Backend (Complete):**
1. ✅ `src/controllers/playerProfile.controller.js` - Profile stats, match history, rating history
2. ✅ `src/routes/playerProfile.routes.js` - API routes
3. ✅ Registered in `src/app.js`

### **Frontend (Complete):**
1. ✅ `client/src/pages/PlayerProfilePage.jsx` - Main profile page
2. ✅ `client/src/components/profile/CareerStatsCard.jsx` - Career statistics
3. ✅ `client/src/components/profile/SportRatingCard.jsx` - Per-sport rating with graph
4. ✅ `client/src/components/profile/MatchHistoryTable.jsx` - Match history table
5. ✅ Route registered in `client/src/App.jsx`

---

## 🚀 Setup Instructions:

### **Step 1: Install Chart.js (Required for Rating Graphs)**

```bash
cd client
npm install chart.js react-chartjs-2
```

### **Step 2: Restart Backend Server**

```bash
# In project root
npm run dev
```

### **Step 3: Restart Frontend**

```bash
cd client
npm run dev
```

---

## 📊 Features Implemented:

### **1. Career Stats Dashboard**
Shows:
- ✅ Total Matches Played
- ✅ Win Rate (%)
- ✅ Titles Won (1st place finishes)
- ✅ Tournaments Played
- ✅ Current Streak (per-sport, shown as W5 or L2)

### **2. Per-Sport Rating Cards**
Each sport shows:
- ✅ Current Rating (Glicko-2)
- ✅ Rank (calculated from all players)
- ✅ Wins/Losses for that sport
- ✅ Current Streak (W/L)
- ✅ Win Rate %
- ✅ **Rating History Graph** (expandable line chart showing rating changes over time)

### **3. Match History Table** ⭐⭐⭐⭐⭐
Shows every match:
- ✅ Opponent Name (with profile picture if available)
- ✅ Tournament Name & City
- ✅ Match Score
- ✅ Rating Change (+14, -8, etc.)
- ✅ Result (WIN/LOSS badge)
- ✅ Date
- ✅ Sport emoji & format
- ✅ Filter by sport dropdown
- ✅ Responsive design (mobile + desktop)

---

## 🔗 API Endpoints:

### **1. GET /api/users/:userId/profile-stats**
Returns:
```json
{
  "success": true,
  "sportsStats": [
    {
      "sportId": "badminton",
      "rating": 1342,
      "wins": 12,
      "losses": 5,
      "rank": 3,
      "streak": "W5",
      "matchCount": 17
    }
  ],
  "careerStats": {
    "totalMatches": 45,
    "wins": 30,
    "losses": 15,
    "winRate": 66.7,
    "titles": 3,
    "tournamentsPlayed": 12
  }
}
```

### **2. GET /api/users/:userId/match-history?sportId=badminton&limit=50**
Returns:
```json
{
  "success": true,
  "matchHistory": [
    {
      "matchId": "...",
      "opponent": "John Doe",
      "opponentId": "...",
      "tournament": "Summer Championship",
      "city": "Mumbai",
      "score": "21-15, 21-18",
      "ratingChange": 14,
      "result": "WIN",
      "date": "2024-01-15T...",
      "sportId": "badminton",
      "format": "SINGLES"
    }
  ],
  "total": 25,
  "hasMore": false
}
```

### **3. GET /api/users/:userId/rating-history/:sportId**
Returns:
```json
{
  "success": true,
  "ratingHistory": [
    {
      "rating": 1200,
      "date": "2024-01-01T...",
      "change": 0
    },
    {
      "rating": 1214,
      "date": "2024-01-05T...",
      "change": 14
    }
  ]
}
```

---

## 🧪 How to Test:

### **1. Access Player Profile:**
Navigate to: `http://localhost:5173/players/:userId`

You can get a userId from:
- Your own profile (check localStorage or API response)
- Any player in the database
- Players page (/players)

### **2. Test Features:**

#### **Career Stats:**
- Should show total matches, win rate, titles, tournaments, streak
- Values calculated automatically from existing match data

#### **Sport Rating Cards:**
- Each sport the player has played should show a card
- Click "Rating History" to expand the graph
- Graph shows rating changes over time with tooltips

#### **Match History:**
- Should show all completed matches
- Use sport filter dropdown to filter by specific sport
- Mobile responsive (try on small screen)

### **3. Test with Existing Data:**
The system automatically calculates stats from existing matches!
- No manual data entry needed
- Works for all players who have played matches
- Rating history pulled from `MatchRatingChange` records

---

## 🎨 UI/UX Features:

### **Gradient Effects:**
- Purple/pink gradients for profile pictures
- Sport-specific color coding
- Win/Loss badges with appropriate colors

### **Interactive Elements:**
- Expandable rating graphs
- Hover effects on match rows
- Sport filter dropdown
- Responsive tables (card view on mobile)

### **Icons & Emojis:**
- Sport emojis (🏸 🏓 🎾)
- Trophy icons for titles
- Chart icons for stats
- Profile pictures with fallback initials

---

## 📱 Responsive Design:

### **Desktop:**
- Full table view with all columns
- Side-by-side sport cards (3 per row)
- Expanded graph view

### **Mobile:**
- Card-based match history
- Stacked sport cards
- Collapsed stats
- Touch-friendly buttons

---

## 🔧 Technical Details:

### **Database Models Used:**
- ✅ `PlayerRating` - Current ratings per sport
- ✅ `MatchRatingChange` - Rating history (already being saved!)
- ✅ `Match` - Match results
- ✅ `Registration` - For titles count
- ✅ `User` - Profile info

### **Calculations:**
- **Rank:** Count of players with higher rating in same sport
- **Win Rate:** (wins / total matches) * 100
- **Titles:** Count of `finalPosition = 1` registrations
- **Streak:** Calculated from recent matches in order
- **Per-sport Wins/Losses:** Filtered by sportId

### **No Database Changes Required:**
- ✅ All necessary tables already exist
- ✅ Rating history already being tracked
- ✅ Just needed to expose the data via API

---

## 🎯 Next Steps (Optional Enhancements):

### **Peak Performance Section:**
- Highest rating achieved per sport
- Best tournament finish
- Longest win streak
- Most wins in a single tournament

### **Achievements/Badges:**
- "First Title" badge
- "10 Win Streak" badge
- "Tournament Champion" badge
- "Rating Milestone" badges

### **Head-to-Head Stats:**
- Record against specific opponents
- Recent form (last 5 matches)
- Favorite opponent / nemesis

### **Advanced Graphs:**
- Win rate over time
- Performance by tournament type
- Rating distribution comparison

---

## ✅ Testing Checklist:

- [ ] Install Chart.js: `cd client && npm install chart.js react-chartjs-2`
- [ ] Restart backend server
- [ ] Restart frontend dev server
- [ ] Navigate to `/players/:userId`
- [ ] Check career stats display correctly
- [ ] Check sport rating cards show
- [ ] Click to expand rating graph
- [ ] Verify match history loads
- [ ] Test sport filter dropdown
- [ ] Test on mobile (responsive design)
- [ ] Verify all existing player data shows automatically

---

## 🐛 Troubleshooting:

### **"Chart.js not found" error:**
```bash
cd client
npm install chart.js react-chartjs-2
```

### **No stats showing:**
- Make sure user has played matches
- Check that matches have `status: 'COMPLETED'`
- Verify rating changes were saved

### **Graph not loading:**
- Check browser console for errors
- Verify API endpoint returns data
- Make sure Chart.js is installed

### **404 on profile page:**
- Make sure route is registered in App.jsx
- Use correct URL format: `/players/:userId` (not `/profile/:userId`)

---

## 🎉 Ready to Use!

Once Chart.js is installed, navigate to any player's profile to see:
- 📊 Career statistics
- 🏆 Per-sport ratings with interactive graphs
- 📜 Complete match history

**All data is calculated automatically from existing matches - no manual data entry needed!**
