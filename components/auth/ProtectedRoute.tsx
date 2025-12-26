'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore, StaffRole, roleConfig } from '@/stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: StaffRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentStaff, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Not authenticated - redirect to login
    if (!isAuthenticated || !currentStaff) {
      router.push('/');
      return;
    }

    // Check if user role is allowed
    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(currentStaff.role)) {
        // Redirect to their default route
        const config = roleConfig[currentStaff.role];
        router.push(config.defaultRoute);
        return;
      }
    }
  }, [isAuthenticated, currentStaff, pathname, router, allowedRoles]);

  // Not authenticated
  if (!isAuthenticated || !currentStaff) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Yönlendiriliyor...</p>
        </div>
      </div>
    );
  }

  // Check role access
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(currentStaff.role)) {
    return null;
  }

  return <>{children}</>;
}
