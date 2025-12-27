'use client';

import { useState, useEffect } from 'react';
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
  Sparkles
} from 'lucide-react';

interface PanelSettings {
  dashboard: boolean;
  tables: boolean;
  orders: boolean;
  waiter: boolean;
  kitchen: boolean;
  reception: boolean;
  pos: boolean;
  reservations: boolean;
}

const defaultPanels: PanelSettings = {
  dashboard: true,
  tables: true,
  orders: true,
  waiter: true,
  kitchen: true,
  reception: true,
  pos: true,
  reservations: true
};

// Tüm menü öğeleri - panelId ile eşleştirilmiş
const allMenuItems = [
  {
    section: 'Ana Menü',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, panelId: 'dashboard' },
      { name: 'Mekanlarım', href: '/venues', icon: Building2, multiVenueOnly: true },
      { name: 'Hızlı Kayıt', href: '/onboarding', icon: Sparkles },
    ]
  },
  {
    section: 'Operasyon',
    items: [
      { name: 'Masalar', href: '/tables', icon: Grid3X3, panelId: 'tables' },
      { name: 'Siparişler', href: '/orders', icon: ClipboardList, panelId: 'orders' },
      { name: 'Garson Paneli', href: '/waiter', icon: UtensilsCrossed, panelId: 'waiter' },
      { name: 'Mutfak', href: '/kitchen', icon: ChefHat, panelId: 'kitchen' },
      { name: 'Resepsiyon', href: '/reception', icon: Users, panelId: 'reception' },
    ]
  },
  {
    section: 'Yönetim',
    items: [
      { name: 'Menü', href: '/menu', icon: UtensilsCrossed },
      { name: 'Rezervasyonlar', href: '/reservations', icon: CalendarCheck, panelId: 'reservations' },
      { name: 'Kasa/POS', href: '/pos', icon: CreditCard, panelId: 'pos' },
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
  const { sidebarOpen, sidebarCollapsed, toggleSidebarCollapse } = useUIStore();
  const { venues, currentVenue } = useVenueStore();
  const [panelSettings, setPanelSettings] = useState<PanelSettings>(defaultPanels);

  const isMultiVenue = venues.length > 1;

  // Panel ayarlarını yükle
  useEffect(() => {
    if (currentVenue?.id) {
      const saved = localStorage.getItem(`venue_panels_${currentVenue.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setPanelSettings(parsed.panels || defaultPanels);
        } catch {
          setPanelSettings(defaultPanels);
        }
      } else {
        setPanelSettings(defaultPanels);
      }
    }
  }, [currentVenue?.id]);

  // Panel ayarları değiştiğinde dinle
  useEffect(() => {
    const handleSettingsChange = (e: CustomEvent<PanelSettings>) => {
      setPanelSettings(e.detail);
    };

    window.addEventListener('panelSettingsChanged', handleSettingsChange as EventListener);
    return () => {
      window.removeEventListener('panelSettingsChanged', handleSettingsChange as EventListener);
    };
  }, []);

  // Menüyü filtrele
  const getFilteredMenuItems = () => {
    return allMenuItems.map(section => ({
      ...section,
      items: section.items.filter(item => {
        // Multi-venue kontrolü
        if (item.multiVenueOnly && !isMultiVenue) return false;
        
        // Panel kontrolü - panelId yoksa her zaman göster
        if (!item.panelId) return true;
        
        // Panel aktif mi kontrol et
        return panelSettings[item.panelId as keyof PanelSettings];
      })
    })).filter(section => section.items.length > 0); // Boş section'ları kaldır
  };

  const filteredMenuItems = getFilteredMenuItems();

  if (!sidebarOpen) return null;

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-gray-900 text-white transition-all duration-300 z-50 flex flex-col overflow-hidden ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800 flex-shrink-0">
        {!sidebarCollapsed && (
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
        <button
          onClick={toggleSidebarCollapse}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Menu - Scrollable */}
      <nav className="flex-1 min-h-0 overflow-y-auto py-4 px-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {filteredMenuItems.map((section) => (
          <div key={section.section} className="mb-6">
            {!sidebarCollapsed && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.section}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
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

      {/* Footer - Panel Count */}
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
  );
}

// MobileHeader component - layout.tsx'de import ediliyor
export function MobileHeader() {
  const { currentVenue } = useVenueStore();
  const { toggleSidebar } = useUIStore();
  const pathname = usePathname();

  const getPageTitle = () => {
    const routes: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/tables': 'Masalar',
      '/orders': 'Siparişler',
      '/waiter': 'Garson Paneli',
      '/kitchen': 'Mutfak',
      '/reception': 'Resepsiyon',
      '/pos': 'Kasa/POS',
      '/menu': 'Menü',
      '/reservations': 'Rezervasyonlar',
      '/stock': 'Stok',
      '/staff': 'Personel',
      '/settings': 'Ayarlar',
    };
    return routes[pathname] || 'ORDER Business';
  };

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-gray-900 text-white flex items-center justify-between px-4 z-40">
      <button onClick={toggleSidebar} className="p-2 hover:bg-gray-800 rounded-lg">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <span className="font-semibold">{getPageTitle()}</span>
      <div className="w-10" />
    </header>
  );
}
