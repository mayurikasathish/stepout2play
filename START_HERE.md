# 🚀 Quick Start Guide

## Prerequisites

✅ PostgreSQL running on port 5432
✅ Node.js installed
✅ Database created and migrated

## Step-by-Step Setup

### 1. Install CORS Package (Important!)

```bash
npm install
```

This will install the newly added `cors` package to fix any cross-origin issues.

### 2. Start Backend Server

Open **Terminal 1**:

```bash
npm run dev
```

**Expected output:**
```
StepOut2Play API running on port 3000
Environment: development
```

✅ Backend is ready when you see this message!

### 3. Install Frontend Dependencies

Open **Terminal 2**:

```bash
cd client
npm install
```

### 4. Start Frontend Server

In the same **Terminal 2**:

```bash
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

✅ Frontend is ready!

### 5. Open the Application

Open your browser and go to:
```
http://localhost:5173
```

## 🧪 Test Registration

### Test Data:

- **First Name:** Test
- **Last Name:** User
- **Email:** test@example.com
- **Password:** Ruby123+
- **Confirm Password:** Ruby123+

### Password Requirements:

✅ At least 8 characters
✅ One uppercase letter
✅ One lowercase letter  
✅ One number
✅ One special character

**Valid passwords:**
- `Ruby123+` ✅
- `Test@1234` ✅
- `MyPass123!` ✅

## 🔍 Debugging

### If registration fails:

1. **Open Browser DevTools** (Press F12)
2. **Go to Console tab**
3. Look for error message: `Registration error: {...}`
4. **Go to Network tab**
5. Click on `/auth/register` request
6. Check the **Response** tab

### Common Issues:

#### "Network Error"
- Backend is not running
- **Fix:** Restart backend with `npm run dev`

#### "User with this email already exists"
- Email already registered
- **Fix:** Use different email or try logging in

#### "Invalid credentials" (on login)
- Wrong email/password
- **Fix:** Double-check credentials

#### Database errors
- PostgreSQL not running
- **Fix:** Start PostgreSQL service
- **Fix:** Run `npm run prisma:migrate`

## 🎯 What to Expect

### After Successful Registration:
1. ✅ User created in database
2. ✅ JWT token generated
3. ✅ Auto-redirect to Dashboard
4. ✅ Welcome message with your name

### After Successful Login:
1. ✅ Token validated
2. ✅ User loaded
3. ✅ Redirected to Dashboard

## 📊 View Database

To see your users in the database:

```bash
npm run prisma:studio
```

Opens at: http://localhost:5555

## 🆘 Still Having Issues?

Run this test command to check backend:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Ruby123+","firstName":"Test","lastName":"User"}'
```

**If this works but the frontend doesn't:**
- Clear browser cache and localStorage
- Hard refresh (Ctrl+Shift+R)
- Try incognito/private window

**If this doesn't work:**
- Check if PostgreSQL is running
- Verify DATABASE_URL in .env file
- Check backend terminal for errors

## 📝 What's New (Latest Changes)

✅ Added password show/hide toggle with eye icon
✅ Fixed password validation regex (now accepts `+` and all special chars)
✅ Added CORS support to backend
✅ Improved error messages with console logging
✅ Created debugging documentation

---

**Everything is ready! Start both servers and try registering.** 🎉
