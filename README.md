# StepOut2Play - Authentication Implementation

Sports tournament management platform - Authentication vertical slice.

## Tech Stack

- Node.js + Express
- PostgreSQL + Prisma ORM
- JWT authentication
- bcrypt password hashing

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update with your values:

```bash
cp .env.example .env
```

Update the `DATABASE_URL` and `JWT_SECRET` in `.env`.

### 3. Setup Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view data
npm run prisma:studio
```

### 4. Start Server

```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

Server runs on `http://localhost:3000`

## API Endpoints

### 1. Register User

**POST** `/auth/register`

```json
{
  "email": "john.doe@example.com",
  "password": "SecureP@ss123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "createdAt": "2026-06-05T10:00:00.000Z",
      "updatedAt": "2026-06-05T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Login

**POST** `/auth/login`

```json
{
  "email": "john.doe@example.com",
  "password": "SecureP@ss123"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "createdAt": "2026-06-05T10:00:00.000Z",
      "updatedAt": "2026-06-05T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Get Current User

**GET** `/auth/me`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "createdAt": "2026-06-05T10:00:00.000Z",
      "updatedAt": "2026-06-05T10:00:00.000Z"
    }
  }
}
```

## Password Requirements

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

## Security Features

- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens expire after 24 hours
- Passwords never returned in API responses
- Email addresses normalized to lowercase
- Comprehensive input validation
- Proper HTTP status codes

## Project Structure

```
stepout2play/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── controllers/
│   │   └── auth.controller.js # HTTP request/response handling
│   ├── lib/
│   │   └── prisma.js          # Prisma client singleton
│   ├── middleware/
│   │   └── authenticate.js    # JWT authentication middleware
│   ├── routes/
│   │   └── auth.routes.js     # Route definitions
│   ├── services/
│   │   └── auth.service.js    # Business logic
│   ├── app.js                 # Express app configuration
│   └── server.js              # Server entry point
├── .env.example               # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": "Error message"
}
```

Or for validation errors:

```json
{
  "success": false,
  "errors": [
    "Email is required",
    "Password must be at least 8 characters long"
  ]
}
```

## Next Steps

- Add refresh token functionality
- Implement email verification
- Add password reset flow
- Add rate limiting
- Add logging
- Write unit and integration tests
