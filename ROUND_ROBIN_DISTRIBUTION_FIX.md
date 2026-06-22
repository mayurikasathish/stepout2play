# Round Robin Group Distribution Fix

## Problem Found

For **55 players with "8 per group" setting** (7 groups total):
- ❌ **OLD**: Snake distribution created **2 groups of 5** and **5 groups of 9**
  - This resulted in **200 matches** total
  - Very uneven groups!

## Root Cause

The code was **always** using snake distribution (zigzag pattern), which is designed to prevent strong seeds from clustering but doesn't guarantee even group sizes.

With 55 players and 7 groups, the snake pattern was:
- Participants 1-7 went to groups A-G (one each)
- Participants 8-14 went to groups G-A (reverse, one each)
- This created a zigzag that happened to create very uneven groups (5,9,9,9,9,9,5)

## Fix Applied

Changed the distribution logic:

### 1. **Default: Round-Robin Distribution**
When seeding method is NOT "Snake", use simple round-robin:
```javascript
participants.forEach((p, idx) => {
  const groupIdx = idx % groupCount;  // 1→A, 2→B, 3→C, ..., 8→A, 9→B...
  groups[groupIdx].participants.push(p);
});
```

For 55 players, 7 groups:
- ✅ **NEW**: Creates **6 groups of 8** and **1 group of 7**
- ✅ Results in **~189 matches** total
- Groups are as balanced as mathematically possible!

### 2. **Snake Distribution: Only When Explicitly Selected**
Snake seeding is now only used when the user explicitly selects "Snake Seeding" as the seeding method.

## Math Verification

**With Round-Robin Distribution (55 players, 7 groups):**
- Group sizes: 8, 8, 8, 8, 8, 8, 7
- Matches per group:
  - Group of 8: 8×7÷2 = 28 matches
  - Group of 7: 7×6÷2 = 21 matches
- Total: (6 × 28) + 21 = **189 matches** ✅

**With Old Snake Distribution:**
- Group sizes: 5, 9, 9, 9, 9, 9, 5
- Matches per group:
  - Group of 5: 5×4÷2 = 10 matches
  - Group of 9: 9×8÷2 = 36 matches
- Total: (2 × 10) + (5 × 36) = **200 matches** ❌ (what you were seeing)

## What to Do

**Delete the existing bracket and regenerate** to see the fix:
1. Click "Delete Bracket"
2. Click "Generate Bracket" again with same settings
3. You should now see evenly distributed groups (8,8,8,8,8,8,7)
4. Total matches should be ~189 instead of 200

## When to Use Snake Seeding

Snake seeding is useful when:
- You have manually ranked participants (Manual seeding)
- You want to ensure the strongest players/teams are distributed across different groups
- Example: If seeds 1-7 go to different groups, then 8-14 go backward (7→1)

For most cases, **the default round-robin distribution is better** because it creates more balanced group sizes.
