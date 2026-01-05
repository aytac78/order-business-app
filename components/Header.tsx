'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useVenueStore, useNotificationStore, useUIStore, useAuthStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import { Bell, ChevronDown, Menu, Search, Building2, Check, LogOut, User, Settings } from 'lucide-react';
import Link from 'next/link';
import { LanguageSelectorCompact } from '@/components/LanguageSelector';

export function Header() {
  const router = useRouter();
  const { currentVenue, setCurrentVenue, venues } = useVenueStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();
  const { toggleSidebar, sidebarCollapsed } = useUIStore();
  const { currentStaff, logout } = useAuthStore();
  const [profileName, setProfileName] = useState<string | null>(null);
  
  const [showVenueDropdown, setShowVenueDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Load profile name from Supabase
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();
        if (data?.full_name) setProfileName(data.full_name);
      }
    };
    loadProfile();
  }, []);

  const handleVenueChange = (venue: any) => {
    setCurrentVenue(venue);
    setShowVenueDropdown(false);
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    router.push('/');
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowVenueDropdown(false);
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const roleLabels: Record<string, string> = { 
    owner: 'Yönetici', 
    manager: 'Müdür', 
    cashier: 'Kasiyer', 
    waiter: 'Garson', 
    kitchen: 'Mutfak',
    reception: 'Resepsiyon'
  };

  const displayName = profileName || currentStaff?.name || 'Kullanıcı';
  const displayRole = currentStaff ? (roleLabels[currentStaff.role] || currentStaff.role) : 'İşletme Sahibi';
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      {(showVenueDropdown || showNotifications || showUserMenu) && (
        <div 
          className="fixed inset-0 z-[100]" 
          onClick={() => { 
            setShowVenueDropdown(false); 
            setShowNotifications(false); 
            setShowUserMenu(false); 
          }} 
        />
      )}

      <header className={`fixed top-0 right-0 h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 z-[101] transition-all ${sidebarCollapsed ? 'left-20' : 'left-64'}`}>
        <div className="flex items-center gap-4">
          <button type="button" 
            onClick={toggleSidebar} 
            className="p-2 hover:bg-gray-800 rounded-lg lg:hidden text-gray-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="relative">
            <button type="button" 
              onClick={() => {
                setShowVenueDropdown(!showVenueDropdown);
                setShowNotifications(false);
                setShowUserMenu(false);
              }} 
              className="flex items-center gap-3 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors border border-gray-700"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="font-medium text-white text-sm">{currentVenue?.name || 'Mekan Seç'}</p>
                <p className="text-xs text-gray-400">{currentVenue ? 'Aktif' : 'Seçim yapın'}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showVenueDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showVenueDropdown && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden z-[102]">
                <div className="p-2 max-h-80 overflow-y-auto">
                  {venues.length > 0 ? venues.map((venue: any) => (
                    <button type="button" 
                      key={venue.id} 
                      onClick={() => handleVenueChange(venue)} 
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        currentVenue?.id === venue.id 
                          ? 'bg-orange-500/20 border border-orange-500/50' 
                          : 'hover:bg-gray-700 border border-transparent'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        currentVenue?.id === venue.id ? 'bg-orange-500' : 'bg-gray-700'
                      }`}>
                        <Building2 className={`w-5 h-5 ${
                          currentVenue?.id === venue.id ? 'text-white' : 'text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`font-medium ${
                          currentVenue?.id === venue.id ? 'text-orange-400' : 'text-white'
                        }`}>{venue.name}</p>
                        <p className="text-xs text-gray-500">{venue.city || venue.district}</p>
                      </div>
                      {currentVenue?.id === venue.id && (
                        <Check className="w-5 h-5 text-orange-500" />
                      )}
                    </button>
                  )) : (
                    <div className="p-4 text-center text-gray-500">
                      <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Henüz mekan yok</p>
                    </div>
                  )}
                </div>
                <div className="p-2 border-t border-gray-700">
                  <Link 
                    href="/onboarding"
                    onClick={() => setShowVenueDropdown(false)}
                    className="block w-full p-3 text-center text-sm text-orange-400 hover:bg-gray-700 rounded-lg font-medium transition-colors"
                  >
                    + Yeni Mekan Ekle
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-xl border border-gray-700">
            <Search className="w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Ara..." 
              className="bg-transparent border-none outline-none text-sm w-40 text-white placeholder-gray-500" 
            />
            <span className="text-xs text-gray-600 bg-gray-700 px-1.5 py-0.5 rounded">⌘K</span>
          </div>

          <LanguageSelectorCompact />

          <div className="relative">
            <button type="button" 
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowVenueDropdown(false);
                setShowUserMenu(false);
              }} 
              className="relative p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden z-[102]">
                <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                  <h3 className="font-bold text-white">Bildirimler</h3>
                  {unreadCount > 0 && (
                    <button type="button" 
                      onClick={markAllAsRead} 
                      className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
                    >
                      Tümünü okundu işaretle
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? notifications.slice(0, 10).map(notif => (
                    <div 
                      key={notif.id} 
                      onClick={() => markAsRead(notif.id)} 
                      className={`p-4 border-b border-gray-700/50 cursor-pointer transition-colors ${
                        !notif.is_read 
                          ? 'bg-orange-500/10 hover:bg-orange-500/20' 
                          : 'hover:bg-gray-700/50'
                      }`}
                    >
                      <p className="text-sm text-gray-200">{notif.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notif.created_at).toLocaleTimeString('tr-TR')}
                      </p>
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

          <div className="relative">
            <button type="button" 
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowVenueDropdown(false);
                setShowNotifications(false);
              }} 
              className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded-xl transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm">
                {initials}
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {showUserMenu && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden z-[102]">
                <div className="p-4 border-b border-gray-700">
                  <p className="font-medium text-white">{displayName}</p>
                  <p className="text-sm text-gray-400">{displayRole}</p>
                </div>
                <div className="p-2">
                  <Link 
                    href="/settings" 
                    onClick={() => setShowUserMenu(false)} 
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Profilim
                  </Link>
                  <Link 
                    href="/settings" 
                    onClick={() => setShowUserMenu(false)} 
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Ayarlar
                  </Link>
                  <div className="my-2 border-t border-gray-700" />
                  <button type="button" 
                    onClick={handleLogout} 
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Çıkış Yap
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}