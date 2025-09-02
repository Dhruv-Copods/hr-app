import { useAuth } from '@/hooks/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = true
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-32 w-32 animate-spin text-gray-900" />
      </div>
    );
  }

  if (requireAuth && !user) {
    // Redirect to login if authentication is required but user is not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!requireAuth && user) {
    // Redirect to dashboard if user is already authenticated and trying to access login
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
