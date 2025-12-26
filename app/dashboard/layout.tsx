'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar, MobileHeader } from '@/components/Sidebar';
import { useUIStore, useAuthStore } from '@/stores';
import { LogOut, User, ChevronDown, Settings } from 'lucide-react';
import Link from 'next/link';
import { roleConfig } from '@/stores/authStore';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { sidebarCollapsed } = useUIStore();
  const { currentStaff, logout, isAuthenticated } = useAuthStore();
  const [isMobile, setIsMobile] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    router.push('/');
  };

  const config = currentStaff ? roleConfig[currentStaff.role] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <MobileHeader />
      
      {/* User Menu - Top Right */}
      <div className="fixed top-2 right-4 z-50 lg:top-4">
        {currentStaff && config && (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow transition-shadow"
            >
              <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                <span className="text-sm">{config.icon}</span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900">{currentStaff.name}</p>
                <p className={`text-xs ${config.color}`}>{config.label}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  <div className="p-3 border-b border-gray-100">
                    <p className="font-medium text-gray-900">{currentStaff.name}</p>
                    <p className={`text-xs ${config.color}`}>{config.label}</p>
                  </div>
                  <div className="p-2">
                    <Link
                      href="/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      <Settings className="w-4 h-4" />
                      Ayarlar
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <LogOut className="w-4 h-4" />
                      Çıkış Yap
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
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
  );
}
