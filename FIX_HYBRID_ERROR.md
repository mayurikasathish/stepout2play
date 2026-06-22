# Fix: "bracketFormat must be SINGLE_ELIMINATION or ROUND_ROBIN" Error

## The Problem

The database migration was applied ✅ but the Prisma Client hasn't been regenerated yet.

Your server is currently running with the OLD Prisma Client that doesn't know about `LEAGUE_CUM_KNOCKOUT`.

## The Solution

### Step 1: Stop Your Dev Server
Press **Ctrl+C** in the terminal where your server is running.

### Step 2: Regenerate Prisma Client
```powershell
npx prisma generate
```

You should see:
```
✔ Generated Prisma Client (x.x.x) to .\node_modules\@prisma\client in XXXms
```

### Step 3: Restart Your Server
```powershell
npm run dev
```

### Step 4: Test Again
1. Go to event bracket page
2. Click "Generate Bracket"
3. Select "League-cum-Knockout"
4. Configure and generate

It should work now! ✅

## Why This Happened

The migration added `LEAGUE_CUM_KNOCKOUT` to the database enum, but:
- Your running server still has the old Prisma Client in memory
- The old client only knows about SINGLE_ELIMINATION and ROUND_ROBIN
- When you send LEAGUE_CUM_KNOCKOUT, it rejects it as invalid

After regenerating the Prisma Client and restarting, it will know about all three formats.

## Verification

After restarting, you can verify it worked by checking the server logs. You should NOT see the error anymore when generating a hybrid bracket.
