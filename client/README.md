# StepOut2Play - Frontend

Modern React frontend for the StepOut2Play sports tournament management platform.

## Features

- ✅ User Authentication (Login/Signup)
- ✅ Protected Routes
- ✅ JWT Token Management
- ✅ Modern Glassmorphism UI
- ✅ Responsive Design
- ✅ Auto-redirect on authentication
- ✅ Axios API Integration
- ✅ Context-based State Management

## Tech Stack

- **React 18** - UI Library
- **React Router 6** - Routing
- **Axios** - HTTP Client
- **Vite** - Build Tool

## Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── Button.jsx           # Reusable button component
│   │   ├── GlassCard.jsx        # Glassmorphism card component
│   │   ├── Input.jsx            # Form input component
│   │   └── ProtectedRoute.jsx   # Route protection wrapper
│   ├── context/
│   │   └── AuthContext.jsx      # Authentication state management
│   ├── pages/
│   │   ├── DashboardPage.jsx    # Main dashboard
│   │   ├── LoginPage.jsx        # Login page
│   │   └── SignupPage.jsx       # Registration page
│   ├── services/
│   │   ├── api.js               # Axios configuration
│   │   └── authService.js       # Authentication API calls
│   ├── App.jsx                  # Main app component
│   ├── main.jsx                 # Entry point
│   └── index.css                # Global styles
├── index.html
├── package.json
└── vite.config.js
```

## Installation

1. Install dependencies:
```bash
cd client
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your backend API URL:
```
VITE_API_URL=http://localhost:3000
```

## Development

Start the development server:
```bash
npm run dev
```

The app will run on `http://localhost:5173`

## Build

Create production build:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Usage

### Authentication Flow

1. **Signup**: New users can register at `/signup`
2. **Login**: Existing users can login at `/login`
3. **Auto-redirect**: Authenticated users are redirected to `/dashboard`
4. **Protected Routes**: Unauthenticated users are redirected to `/login`
5. **Logout**: Clears token and redirects to login

### API Integration

All API calls go through the centralized `api.js` service which:
- Automatically attaches JWT tokens
- Handles 401 errors with auto-logout
- Provides axios interceptors

### Using Auth Context

```jsx
import { useAuth } from '../context/AuthContext'

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth()
  
  // Access user data, auth methods, etc.
}
```

## Design System

### Colors
- **Primary**: Indigo (#667eea) to Purple (#764ba2)
- **Background**: Gradient (Indigo to Purple)
- **Cards**: White with glassmorphism effect
- **Text**: Gray shades (#1f2937, #6b7280)

### Components
- **GlassCard**: Frosted glass effect cards
- **Button**: Primary, Secondary, Danger variants
- **Input**: Styled form inputs with validation

## API Endpoints Used

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user

## Security Features

- JWT tokens stored in localStorage
- Automatic token attachment to requests
- Auto-logout on 401 responses
- Protected route wrapper
- Password validation (8+ chars, uppercase, lowercase, number, special char)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

ISC
