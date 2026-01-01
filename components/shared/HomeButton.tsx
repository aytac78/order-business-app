'use client';

import Link from 'next/link';
import { Home, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';

interface HomeButtonProps {
  variant?: 'default' | 'compact';
  showLogout?: boolean;
}

export function HomeButton({ variant = 'default', showLogout = true }: HomeButtonProps) {
  const { logout, currentStaff } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-all flex items-center gap-2"
        >
          <Home className="w-5 h-5" />
        </Link>
        {showLogout && (
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/"
        className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-all flex items-center gap-2 font-medium"
      >
        <Home className="w-5 h-5" />
        <span>Ana Sayfa</span>
      </Link>
      {showLogout && (
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition-all flex items-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          <span>Çıkış</span>
        </button>
      )}
    </div>
  );
}

export function PanelHeader({ 
  title, 
  subtitle,
  icon: Icon,
  iconBg = 'bg-blue-500',
  children 
}: {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  iconBg?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`${iconBg} p-3 rounded-xl`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-slate-400 text-sm">{subtitle}</p>}
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {children}
        <HomeButton />
      </div>
    </div>
  );
}
