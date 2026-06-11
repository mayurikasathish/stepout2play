# Doubles & Mixed Doubles Registration Guide

## Overview

This feature allows users to register for Doubles and Mixed Doubles events with partner verification to ensure both players are eligible.

## How It Works

### For Singles Events
1. User clicks "Register" button
2. System checks eligibility (age, gender, DOB)
3. If eligible, registration is confirmed
4. Success message is shown

### For Doubles/Mixed Doubles Events
1. User clicks "Register" button
2. **Partner Selection Modal** appears
3. User enters partner's email address
4. System searches for partner account
5. System verifies **both players** for:
   - Age eligibility (based on event category)
   - Gender requirements (event-specific)
   - Mixed Doubles gender compatibility (one male + one female)
   - Existing registrations (partner not already registered)
6. **Eligibility Result** is shown:
   - ✅ **Both Eligible**: Shows success message with both player details
   - ❌ **Not Eligible**: Shows specific reasons for rejection
7. If eligible, user confirms and registration is completed

## Backend Implementation

### New Files Created:
- **`src/services/partner.service.js`** - Partner search and verification logic
  - `searchPartnerByEmail(email)` - Finds user by email
  - `verifyPartnerEligibility(userId, partnerId, eventId)` - Comprehensive eligibility check

### Updated Files:
- **`src/controllers/registration.controller.js`** - Added endpoints:
  - `POST /events/:eventId/search-partner` - Search for partner
  - `POST /events/:eventId/verify-partner` - Verify partner eligibility
  
- **`src/routes/registration.routes.js`** - Added new routes

### Verification Logic

#### For Regular Doubles (Men's/Women's):
- ✅ Both players must match the gender requirement
- ✅ Both players must meet age requirements
- ✅ Partner not already registered
- ✅ Both players have DOB and gender in profile

#### For Mixed Doubles:
- ✅ One male + one female player (required)
- ✅ Both players must meet age requirements
- ✅ Partner not already registered
- ✅ Both players have DOB and gender in profile

## Frontend Implementation

### New Components:
- **`client/src/components/PartnerSelectionModal.jsx`**
  - Step 1: Email input and partner search
  - Step 2: Verification results display
  - Shows partner info (name, email, age, gender)
  - Clear eligibility status with specific reasons

### Updated Pages:
- **`client/src/pages/TournamentDetailPage.jsx`**
  - Added partner modal state management
  - Updated `handleRegister()` to detect doubles/mixed doubles
  - Added `registerForEvent()` with optional partnerId
  - Added `handlePartnerConfirm()` callback

## API Endpoints

### 1. Search Partner
```http
POST /api/events/:eventId/search-partner
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "partner@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "partner": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "dob": "1995-05-15",
    "gender": "Male",
    "profilePicture": null
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "No user found with this email address"
}
```

### 2. Verify Partner Eligibility
```http
POST /api/events/:eventId/verify-partner
Authorization: Bearer <token>
Content-Type: application/json

{
  "partnerId": "partner-uuid"
}
```

**Response (Both Eligible):**
```json
{
  "success": true,
  "eligible": true,
  "reasons": [],
  "user": {
    "id": "user-uuid",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "dob": "1998-03-20",
    "gender": "Female",
    "age": 28
  },
  "partner": {
    "id": "partner-uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "dob": "1995-05-15",
    "gender": "Male",
    "age": 31
  },
  "event": {
    "id": "event-uuid",
    "name": "Mixed Doubles Open",
    "format": "MIXED_DOUBLES",
    "category": "Open",
    "gender": null,
    "tournamentName": "City Championship 2026"
  }
}
```

**Response (Not Eligible):**
```json
{
  "success": true,
  "eligible": false,
  "reasons": [
    "Mixed Doubles requires one male and one female player",
    "Partner: This event is for players under 19 years old. Partner will be 31 years old on the tournament date."
  ],
  "user": { ... },
  "partner": { ... },
  "event": { ... }
}
```

### 3. Register for Event (with Partner)
```http
POST /api/events/:eventId/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "partnerId": "partner-uuid"  // Optional, only for doubles
}
```

## Testing Scenarios

### Test 1: Singles Registration
1. Navigate to a tournament with Singles events
2. Click "Register" on a Singles event
3. Should register immediately (if eligible)

### Test 2: Doubles - Both Eligible
1. Create two users with matching gender for event
2. Navigate to a Doubles event
3. Click "Register"
4. Enter partner's email
5. Should show "Both Players Eligible!"
6. Click "Confirm & Register"
7. Should show success message

### Test 3: Mixed Doubles - Gender Mismatch
1. Create two users with SAME gender
2. Navigate to a Mixed Doubles event
3. Click "Register"
4. Enter partner's email
5. Should show "Not Eligible" with reason: "Mixed Doubles requires one male and one female player"

### Test 4: Partner Already Registered
1. User A registers for a doubles event with User B
2. User C tries to register with User B as partner
3. Should show "Not Eligible" with reason: "Partner is already registered for this event"

### Test 5: Age Restriction
1. Create event "U19 Boys Doubles"
2. User (age 25) tries to register with partner (age 17)
3. Should show "Not Eligible" with reason: "You: This event is for players under 19 years old. You will be 25 years old on the tournament date."

### Test 6: Missing Profile Data
1. User has no DOB set in profile
2. Tries to register for any doubles event
3. Should show "Not Eligible" with reason: "Date of birth not set in profile. Please update your profile."

### Test 7: Gender Requirement (Women's Doubles)
1. Male user tries to register for "Women's Doubles"
2. Should show "Not Eligible" with reason: "You: This event is for Women only."

### Test 8: Partner Not Found
1. Enter non-existent email
2. Should show error: "No user found with this email address"

## Database Schema (Existing)

The `Registration` model already supports partner relationships:

```prisma
model Registration {
  id        String             @id @default(uuid())
  userId    String             // Primary registrant
  eventId   String
  partnerId String?            // Partner (optional, for doubles)
  status    RegistrationStatus @default(CONFIRMED)
  createdAt DateTime           @default(now())
  updatedAt DateTime           @updatedAt
  
  event     Event              @relation(...)
  user      User               @relation("UserRegistrations", ...)
  partner   User?              @relation("PartnerRegistrations", ...)
  
  @@unique([userId, eventId])
}
```

## User Flow Diagram

```
Singles Event:
  Register → Check Eligibility → Register → Success

Doubles/Mixed Doubles Event:
  Register → Partner Modal Opens
           ↓
           Enter Partner Email
           ↓
           Search Partner (API Call)
           ↓
           Verify Both Players (API Call)
           ↓
      ┌────┴────┐
      │         │
   Eligible   Not Eligible
      │         │
      │         └→ Show Reasons
      │            ↓
      │            Try Different Partner / Close
      │
      └→ Show Success
         ↓
         Confirm & Register
         ↓
         Registration Created
         ↓
         Success Message
```

## Error Handling

All API errors are caught and displayed to the user:
- **404**: Partner not found
- **400**: Invalid request (missing fields, self-partnering)
- **403**: Eligibility check failed
- **409**: Already registered / Partner already registered
- **500**: Server error

## Future Enhancements

Potential improvements for the future:
1. **Partner Invitations**: Send email invitation to partner for confirmation
2. **Partner Suggestions**: Show list of eligible partners based on event requirements
3. **Team Names**: Allow custom team names for doubles pairs
4. **Partner History**: Show previous partners and win/loss records
5. **Waitlist**: If partner becomes eligible later, notify both players
6. **Bulk Registration**: Register multiple pairs at once (for organizers)

## Troubleshooting

### Issue: "Partner not found" but email is correct
**Solution**: Partner must have a registered account. Direct them to sign up first.

### Issue: Modal closes unexpectedly
**Solution**: Check browser console for errors. Ensure all API endpoints are accessible.

### Issue: Verification always fails
**Solution**: 
1. Check that both users have DOB and gender set in their profiles
2. Verify event category and gender requirements
3. Check database for existing registrations

### Issue: Can't register even though both players are eligible
**Solution**: Check the event's `maxParticipants` limit and current registration count.

## Development Notes

- Partner verification is done server-side for security
- Client-side modal provides immediate feedback
- All eligibility rules are centralized in `eligibility.service.js`
- Prisma relations handle partner lookups efficiently
- Modal component is reusable for different event formats
