# Complete Standby to Seeding Flow Test

## The Flow You Need to Test

```
1. Player withdraws
   ↓
2. Organizer clicks "Notify Standby Players"
   ↓
3. Standby players get:
   - In-app notification 🔔
   - Email notification 📧
   ↓
4. Standby player clicks "Accept" (email link or in-app)
   ↓
5. Player is promoted to CONFIRMED
   - Database updated ✅
   - In-app notification sent ✅
   - Email confirmation sent ✅
   - Organizers notified ✅
   ↓
6. Bracket generation uses CONFIRMED players (including newly promoted)
   ↓
7. Seeding works correctly
```

## Prerequisites

### 1. Set up Mailtrap

See `MAILTRAP_SETUP.md` for detailed instructions.

**Quick setup:**
1. Sign up at https://mailtrap.io
2. Get credentials from your inbox
3. Update `.env`:
   ```bash
   EMAIL_HOST="sandbox.smtp.mailtrap.io"
   EMAIL_PORT=2525
   EMAIL_USER="your-mailtrap-username"
   EMAIL_PASSWORD="your-mailtrap-password"
   ```

### 2. Prepare Test Data

```sql
-- Create a tournament with replacement window
INSERT INTO "Tournament" (
  "name", 
  "organizationId", 
  "sport", 
  "startDate", 
  "endDate",
  "startTime",
  "endTime",
  "city", 
  "venueName",
  "registrationDeadline",
  "replacementWindowHours",
  "status"
) VALUES (
  'Test Tournament',
  1,  -- Your org ID
  'badminton',
  '2026-07-15',
  '2026-07-17',
  '09:00',
  '18:00',
  'Mumbai',
  'Test Venue',
  '2026-07-14 23:59:59',
  24,  -- 24 hours replacement window
  'OPEN'
);

-- Create an event
INSERT INTO "Event" (
  "tournamentId",
  "name",
  "format",
  "gender",
  "maxParticipants",
  "sportId"
) VALUES (
  1,  -- Tournament ID from above
  'Men\'s Singles',
  'SINGLES',
  'Men',
  16,
  'badminton'
);

-- Create confirmed players (14 players - leaving 2 spots)
-- You can use existing users or create test users

-- Create standby players (2 standby)
INSERT INTO "Registration" (
  "userId",
  "eventId",
  "status",
  "isStandby",
  "standbyPosition"
) VALUES
  (10, 1, 'STANDBY', true, 1),  -- Replace with real user IDs
  (11, 1, 'STANDBY', true, 2);
```

## Testing Steps

### Step 1: Start Server

```bash
npm start
```

Watch the console for logs.

### Step 2: Trigger Standby Notification

**Option A: Via API (easier for testing)**
```bash
curl -X POST http://localhost:3001/api/test-notify-standby \
  -H "Content-Type: application/json" \
  -d '{"eventId": 1}'
```

**Option B: Via UI**
1. Log in as organizer
2. Go to Tournament Management
3. Registrations tab
4. Find player who withdrew
5. Click "Notify Standby Players"

### Step 3: Check In-App Notifications

**As standby player:**
1. Log in to the app
2. Click the 🔔 bell icon (top right)
3. You should see:
   ```
   🎾 Spot Available!
   A spot opened in Men's Singles. You're #1 on the waitlist. Click to accept!
   ```

### Step 4: Check Mailtrap

1. Go to https://mailtrap.io/inboxes
2. Click your inbox
3. You should see email(s) to standby players
4. Click to view the email
5. Email should show:
   - Subject: "🎾 Spot Available: Men's Singles"
   - Body: Colorful email with "ACCEPT THIS SPOT" button
   - Link: `http://localhost:3001/api/accept-replacement/1/10/auto`

### Step 5: Accept the Spot

**Option A: Click email link**
- Click "ACCEPT THIS SPOT" button in Mailtrap
- Opens in browser

**Option B: Click in-app notification**
- Click "Accept Spot" in the notification
- Takes you to acceptance page

**Option C: Direct URL**
```
http://localhost:3001/api/accept-replacement/1/10/auto
```

### Step 6: Watch Server Logs

You should see:
```
=== AUTO-REPLACEMENT ATTEMPT ===
EventId: 1, UserId: 10, Token: auto
Request URL: /api/accept-replacement/1/10/auto
Promoting player: john@test.com (ID: 123)
✅ Player promoted successfully in database
Found 2 organizers to notify
Sending organizer email to: organizer@test.com
✅ Organizer email sent to organizer@test.com
Sending in-app confirmation notification to: 10
✅ In-app notification sent
Sending confirmation email to player: john@test.com
✅ Confirmation email sent to john@test.com
=== REPLACEMENT SUCCESSFUL ===
Player: John Doe
Event: Men's Singles
Tournament: Test Tournament
```

### Step 7: See Success Page

Browser shows:
```
🎉 You're Confirmed!

✅ Registration Status: CONFIRMED

John Doe
Successfully promoted from standby

Event: Men's Singles
Tournament: Test Tournament
Your Email: john@test.com

📧 A confirmation email has been sent...
🔔 The tournament organizers (2 admins) have been notified...

See you at the tournament! 🎾
```

### Step 8: Verify Database

```sql
SELECT 
  u."firstName",
  u."lastName",
  r."isStandby",
  r."status",
  r."standbyPosition"
FROM "Registration" r
JOIN "User" u ON u.id = r."userId"
WHERE r."eventId" = 1
ORDER BY r."isStandby" DESC, r."standbyPosition" ASC;
```

**Expected result:**
- Previously standby player now shows:
  - `isStandby = false`
  - `status = 'CONFIRMED'`
  - `standbyPosition = null`

### Step 9: Check In-App Notifications (Player)

**As the promoted player:**
1. Refresh notifications
2. You should now see TWO notifications:
   - Old: "🎾 Spot Available!" (the initial notification)
   - New: "✅ You're Confirmed!" (confirmation after accepting)

### Step 10: Check Mailtrap for New Emails

You should now see **2 MORE emails**:

**Email 1: To Player (Confirmation)**
- To: john@test.com
- Subject: "✅ Confirmed: Men's Singles"
- Body: Confirmation with event details

**Email 2: To Organizer (Notification)**
- To: organizer@test.com
- Subject: "✅ Standby Replacement: Men's Singles"
- Body: "John Doe has accepted the standby spot..."

### Step 11: Check In-App Notifications (Organizer)

**As organizer:**
1. Log in
2. Check notifications
3. Should see: "John Doe has been confirmed for Men's Singles"

### Step 12: Generate Bracket

**Via UI:**
1. Go to Tournament Management → Brackets tab
2. Select "Men's Singles"
3. Click "Generate Bracket"

**Check players:**
- Should include the newly promoted player (John Doe)
- Should have 15 confirmed players total (14 original + 1 promoted)

### Step 13: Verify Seeding

The bracket should include:
- All originally confirmed players ✅
- The newly promoted standby player ✅
- Seeding based on skill level (if implemented) ✅

## Success Criteria

✅ **In-app notification sent** when organizer notifies standby  
✅ **Email sent** to standby players via Mailtrap  
✅ **Email contains working link** to accept spot  
✅ **Click link promotes player** in database  
✅ **Confirmation in-app notification** sent to player  
✅ **Confirmation email** sent to player  
✅ **Organizer notification email** sent  
✅ **Database updated** correctly  
✅ **Bracket generation** includes promoted player  
✅ **Seeding works** with all confirmed players  

## Common Issues

### Issue: No in-app notification

**Check:**
```sql
SELECT * FROM "Notification" 
WHERE "userId" = 10 
ORDER BY "createdAt" DESC LIMIT 5;
```

Should show notifications with:
- `type = 'STANDBY_SPOT_AVAILABLE'`
- `type = 'STANDBY_PROMOTED'`

### Issue: No emails in Mailtrap

**Check server logs for:**
- `Email not configured` → Mailtrap credentials wrong
- `Error sending email` → Check error message
- `✅ Email sent successfully` → Email WAS sent, check Mailtrap inbox

### Issue: Link doesn't work

**Check:**
- Console log shows: `🔗 Auto-replacement URL: http://localhost:3001/...`
- URL should be localhost (Mailtrap testing)
- Make sure server is running when you click

### Issue: Player not in bracket

**Check:**
```sql
SELECT * FROM "Registration" 
WHERE "eventId" = 1 AND "status" = 'CONFIRMED' AND "isWithdrawn" = false;
```

Player should be in this list.

### Issue: Database not updated

**Check server logs:**
- Should see: `✅ Player promoted successfully in database`
- If not, check what error appears before this line

## Email Templates You'll See

### 1. Standby Spot Available Email
```
Subject: 🎾 Spot Available: Men's Singles

🎾 A Spot Has Opened Up!

Hi John Doe,

Great news! A confirmed player has withdrawn from Men's Singles 
in the Test Tournament tournament.

⚡ Quick Action Required!
You were #1 on the waitlist. All standby players have been notified, 
and the first person to accept gets the spot.

⏰ Time Sensitive: This spot will go to the first person who accepts!

[ACCEPT THIS SPOT] (big green button)

Simply click the button above to automatically confirm your spot...
```

### 2. Player Confirmation Email
```
Subject: ✅ Confirmed: Men's Singles

🎉 You're Confirmed!

Hi John Doe,

✅ Registration Confirmed
You've been promoted from the waitlist to a confirmed participant!

Event: Men's Singles
Tournament: Test Tournament

You can view all your tournament registrations and match schedules 
in the "My Matches" section.

See you at the tournament!
```

### 3. Organizer Notification Email
```
Subject: ✅ Standby Replacement: Men's Singles

Standby Player Promoted

John Doe has accepted the standby spot and is now confirmed for:

Event: Men's Singles
Tournament: Test Tournament

The replacement was completed automatically.
```

## Next Steps After Successful Test

Once this flow works in Mailtrap:

1. ✅ You know standby → confirmed → seeding works
2. ✅ You can confidently generate brackets
3. ✅ In-app notifications work
4. ✅ Email flow is tested

For production:
1. Switch from Mailtrap to Gmail in `.env`
2. Set `API_URL=https://stepout2play-api.onrender.com`
3. Deploy
4. Same flow will work with real emails

## Timeline Matters!

**Replacement Window Logic:**
```
Tournament Start: July 15, 2026 at 09:00
Replacement Window: 24 hours before
Cutoff: July 14, 2026 at 09:00

✅ Withdrawals before July 14 09:00 → Standby notified
❌ Withdrawals after July 14 09:00 → Standby NOT notified (too late)
```

Make sure your test tournament start date/time is in the future!

## Debug Commands

**Check standby players:**
```sql
SELECT 
  u.email,
  r."standbyPosition",
  r."status",
  r."isStandby"
FROM "Registration" r
JOIN "User" u ON u.id = r."userId"
WHERE r."eventId" = 1 AND r."isStandby" = true;
```

**Check all notifications:**
```sql
SELECT * FROM "Notification" 
WHERE "userId" = 10 
ORDER BY "createdAt" DESC;
```

**Check email logs:**
- See server console output
- Look for `📧` and `✅` emoji markers

Happy testing! 🎾
