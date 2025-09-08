import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { EmployeeProvider } from '@/hooks/EmployeeProvider';
import { LeaveProvider } from '@/hooks/LeaveProvider';
import { SettingsProvider } from '@/hooks/SettingsProvider';
import { AuthGuard } from '@/components/AuthGuard';
import { Layout } from '@/components/Layout';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Employees } from '@/pages/Employees';
import { EmployeeDetail } from '@/pages/EmployeeDetail';
import { LeaveManagement } from '@/pages/LeaveManagement';
import { Attendance } from '@/pages/Attendance';
import { Reports } from '@/pages/Reports';
import { Settings } from '@/pages/Settings';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <AuthProvider>
      <EmployeeProvider>
        <LeaveProvider>
          <SettingsProvider>
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

          {/* Protected routes - requires authentication and uses Layout */}
          <Route
            path="/dashboard"
            element={
              <AuthGuard requireAuth={true}>
                <Layout>
                  <Dashboard />
                </Layout>
              </AuthGuard>
            }
          />

          <Route
            path="/employees"
            element={
              <AuthGuard requireAuth={true}>
                <Layout>
                  <Employees />
                </Layout>
              </AuthGuard>
            }
          />

          <Route
            path="/employees/:id"
            element={
              <AuthGuard requireAuth={true}>
                <Layout>
                  <EmployeeDetail />
                </Layout>
              </AuthGuard>
            }
          />

          <Route
            path="/leave-management"
            element={
              <AuthGuard requireAuth={true}>
                <Layout>
                  <LeaveManagement />
                </Layout>
              </AuthGuard>
            }
          />

          <Route
            path="/attendance"
            element={
              <AuthGuard requireAuth={true}>
                <Layout>
                  <Attendance />
                </Layout>
              </AuthGuard>
            }
          />

          <Route
            path="/reports"
            element={
              <AuthGuard requireAuth={true}>
                <Layout>
                  <Reports />
                </Layout>
              </AuthGuard>
            }
          />

          <Route
            path="/settings"
            element={
              <AuthGuard requireAuth={true}>
                <Layout>
                  <Settings />
                </Layout>
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
          <Toaster />
        </SettingsProvider>
        </LeaveProvider>
      </EmployeeProvider>
    </AuthProvider>
  );
}

export default App;
