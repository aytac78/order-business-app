'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore, useVenueStore } from '@/stores';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard, UtensilsCrossed, ChefHat, Users, CalendarCheck,
  Receipt, BarChart3, Package, Clock, UserCircle, TrendingUp,
  AlertTriangle, QrCode, Ticket, Settings, Building2, CreditCard,
  ClipboardList, Grid3X3, ChevronLeft, Sparkles, MapPin, Menu, X
} from 'lucide-react';
import { PartyPopper } from 'lucide-react';

const getMenuItems = (t: (key: string) => string) => [
  {
    section: t('mainMenu'),
    items: [
      { name: t('dashboard'), href: '/dashboard', icon: LayoutDashboard },
      { name: t('venues'), href: '/venues', icon: Building2, multiVenueOnly: true },
      { name: t('onboarding'), href: '/onboarding', icon: Sparkles },
    ]
  },
  {
    section: t('operations'),
    items: [
      { name: t('tables'), href: '/tables', icon: Grid3X3 },
      { name: t('orders'), href: '/orders', icon: ClipboardList },
      { name: t('waiter'), href: '/waiter', icon: UtensilsCrossed },
      { name: t('kitchen'), href: '/kitchen', icon: ChefHat },
      { name: t('reception'), href: '/reception', icon: Users },
    ]
  },
  {
    section: t('communication'),
    items: [
      { name: t('hereCustomers'), href: '/here-customers', icon: MapPin },
    ]
  },
  {
    section: t('management'),
    items: [
      { name: t('menu'), href: '/menu', icon: UtensilsCrossed },
      { name: t('events'), href: '/events', icon: PartyPopper },
      { name: t('reservations'), href: '/reservations', icon: CalendarCheck },
      { name: t('pos'), href: '/pos', icon: CreditCard },
      { name: t('qrMenu'), href: '/qr-menu', icon: QrCode },
      { name: t('coupons'), href: '/coupons', icon: Ticket },
    ]
  },
  {
    section: t('stockAndStaff'),
    items: [
      { name: t('stock'), href: '/stock', icon: Package },
      { name: t('stockAlerts'), href: '/stock-alerts', icon: AlertTriangle },
      { name: t('staff'), href: '/staff', icon: Users },
      { name: t('shifts'), href: '/shifts', icon: Clock },
      { name: t('performance'), href: '/performance', icon: TrendingUp },
    ]
  },
  {
    section: t('analysisAndCrm'),
    items: [
      { name: t('reports'), href: '/reports', icon: Receipt },
      { name: t('analytics'), href: '/analytics', icon: BarChart3 },
      { name: t('crm'), href: '/crm', icon: UserCircle },
    ]
  },
  {
    section: t('system'),
    items: [
      { name: t('settings'), href: '/settings', icon: Settings },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, sidebarCollapsed, toggleSidebarCollapse, setSidebarOpen } = useUIStore();
  const { venues } = useVenueStore();
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  
  const isMultiVenue = venues.length > 1;
  const menuItems = getMenuItems(t);

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
        <button type="button"
          onClick={toggleSidebarCollapse}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
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
              <p className="text-xs text-gray-400">{tCommon('active')}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>
        </div>
      )}
    </aside>
  );
}

// Mobile Sidebar Toggle Button
export function MobileSidebarToggle() {
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <button type="button"
      onClick={() => setSidebarOpen(!sidebarOpen)}
      className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-lg text-white"
    >
      {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
    </button>
  );
}

// Mobile Header for dashboard
export function MobileHeader() {
  const { setSidebarOpen } = useUIStore();

  return (
    <div className="lg:hidden flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800">
      <button type="button"
        onClick={() => setSidebarOpen(true)}
        className="p-2 hover:bg-gray-800 rounded-lg text-white"
      >
        <Menu className="w-6 h-6" />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-white">ORDER</span>
      </div>
      <div className="w-10" />
    </div>
  );
}
