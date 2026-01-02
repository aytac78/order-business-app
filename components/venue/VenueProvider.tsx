'use client';

import { useEffect, useState } from 'react';
import { useVenueStore, useAuthStore } from '@/stores';
import { venueService, Venue } from '@/lib/services';

export function VenueProvider({ children }: { children: React.ReactNode }) {
  const { setVenues, setCurrentVenue, currentVenue, venues } = useVenueStore();
  const { currentStaff, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadVenues() {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Tüm aktif mekanları getir
        const venuesData = await venueService.getAll();
        
        if (venuesData.length > 0) {
          setVenues(venuesData as any);
          
          // Eğer seçili mekan yoksa ilkini seç
          if (!currentVenue) {
            setCurrentVenue(venuesData[0] as any);
          }
        }
      } catch (err) {
        console.error('Mekanlar yüklenirken hata:', err);
        setError('Mekanlar yüklenemedi');
      } finally {
        setLoading(false);
      }
    }

    loadVenues();
  }, [isAuthenticated, setVenues, setCurrentVenue]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Mekanlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button type="button" 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}