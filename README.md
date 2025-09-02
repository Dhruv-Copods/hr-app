# HR App with Firebase Authentication

A React application with Firebase Google authentication and user profile management.

## Features

- 🔐 Google Sign-in with popup authentication
- 👤 User profile display with detailed information
- 🚪 Sign out functionality
- 📱 Responsive design with Tailwind CSS
- ⚡ Fast development with Vite

## Setup Instructions

### 1. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Authentication and add Google as a sign-in provider
4. Get your Firebase configuration from Project Settings > General > Your apps
5. Update `src/firebase.ts` with your actual Firebase configuration:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id"
};
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Run Development Server

```bash
pnpm dev
```

The app will open at `http://localhost:5173`

## How It Works

1. **Initial State**: App shows a loading spinner while checking authentication state
2. **Not Authenticated**: Shows the login page with Google sign-in button
3. **Authentication**: Clicking the Google button opens a popup for Google authentication
4. **Authenticated**: After successful login, shows the user profile with:
   - Full name
   - Email address
   - User ID
   - Email verification status
   - Account creation date
   - Last sign-in date
5. **Sign Out**: Click the sign-out button to return to the login page

## Project Structure

```
src/
├── components/
│   ├── Login.tsx          # Login component with Google sign-in
│   └── UserProfile.tsx    # User profile display component
├── hooks/
│   └── useAuth.ts         # Custom hook for authentication state
├── firebase.ts            # Firebase configuration and auth functions
├── App.tsx                # Main app component
└── index.css              # Styles with Tailwind CSS
```

## Technologies Used

- React 19
- TypeScript
- Firebase Authentication
- Tailwind CSS
- Vite

## Notes

- The app uses popup authentication for a better user experience
- All user data is fetched from Firebase Auth
- The UI is fully responsive and follows modern design principles
- Error handling is implemented for authentication failures
