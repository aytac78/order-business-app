'use client';

// Protected Route Component
// /components/auth/ProtectedRoute.tsx

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { canAccessRoute, getDefaultRoute, UserRole } from '@/lib/auth/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // Not authenticated - redirect to login
    if (!isAuthenticated || !user) {
      router.push('/');
      return;
    }

    // Check if user can access this route
    if (!canAccessRoute(user.role, pathname)) {
      // Redirect to their default route
      const defaultRoute = getDefaultRoute(user.role);
      router.push(defaultRoute);
      return;
    }
  }, [isLoading, isAuthenticated, user, pathname, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  // Not authorized for this route
  if (!canAccessRoute(user.role, pathname)) {
    return null;
  }

  return <>{children}</>;
}
