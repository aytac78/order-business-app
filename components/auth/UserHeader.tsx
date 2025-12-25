'use client';

// User Header Component
// /components/auth/UserHeader.tsx

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LogOut, User, ChevronDown, Settings, Bell,
  LayoutDashboard, ChefHat, CreditCard, Calendar,
  Home
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { ROLE_CONFIG } from '@/lib/auth/types';

export function UserHeader() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  if (!user) return null;

  const roleConfig = ROLE_CONFIG[user.role];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const menuItems = [
    ...(user.role === 'admin' || user.role === 'manager' ? [
      { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    ] : []),
    ...roleConfig.allowedRoutes.filter(r => r !== '/').map(route => {
      const icons: Record<string, typeof ChefHat> = {
        '/kitchen': ChefHat,
        '/waiter': User,
        '/pos': CreditCard,
        '/reception': Calendar,
      };
      const labels: Record<string, string> = {
        '/kitchen': 'Mutfak',
        '/waiter': 'Garson',
        '/pos': 'Kasa',
        '/reception': 'Resepsiyon',
      };
      return {
        href: route,
        icon: icons[route] || Home,
        label: labels[route] || route,
      };
    }),
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-3 px-3 py-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-colors"
      >
        {/* Avatar */}
        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${roleConfig.color} flex items-center justify-center`}>
          <span className="text-lg">{roleConfig.icon}</span>
        </div>
        
        {/* User Info */}
        <div className="text-left hidden sm:block">
          <div className="text-sm font-medium text-white">{user.name}</div>
          <div className="text-xs text-zinc-500">{roleConfig.labelTr}</div>
        </div>
        
        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
      </button>
      
      {/* Dropdown Menu */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-zinc-800">
              <div className="font-medium text-white">{user.name}</div>
              <div className="text-sm text-zinc-400">{user.email}</div>
              <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${roleConfig.color} text-white`}>
                <span>{roleConfig.icon}</span>
                {roleConfig.labelTr}
              </div>
            </div>
            
            {/* Navigation Links */}
            {menuItems.length > 0 && (
              <div className="py-2 border-b border-zinc-800">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-3 px-4 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
            
            {/* Settings & Logout */}
            <div className="py-2">
              {(user.role === 'admin' || user.role === 'manager') && (
                <Link
                  href="/settings"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-3 px-4 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Ayarlar
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Çıkış Yap
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Compact version for tablet panels
export function UserHeaderCompact() {
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user) return null;

  const roleConfig = ROLE_CONFIG[user.role];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${roleConfig.color} flex items-center justify-center`}>
          <span className="text-sm">{roleConfig.icon}</span>
        </div>
        <div className="hidden sm:block">
          <div className="text-sm font-medium text-white">{user.name}</div>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        title="Çıkış Yap"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </div>
  );
}
