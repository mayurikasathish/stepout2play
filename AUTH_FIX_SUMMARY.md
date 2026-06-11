# Authentication Fix Summary

## Issues Found & Fixed

### 1. **Routing Loop Issue** ✅ FIXED
**Problem:** After logging in from LandingPage modal, users were being redirected to `/login` page, then getting "invalid credentials" error.

**Root Cause:** 
- After successful login, the app navigated to `/dashboard`
- But `onboardingComplete` was `false` for new users
- `ProtectedRoute` redirected to `/onboarding` (or `/login` if state wasn't updated yet)
- This caused a routing loop

**Solution:**
- Updated `AuthContext.login()` to return the user data
- Updated login forms to check `onboardingComplete` status
- Now navigates to `/onboarding` if incomplete, `/dashboard` if complete

### 2. **Email Normalization** ✅ FIXED
**Problem:** Email case sensitivity could cause login issues

**Solution:**
- Backend now trims and lowercases emails consistently in both register and login
- Frontend trims emails before sending to API
- Passwords are NOT trimmed (whitespace could be intentional)

### 3. **Google OAuth Users** ✅ FIXED
**Problem:** Users who signed up with Google don't have a password hash, but error message was generic

**Solution:**
- Added check in login function for missing `passwordHash`
- Returns specific error: "This account was created with Google. Please use 'Sign in with Google'"

## Files Modified

### Backend
- ✅ `src/services/auth.service.js` - Email normalization, Google OAuth check
- ✅ Already had proper validation in `src/controllers/auth.controller.js`

### Frontend
- ✅ `client/src/context/AuthContext.jsx` - Return user data from login/register
- ✅ `client/src/services/authService.js` - Trim email in login/register
- ✅ `client/src/pages/LoginPage.jsx` - Check onboarding status, trim email
- ✅ `Downloads/LandingPage.jsx` - Check onboarding status, trim email (modal form)

## Testing

### Test the Flow:

1. **Start the servers:**
   ```bash
   # Backend (in project root)
   npm start

   # Frontend (in client folder)
   npm run dev
   ```

2. **Test Registration:**
   - Go to http://localhost:5173
   - Click "Sign Up" 
   - Fill in details with a strong password (min 8 chars, uppercase, lowercase, number, special char)
   - Should redirect to `/onboarding` ✅

3. **Test Login:**
   - After completing onboarding, logout
   - Click "Log In"
   - Enter your credentials
   - Should redirect to `/dashboard` ✅

4. **Test New User Login:**
   - Create a new account
   - Without completing onboarding, logout
   - Login again
   - Should redirect to `/onboarding` (not `/login`) ✅

## Database Tools

### View All Database Data:
```bash
node view-db.js
```

Shows all tables with data:
- 📊 Users (with onboarding status, roles, sports)
- 🏢 Organizations
- 🏆 Tournaments
- 🎯 Events
- 📝 Registrations

### View Prisma Schema:
```bash
node view-schema.js
```

Shows all models, fields, and enums in a readable format.

### Direct Prisma Commands:
```bash
# Generate Prisma client
npx prisma generate

# View database in Prisma Studio (GUI)
npx prisma studio

# Push schema changes to database
npx prisma db push

# View migration status
npx prisma migrate status

# Create a new migration
npx prisma migrate dev --name description_of_changes
```

### Manual Database Inspection:

Using Node REPL:
```bash
node
```

Then in the REPL:
```javascript
const prisma = require('./src/lib/prisma')

// Get all users
await prisma.user.findMany()

// Get a specific user
await prisma.user.findUnique({ where: { email: 'demo@test.com' } })

// Delete a user
await prisma.user.delete({ where: { email: 'test@example.com' } })

// Update a user
await prisma.user.update({
  where: { email: 'demo@test.com' },
  data: { onboardingComplete: true }
})
```

## Common Issues & Solutions

### Issue: "Invalid credentials" on correct password
**Cause:** User might not exist, or password doesn't meet requirements
**Solution:** 
1. Check if user exists: `node view-db.js`
2. Verify password meets requirements (8+ chars, uppercase, lowercase, number, special char)
3. Check browser console (F12) for detailed error logs

### Issue: Keeps redirecting to login page
**Cause:** Onboarding not complete
**Solution:** Check user's `onboardingComplete` status in database with `node view-db.js`

### Issue: Can't create new user
**Cause:** Email already exists
**Solution:** Use a different email or delete the existing user from database

### Issue: Database connection error
**Cause:** PostgreSQL not running or wrong credentials
**Solution:** 
1. Check if PostgreSQL is running
2. Verify `.env` has correct `DATABASE_URL`
3. Try: `npx prisma db push` to sync schema

## Password Requirements

**Must have ALL of these:**
- ✅ Minimum 8 characters
- ✅ At least one uppercase letter (A-Z)
- ✅ At least one lowercase letter (a-z)
- ✅ At least one number (0-9)
- ✅ At least one special character (!@#$%^&*()_+-=[]{};':"\\|,.<>/?)

**Examples of valid passwords:**
- `Demo123!@#`
- `Password1!`
- `MyPass123#`

**Examples of INVALID passwords:**
- `demo123` (no uppercase, no special char)
- `DEMO123!` (no lowercase)
- `DemoPass!` (no number)
- `Demo123` (no special char)

## Environment Variables

### Backend (.env in project root):
```env
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/stepout2play?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### Frontend (client/.env):
```env
VITE_API_URL=http://localhost:3001
```

## Current Database State

Run `node view-db.js` to see current state. As of the last check:
- ✅ 1 user: demo@test.com (onboarding pending)
- ✅ 0 organizations
- ✅ 0 tournaments
- ✅ Database connection working

## Next Steps

1. Test the complete flow from signup → onboarding → dashboard
2. If still seeing "invalid credentials", check browser console for detailed errors
3. Use `node view-db.js` to verify user exists with correct email
4. Make sure backend server is running on port 3001
5. Make sure frontend is accessing correct API URL (check Network tab in browser DevTools)
