# Mailtrap Setup for Email Testing

## What is Mailtrap?

Mailtrap is a **fake SMTP server** that catches all emails you send during development. 
- ✅ No emails actually get sent to real people
- ✅ You can see all emails in a web interface
- ✅ Perfect for testing email flows locally
- ✅ Free for development

## Setup Steps

### 1. Create Mailtrap Account

1. Go to https://mailtrap.io/
2. Sign up for free account (Google/GitHub login works)
3. Verify your email

### 2. Get SMTP Credentials

1. After login, you'll see **My Inbox**
2. Click on **My Inbox** (or create a new inbox)
3. Click **Show Credentials** or **SMTP Settings**
4. You'll see:
   ```
   Host: sandbox.smtp.mailtrap.io
   Port: 2525 (or 587, 465)
   Username: [your-username]
   Password: [your-password]
   ```

### 3. Update Your `.env` File

Replace your current email settings with Mailtrap credentials:

```bash
# Email Configuration - MAILTRAP (for testing)
EMAIL_HOST="sandbox.smtp.mailtrap.io"
EMAIL_PORT=2525
EMAIL_SECURE=false
EMAIL_USER="your-mailtrap-username"
EMAIL_PASSWORD="your-mailtrap-password"
EMAIL_FROM="test@stepout2play.com"
EMAIL_FROM_NAME="StepOut2Play"
```

**Example:**
```bash
EMAIL_HOST="sandbox.smtp.mailtrap.io"
EMAIL_PORT=2525
EMAIL_SECURE=false
EMAIL_USER="a1b2c3d4e5f6g7"
EMAIL_PASSWORD="h8i9j0k1l2m3n4"
EMAIL_FROM="test@stepout2play.com"
EMAIL_FROM_NAME="StepOut2Play"
```

### 4. Restart Your Server

```bash
npm start
```

### 5. Test It!

**Test basic email:**
```bash
curl -X POST http://localhost:3001/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "anyone@example.com"}'
```

**Check Mailtrap:**
1. Go to https://mailtrap.io/inboxes
2. Click on your inbox
3. You should see the test email!

**Test standby notification:**
```bash
curl -X POST http://localhost:3001/api/test-notify-standby \
  -H "Content-Type: application/json" \
  -d '{"eventId": 5}'
```

Check Mailtrap - you should see the standby promotion emails!

## What You'll See in Mailtrap

### Email Preview
- Full HTML preview
- Plain text version
- Email headers
- **The auto-replacement link** (you can click it!)

### Email Details
- From: StepOut2Play <test@stepout2play.com>
- To: player@example.com (whatever email is in your DB)
- Subject: 🎾 Spot Available: [Event Name]
- Body: Full HTML email with "ACCEPT THIS SPOT" button

### Click the Link!
- The link will be: `http://localhost:3001/api/accept-replacement/{eventId}/{userId}/auto`
- You can click it directly from Mailtrap
- It will open in your browser and show the success page
- Check your server logs for the promotion logs

## Advantages of Mailtrap

1. **No Spam** - Emails never leave Mailtrap
2. **Test Any Email** - Can send to fake@test.com, doesn't matter
3. **See All Emails** - Standby emails, organizer emails, confirmation emails all in one place
4. **Click Links** - Test the auto-replacement flow by clicking email links
5. **Debug** - See raw email HTML, headers, etc.

## Testing the Full Flow

### 1. Set up test data (if needed)

```sql
-- Make sure you have a standby player
UPDATE "Registration"
SET "isStandby" = true, "standbyPosition" = 1, "status" = 'STANDBY'
WHERE id = 123;
```

### 2. Trigger standby notification

```bash
curl -X POST http://localhost:3001/api/test-notify-standby \
  -H "Content-Type: application/json" \
  -d '{"eventId": 5}'
```

### 3. Check Mailtrap inbox

You should see emails sent to ALL standby players

### 4. Click the "ACCEPT THIS SPOT" link

Opens: `http://localhost:3001/api/accept-replacement/5/123/auto`

### 5. Watch server logs

```
📧 Generating standby email for John Doe (john@test.com)
🔗 Auto-replacement URL: http://localhost:3001/api/accept-replacement/5/123/auto
Email sent successfully: <message-id>
=== AUTO-REPLACEMENT ATTEMPT ===
EventId: 5, UserId: 123, Token: auto
Promoting player: john@test.com (ID: 456)
✅ Player promoted successfully in database
Found 2 organizers to notify
Sending organizer email to: organizer@test.com
✅ Organizer email sent to organizer@test.com
Sending confirmation email to player: john@test.com
✅ Confirmation email sent to john@test.com
=== REPLACEMENT SUCCESSFUL ===
```

### 6. Check Mailtrap again

You should now see **TWO MORE EMAILS**:
1. Organizer notification: "✅ Standby Replacement: [Event]"
2. Player confirmation: "✅ Confirmed: [Event]"

### 7. Check in-app notifications

Log in as the standby player → Check notifications bell → Should see:
- "🎾 Spot Available!" notification (when organizer clicked notify)
- "✅ You're Confirmed!" notification (after accepting)

### 8. Verify database

```sql
SELECT * FROM "Registration" WHERE id = 123;
-- isStandby = false
-- status = 'CONFIRMED'
-- standbyPosition = null
```

## Switching Between Mailtrap and Real Gmail

### For Development (Use Mailtrap)
```bash
EMAIL_HOST="sandbox.smtp.mailtrap.io"
EMAIL_PORT=2525
EMAIL_USER="mailtrap-username"
EMAIL_PASSWORD="mailtrap-password"
```

### For Production (Use Gmail)
```bash
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="kitteniesta@gmail.com"
EMAIL_PASSWORD="awlj hlrt odni ucqp"
```

Just update `.env` and restart the server!

## Troubleshooting

### "Error sending email: Invalid login"
- Check your Mailtrap username/password
- Make sure you copied from the right inbox
- Try regenerating credentials in Mailtrap

### "Email not configured"
- Check `.env` file has all EMAIL_* variables
- Restart your server after updating `.env`

### Emails not showing in Mailtrap
- Make sure you're looking at the right inbox
- Check server logs for "Email sent successfully"
- Try the test-email endpoint first

### Link doesn't work when clicked
- Normal! The link is `localhost:3001` which only works on your machine
- Copy the link and paste in your browser
- Or run the server so the link works

## What This Solves

✅ **No localhost URL problem** - You can see the actual link in the email
✅ **Test emails without spam** - No real emails sent
✅ **See all emails** - Standby, organizer, confirmation all in one place
✅ **Click and test** - Full flow testing
✅ **In-app notifications** - Players get notified in the app too
✅ **Full audit trail** - See exactly what emails were sent

## Next Steps After Mailtrap Testing

Once everything works in Mailtrap:

1. ✅ Standby players get in-app notification
2. ✅ Standby players get email
3. ✅ Click link promotes player
4. ✅ Database updates
5. ✅ Organizers get notification email
6. ✅ Player gets confirmation email

Then switch to production:
1. Update `.env` with production values
2. Set `API_URL=https://stepout2play-api.onrender.com`
3. Deploy
4. Test with real emails

You'll know the flow works because you tested it in Mailtrap! 🎯
