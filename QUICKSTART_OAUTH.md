# Quick Start: Google OAuth Integration

## ✅ What's Been Done

All code changes are complete! Here's what was implemented:

- ✅ Installed required npm packages (passport, passport-google-oauth20, express-session)
- ✅ Updated Prisma schema with Google OAuth fields
- ✅ Created Passport.js configuration
- ✅ Updated backend authentication service
- ✅ Added OAuth routes and controllers
- ✅ Updated Express app with session handling
- ✅ Created Google OAuth button component
- ✅ Updated login and signup pages
- ✅ Added OAuth callback page
- ✅ Updated environment variable templates

## 🚀 Getting Started (3 Steps)

### Step 1: Get Google OAuth Credentials (10 minutes)

Follow the detailed guide: **[GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)**

Quick summary:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable Google+ API
4. Configure OAuth consent screen
5. Create OAuth credentials
6. Copy your Client ID and Client Secret

### Step 2: Update Environment Variables (2 minutes)

Edit your `.env` file and add:

```env
# Google OAuth Credentials (from Google Cloud Console)
GOOGLE_CLIENT_ID="your-actual-client-id-here"
GOOGLE_CLIENT_SECRET="your-actual-client-secret-here"
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"

# Session Secret (generate a random string)
SESSION_SECRET="generate-with-command-below"

# Client URL (your frontend)
CLIENT_URL="http://localhost:5173"
```

**Generate SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Run Database Migration (1 minute)

Apply the schema changes:

```bash
npm run prisma:migrate
```

When prompted for migration name, type: `add_google_oauth`

## 🎉 That's It! Test Your Integration

### Start Your Servers

**Terminal 1 - Backend:**
```bash
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### Test It Out

1. Open http://localhost:5173/login
2. Click "Continue with Google"
3. Sign in with your Google account
4. You should be redirected to the dashboard!

### What Works Now

✅ **Google Sign-In** - New and existing users can sign in with Google
✅ **Google Sign-Up** - First-time users are automatically registered
✅ **Account Linking** - Existing email users can link their Google account
✅ **Email/Password** - Original authentication still works perfectly

## 📝 Quick Reference

### Backend Endpoints

- `POST /auth/register` - Email/password registration (existing)
- `POST /auth/login` - Email/password login (existing)
- `GET /auth/google` - **NEW:** Initiates Google OAuth flow
- `GET /auth/google/callback` - **NEW:** Handles Google callback
- `GET /auth/me` - Get current user (existing, works for both auth methods)

### Frontend Routes

- `/login` - Login page (now with Google button)
- `/signup` - Signup page (now with Google button)
- `/auth/callback` - **NEW:** OAuth callback handler
- `/dashboard` - Protected dashboard (accessible after any auth method)

## 🔧 Troubleshooting

### Issue: "redirect_uri_mismatch"
**Fix:** Make sure the redirect URI in Google Console exactly matches:
```
http://localhost:3000/auth/google/callback
```

### Issue: "Access blocked: This app's request is invalid"
**Fix:** 
1. Enable Google+ API in Google Cloud Console
2. Add your email as a test user in OAuth consent screen

### Issue: Backend error "GOOGLE_CLIENT_ID is not defined"
**Fix:** Make sure you added the Google credentials to your `.env` file

### Issue: Frontend redirects to login with "oauth_failed"
**Fix:**
1. Check backend console for errors
2. Verify Google credentials are correct
3. Ensure `CLIENT_URL` in `.env` matches your frontend URL

### Issue: Can't see Google button
**Fix:** 
1. Restart your frontend development server
2. Clear browser cache
3. Check browser console for errors

## 📚 Documentation

- **[OAUTH_IMPLEMENTATION_SUMMARY.md](./OAUTH_IMPLEMENTATION_SUMMARY.md)** - Complete technical details
- **[GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)** - Detailed Google Console setup

## 🔒 Security Notes

- Never commit your `.env` file
- Keep `GOOGLE_CLIENT_SECRET` and `JWT_SECRET` private
- Use HTTPS in production
- Rotate secrets regularly

## 📞 Need Help?

1. Check the backend console for error messages
2. Check the browser console for frontend errors
3. Review [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) for detailed troubleshooting
4. Verify all environment variables are set correctly

## 🚀 Production Deployment

When deploying to production:

1. **Update Google Console:**
   - Add production URLs to authorized JavaScript origins
   - Add production callback URL to authorized redirect URIs

2. **Update Environment Variables:**
   ```env
   GOOGLE_CALLBACK_URL="https://yourdomain.com/auth/google/callback"
   CLIENT_URL="https://yourdomain.com"
   NODE_ENV=production
   ```

3. **Use HTTPS** for all URLs (required by Google OAuth)

---

**That's it! You now have Google OAuth fully integrated with your existing authentication system.** 🎉
