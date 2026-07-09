# Tournament Update Error - 400 Bad Request

## Error Details
```
PATCH http://localhost:3001/api/tournaments/528e9254-8129-4b43-87ae-8b787de281aa 400 (Bad Request)
Error updating tournament: AxiosError: Request failed with status code 400
```

## What This Error Means

A **400 Bad Request** error means the server rejected your request because:
1. **Data validation failed** - The data you sent doesn't meet the backend's requirements
2. **Missing required fields** - A required field is missing or empty
3. **Invalid date format** - Dates aren't in the correct format
4. **Database constraint violation** - The data violates a Prisma schema rule

## Common Causes

### 1. **Empty or Invalid Name**
```javascript
// ❌ BAD - Empty name
{ name: '' }

// ✅ GOOD
{ name: 'My Tournament' }
```

### 2. **Invalid Date Format**
```javascript
// ❌ BAD - Invalid date
{ startDate: 'Invalid Date', endDate: null }

// ✅ GOOD - ISO 8601 format
{ startDate: '2026-07-15', endDate: '2026-07-20' }
```

### 3. **Registration Deadline Issues**
```javascript
// ❌ BAD - Invalid datetime
{ registrationDeadline: '' }

// ✅ GOOD - Full ISO datetime
{ registrationDeadline: '2026-07-14T23:59' }
```

### 4. **Empty Required Fields**
The backend requires these fields to **NOT be empty strings**:
- `name` (must be non-empty after trim)
- `venueName` (must be non-empty after trim)
- `city` (must be non-empty after trim)

### 5. **Sports Array Issues**
```javascript
// ❌ BAD - Empty sports array
{ sports: [] }

// ✅ GOOD
{ sports: ['badminton'] }
```

## How to Debug

### Step 1: Check Browser Console
After clicking "Save" in the edit modal, check the console for:
```
📤 Sending update data: { ... }  ← What data is being sent
❌ Response data: { error: "..." }  ← What error the backend returned
```

### Step 2: Check Backend Logs
In your terminal where the backend is running, look for:
```
📥 Update tournament request: { id: '...', body: { ... } }
📝 Update data prepared: { ... }
❌ Error updating tournament: Error: ...
```

### Step 3: Common Backend Error Messages

#### "Status must be one of: DRAFT, OPEN"
**Cause**: Trying to set status to something other than DRAFT or OPEN
**Fix**: The modal should only allow DRAFT or OPEN status

#### Prisma Validation Error
```
Invalid `prisma.tournament.update()` invocation:
  Argument `startDate`: Invalid value provided. Expected DateTime.
```
**Cause**: Date is not a valid Date object or ISO string
**Fix**: Ensure dates are in `YYYY-MM-DD` format

#### "Cannot set required field to null"
```
Argument `name`: Got invalid value 'null' on prisma.updateTournament. Provided null, expected String.
```
**Cause**: A required field (name, venueName, city) is null or empty
**Fix**: Ensure all required fields have values

## The Backend Validation Logic

```javascript
// updateTournament in tournament.controller.js

// Required fields (can't be empty strings)
if (name !== undefined) updateData.name = name.trim();  // Must not be empty!
if (venueName !== undefined) updateData.venueName = venueName.trim();  // Must not be empty!
if (city !== undefined) updateData.city = city.trim();  // Must not be empty!

// Date fields (must be valid Date objects)
if (startDate !== undefined) updateData.startDate = new Date(startDate);
if (endDate !== undefined) updateData.endDate = new Date(endDate);
if (registrationDeadline !== undefined) updateData.registrationDeadline = new Date(registrationDeadline);

// Status validation (only DRAFT or OPEN allowed)
if (status !== undefined) {
  const validStatuses = ['DRAFT', 'OPEN'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Status must be one of: ${validStatuses.join(', ')}`
    });
  }
}
```

## Quick Fix Checklist

Before submitting the update, verify:

- [ ] **Name is not empty** - `formData.name.trim().length > 0`
- [ ] **Venue name is not empty** - `formData.venueName.trim().length > 0`
- [ ] **City is not empty** - `formData.city.trim().length > 0`
- [ ] **Start date is valid** - `formData.startDate` is a date string like "2026-07-15"
- [ ] **End date is valid** - `formData.endDate` is a date string like "2026-07-20"
- [ ] **Registration deadline is valid** - `formData.registrationDeadline` is like "2026-07-14T23:59"
- [ ] **At least one sport selected** - `selectedSports.length > 0`
- [ ] **Status is DRAFT or OPEN** - Not ONGOING, COMPLETED, etc.

## How to Test

### Test 1: Update Just the Name
1. Open edit modal
2. Change only the tournament name to "Test Tournament 123"
3. Click Save
4. Check console for what data was sent

### Test 2: Update All Fields
1. Fill in all fields with valid data
2. Click Save
3. If it fails, check which field caused the error

### Test 3: Intentionally Break It
1. Leave name empty
2. Click Save
3. Should see validation error (helps you understand the error)

## What I Added for Debugging

### Frontend (TournamentManagePage.jsx:110)
```javascript
console.log('📤 Sending update data:', updateData)  // Shows what you're sending
console.error('❌ Response data:', err.response?.data)  // Shows backend error
```

### Backend (tournament.controller.js:275)
```javascript
console.log('📥 Update tournament request:', { id, body: req.body })
console.log('📝 Update data prepared:', updateData)
console.error('❌ Error updating tournament:', error)
```

## Next Steps

1. **Try updating the tournament again**
2. **Check the browser console** - Look for `📤 Sending update data:`
3. **Check the terminal (backend)** - Look for `📥 Update tournament request:`
4. **Copy the error message** from either console and share it with me
5. I'll be able to tell you exactly which field is causing the problem

## Most Likely Culprits (in order)

1. **Registration Deadline** - Often has invalid datetime format
2. **Empty Name/Venue/City** - User accidentally cleared a required field
3. **Date Format Issues** - Browser sends dates in unexpected format
4. **Status Field** - Trying to set invalid status

---

**Run the update again and share the console output!** The logs will tell us exactly what's wrong.
