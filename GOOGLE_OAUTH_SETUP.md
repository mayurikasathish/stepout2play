# Google OAuth Setup Guide

This guide will walk you through setting up Google OAuth for the StepOut2Play application.

## Prerequisites

- A Google account
- Your application running locally or deployed

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project name and ID

## Step 2: Enable Google+ API

1. In the Google Cloud Console, navigate to **APIs & Services** > **Library**
2. Search for "Google+ API"
3. Click on it and press **Enable**

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type (unless you have a Google Workspace account)
3. Click **Create**
4. Fill in the required fields:
   - **App name**: StepOut2Play
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click **Save and Continue**
6. Skip the "Scopes" section by clicking **Save and Continue**
7. Add test users (your email) if in testing mode
8. Click **Save and Continue**

## Step 4: Create OAuth Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Choose **Web application**
4. Configure the settings:
   - **Name**: StepOut2Play Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (development)
     - Your production URL (e.g., `https://yourdomain.com`)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/auth/google/callback` (development)
     - Your production callback URL (e.g., `https://yourdomain.com/auth/google/callback`)
5. Click **Create**
6. Copy your **Client ID** and **Client Secret**

## Step 5: Update Environment Variables

1. Copy `.env.example` to `.env` if you haven't already:
   ```bash
   cp .env.example .env
   ```

2. Update your `.env` file with the Google OAuth credentials:
   ```env
   GOOGLE_CLIENT_ID="your-actual-client-id-from-google"
   GOOGLE_CLIENT_SECRET="your-actual-client-secret-from-google"
   GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"
   CLIENT_URL="http://localhost:5173"
   SESSION_SECRET="generate-a-random-secret-key-here"
   ```

3. For `SESSION_SECRET`, generate a random string:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

## Step 6: Update Database Schema

Run the Prisma migration to add the new Google OAuth fields:

```bash
npm run prisma:migrate
```

If prompted for a migration name, enter: `add_google_oauth`

## Step 7: Test the Integration

1. Start your backend server:
   ```bash
   npm run dev
   ```

2. Start your frontend client:
   ```bash
   cd client
   npm run dev
   ```

3. Navigate to the login or signup page
4. Click "Continue with Google"
5. Sign in with your Google account
6. You should be redirected back to the dashboard

## Troubleshooting

### "redirect_uri_mismatch" Error
- Ensure the redirect URI in Google Console exactly matches your `GOOGLE_CALLBACK_URL`
- Check for trailing slashes and http vs https

### "Access blocked: This app's request is invalid"
- Make sure you've enabled the Google+ API
- Verify your OAuth consent screen is configured correctly
- Add your email as a test user if the app is in testing mode

### "No authorization token provided"
- Check that `CLIENT_URL` in `.env` matches your frontend URL
- Verify CORS is configured correctly in `src/app.js`

### Backend doesn't redirect properly
- Ensure `CLIENT_URL` environment variable is set correctly
- Check browser console for errors

## Production Deployment

When deploying to production:

1. Update your OAuth credentials in Google Console with production URLs
2. Set `NODE_ENV=production` in your environment
3. Use HTTPS for all URLs
4. Update `GOOGLE_CALLBACK_URL` and `CLIENT_URL` to your production domains
5. Set `cookie.secure: true` in session config (already configured to use `NODE_ENV`)

## Security Notes

- Never commit your `.env` file to version control
- Keep your `GOOGLE_CLIENT_SECRET` secure
- Use strong random strings for `JWT_SECRET` and `SESSION_SECRET`
- In production, use HTTPS for all OAuth redirect URIs
- Regularly rotate your secrets
