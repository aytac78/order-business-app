'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVenueStore, useNotificationStore, useUIStore, useAuthStore } from '@/stores';
import { Bell, ChevronDown, Menu, Search, Building2, Check, LogOut, User, Settings } from 'lucide-react';
import Link from 'next/link';

// Demo venues
const demoVenues = [
  { id: '1', name: 'ORDER Bodrum Marina', type: 'restaurant', city: 'Bodrum' },
  { id: '2', name: 'ORDER Türkbükü Beach', type: 'beach_club', city: 'Bodrum' },
  { id: '3', name: 'ORDER Yalıkavak', type: 'restaurant', city: 'Bodrum' },
];

export function Header() {
  const router = useRouter();
  const { currentVenue, setCurrentVenue, venues } = useVenueStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();
  const { toggleSidebar, sidebarCollapsed } = useUIStore();
  const { currentStaff, logout } = useAuthStore();
  
  const [showVenueDropdown, setShowVenueDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Use demo venues if no venues in store
  const displayVenues = venues.length > 0 ? venues : demoVenues;

  const handleVenueChange = (venue: any) => {
    setCurrentVenue(venue);
    setShowVenueDropdown(false);
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    router.push('/');
  };

  const roleLabels: Record<string, string> = { 
    owner: 'Yönetici', 
    manager: 'Müdür', 
    cashier: 'Kasiyer', 
    waiter: 'Garson', 
    kitchen: 'Mutfak',
    reception: 'Resepsiyon'
  };

  const displayName = currentStaff?.name || 'Ahmet Yılmaz';
  const displayRole = currentStaff ? (roleLabels[currentStaff.role] || currentStaff.role) : 'İşletme Sahibi';
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header className={`fixed top-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-40 transition-all ${sidebarCollapsed ? 'left-20' : 'left-64'}`}>
      {/* Left */}
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="p-2 hover:bg-gray-100 rounded-lg lg:hidden">
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Venue Selector */}
        <div className="relative">
          <button onClick={() => setShowVenueDropdown(!showVenueDropdown)} className="flex items-center gap-3 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900 text-sm">{currentVenue?.name || 'Mekan Seç'}</p>
              <p className="text-xs text-gray-500">{currentVenue ? 'Aktif' : 'Seçim yapın'}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showVenueDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showVenueDropdown && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
              <div className="p-2">
                {displayVenues.map((venue: any) => (
                  <button key={venue.id} onClick={() => handleVenueChange(venue)} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${currentVenue?.id === venue.id ? 'bg-orange-50' : 'hover:bg-gray-50'}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${currentVenue?.id === venue.id ? 'bg-orange-500' : 'bg-gray-200'}`}>
                      <Building2 className={`w-5 h-5 ${currentVenue?.id === venue.id ? 'text-white' : 'text-gray-600'}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900">{venue.name}</p>
                      <p className="text-xs text-gray-500">{venue.city}</p>
                    </div>
                    {currentVenue?.id === venue.id && <Check className="w-5 h-5 text-orange-500" />}
                  </button>
                ))}
              </div>
              <div className="p-2 border-t border-gray-100">
                <button className="w-full p-3 text-center text-sm text-orange-600 hover:bg-orange-50 rounded-lg font-medium">
                  + Yeni Mekan Ekle
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Ara..." className="bg-transparent border-none outline-none text-sm w-40" />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 hover:bg-gray-100 rounded-xl">
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold">Bildirimler</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-orange-600 hover:underline">Tümünü okundu işaretle</button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? notifications.slice(0, 10).map(notif => (
                  <div key={notif.id} onClick={() => markAsRead(notif.id)} className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${!notif.is_read ? 'bg-orange-50/50' : ''}`}>
                    <p className="text-sm text-gray-900">{notif.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(notif.created_at).toLocaleTimeString('tr-TR')}</p>
                  </div>
                )) : (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Bildirim yok</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm">
              {initials}
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          
          {showUserMenu && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
              <div className="p-3 border-b border-gray-100">
                <p className="font-medium text-gray-900">{displayName}</p>
                <p className="text-xs text-gray-500">{displayRole}</p>
              </div>
              <div className="p-2">
                <Link href="/settings" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                  <User className="w-4 h-4" />Profilim
                </Link>
                <Link href="/settings" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                  <Settings className="w-4 h-4" />Ayarlar
                </Link>
                <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                  <LogOut className="w-4 h-4" />Çıkış Yap
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Backdrop */}
      {(showVenueDropdown || showNotifications || showUserMenu) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowVenueDropdown(false); setShowNotifications(false); setShowUserMenu(false); }} />
      )}
    </header>
  );
}
