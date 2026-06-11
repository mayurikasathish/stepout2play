# 🚀 Quick Start - Doubles Registration

## Test It Right Now!

### 1. Create Test Users (30 seconds)
```bash
node test-doubles.js
```

### 2. Start Servers
```bash
# Terminal 1 - Backend
npm start

# Terminal 2 - Frontend
cd client && npm run dev
```

### 3. Test the Feature (2 minutes)

#### ✅ Test Case 1: Mixed Doubles Success
1. Open http://localhost:5173
2. Login: `male1@test.com` / `Test123!@#`
3. Go to Browse → Find any tournament
4. Click "Register" on a Mixed Doubles event
5. Enter partner email: `female1@test.com`
6. Click "Find Partner"
7. ✅ Should show: "Both Players Eligible!"
8. Click "Confirm & Register"
9. ✅ Success!

#### ❌ Test Case 2: Gender Mismatch
1. Same login: `male1@test.com`
2. Click "Register" on Mixed Doubles
3. Enter partner email: `male2@test.com`
4. Click "Find Partner"
5. ❌ Should show: "Mixed Doubles requires one male and one female player"

## Test Users Cheat Sheet

| Email | Password | Gender | Age | Notes |
|-------|----------|--------|-----|-------|
| `male1@test.com` | `Test123!@#` | Male | 31 | Perfect for Mixed Doubles |
| `female1@test.com` | `Test123!@#` | Female | 28 | Perfect for Mixed Doubles |
| `male2@test.com` | `Test123!@#` | Male | 16 | Too young for some events |
| `female2@test.com` | `Test123!@#` | Female | 34 | Perfect for Women's Doubles |

## Quick Commands

```bash
# View all users
node view-db.js

# View database schema
node view-schema.js

# View authentication summary
cat AUTH_FIX_SUMMARY.md

# View full doubles guide
cat DOUBLES_REGISTRATION_GUIDE.md
```

## What to Look For

### ✅ Success Indicators
- Green success badge "Both Players Eligible! ✓"
- Partner profile shows with name, age, gender
- "Confirm & Register" button appears
- Registration successful message

### ❌ Error Indicators
- Red error badge "Not Eligible"
- Clear bullet list of reasons
- "Try Different Partner" button
- No registration created

## Common Test Scenarios

### 🎯 Scenario Matrix

| Your Account | Partner Account | Event Type | Expected Result |
|-------------|-----------------|------------|-----------------|
| male1 | female1 | Mixed Doubles | ✅ Success |
| male1 | male2 | Mixed Doubles | ❌ Same gender |
| female1 | female2 | Women's Doubles | ✅ Success |
| female1 | male1 | Women's Doubles | ❌ Wrong gender |
| male1 | male2 | Men's Doubles | ✅ Success |

## Troubleshooting

### Issue: Partner not found
**Fix**: Make sure partner account exists. Run `node view-db.js` to verify.

### Issue: Modal doesn't open
**Fix**: Check browser console (F12) for errors. Verify API is running on port 3001.

### Issue: Always shows "Not Eligible"
**Fix**: 
1. Verify both users have DOB and gender set
2. Check event requirements (category, gender)
3. Run `node view-db.js` to inspect user profiles

### Issue: Can't create tournament/events
**Fix**: You need an organization first. The demo user already has one (MARENA).

## API Quick Test

```bash
# Get auth token (replace with actual credentials)
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"male1@test.com","password":"Test123!@#"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Search for partner
curl -X POST http://localhost:3001/api/events/EVENT_ID/search-partner \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"female1@test.com"}'

# Verify partner
curl -X POST http://localhost:3001/api/events/EVENT_ID/verify-partner \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"partnerId":"PARTNER_ID"}'
```

## Files to Check

| File | Purpose |
|------|---------|
| `IMPLEMENTATION_SUMMARY.md` | Complete overview |
| `DOUBLES_REGISTRATION_GUIDE.md` | Detailed documentation |
| `AUTH_FIX_SUMMARY.md` | Authentication fixes |
| `test-doubles.js` | Create test users |
| `view-db.js` | Inspect database |

## Next Steps

1. ✅ Test all scenarios above
2. ✅ Create a real tournament with Doubles events
3. ✅ Register multiple pairs
4. ✅ Check registration list in tournament management
5. ✅ Verify partner relationships in database

## Support

If something doesn't work:
1. Check browser console (F12)
2. Check server logs
3. Run `node view-db.js`
4. Read `DOUBLES_REGISTRATION_GUIDE.md` → Troubleshooting section

---

**Ready to test? Run `node test-doubles.js` and get started! 🎉**
