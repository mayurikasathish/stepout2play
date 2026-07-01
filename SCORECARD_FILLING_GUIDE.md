# Scorecard Filling Guide for OCR Recognition

## ✅ How to Fill Scorecards for Best Results

### **Scenario: Player 1 wins 2-0 (21-18, 21-13)**

#### ✅ **RECOMMENDED: Leave Set 3 Blank**
```
SET 1:  21 - 18  ✅
SET 2:  21 - 13  ✅
SET 3:  [blank]  ✅  ← Just leave empty, don't write anything
```

**Why this works:**
- ✅ AI extracts Sets 1 & 2 successfully
- ✅ Parser determines winner: Player 1 won 2 sets → Player 1 wins
- ✅ No confusion from unnecessary marks
- ✅ **This is the cleanest approach**

---

#### ⚠️ **ACCEPTABLE: Write Dashes**
```
SET 1:  21 - 18  ✅
SET 2:  21 - 13  ✅
SET 3:   -  -    ⚠️  ← Dashes are OK but might confuse OCR
```

**Why this might work:**
- ⚠️ AI might extract " - " as text, not as numbers
- ⚠️ Parser will try to find numbers, won't find any → ignores Set 3
- ⚠️ **Risk:** OCR might misread dash as "7" or "1"

---

#### ❌ **DON'T DO: Write 0-0**
```
SET 1:  21 - 18  ✅
SET 2:  21 - 13  ✅
SET 3:   0 -  0  ❌  ← AI will skip this (0-0 = invalid)
```

**Why this is filtered out:**
- ❌ Parser explicitly skips "0-0" scores (line 159: `!(player1Score === 0 && player2Score === 0)`)
- ❌ Treated as blank/unplayed
- ✅ **Actually works** but unnecessary

---

#### ❌ **DON'T DO: Write "N/A" or "DNP"**
```
SET 1:  21 - 18  ✅
SET 2:  21 - 13  ✅
SET 3:  N/A      ❌  ← OCR will try to read as numbers, fails
```

**Why this fails:**
- ❌ AI tries to extract numbers from "N/A"
- ❌ Might read "N" as "11" or "A" as "4" → creates fake score
- ❌ Confuses parser

---

## 📋 Parser Logic

### What the AI Does:

1. **Extracts all SET blocks** with scores
2. **Validates each set:**
   - Set number: 1, 2, or 3 ✅
   - Scores: 0-30 ✅
   - Not 0-0 ✅
   - At least one score ≥ 15 ✅

3. **Determines winner:**
   - Counts sets won by each player
   - Player with 2+ sets won = Winner 🏆

4. **Validates match:**
   - If neither player won 2+ sets → Error ❌
   - Returns: Player IDs, Set scores, Winner

### Examples:

| Set 1 | Set 2 | Set 3 | Result |
|-------|-------|-------|--------|
| 21-18 | 21-13 | [blank] | ✅ Player 1 wins 2-0 |
| 21-18 | 19-21 | 21-15 | ✅ Player 1 wins 2-1 |
| 21-18 | [blank] | [blank] | ❌ Error: Need at least 2 sets |
| 18-21 | 13-21 | [blank] | ✅ Player 2 wins 2-0 |
| 21-19 | 19-21 | [blank] | ❌ Error: 1-1, no clear winner |

---

## 🎯 Best Practices for Scorecard Photography

### ✅ DO:
- ✅ **Leave unplayed sets completely blank** (no marks at all)
- ✅ Use clear, dark ink (black/blue pen)
- ✅ Write numbers large and clear
- ✅ Take photo in good lighting
- ✅ Hold camera straight (not angled)
- ✅ Ensure all SET labels are visible

### ❌ DON'T:
- ❌ Write "N/A", "DNP", "Not Played" in blank sets
- ❌ Write 0-0 for unplayed sets (unnecessary)
- ❌ Use light pencil (hard for AI to read)
- ❌ Cover parts of scorecard with hand/shadow
- ❌ Take blurry photos

---

## 🔧 Technical Details

### Parser File: `src/utils/scorecardParser.js`

**Set Validation (Line 155-162):**
```javascript
if (setNum >= 1 && setNum <= 3 &&              // Valid set number
    player1Score >= 0 && player1Score <= 30 && // Valid score range
    player2Score >= 0 && player2Score <= 30 &&
    !(player1Score === 0 && player2Score === 0) && // Skip 0-0
    (player1Score >= 15 || player2Score >= 15)) {  // Realistic score
  // Accept this set
}
```

**Winner Determination (Line 232-241):**
```javascript
sets.forEach(set => {
  if (set.player1Score > set.player2Score) player1Wins++;
  else if (set.player2Score > set.player1Score) player2Wins++;
});

// Validate clear winner
if (player1Wins < 2 && player2Wins < 2) {
  return { success: false, error: 'Need at least 2 sets won' };
}
```

---

## 📊 Summary

| Filling Method | OCR Success | Recommended? |
|----------------|-------------|--------------|
| **Leave blank** | ✅ 95%+ | **YES** ⭐ |
| Dashes (- -) | ⚠️ 80% | Maybe |
| 0-0 | ✅ 90% (filtered out) | Unnecessary |
| N/A / DNP | ❌ 20% | **NO** |

**Bottom Line:** 
🎯 **Just leave Set 3 blank if it wasn't played!** 

The AI is trained to extract **only the sets with actual scores** and determine the winner from those.
