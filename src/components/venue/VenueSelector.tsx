'use client';

import { useState, useRef, useEffect } from 'react';
import { useVenueStore, useAuthStore } from '@/stores';
import { ChevronDown, Building2, Check, X, HelpCircle } from 'lucide-react';

const venueIcons: Record<string, string> = {
  restaurant: '🍽️',
  cafe: '☕',
  bar: '🍸',
  beach_club: '🏖️',
  nightclub: '🎵',
  hotel_restaurant: '🏨',
};

export function VenueSelector() {
  const { currentVenue, venues, setCurrentVenue } = useVenueStore();
  const { currentStaff } = useAuthStore();
  const canSeeAllVenues = currentStaff?.role === "owner" || currentStaff?.role === "manager";
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Kasiyer/garson ise ve "Tüm Mekanlar" seçiliyse, ilk mekanı seç
  useEffect(() => {
    if (!canSeeAllVenues && currentVenue === null && venues.length > 0) {
      setCurrentVenue(venues[0]);
    }
  }, [canSeeAllVenues, currentVenue, venues, setCurrentVenue]);
  const handleSelectVenue = (venue: any | null) => {
    setCurrentVenue(venue);
    setIsOpen(false);
  };

  // Tüm Mekanlar seçiliyse (currentVenue === null)
  const isAllVenues = currentVenue === null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-orange-300 transition-colors min-w-[200px]"
      >
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-xl">
          {isAllVenues ? '🏢' : (venueIcons[currentVenue?.type || ''] || '🏢')}
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-gray-900 truncate max-w-[150px]">
            {isAllVenues ? 'Tüm Mekanlar' : currentVenue?.name}
          </p>
          <p className="text-xs text-gray-500 capitalize">
            {isAllVenues ? `${venues.length} mekan` : (currentVenue?.type?.replace('_', ' ') || '')}
          </p>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Tüm Mekanlar seçeneği - sadece owner/manager görebilir */}
          {canSeeAllVenues && (
          <button
            onClick={() => handleSelectVenue(null)}
            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors ${
              isAllVenues ? 'bg-orange-50' : ''
            }`}
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-xl">
              🏢
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-900">Tüm Mekanlar</p>
              <p className="text-xs text-gray-500">{venues.length} mekan</p>
            </div>
            {isAllVenues && <Check className="w-5 h-5 text-orange-500" />}
          </button>

          )}

          <div className="border-t border-gray-100" />

          {/* Mekan listesi */}
          <div className="max-h-64 overflow-y-auto">
            {venues.map((venue) => (
              <button
                key={venue.id}
                onClick={() => handleSelectVenue(venue)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors ${
                  currentVenue?.id === venue.id ? 'bg-orange-50' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-xl">
                  {venueIcons[venue.type] || '🏢'}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900">{venue.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{venue.type?.replace('_', ' ')}</p>
                </div>
                {currentVenue?.id === venue.id && <Check className="w-5 h-5 text-orange-500" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
