'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore, useVenueStore } from '@/stores';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ChefHat,
  Users,
  CalendarCheck,
  Receipt,
  BarChart3,
  Package,
  Clock,
  UserCircle,
  TrendingUp,
  AlertTriangle,
  QrCode,
  Ticket,
  Settings,
  Building2,
  CreditCard,
  ClipboardList,
  Grid3X3,
  ChevronLeft,
  Sparkles,
  Menu,
  X
} from 'lucide-react';

const menuItems = [
  {
    section: 'Ana Menü',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Mekanlarım', href: '/venues', icon: Building2, multiVenueOnly: true },
      { name: 'Hızlı Kayıt', href: '/onboarding', icon: Sparkles },
    ]
  },
  {
    section: 'Operasyon',
    items: [
      { name: 'Masalar', href: '/tables', icon: Grid3X3 },
      { name: 'Siparişler', href: '/orders', icon: ClipboardList },
      { name: 'Garson Paneli', href: '/waiter', icon: UtensilsCrossed },
      { name: 'Mutfak', href: '/kitchen', icon: ChefHat },
      { name: 'Resepsiyon', href: '/reception', icon: Users },
    ]
  },
  {
    section: 'Yönetim',
    items: [
      { name: 'Menü', href: '/menu', icon: UtensilsCrossed },
      { name: 'Rezervasyonlar', href: '/reservations', icon: CalendarCheck },
      { name: 'Kasa/POS', href: '/pos', icon: CreditCard },
      { name: 'QR Menü', href: '/qr-menu', icon: QrCode },
      { name: 'Kuponlar', href: '/coupons', icon: Ticket },
    ]
  },
  {
    section: 'Stok & Personel',
    items: [
      { name: 'Stok Yönetimi', href: '/stock', icon: Package },
      { name: 'Stok Uyarıları', href: '/stock-alerts', icon: AlertTriangle },
      { name: 'Personel', href: '/staff', icon: Users },
      { name: 'Vardiyalar', href: '/shifts', icon: Clock },
      { name: 'Performans', href: '/performance', icon: TrendingUp },
    ]
  },
  {
    section: 'Analiz & CRM',
    items: [
      { name: 'Raporlar', href: '/reports', icon: Receipt },
      { name: 'Analitik', href: '/analytics', icon: BarChart3 },
      { name: 'Müşteri CRM', href: '/crm', icon: UserCircle },
    ]
  },
  {
    section: 'Sistem',
    items: [
      { name: 'Ayarlar', href: '/settings', icon: Settings },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, sidebarCollapsed, toggleSidebarCollapse, setSidebarOpen } = useUIStore();
  const { venues } = useVenueStore();
  
  const isMultiVenue = venues.length > 1;

  // Mobilde sayfa değiştiğinde sidebar'ı kapat
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [pathname, setSidebarOpen]);

  // ESC tuşu ile kapat
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [setSidebarOpen]);

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed left-0 top-0 h-screen bg-gray-900 text-white z-50 flex flex-col overflow-hidden
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${sidebarCollapsed ? 'lg:w-20' : 'w-72 lg:w-64'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800 flex-shrink-0">
          {(!sidebarCollapsed || window.innerWidth < 1024) && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">ORDER</span>
              <span className="text-xs px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded">
                Business
              </span>
            </Link>
          )}
          
          {/* Desktop: Collapse button */}
          <button
            onClick={toggleSidebarCollapse}
            className="hidden lg:block p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Mobile: Close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu - Scrollable */}
        <nav className="flex-1 min-h-0 overflow-y-auto py-4 px-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {menuItems.map((section) => (
            <div key={section.section} className="mb-6">
              {!sidebarCollapsed && (
                <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {section.section}
                </h3>
              )}
              <div className="space-y-1">
                {section.items
                  .filter(item => !item.multiVenueOnly || isMultiVenue)
                  .map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => {
                          // Mobilde tıklayınca kapat
                          if (window.innerWidth < 1024) {
                            setSidebarOpen(false);
                          }
                        }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                          isActive
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                        }`}
                        title={sidebarCollapsed ? item.name : undefined}
                      >
                        <Icon className={`w-5 h-5 flex-shrink-0 ${
                          isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                        }`} />
                        {!sidebarCollapsed && (
                          <span className="text-sm font-medium">{item.name}</span>
                        )}
                      </Link>
                    );
                  })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center gap-3 px-3 py-2 bg-gray-800/50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">TiT</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">TiT Pay</p>
                <p className="text-xs text-gray-400">Entegre</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

// Mobile Header Component - Bu ayrı bir dosyaya da konulabilir
export function MobileHeader() {
  const { setSidebarOpen } = useUIStore();
  const { currentVenue } = useVenueStore();

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30 flex items-center justify-between px-4">
      <button
        onClick={() => setSidebarOpen(true)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-gray-900">ORDER</span>
      </div>

      <div className="w-10" /> {/* Spacer for centering */}
    </div>
  );
}
