# Fix for "Cannot read properties of undefined (reading 'create')" Error

## The Problem
The Prisma Client doesn't have the new `Group` and `GroupStanding` models yet because:
1. The migration hasn't been applied to your database OR
2. The Prisma Client hasn't been regenerated after the migration

## The Solution

### Step 1: Stop your dev server
Press `Ctrl+C` in the terminal where your backend/frontend is running.

### Step 2: Apply the migration (if not already applied)
```bash
cd /c/Users/vinib/OneDrive/Desktop/stepout2play
npx prisma migrate dev
```

This will:
- Apply any pending migrations (including the round_robin migration)
- Automatically regenerate the Prisma Client

### Step 3: Restart your dev server
```bash
npm run dev
# or whatever command you use to start your server
```

## Alternative: If Step 2 fails because migration is already applied

If you get an error saying the migration is already applied, just regenerate the client:

```bash
npx prisma generate
```

If this still fails with "EPERM: operation not permitted", it means the dev server is still running. Stop it completely and try again.

## Verify it worked

After restarting, try creating a bracket again. You should no longer see the error.

## What was the issue?

The round_robin migration added these new tables:
- `groups` - stores group information (Group A, B, C, etc.)
- `group_standings` - stores win/loss/draw records for each participant in a group

Your code tried to use `prisma.group.create()` but the Prisma Client didn't know about these models yet because it was generated before the migration was applied.
