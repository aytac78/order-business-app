'use client';

import { useState } from 'react';
import { VenueSelector } from '@/components/venue/VenueSelector';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { useAuthStore } from '@/stores';
import { Search, HelpCircle, LogOut, User } from 'lucide-react';

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const { currentStaff, logout } = useAuthStore();

  const roleLabels: Record<string, string> = { 
    owner: 'Patron', 
    manager: 'Müdür', 
    cashier: 'Kasiyer', 
    waiter: 'Garson', 
    kitchen: 'Mutfak' 
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 ml-12 md:ml-0">
      {/* Left: Venue Selector */}
      <div className="hidden sm:block">
        <VenueSelector />
      </div>

      {/* Mobile: Compact Venue Selector */}
      <div className="sm:hidden">
        <VenueSelector />
      </div>

      {/* Center: Search - Hidden on mobile */}
      <div className="hidden md:flex flex-1 max-w-xl mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Sipariş, rezervasyon, müşteri ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">⌘K</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 md:gap-2">
        <button className="p-2 hover:bg-gray-100 rounded-lg hidden md:flex">
          <HelpCircle className="w-5 h-5 text-gray-600" />
        </button>
        
        <NotificationCenter />
        
        <div className="w-px h-6 bg-gray-200 mx-1 md:mx-2 hidden md:block" />
        
        {/* User Info & Logout */}
        {currentStaff && (
          <div className="flex items-center gap-2">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900">{currentStaff.name}</p>
              <p className="text-xs text-gray-500">{roleLabels[currentStaff.role] || currentStaff.role}</p>
            </div>
            <button 
              className="w-8 h-8 md:w-9 md:h-9 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold hover:bg-orange-600"
              title={currentStaff.name}
            >
              {currentStaff.name.charAt(0)}
            </button>
            <button
              onClick={logout}
              className="p-2 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600 transition-colors"
              title="Çıkış Yap"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
