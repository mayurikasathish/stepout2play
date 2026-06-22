# Seeding Methods Test Plan

## Test Setup
Create a test event with known participants to verify seeding works correctly.

### Test Data Setup
1. Create an event with 8 participants (for knockout) or 12 participants (for round robin)
2. Note down the registration order (who registered first, second, etc.)
3. For manual seeding tests, set seed numbers 1-8 (or 1-12) in the Registrations tab

## Round Robin Tests (12 participants, 3 groups of 4)

### Test 1: REGISTRATION_ORDER ✅
**Expected Result:**
- Group A: Participants 1, 4, 7, 10 (first, fourth, seventh, tenth registered)
- Group B: Participants 2, 5, 8, 11
- Group C: Participants 3, 6, 9, 12

**How to Verify:**
1. Generate bracket with "Registration Order" seeding
2. Check each group's participants
3. First registered should be in Group A, second in Group B, third in Group C, fourth back to A

**Status:** Should work ✅

---

### Test 2: RANDOM ✅
**Expected Result:**
- Groups should have random distribution
- Running twice should give different results

**How to Verify:**
1. Generate bracket with "Random" seeding - note the groups
2. Delete bracket
3. Generate again with "Random" seeding - should be different

**Status:** Should work ✅

---

### Test 3: MANUAL (with seed numbers set) ✅
**Setup:**
- Go to Registrations tab
- Set seed numbers 1-12 for all participants
- Assign seed 1 to a specific participant you can recognize

**Expected Result:**
- Group A: Seeds 1, 4, 7, 10
- Group B: Seeds 2, 5, 8, 11
- Group C: Seeds 3, 6, 9, 12
- Seed 1 should be in Group A first position

**How to Verify:**
1. Generate bracket with "Manual" seeding
2. Check that the participant with seed 1 is in Group A
3. Check that seeding follows the pattern above

**Status:** Should work ✅ (with new validation)

---

### Test 4: MANUAL (without seed numbers) ⚠️
**Setup:**
- Do NOT set any seed numbers (or leave some blank)

**Expected Result:**
- Should show error: "Manual seeding requires all participants to have seed numbers. X participant(s) are missing seed numbers."
- Bracket should NOT be generated

**How to Verify:**
1. Try to generate bracket with "Manual" seeding
2. Should see error message

**Status:** ✅ FIXED (validation added)

---

### Test 5: SNAKE 🔄
**Setup:**
- Set seed numbers 1-12 (so you can track which seed goes where)

**Expected Result:**
- Group A: Seeds 1, 6, 7, 12 (zigzag pattern)
- Group B: Seeds 2, 5, 8, 11
- Group C: Seeds 3, 4, 9, 10
- Strongest seeds (1, 2, 3) should be in different groups

**How to Verify:**
1. Generate bracket with "Snake Seeding"
2. Check group assignments follow zigzag pattern
3. Verify top 3 seeds are in different groups

**Status:** Should work ✅

---

## Knockout Tests (8 participants = 3 rounds)

### Test 6: REGISTRATION_ORDER ✅
**Expected Result:**
- Bracket follows standard seeding pattern
- Seed 1 (first registered) at top
- Seed 2 at bottom
- Seeds 1 and 2 should meet in the final if both win

**Standard 8-player bracket matchups (Round 1):**
- Match 1: Seed 1 vs Seed 8
- Match 2: Seed 4 vs Seed 5
- Match 3: Seed 2 vs Seed 7
- Match 4: Seed 3 vs Seed 6

**How to Verify:**
1. Generate knockout bracket with "Registration Order"
2. Check Round 1 matchups
3. First registered should play eighth registered in Match 1

**Status:** Should work ✅

---

### Test 7: RANDOM (Knockout) ✅
**Expected Result:**
- Random bracket placement
- Different results each time

**How to Verify:**
1. Generate knockout bracket with "Random" seeding
2. Note the matchups
3. Delete and regenerate - should be different

**Status:** Should work ✅

---

### Test 8: MANUAL (Knockout with seed numbers) ✅
**Setup:**
- Set seed numbers 1-8

**Expected Result:**
- Bracket should follow standard seeding based on manual seeds
- Same pattern as Test 6, but using your manual seed numbers
- Seed 1 at top, Seed 2 at bottom

**How to Verify:**
1. Generate knockout bracket with "Manual" seeding
2. Participant with seed 1 should be at top of bracket
3. Should follow standard bracket seeding pattern

**Status:** Should work ✅

---

### Test 9: SNAKE option should be hidden for Knockout 🚫
**Expected Result:**
- When "Knockout" format is selected
- "Snake Seeding" option should NOT appear in the list

**How to Verify:**
1. Select "Knockout" format
2. Check seeding method options
3. Should only see: Registration Order, Random, Manual

**Status:** ✅ Already implemented (line 70 in BracketGenerator.jsx)

---

## Edge Cases to Test

### Test 10: Odd Number of Participants (Round Robin)
**Setup:** 11 participants, 3 groups

**Expected Result:**
- Groups of 4, 4, 3 (or similar balanced split)
- No errors or crashes

---

### Test 11: Odd Number of Participants (Knockout)
**Setup:** 13 participants

**Expected Result:**
- Bracket rounds up to 16 slots
- 3 bye matches created
- Byes automatically advance winners

---

### Test 12: Manual with Duplicate Seeds ⚠️
**Setup:**
- Set seed number 1 for two different participants

**Expected Result:**
- Should show error: "Duplicate seed numbers found. Each participant must have a unique seed number."

**Status:** ✅ FIXED (validation added)

---

## Quick Test Checklist

### Round Robin (12 participants)
- [ ] Registration Order: First in Group A ✅
- [ ] Random: Different each time ✅
- [ ] Manual (with seeds): Seed 1 in Group A ✅
- [ ] Manual (no seeds): Shows error ✅
- [ ] Snake: Top seeds spread across groups ✅

### Knockout (8 participants)
- [ ] Registration Order: Seed 1 vs 8 in first match ✅
- [ ] Random: Different each time ✅
- [ ] Manual (with seeds): Proper bracket seeding ✅
- [ ] Snake option hidden ✅

## Summary of Fixes Applied

1. ✅ **Manual Seeding Validation**: Now checks that all participants have seed numbers
2. ✅ **Duplicate Seed Detection**: Prevents duplicate seed numbers
3. ✅ **Round Robin Distribution**: Fixed to balance groups evenly
4. ✅ **Snake Seeding**: Already properly restricted to Round Robin only

All seeding methods should now work correctly! 🎉
