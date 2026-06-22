# Seeding Methods Analysis & Issues Found

## Current Flow
1. User selects seeding method in UI
2. `generateBracket()` applies seeding method (lines 46-55)
3. Seeded participants are passed to format-specific generator
4. Format generator distributes participants into bracket/groups

## Issues Found 🔴

### Issue 1: SNAKE Seeding Logic Error
**Problem**: Line 52 applies snake seeding BEFORE passing to round robin generator:
```javascript
} else if (seedingMethod === 'SNAKE') {
  seededParticipants = this.applySeedingSnake(event.registrations, options.groupSize || 4);
}
```

But `applySeedingSnake()` (lines 602-606) **does nothing** - it just returns the array as-is:
```javascript
applySeedingSnake(registrations, groupCount) {
  // For snake seeding, keep original order — actual distribution is done
  // by _snakeIndex() during group assignment in generateRoundRobinBracket
  return [...registrations];
}
```

Then in `generateRoundRobinBracket()` (lines 89-103), there's logic that checks:
```javascript
if (seedingMethod === 'SNAKE') {
  // Use snake distribution
} else {
  // Use round-robin distribution
}
```

**This is correct!** Snake distribution should happen during group assignment, not during seeding. ✅

### Issue 2: SNAKE Seeding Only Works for Round Robin
**Problem**: If user selects SNAKE seeding for SINGLE_ELIMINATION (knockout), it will:
1. Call `applySeedingSnake()` which returns participants unchanged
2. Pass to knockout generator which uses standard bracket seeding
3. Snake seeding has no effect on knockout brackets

**Fix needed**: Prevent SNAKE selection for knockout brackets in the UI, or show error.

### Issue 3: Manual Seeding Validation Missing
**Problem**: If user selects MANUAL seeding but hasn't set seed numbers:
- `applySeedingManual()` will put all null seeds at the end
- Participants without seed numbers will be randomly ordered
- No warning or error shown to user

**Fix needed**: Validate that seed numbers are set before allowing manual seeding.

## Seeding Method Breakdown

### ✅ REGISTRATION_ORDER (Works for both formats)
- **Code**: Uses `event.registrations` as-is (line 54)
- **Knockout**: First registered = Seed 1, goes to top of bracket
- **Round Robin**: First registered = first in Group A, second in Group B, etc.
- **Status**: ✅ CORRECT

### ✅ RANDOM (Works for both formats)
- **Code**: `applySeedingRandom()` (lines 593-600) - Fisher-Yates shuffle
- **Knockout**: Randomly shuffled participants fill bracket
- **Round Robin**: Randomly shuffled participants distributed to groups
- **Status**: ✅ CORRECT

### ⚠️ MANUAL (Works but needs validation)
- **Code**: `applySeedingManual()` (lines 585-591) - sorts by seedNumber
- **Knockout**: Participants ordered by seedNumber, then standard bracket placement
- **Round Robin**: Participants ordered by seedNumber, then distributed to groups
- **Issue**: No validation that seedNumber is set
- **Status**: ⚠️ NEEDS VALIDATION

### ⚠️ SNAKE (Only works for Round Robin)
- **Code**: Snake distribution in `generateRoundRobinBracket()` (lines 89-103)
- **Knockout**: NOT SUPPORTED - snake has no meaning in single elimination
- **Round Robin**: Zigzag distribution (1→A, 2→B, 3→C, 4→C, 5→B, 6→A)
- **Issue**: Should be hidden for knockout format
- **Status**: ⚠️ NEEDS UI FIX (already done in UI, but need to verify)

## Testing Checklist

### Round Robin Format
- [ ] REGISTRATION_ORDER: First registered should be first in Group A
- [ ] RANDOM: Order should be different each time
- [ ] MANUAL: Should order by seed numbers (need to set them first)
- [ ] SNAKE: Should create zigzag pattern (strongest seeds spread across groups)

### Knockout Format
- [ ] REGISTRATION_ORDER: Seed 1 at top, proper bracket distribution
- [ ] RANDOM: Different matchups each time
- [ ] MANUAL: Should follow standard bracket seeding based on seed numbers
- [ ] SNAKE: Should not be available (check UI)

## Recommended Fixes

### Fix 1: Add Manual Seeding Validation
```javascript
applySeedingManual(registrations) {
  const withSeeds = registrations.filter(r => r.seedNumber !== null);
  const withoutSeeds = registrations.filter(r => r.seedNumber === null);
  
  if (withoutSeeds.length > 0) {
    const error = new Error(
      `Manual seeding requires all participants to have seed numbers. ` +
      `${withoutSeeds.length} participant(s) missing seed numbers.`
    );
    error.statusCode = 400;
    throw error;
  }
  
  return [...registrations].sort((a, b) => a.seedNumber - b.seedNumber);
}
```

### Fix 2: Verify UI Prevents SNAKE for Knockout
The UI already has `rrOnly: true` flag on SNAKE method (BracketGenerator.jsx line 49).
Need to verify it's actually hidden when knockout is selected.

### Fix 3: Document Seeding Behavior
Add tooltips/help text explaining what each seeding method does for each format.
