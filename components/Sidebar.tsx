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
  Sparkles,
  User
} from 'lucide-react';

interface PanelSettings {
  tables: boolean;
  orders: boolean;
  waiter: boolean;
  kitchen: boolean;
  pos: boolean;
  reception: boolean;
  menu: boolean;
  reservations: boolean;
  stock: boolean;
  staff: boolean;
  qr: boolean;
  coupons: boolean;
}

const defaultPanels: PanelSettings = {
  tables: true,
  orders: true,
  waiter: true,
  kitchen: true,
  pos: true,
  reception: true,
  menu: true,
  reservations: true,
  stock: true,
  staff: true,
  qr: true,
  coupons: true,
};

const menuItems = [
  {
    section: 'Ana Menü',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Mekanlarım', href: '/venues', icon: Building2, multiVenueOnly: true },
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
      { name: 'Menü', href: '/menu', icon: UtensilsCrossed, panelId: 'menu' },
      { name: 'Rezervasyonlar', href: '/reservations', icon: CalendarCheck, panelId: 'reservations' },
      { name: 'Kasa/POS', href: '/pos', icon: CreditCard, panelId: 'pos' },
      { name: 'QR Menü', href: '/qr-menu', icon: QrCode, panelId: 'qr' },
      { name: 'Kuponlar', href: '/coupons', icon: Ticket, panelId: 'coupons' },
    ]
  },
  {
    section: 'Stok & Personel',
    items: [
      { name: 'Stok Yönetimi', href: '/stock', icon: Package, panelId: 'stock' },
      { name: 'Stok Uyarıları', href: '/stock-alerts', icon: AlertTriangle, panelId: 'stock' },
      { name: 'Personel', href: '/staff', icon: Users, panelId: 'staff' },
      { name: 'Vardiyalar', href: '/shifts', icon: Clock, panelId: 'staff' },
      { name: 'Performans', href: '/performance', icon: TrendingUp, panelId: 'staff' },
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
      { name: 'Profilim', href: '/profile', icon: User },
      { name: 'Ayarlar', href: '/settings', icon: Settings },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, sidebarCollapsed, toggleSidebarCollapse } = useUIStore();
  const { venues } = useVenueStore();
  const [panels, setPanels] = useState<PanelSettings>(defaultPanels);
  
  const isMultiVenue = venues.length > 1;

  // Load panel settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('order-panels');
    if (saved) {
      try {
        setPanels(JSON.parse(saved));
      } catch {}
    }
    
    // Listen for changes
    const handleStorage = () => {
      const updated = localStorage.getItem('order-panels');
      if (updated) {
        try {
          setPanels(JSON.parse(updated));
        } catch {}
      }
    };
    
    window.addEventListener('storage', handleStorage);
    
    // Also check periodically for same-tab updates
    const interval = setInterval(() => {
      const updated = localStorage.getItem('order-panels');
      if (updated) {
        try {
          const parsed = JSON.parse(updated);
          setPanels(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(parsed)) {
              return parsed;
            }
            return prev;
          });
        } catch {}
      }
    }, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  // Filter menu items based on panel settings
  const filteredMenuItems = menuItems.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (!item.panelId) return true; // Items without panelId are always shown
      return panels[item.panelId as keyof PanelSettings];
    })
  })).filter(section => section.items.length > 0);

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
              {section.items
                .filter(item => !item.multiVenueOnly || isMultiVenue)
                .map((item) => {
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
  );
}

// Mobile Header Component
export function MobileHeader() {
  const { toggleSidebar } = useUIStore();
  
  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 z-40">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg text-white">ORDER</span>
      </Link>
      <button
        onClick={toggleSidebar}
        className="p-2 hover:bg-gray-800 rounded-lg"
      >
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>
    </div>
  );
}
