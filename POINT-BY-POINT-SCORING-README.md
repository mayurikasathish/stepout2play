# 🎯 Point-by-Point Scoring System

## ✅ What's Been Built:

### **New Universal Scoring Modal**
- **File:** `client/src/components/UniversalScoreModal.jsx`
- **Supports:** Badminton, Table Tennis, Pickleball, Squash
- **Features:**
  - ✅ Point-by-point scoring (click +Point for each point)
  - ✅ Tracks EVERY point in history
  - ✅ Auto-handles sport-specific rules
  - ✅ Undo last point functionality
  - ✅ Auto-advances to next set when set is won
  - ✅ Auto-detects match winner

### **Sport Rules Implemented:**

| Sport | Points to Win | Win By | Special Rule |
|-------|---------------|--------|--------------|
| **Badminton** | 21 | 2 | Cap at 30 (29-30/30-29 possible) |
| **Table Tennis** | 11 | 2 | Unlimited deuce |
| **Pickleball** | 11 | 2 | Unlimited deuce |
| **Squash** | 11 | 2 | Unlimited deuce |
| **Tennis** | Game/Set | - | Already done (uses TennisScoreModal) |
| **Padel** | Game/Set | - | Already done (uses TennisScoreModal) |

---

## 🚀 Setup Instructions:

### **Step 1: Reset Ratings & Delete Old Matches**

**⚠️ IMPORTANT:** This deletes ALL completed matches and resets ALL ratings to 1200!

```bash
node reset-ratings-and-matches.js
```

**What it does:**
- Deletes all completed matches
- Deletes all rating history
- Resets all player ratings to 1200
- Resets RD to 350, match counts to 0

**Wait 5 seconds to cancel if needed (Ctrl+C)**

### **Step 2: Restart Backend**

```bash
npm run dev
```

### **Step 3: Restart Frontend**

```bash
cd client
npm run dev
```

### **Step 4: Test It!**

1. Go to any event's bracket page
2. Click "Edit Score" on a match
3. You'll see the new point-by-point modal!
4. Click "+Point" for each player as they score
5. Watch it auto-advance through sets
6. When match is won, click "Finalize Match"

---

## 📊 How It Works:

### **Point History Storage:**

When you save a match, the `pointHistory` is stored as JSON:

```json
{
  "winnerId": "abc-123",
  "score": "21-15, 21-10",
  "pointHistory": "[
    {\"timestamp\":\"2024-01-15T10:00:01Z\",\"set\":1,\"player\":\"p1\",\"score\":{\"p1\":1,\"p2\":0}},
    {\"timestamp\":\"2024-01-15T10:00:15Z\",\"set\":1,\"player\":\"p2\",\"score\":{\"p1\":1,\"p2\":1}},
    ...
  ]"
}
```

This allows:
- ✅ Replay match point-by-point
- ✅ Analytics on scoring patterns
- ✅ Live updates (future feature)

### **Score Display:**

- **Simple:** "21-15, 21-10" (Badminton, TT, etc.)
- **Tennis:** "6-4, 7-6(3)" (already done)

---

## 🎮 Usage Example:

### **Badminton Match:**

1. **Start:** 0-0
2. **Player 1 scores:** Click "+Point" under Player 1 → 1-0
3. **Player 2 scores:** Click "+Point" under Player 2 → 1-1
4. **Continue...** → 20-20 (deuce)
5. **Player 1 scores:** 21-20 (not won yet, need 2 lead)
6. **Player 1 scores again:** 22-20 → **Set 1 Won!**
7. **Auto-advances to Set 2:** 0-0
8. **Continue Set 2...** → 21-15 → **Set 2 Won!**
9. **Match Winner:** Player 1 wins 2-0
10. **Click "Finalize Match"** → Saves to database

### **Special Case - Badminton 29-30:**

- Score reaches 29-29
- Player 1 scores → 30-29 → **Player 1 WINS** (30 is max)
- Can't go to 30-30 (cap at 30)

---

## 🔍 Technical Details:

### **Modal Component:**

```jsx
<UniversalScoreModal
  match={matchData}
  event={eventData}
  isRoundRobin={false}
  onClose={() => {}}
  onSubmit={(data) => {
    // data.winnerId
    // data.score (string: "21-15, 21-10")
    // data.pointHistory (JSON string)
  }}
/>
```

### **Sport Rules Function:**

```javascript
getSportRules(sportId, event)
// Returns: { name, bestOf, pointsToWin, minimumLead, maxScore }
```

### **State Management:**

- `currentSet` - Which set is being played
- `p1Score, p2Score` - Current points in this set
- `p1SetsWon, p2SetsWon` - Sets won
- `completedSets` - [{p1: 21, p2: 15}, ...]
- `pointHistory` - Every single point scored
- `matchWinner` - Set when match is won

### **Undo Functionality:**

- Removes last point from history
- Rebuilds entire state from remaining history
- Can undo back to 0-0 if needed

---

## 🎯 What's Next (Future):

### **Live Updates (Not Built Yet):**
- WebSockets or polling
- Live page shows points updating in real-time
- Multiple spectators see same score live

### **Analytics (Not Built Yet):**
- Scoring patterns
- "Player X is stronger in Set 2"
- Momentum swings

### **Replay (Not Built Yet):**
- Watch match point-by-point
- Show timeline of scoring

---

## ✅ Testing Checklist:

- [ ] Run `node reset-ratings-and-matches.js`
- [ ] Confirm old matches deleted
- [ ] Confirm ratings reset to 1200
- [ ] Restart backend + frontend
- [ ] Open bracket page
- [ ] Click Edit Score on a match
- [ ] See new point-by-point modal
- [ ] Test adding points
- [ ] Test undo
- [ ] Test set completion (auto-advance)
- [ ] Test match completion
- [ ] Test Badminton 30-point cap
- [ ] Test Table Tennis unlimited deuce
- [ ] Finalize match
- [ ] Check score displays correctly on bracket

---

## 🐛 Known Limitations:

1. **No live updates yet** - Must refresh page to see score changes
2. **Tennis/Padel still use old modal** - That's intentional, they work differently
3. **Can't edit existing matches** - Only works for new matches
4. **No resume** - If you close modal, progress is lost (could add later)

---

## 🎉 Ready to Use!

Run the reset script and start scoring matches point-by-point! 🚀

All sports now track every single point for ultimate accuracy and future live updates!
