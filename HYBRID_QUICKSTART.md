# League-cum-Knockout - Quick Start

## 🚀 Setup (Run Once)

### Stop your server, then run:

```powershell
cd C:\Users\vinib\OneDrive\Desktop\stepout2play

# Apply database changes
npx prisma db execute --file add_hybrid_format.sql --schema prisma/schema.prisma

# Regenerate Prisma Client
npx prisma generate

# Restart server
npm run dev
```

## ✅ Done! That's it.

---

## 🎯 How to Use

1. **Go to any event** → Bracket tab
2. **Click "Generate Bracket"**
3. **Select "League-cum-Knockout"** (third option with 🏆 icon)
4. **Configure:**
   - **Groups:** 4 (or 2-16)
   - **Qualifiers per group:** 2 (or 1-4)
   - **Bronze Match:** ✓ Checked (or uncheck)
5. **Choose seeding method** (Registration Order, Random, Manual, or Snake)
6. **Click "Generate League-cum-Knockout Bracket"**

---

## ✨ What You'll Get

### Group Stage
- Participants divided into groups (A, B, C, D...)
- Each group plays round-robin
- Standings track wins/losses/points

### Knockout Stage (Structure Created)
- Empty bracket ready for qualifiers
- Single elimination format
- Optional bronze match for 3rd place

---

## 📌 Valid Configurations

✅ **Good Examples:**
- 16 players → 4 groups × 2 qualifiers = **8 knockout** ✅
- 24 players → 8 groups × 2 qualifiers = **16 knockout** ✅
- 32 players → 8 groups × 4 qualifiers = **32 knockout** ✅

❌ **Invalid Examples:**
- 18 players → 6 groups × 2 qualifiers = **12 knockout** ❌ (not power of 2)
- 20 players → 5 groups × 2 qualifiers = **10 knockout** ❌ (not power of 2)

**Fix:** Adjust groups or qualifiers until knockout size is 4, 8, 16, or 32.

---

## 🎨 What It Looks Like

**Format Selection:**
```
┌──────────────┬──────────────────┬───────────────────────┐
│ ⚡ Knockout   │ 🔄 Round Robin   │ 🏆 League-cum-Knockout│
│              │                  │ [SELECTED]            │
└──────────────┴──────────────────┴───────────────────────┘
```

**Configuration Panel (Purple/Indigo):**
```
┌─────────────────────────────────────────────────┐
│ 🏆 League-cum-Knockout Configuration            │
│ Group stage winners advance to knockout rounds  │
│                                                 │
│ Number of Groups:        [4] groups             │
│ Qualifiers per Group:    [2] advance            │
│ ☑ Include Bronze Match (3rd Place)             │
│                                                 │
│ Summary:                                        │
│ ┌────────────────┬──────────────────┐          │
│ │ Group Stage    │ Knockout Stage   │          │
│ │ 4 groups × ~4  │ 8 advance        │          │
│ └────────────────┴──────────────────┘          │
└─────────────────────────────────────────────────┘
```

---

## 🔍 Troubleshooting

### Error: "Knockout participants must be a power of 2"
**Solution:** Change groups or qualifiers.
- Try: 4 groups × 2 qualifiers = 8 ✅
- Try: 8 groups × 2 qualifiers = 16 ✅

### Error: "prisma.group is undefined"
**Solution:** You forgot to run `npx prisma generate`

### Error: "type BracketFormat does not exist"
**Solution:** Run the migration SQL first

### UI shows old format options
**Solution:** Hard refresh browser (Ctrl+Shift+R) or clear cache

---

## 📚 More Info

- **Full Setup Guide:** `HYBRID_FORMAT_SETUP.md`
- **Implementation Details:** `HYBRID_IMPLEMENTATION_SUMMARY.md`

---

That's it! You now have a professional hybrid tournament format. 🏆
