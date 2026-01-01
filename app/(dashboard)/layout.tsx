'use client';

import { useEffect, useState } from 'react';
import { Sidebar, MobileHeader } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useUIStore, useVenueStore } from '@/stores';
import { ProtectedRoute } from '@/components/auth';
import { ThemeProvider } from '@/components/ThemeProvider';
import { I18nProvider } from '@/lib/i18n/provider';
import { supabase } from '@/lib/supabase';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed } = useUIStore();
  const { currentVenue, currentVenueId, setCurrentVenue, setVenues } = useVenueStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const fetchVenues = async () => {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('is_active', true);

      if (!error && data && data.length > 0) {
        setVenues(data);
        
        if (!currentVenue && currentVenueId) {
          const existingVenue = data.find(v => v.id === currentVenueId);
          if (existingVenue) {
            setCurrentVenue(existingVenue);
          } else {
            setCurrentVenue(data[0]);
          }
        } else if (!currentVenue) {
          setCurrentVenue(data[0]);
        }
      }
    };

    fetchVenues();
  }, []);

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
      <I18nProvider>
        <ThemeProvider>
          <div className="min-h-screen bg-gray-900" style={{ backgroundColor: "#111827" }}>
            <MobileHeader />
            
            <div className="block">
              <Header />
            </div>
            
            <Sidebar />
            
            <main 
              className={`
                transition-all duration-300
                pt-6 lg:pt-20
                ${isMobile ? 'ml-0 pt-16' : sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}
              `}
            >
              <div className="p-4 lg:p-6 bg-gray-900">
                {children}
              </div>
            </main>
          </div>
        </ThemeProvider>
      </I18nProvider>
    </ProtectedRoute>
  );
}
