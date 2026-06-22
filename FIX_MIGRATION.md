# How to Fix the Migration Error

## The Problem
The migration SQL has syntax issues and needs to be regenerated fresh by Prisma.

## Solution: Let Prisma Generate the Migration

**Run this in your PowerShell terminal** (not through Claude):

```powershell
cd C:\Users\vinib\OneDrive\Desktop\stepout2play

# Make sure your dev server is STOPPED first!

# Let Prisma create the migration automatically from your schema
npx prisma migrate dev --name add_round_robin
```

When prompted:
- If it asks about resetting the database, type **yes** (your schema is the source of truth)
- If it asks about data loss, type **yes** (for development, this is fine)

This will:
1. Drop the shadow database and recreate it
2. Generate clean SQL from your schema.prisma
3. Apply it to your database
4. Regenerate the Prisma Client automatically

## Alternative: Manual Fix (if you want to keep existing data)

If you have important data and don't want to reset, run these commands:

```powershell
# 1. Mark the current state as a baseline
npx prisma migrate resolve --applied 20260622000000_add_round_robin

# 2. Force regenerate the client
# First, make SURE your server is stopped, then:
npx prisma generate --no-hints

# 3. If that still fails with EPERM, close ALL VS Code windows and terminals, then:
npx prisma generate
```

## After Migration Succeeds

Start your dev server again:
```powershell
npm run dev
```

Then test creating a bracket - it should work!

## Why This Happened

The migration file had `IF NOT EXISTS` clauses that work in plain PostgreSQL but confuse Prisma's migration engine when validating against the shadow database. Letting Prisma generate it from scratch will produce clean, valid SQL.
