'use client';

import { Home, LogOut } from 'lucide-react';

interface PanelHeaderProps {
  title: string;
  icon?: React.ReactNode;
}

export default function PanelHeader({ title, icon }: PanelHeaderProps) {
  const handleHome = () => {
    window.location.href = '/admin';
  };

  const handleLogout = () => {
    if (confirm('Çıkış yapmak istiyor musunuz?')) {
      window.location.href = '/';
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {icon}
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleHome}
          className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
          title="Ana Sayfa"
        >
          <Home className="w-5 h-5" />
        </button>
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-500 transition-colors"
          title="Çıkış"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
