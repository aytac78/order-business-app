'use client';

import { useEffect, useState } from 'react';
import { Sidebar, MobileHeader } from '@/components/Sidebar';
import { useUIStore } from '@/stores';
import { ProtectedRoute } from '@/components/auth';
import { UserHeader } from '@/components/auth';
import { ThemeProvider } from '@/components/ThemeProvider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed } = useUIStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <ProtectedRoute allowedRoles={['owner', 'manager']}>
      <ThemeProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {/* Mobile Header */}
          <MobileHeader />
          
          {/* User Header - Top Right */}
          <div className="fixed top-2 right-4 z-50 lg:top-4">
            <UserHeader variant="compact" />
          </div>
          
          {/* Sidebar */}
          <Sidebar />
          
          {/* Main Content */}
          <main 
            className={`
              transition-all duration-300
              pt-16 lg:pt-0
              ${isMobile ? 'ml-0' : sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}
            `}
          >
            <div className="p-4 lg:p-6">
              {children}
            </div>
          </main>
        </div>
      </ThemeProvider>
    </ProtectedRoute>
  );
}
