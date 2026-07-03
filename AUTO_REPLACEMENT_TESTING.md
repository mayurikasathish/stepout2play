# Auto-Replacement Feature - Testing Guide

## Overview
This feature allows standby players to automatically accept available spots by clicking a link in their email. When they click, they're instantly promoted and organizers are notified.

## How It Works

### Flow:
1. **Player Withdraws** → Standby players are notified via email
2. **Standby Clicks Link** → Auto-replacement endpoint is hit
3. **System Checks**:
   - Is the player on standby list?
   - Is replacement window still open?
   - Is there still space available (race condition)?
4. **If All Pass** → Player is promoted, organizers notified
5. **User Sees** → Success page (no form needed!)

## Features Implemented

### 1. Auto-Replacement Route
- **URL**: `GET /api/accept-replacement/:eventId/:userId/:token`
- **What it does**: Instantly promotes standby player when they click the email link
- **Validations**:
  - ✅ Player must be on standby list
  - ✅ Replacement window must be open (checks `tournament.replacementWindowHours`)
  - ✅ Event must have space (prevents race conditions)

### 2. Updated Email
- Email now contains direct replacement link
- No UI form needed - click → instant confirmation
- Shows beautiful success/error pages

### 3. Organizer Notifications
- Organizers are auto-notified when standby accepts
- Email includes player name, event, tournament

### 4. Test Endpoint
- **URL**: `POST /api/test-notify-standby`
- **Body**: `{ "eventId": 123 }`
- **Use**: Manually trigger standby notifications for testing

## Testing Steps

### Setup:
1. **Start the server**:
   ```bash
   npm start
   ```

2. **Verify .env has**:
   ```
   API_URL=http://localhost:3001
   REPLACEMENT_TOKEN_SECRET=your-replacement-token-secret-change-in-production
   EMAIL_HOST=smtp.gmail.com
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```

### Test Scenario 1: Happy Path (Standby Accepts)

1. **Find an event with standby players**:
   ```bash
   # In psql or your DB tool
   SELECT e.id, e.name, COUNT(*) as standby_count
   FROM "Event" e
   JOIN "Registration" r ON r."eventId" = e.id
   WHERE r."isStandby" = true AND r.status = 'STANDBY'
   GROUP BY e.id, e.name;
   ```

2. **Trigger standby notifications**:
   ```bash
   curl -X POST http://localhost:3001/api/test-notify-standby \
     -H "Content-Type: application/json" \
     -d '{"eventId": YOUR_EVENT_ID}'
   ```

3. **Check email** (sent to all standby players):
   - Should see "A Spot Has Opened Up!"
   - Button says "ACCEPT THIS SPOT"

4. **Click the link in email**:
   - Link format: `http://localhost:3001/api/accept-replacement/{eventId}/{userId}/auto`
   - Should see success page with:
     - 🎉 "You're Confirmed!"
     - Player name
     - Event and tournament details

5. **Verify in database**:
   ```sql
   SELECT "userId", "isStandby", "status", "standbyPosition"
   FROM "Registration"
   WHERE "eventId" = YOUR_EVENT_ID AND "userId" = YOUR_USER_ID;
   -- Should show: isStandby = false, status = 'CONFIRMED', standbyPosition = null
   ```

6. **Check organizer email**:
   - Should receive "Standby Player Promoted" email
   - Shows which player was promoted

### Test Scenario 2: Replacement Window Closed

1. **Update tournament to close window**:
   ```sql
   UPDATE "Tournament"
   SET "replacementWindowHours" = 0  -- Close immediately
   WHERE id = YOUR_TOURNAMENT_ID;
   ```

2. **Click the same link again**:
   - Should see: ⏰ "Replacement Window Closed"

3. **Reset**:
   ```sql
   UPDATE "Tournament"
   SET "replacementWindowHours" = 24  -- Reset to 24 hours
   WHERE id = YOUR_TOURNAMENT_ID;
   ```

### Test Scenario 3: Race Condition (2 Players Click Simultaneously)

1. **Get 2 standby player emails**
2. **Both click the link at ~same time**
3. **Expected**:
   - First click: ✅ Success page
   - Second click: 😔 "Spot Already Taken"

### Test Scenario 4: Player Already Promoted

1. **Promote a player manually**:
   ```sql
   UPDATE "Registration"
   SET "isStandby" = false, "status" = 'CONFIRMED', "standbyPosition" = null
   WHERE id = YOUR_REGISTRATION_ID;
   ```

2. **Try clicking their old link**:
   - Should see: ❌ "Not Found - You are not on the standby list"

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/accept-replacement/:eventId/:userId/:token` | GET | Auto-promote standby player |
| `/api/test-notify-standby` | POST | Test: Send standby emails |

## Email Link Format

```
http://localhost:3001/api/accept-replacement/{eventId}/{userId}/auto
```

Example:
```
http://localhost:3001/api/accept-replacement/5/123/auto
```

## Response Pages

### Success ✅
- Green gradient background
- 🎉 Icon
- "You're Confirmed!"
- Shows event and tournament details

### Window Closed ⏰
- Purple gradient
- "Replacement Window Closed"

### Spot Taken 😔
- Purple gradient
- "Someone else accepted first"

### Not Found ❌
- Purple gradient
- "Not on standby list"

### Error ⚠️
- Purple gradient
- Shows error message

## Production Deployment

### Environment Variables Needed:
```bash
API_URL=https://stepout2play-api.onrender.com
REPLACEMENT_TOKEN_SECRET=<generate-strong-secret>
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=kitteniesta@gmail.com
EMAIL_PASSWORD=<your-app-password>
```

### Security Notes:
- Token currently uses simple validation (64-char hex)
- Consider adding expiration timestamps in production
- Add rate limiting on the replacement endpoint

## Files Changed

1. **New**:
   - `src/routes/replacement.routes.js` - Auto-replacement endpoint

2. **Modified**:
   - `src/services/email.service.js` - Updated standby email with auto-replacement link
   - `src/services/withdrawal.service.js` - Pass eventId/userId to email service
   - `src/app.js` - Register replacement routes
   - `.env` - Add API_URL and REPLACEMENT_TOKEN_SECRET

## Future Enhancements

1. **Token Expiration**: Add 24-hour expiration to links
2. **SMS Notifications**: Send SMS in addition to email
3. **Push Notifications**: Browser/mobile push when spot opens
4. **Analytics**: Track click rates, acceptance times
5. **Waitlist Position Updates**: Real-time position changes

## Troubleshooting

### Emails not sending?
- Check .env EMAIL_* variables
- Verify Gmail app password (not regular password)
- Check console for email service errors

### Link not working?
- Verify API_URL in .env matches your server
- Check if replacement window is open
- Verify player is on standby list

### Database issues?
- Ensure migrations are run: `npx prisma migrate dev`
- Check registration status and isStandby fields

## Questions?

This is a testing implementation. For production:
- Add proper token expiration
- Add rate limiting
- Consider using signed JWTs instead of simple tokens
- Add comprehensive logging
