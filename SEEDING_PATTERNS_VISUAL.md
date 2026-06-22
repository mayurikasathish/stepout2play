# Visual Guide: How Each Seeding Method Works

## Round Robin (12 participants, 3 groups)

### Registration Order (Round-Robin Distribution)
```
Participants: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12

Distribution pattern: 1→A, 2→B, 3→C, 4→A, 5→B, 6→C...

┌─────────────┬─────────────┬─────────────┐
│  Group A    │  Group B    │  Group C    │
├─────────────┼─────────────┼─────────────┤
│  P1  (1st)  │  P2  (2nd)  │  P3  (3rd)  │
│  P4  (4th)  │  P5  (5th)  │  P6  (6th)  │
│  P7  (7th)  │  P8  (8th)  │  P9  (9th)  │
│  P10 (10th) │  P11 (11th) │  P12 (12th) │
└─────────────┴─────────────┴─────────────┘
```

### Snake Seeding (Zigzag Pattern)
```
Seeds: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12

Distribution: 1→A, 2→B, 3→C, 4→C, 5→B, 6→A, 7→A, 8→B, 9→C...
             (forward)      (backward)     (forward again)

┌─────────────┬─────────────┬─────────────┐
│  Group A    │  Group B    │  Group C    │
├─────────────┼─────────────┼─────────────┤
│  Seed 1 ★   │  Seed 2 ★   │  Seed 3 ★   │  ← Top seeds spread
│  Seed 6     │  Seed 5     │  Seed 4     │  ← Zigzag back
│  Seed 7     │  Seed 8     │  Seed 9     │  ← Forward again
│  Seed 12    │  Seed 11    │  Seed 10    │  ← Back again
└─────────────┴─────────────┴─────────────┘

Advantage: Strongest players (1, 2, 3) in different groups!
```

### Random Seeding
```
Result 1:                      Result 2 (different):
┌─────────────┐               ┌─────────────┐
│  Group A    │               │  Group A    │
│  P8, P3,    │               │  P1, P11,   │
│  P12, P5    │               │  P4, P9     │
├─────────────┤               ├─────────────┤
│  Group B    │               │  Group B    │
│  P1, P9,    │               │  P7, P2,    │
│  P6, P11    │               │  P5, P12    │
├─────────────┤               ├─────────────┤
│  Group C    │               │  Group C    │
│  P7, P2,    │               │  P3, P8,    │
│  P4, P10    │               │  P10, P6    │
└─────────────┘               └─────────────┘
```

---

## Knockout (8 participants)

### Standard Bracket Seeding Pattern
```
Seeds: 1, 2, 3, 4, 5, 6, 7, 8

Round 1          Semifinals      Final        Champion
┌──────────┐
│ Seed 1 ★ │────┐
└──────────┘    │ 
                ├─────────┐
┌──────────┐    │         │
│ Seed 8   │────┘         │
└──────────┘              │
                          ├─────────► 🏆
┌──────────┐              │
│ Seed 4   │────┐         │
└──────────┘    │         │
                ├─────────┘
┌──────────┐    │
│ Seed 5   │────┘
└──────────┘


┌──────────┐
│ Seed 2 ★ │────┐
└──────────┘    │
                ├─────────┐
┌──────────┐    │         │
│ Seed 7   │────┘         │
└──────────┘              │
                          │
┌──────────┐              │
│ Seed 3   │────┐         │
└──────────┘    │         │
                ├─────────┘
┌──────────┐    │
│ Seed 6   │────┘
└──────────┘

Why this pattern?
- Seed 1 (strongest) vs Seed 8 (weakest)
- Seed 2 vs Seed 7
- Protects top seeds from meeting early
- Seeds 1 & 2 can only meet in final
```

### Registration Order Knockout
```
First 8 registrants become Seeds 1-8:
- 1st registered → Seed 1 (top bracket position)
- 2nd registered → Seed 2 (bottom bracket position)
- 3rd registered → Seed 3
- etc.

Then uses standard bracket pattern above.
```

### Manual Seeding Knockout
```
Use YOUR seed numbers:
- Participant with seedNumber=1 → top position
- Participant with seedNumber=2 → bottom position
- etc.

Then uses standard bracket pattern.

Example:
If you set:
  - Alice: seedNumber = 1
  - Bob: seedNumber = 2
  - Charlie: seedNumber = 8

Bracket will be:
  Round 1, Match 1: Alice vs Charlie
  (Seed 1 vs Seed 8)
```

### Random Knockout
```
Shuffle all participants randomly, then:
- Random[0] → Seed 1 position
- Random[1] → Seed 2 position
- etc.

Then uses standard bracket pattern.

Different matchups every time!
```

---

## When to Use Each Method

### 📝 Registration Order
**Use when:** First-come-first-served is fair
- Example: Casual tournament, all similar skill levels
- Encourages early registration

### 🎲 Random
**Use when:** You want completely random matchups
- Example: Fun tournament, friendly competition
- No prior ranking available

### 🎯 Manual
**Use when:** You have player rankings/ratings
- Example: Competitive tournament with seeded players
- You have previous results/rankings
- **Must set seed numbers first!**

### 🐍 Snake (Round Robin only)
**Use when:** You want balanced groups with manual seeding
- Example: Round robin with ranked players
- Ensures top seeds don't meet in group stage
- Spreads strong players across different groups

---

## Quick Reference

| Seeding Method    | Knockout | Round Robin | Needs Setup? |
|-------------------|----------|-------------|--------------|
| Registration Order| ✅       | ✅          | No           |
| Random            | ✅       | ✅          | No           |
| Manual            | ✅       | ✅          | Yes (seeds)  |
| Snake             | ❌       | ✅          | Yes (seeds)  |

---

## Testing Tip

**To verify seeding is working:**
1. Create test participants with recognizable names (A, B, C, D, E, F, G, H)
2. Register them in order A→B→C→D→E→F→G→H
3. Generate bracket with different seeding methods
4. Check if placement matches the patterns above

**Expected for 8 participants, Knockout, Registration Order:**
- Round 1, Match 1: A vs H (first vs last registered)
- Round 1, Match 2: D vs E (middle registrants)
- Round 1, Match 3: B vs G (2nd vs 7th)
- Round 1, Match 4: C vs F (3rd vs 6th)
