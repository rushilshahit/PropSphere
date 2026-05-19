import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { UserRole } from '@propsphere/types';
import { useAppSelector } from '@/store/hooks';
import {
  selectAuthInitialized,
  selectIsAuthenticated,
  selectUserRole,
} from '@/features/auth/store/authSlice';
import { Spinner } from '@/components/ui';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: UserRole[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const initialized = useAppSelector(selectAuthInitialized);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const userRole = useAppSelector(selectUserRole);
  const location = useLocation();

  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ requireAuth: true, returnTo: location.pathname }} />;
  }

  if (roles && userRole && !roles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
