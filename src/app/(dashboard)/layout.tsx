'use client';

import { useEffect, useState } from 'react';
import { Sidebar, MobileHeader } from '@/components/Sidebar';
import { useUIStore } from '@/stores';

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
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <MobileHeader />
      
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
  );
}
