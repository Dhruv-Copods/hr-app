# Routing System Documentation

## Overview
This HR app implements a secure routing system with authentication guards using React Router v6 and Firebase authentication.

## Routes

### Public Routes
- **`/login`** - Login page with Google Sign-In
  - Redirects authenticated users to `/dashboard`
  - Accessible to everyone

### Protected Routes
- **`/dashboard`** - Main dashboard (requires authentication)
  - Redirects unauthenticated users to `/login`
  - Shows user profile and account information

### Default Redirects
- **`/`** - Redirects to `/dashboard`
- **`*`** (catch-all) - Redirects to `/dashboard`

## Authentication Guards

### AuthGuard
- Protects routes that require authentication
- Shows loading spinner while checking auth state
- Redirects to `/login` if user is not authenticated
- Renders children if user is authenticated

### PublicRoute
- Protects public routes from authenticated users
- Shows loading spinner while checking auth state
- Redirects to `/dashboard` if user is already authenticated
- Renders children if user is not authenticated

## Components

### App.tsx
- Main routing configuration
- Handles global loading state
- Sets up route structure with guards

### Dashboard.tsx
- Protected route component
- Displays user information
- Includes logout functionality in header

### Login.tsx
- Public route component
- Google Sign-In integration
- Loading states for better UX

### UserProfile.tsx
- Displays detailed user information
- Used within Dashboard component

## Authentication Flow

1. **Unauthenticated User**
   - Visits any route → redirected to `/login`
   - Signs in with Google → automatically redirected to `/dashboard`

2. **Authenticated User**
   - Visits `/login` → redirected to `/dashboard`
   - Visits `/dashboard` → allowed access
   - Signs out → redirected to `/login`

3. **Loading States**
   - App shows loading spinner while checking authentication
   - Prevents flashing of incorrect content

## Security Features

- **Route Protection**: All routes are protected by appropriate guards
- **Automatic Redirects**: Users are automatically redirected based on auth state
- **Session Persistence**: Firebase handles session persistence across browser sessions
- **Loading States**: Prevents unauthorized access during authentication checks

## Usage

The routing system automatically handles:
- Authentication state changes
- Route protection
- User redirects
- Loading states

No manual navigation management is required - the system automatically routes users based on their authentication status.
