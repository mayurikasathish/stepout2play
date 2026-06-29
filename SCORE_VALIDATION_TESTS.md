# Score Validation Tests

## Badminton (21 points, deuce at 20, max 30)

### ✅ Valid Scores
- `21-0` to `21-19` - Normal wins (opponent < 20)
- `22-20` - Deuce win with 2-point lead
- `23-21` - Extended deuce
- `24-22`, `25-23`, `26-24`, `27-25`, `28-26`, `29-27` - Valid deuce progression
- `30-28`, `30-29` - Maximum score wins

### ❌ Invalid Scores
- `20-18` - Neither reached 21
- `21-20` - Winner at 21 but opponent at 20 (deuce zone, needs 2-point lead)
- `21-21` - Tie (not possible, must lead by 2 in deuce)
- `22-21` - Only 1-point lead in deuce (need 2)
- `25-20` - Winner at 25 but opponent at 20 (should be 22-20 at minimum)
- `30-27` - Exceeds 2-point lead at max (max is 30-28)
- `31-29` - Exceeds maximum score of 30
- `32-21` - Way over maximum

---

## Table Tennis (11 points, deuce at 10, no max)

### ✅ Valid Scores
- `11-0` to `11-9` - Normal wins (opponent < 10)
- `12-10` - Deuce win with 2-point lead
- `13-11`, `14-12`, `15-13` - Extended deuce (no limit)
- `20-18`, `25-23` - Very extended deuce (valid!)

### ❌ Invalid Scores
- `10-8` - Neither reached 11
- `11-10` - Winner at 11 but opponent at 10 (deuce zone, needs 2-point lead)
- `11-11` - Tie (not possible)
- `12-11` - Only 1-point lead in deuce
- `13-10` - Jump from 10 to 13 without proper deuce progression

---

## Squash (11 points, deuce at 10, no max)

Same rules as Table Tennis.

### ✅ Valid Scores
- `11-0` to `11-9` - Normal wins
- `12-10`, `13-11`, `14-12` - Deuce wins
- Extended deuce with 2-point lead (no max)

### ❌ Invalid Scores
- `10-8` - Neither reached 11
- `11-10` - Deuce zone without 2-point lead
- `12-11` - Only 1-point lead

---

## Pickleball (11 points, deuce at 10, max 15)

### ✅ Valid Scores
- `11-0` to `11-9` - Normal wins (opponent < 10)
- `12-10` - Deuce win with 2-point lead
- `13-11`, `14-12` - Extended deuce
- `15-13` - Maximum score win

### ❌ Invalid Scores
- `10-8` - Neither reached 11
- `11-10` - Deuce zone without 2-point lead
- `15-12` - Exceeds 2-point lead at max (max is 15-13)
- `16-14` - Exceeds maximum score of 15

---

## Implementation Details

### Backend Validation
Location: `src/utils/scoreValidator.js`
- `validateGameScore(p1Score, p2Score, rules)` - Validates individual game/set
- `validateMatchScore(scoreString, rules)` - Validates complete match score string
- `getSportValidationHelp(sportId, rules)` - Returns human-readable error message

Used in:
- `src/services/bracket.service.js` - Lines ~930 and ~470

### Frontend Validation
Location: `client/src/utils/scoreValidator.js`
- Same functions as backend for consistency

Used in:
- `client/src/components/BracketView.jsx` - `validateSetScore()` function

### Validation Rules Logic

1. **Normal Win** (opponent < deuceStartsAt):
   - Winner must score exactly `pointsPerSet`
   - Example: Badminton 21-19 ✅, 22-19 ❌

2. **Deuce Situation** (both >= deuceStartsAt):
   - Winner must lead by `minimumLead` (usually 2)
   - Cannot exceed `maxPoints` if defined
   - Example: Badminton 22-20 ✅, 21-20 ❌, 31-29 ❌

3. **Maximum Score** (if defined):
   - Neither player can exceed `maxPoints`
   - At `maxPoints`, opponent must be exactly `maxPoints - minimumLead`
   - Example: Badminton 30-29 ✅, 30-27 ❌

---

## Testing Procedure

### Manual Test Cases

1. **Badminton Event:**
   - Try score `32-21` → Should reject with clear error
   - Try score `21-20` → Should reject (deuce zone error)
   - Try score `30-29` → Should accept
   - Try score `21-15` → Should accept

2. **Table Tennis Event:**
   - Try score `11-10` → Should reject (deuce zone)
   - Try score `12-10` → Should accept
   - Try score `20-18` → Should accept (no max limit)

3. **Check Error Messages:**
   - Should show sport-specific rules
   - Should explain deuce situation
   - Should show maximum score if applicable

### Backend Test (cURL)
```bash
# Try invalid badminton score
curl -X PATCH http://localhost:3001/api/matches/{matchId}/result \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"winnerId": "{winnerId}", "score": "32-21"}'

# Expected: 400 error with detailed validation message
```

### Frontend Test
1. Create a badminton event
2. Generate bracket
3. Open match result modal
4. Enter invalid score like "32-21"
5. Click "Save Set 1"
6. Should show validation error immediately

---

## Future Enhancements

1. ✅ Add real-time validation as user types
2. Add visual indicator for deuce situations
3. Show example valid scores in UI
4. Add "suggestion" feature: if user enters 21-20, suggest 22-20 or 21-19
5. Track common validation errors for analytics
