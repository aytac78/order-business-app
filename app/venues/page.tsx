'use client';

import { useState, useEffect } from 'react';
import { useVenueStore } from '@/stores';
import { Building2, Plus, MapPin, Phone, Mail, Clock, Users, TrendingUp, Settings, Check, Star, ExternalLink, MoreVertical } from 'lucide-react';

interface VenueCard {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  phone: string;
  isActive: boolean;
  stats: {
    todayRevenue: number;
    todayOrders: number;
    activeOrders: number;
    occupancy: number;
  };
}

const demoVenues: VenueCard[] = [
  { id: '1', name: 'ORDER Bodrum Marina', type: 'restaurant', address: 'Neyzen Tevfik Cad. No:123', city: 'Bodrum, Muğla', phone: '0252 316 1234', isActive: true, stats: { todayRevenue: 18450, todayOrders: 47, activeOrders: 8, occupancy: 75 } },
  { id: '2', name: 'ORDER Türkbükü Beach', type: 'beach_club', address: 'Türkbükü Sahil', city: 'Bodrum, Muğla', phone: '0252 377 2345', isActive: true, stats: { todayRevenue: 32800, todayOrders: 62, activeOrders: 12, occupancy: 85 } },
  { id: '3', name: 'ORDER Yalıkavak', type: 'restaurant', address: 'Palmarina No:45', city: 'Bodrum, Muğla', phone: '0252 385 3456', isActive: false, stats: { todayRevenue: 0, todayOrders: 0, activeOrders: 0, occupancy: 0 } },
];

const typeLabels: Record<string, string> = {
  restaurant: 'Restoran',
  cafe: 'Kafe',
  bar: 'Bar',
  beach_club: 'Beach Club',
  nightclub: 'Gece Kulübü',
  hotel_restaurant: 'Otel Restoranı',
};

export default function VenuesPage() {
  const { currentVenue, setCurrentVenue, venues } = useVenueStore();
  const [mounted, setMounted] = useState(false);
  const [venueList, setVenueList] = useState<VenueCard[]>(demoVenues);

  useEffect(() => { setMounted(true); }, []);

  const totalRevenue = venueList.reduce((sum, v) => sum + v.stats.todayRevenue, 0);
  const totalOrders = venueList.reduce((sum, v) => sum + v.stats.todayOrders, 0);
  const activeVenues = venueList.filter(v => v.isActive).length;

  if (!mounted) return <div className="animate-pulse bg-gray-100 rounded-2xl h-96" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mekanlarım</h1>
          <p className="text-gray-500">{venueList.length} mekan • {activeVenues} aktif</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600">
          <Plus className="w-4 h-4" />Yeni Mekan Ekle
        </button>
      </div>

      {/* Total Stats */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white">
        <h2 className="text-orange-100 mb-4">Bugün Tüm Mekanlar</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-3xl font-bold">₺{totalRevenue.toLocaleString()}</p>
            <p className="text-orange-100">Toplam Ciro</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{totalOrders}</p>
            <p className="text-orange-100">Toplam Sipariş</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{venueList.reduce((sum, v) => sum + v.stats.activeOrders, 0)}</p>
            <p className="text-orange-100">Aktif Sipariş</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{Math.round(venueList.filter(v => v.isActive).reduce((sum, v) => sum + v.stats.occupancy, 0) / activeVenues)}%</p>
            <p className="text-orange-100">Ort. Doluluk</p>
          </div>
        </div>
      </div>

      {/* Venues Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {venueList.map(venue => (
          <div key={venue.id} className={`bg-white rounded-2xl border overflow-hidden ${!venue.isActive ? 'opacity-60' : ''}`}>
            {/* Header */}
            <div className="p-4 border-b flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${currentVenue?.id === venue.id ? 'bg-orange-500' : 'bg-gray-100'}`}>
                  <Building2 className={`w-6 h-6 ${currentVenue?.id === venue.id ? 'text-white' : 'text-gray-600'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{venue.name}</h3>
                    {currentVenue?.id === venue.id && <Check className="w-4 h-4 text-orange-500" />}
                  </div>
                  <p className="text-sm text-gray-500">{typeLabels[venue.type]}</p>
                </div>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            
            {/* Info */}
            <div className="p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{venue.address}, {venue.city}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{venue.phone}</span>
              </div>
            </div>
            
            {/* Stats */}
            {venue.isActive && (
              <div className="px-4 pb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-green-600">₺{venue.stats.todayRevenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Bugün Ciro</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold">{venue.stats.todayOrders}</p>
                    <p className="text-xs text-gray-500">Sipariş</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-orange-600">{venue.stats.activeOrders}</p>
                    <p className="text-xs text-gray-500">Aktif</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold">{venue.stats.occupancy}%</p>
                    <p className="text-xs text-gray-500">Doluluk</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="p-4 border-t flex gap-2">
              {currentVenue?.id !== venue.id ? (
                <button 
                  onClick={() => setCurrentVenue(venue as any)} 
                  className="flex-1 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600"
                >
                  Yönet
                </button>
              ) : (
                <button className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl font-medium">
                  <Check className="w-4 h-4 inline mr-1" />Seçili
                </button>
              )}
              <button className="p-2 hover:bg-gray-100 rounded-xl">
                <Settings className="w-5 h-5 text-gray-500" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-xl">
                <ExternalLink className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        ))}
        
        {/* Add New Card */}
        <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center min-h-[300px]">
          <button className="text-center p-8">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <p className="font-medium text-gray-600">Yeni Mekan Ekle</p>
            <p className="text-sm text-gray-400">Yeni bir işletme oluşturun</p>
          </button>
        </div>
      </div>
    </div>
  );
}
