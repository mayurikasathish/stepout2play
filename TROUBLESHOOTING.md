# Troubleshooting Guide

## "Registration Failed" Error

### Step 1: Check if Backend is Running

Make sure your backend server is running on port 3000:

```bash
# In the root directory
npm run dev
```

You should see:
```
StepOut2Play API running on port 3000
Environment: development
```

### Step 2: Check if Frontend is Running

In a separate terminal:

```bash
cd client
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

### Step 3: Test Backend API Directly

Open a new terminal and test the backend API directly with curl or use Postman:

```bash
# Test registration endpoint directly
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Ruby123+",
    "firstName": "Test",
    "lastName": "User"
  }'
```

**Expected Response (Success):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User"
    },
    "token": "eyJhbGc..."
  }
}
```

**If you get an error**, it will tell you exactly what's wrong.

### Step 4: Check Browser Console

1. Open your browser Developer Tools (F12)
2. Go to the **Console** tab
3. Try to register again
4. Look for the error message that starts with: `Registration error:`

This will show you the exact error from the backend.

### Step 5: Check Network Tab

1. Open Developer Tools (F12)
2. Go to the **Network** tab
3. Try to register again
4. Click on the `/auth/register` request
5. Check the **Response** tab to see what the backend returned

### Common Issues and Solutions

#### Issue 1: "Network Error" or "ERR_CONNECTION_REFUSED"

**Problem:** Backend is not running or running on wrong port.

**Solution:**
```bash
# Stop any running node processes
# Then restart backend
npm run dev
```

#### Issue 2: "User with this email already exists"

**Problem:** You already registered with that email.

**Solution:** Use a different email or login instead.

#### Issue 3: CORS Error

**Problem:** Frontend can't connect to backend due to CORS.

**Solution:** The Vite proxy should handle this, but if not, add CORS to backend:

```bash
npm install cors
```

Then update `src/app.js`:
```javascript
const cors = require('cors');
app.use(cors());
```

#### Issue 4: Database Connection Error

**Problem:** PostgreSQL is not running or credentials are wrong.

**Solution:**
1. Check if PostgreSQL is running
2. Verify `.env` file has correct `DATABASE_URL`
3. Run migrations again:
```bash
npm run prisma:migrate
```

#### Issue 5: Password Validation Error

**Problem:** Password doesn't meet requirements.

**Solution:** Password must have:
- At least 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*()_+-=[]{}etc.)

Example valid passwords:
- `Ruby123+`
- `Test@1234`
- `MyPass123!`

### Step 6: Check Database

Make sure the database is set up correctly:

```bash
# Open Prisma Studio to view database
npm run prisma:studio
```

This will open a browser at `http://localhost:5555` where you can see your users.

### Still Having Issues?

If none of the above works, please provide:
1. The exact error message from the browser console
2. The response from the Network tab
3. Whether the backend is running and showing any errors
