# Testing Auto-Replacement Flow

## Issue Summary
User clicks email link and:
1. ❌ Link goes to localhost (wrong URL)
2. ❌ No confirmation email received
3. ❌ Organizer not notified
4. ❌ No database update

## How to Debug

### Step 1: Check Server Logs

When you click the link, check your server console for these logs:

```
=== AUTO-REPLACEMENT ATTEMPT ===
EventId: X, UserId: Y, Token: auto
Request URL: /api/accept-replacement/X/Y/auto
```

If you DON'T see these logs → The request isn't reaching your server (wrong URL)

### Step 2: Check Email URL

Look at the email you received. The link should be:

**For local testing:**
```
http://localhost:3001/api/accept-replacement/{eventId}/{userId}/auto
```

**For production:**
```
https://stepout2play-api.onrender.com/api/accept-replacement/{eventId}/{userId}/auto
```

If it shows `localhost` but you're testing production → Need to update `.env` on production server

### Step 3: Test Manually

**Trigger standby notification:**
```bash
curl -X POST http://localhost:3001/api/test-notify-standby \
  -H "Content-Type: application/json" \
  -d '{"eventId": YOUR_EVENT_ID}'
```

Check console for:
```
📧 Generating standby email for [Name] ([Email])
🔗 Auto-replacement URL: [Full URL]
Email sent successfully: [Message ID]
```

### Step 4: Click the Link

After clicking, check console for:
```
Promoting player: [email] (ID: X)
✅ Player promoted successfully in database
Found X organizers to notify
Sending organizer email to: [organizer email]
✅ Organizer email sent to [email]
Sending confirmation email to player: [player email]
✅ Confirmation email sent to [email]
```

### Step 5: Verify Database

```sql
-- Check if player was promoted
SELECT "userId", "isStandby", "status", "standbyPosition"
FROM "Registration"
WHERE "eventId" = YOUR_EVENT_ID AND "userId" = YOUR_USER_ID;

-- Should show:
-- isStandby = false
-- status = 'CONFIRMED'
-- standbyPosition = null
```

## Common Issues & Fixes

### Issue 1: Email has localhost URL but you're on production

**Fix:** Set environment variable on production server:
```bash
API_URL=https://stepout2play-api.onrender.com
```

In Render.com dashboard:
1. Go to your backend service
2. Environment tab
3. Add: `API_URL` = `https://stepout2play-api.onrender.com`
4. Save (will redeploy)

### Issue 2: Email not sent (console shows "Email not configured")

**Fix:** Check email credentials in .env:
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=kitteniesta@gmail.com
EMAIL_PASSWORD=awlj hlrt odni ucqp
```

### Issue 3: Link clicked but no action

**Possible causes:**
1. Player not on standby list → Check database
2. Replacement window closed → Check tournament start time
3. Event already full → Check participant count
4. Server error → Check console logs

### Issue 4: Player promoted but emails not sent

**Check logs for:**
```
❌ Error notifying organizer [email]: [error message]
❌ Error sending confirmation email to player: [error message]
```

Common email errors:
- Gmail app password invalid
- Network timeout
- Gmail blocking less secure apps

## Quick Test Checklist

- [ ] Server running and accessible
- [ ] Email credentials configured
- [ ] API_URL set correctly (local vs production)
- [ ] Event has standby players
- [ ] Replacement window is open
- [ ] Event has available spots
- [ ] Click link shows console logs
- [ ] Database updated
- [ ] Player receives confirmation email
- [ ] Organizer receives notification email

## Environment Variables Needed

### Local (.env)
```
API_URL=http://localhost:3001
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=kitteniesta@gmail.com
EMAIL_PASSWORD=awlj hlrt odni ucqp
REPLACEMENT_TOKEN_SECRET=your-secret-here
```

### Production (Render.com Environment)
```
API_URL=https://stepout2play-api.onrender.com
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=kitteniesta@gmail.com
EMAIL_PASSWORD=awlj hlrt odni ucqp
REPLACEMENT_TOKEN_SECRET=your-secret-here
```

## Manual Test URL

Replace `{eventId}` and `{userId}` with actual values:

```
http://localhost:3001/api/accept-replacement/{eventId}/{userId}/auto
```

Example:
```
http://localhost:3001/api/accept-replacement/5/123/auto
```

You should see the success page with player name and event details.
