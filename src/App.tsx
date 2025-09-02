import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/AuthGuard';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public route - redirects to dashboard if already authenticated */}
          <Route
            path="/login"
            element={
              <AuthGuard requireAuth={false}>
                <Login />
              </AuthGuard>
            }
          />

          {/* Protected routes - requires authentication */}
          <Route
            path="/dashboard"
            element={
              <AuthGuard requireAuth={true}>
                <Dashboard />
              </AuthGuard>
            }
          />

          {/* Default route - redirect to dashboard if authenticated, otherwise to login */}
          <Route
            path="/"
            element={
              <AuthGuard requireAuth={true}>
                <Navigate to="/dashboard" replace />
              </AuthGuard>
            }
          />

          {/* Catch all route - redirect to dashboard if authenticated, otherwise to login */}
          <Route
            path="*"
            element={
              <AuthGuard requireAuth={true}>
                <Navigate to="/dashboard" replace />
              </AuthGuard>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
