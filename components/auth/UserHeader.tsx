'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LogOut, User, ChevronDown, Settings, Bell,
  LayoutDashboard, ChefHat, CreditCard, Calendar,
  Home, Crown, Briefcase, UtensilsCrossed, ClipboardList
} from 'lucide-react';
import { useAuthStore, roleConfig } from '@/stores/authStore';

interface UserHeaderProps {
  variant?: 'default' | 'compact';
}

export function UserHeader({ variant = 'default' }: UserHeaderProps) {
  const router = useRouter();
  const { currentStaff, logout } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);

  if (!currentStaff) return null;

  const config = roleConfig[currentStaff.role];

  const handleLogout = () => {
    logout();
    setShowMenu(false);
    router.push('/');
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center`}>
            <span className="text-sm">{config.icon}</span>
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium text-white">{currentStaff.name}</div>
          </div>
        </div>
        <button type="button"
          onClick={handleLogout}
          className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          title="Çıkış Yap"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button type="button"
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-3 px-3 py-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-colors"
      >
        <div className={`w-9 h-9 rounded-lg ${config.bgColor} flex items-center justify-center`}>
          <span className="text-lg">{config.icon}</span>
        </div>
        
        <div className="text-left hidden sm:block">
          <div className="text-sm font-medium text-white">{currentStaff.name}</div>
          <div className={`text-xs ${config.color}`}>{config.label}</div>
        </div>
        
        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
      </button>
      
      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          
          <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800">
              <div className="font-medium text-white">{currentStaff.name}</div>
              <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                <span>{config.icon}</span>
                {config.label}
              </div>
            </div>
            
            <div className="py-2">
              {(currentStaff.role === 'owner' || currentStaff.role === 'manager') && (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-3 px-4 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-3 px-4 py-2 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Ayarlar
                  </Link>
                </>
              )}
              <button type="button"
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

// Alias for backward compatibility
export function UserHeaderCompact() {
  return <UserHeader variant="compact" />;
}