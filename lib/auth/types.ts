import { ChefHat, CreditCard, Calendar, LayoutDashboard, Users, Crown } from 'lucide-react';

export type UserRole = 'owner' | 'manager' | 'kitchen' | 'waiter' | 'cashier' | 'reception';

export interface User {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  venueId?: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const ROLE_CONFIG: Record<UserRole, {
  label: string;
  labelTr: string;
  icon: typeof ChefHat;
  color: string;
  bgColor: string;
  permissions: string[];
  allowedRoutes: string[];
  defaultRoute: string;
}> = {
  owner: {
    label: 'Owner',
    labelTr: 'Yönetici',
    icon: Crown,
    color: 'from-purple-500 to-indigo-600',
    bgColor: 'bg-purple-100',
    permissions: ['*'],
    allowedRoutes: ['*'],
    defaultRoute: '/dashboard',
  },
  manager: {
    label: 'Manager',
    labelTr: 'Müdür',
    icon: LayoutDashboard,
    color: 'from-blue-500 to-cyan-600',
    bgColor: 'bg-blue-100',
    permissions: ['dashboard', 'orders', 'menu', 'staff', 'reports'],
    allowedRoutes: ['/dashboard', '/orders', '/menu', '/staff', '/reports', '/settings', '/kitchen', '/waiter', '/pos', '/reception'],
    defaultRoute: '/dashboard',
  },
  kitchen: {
    label: 'Kitchen',
    labelTr: 'Mutfak',
    icon: ChefHat,
    color: 'from-orange-500 to-red-600',
    bgColor: 'bg-orange-100',
    permissions: ['kitchen', 'orders.view'],
    allowedRoutes: ['/kitchen', '/kitchen-tablet'],
    defaultRoute: '/kitchen-tablet',
  },
  waiter: {
    label: 'Waiter',
    labelTr: 'Garson',
    icon: Users,
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-100',
    permissions: ['orders', 'tables'],
    allowedRoutes: ['/waiter', '/waiter-tablet', '/orders', '/tables'],
    defaultRoute: '/waiter-tablet',
  },
  cashier: {
    label: 'Cashier',
    labelTr: 'Kasiyer',
    icon: CreditCard,
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-100',
    permissions: ['pos', 'orders', 'payments'],
    allowedRoutes: ['/pos', '/pos-tablet', '/orders'],
    defaultRoute: '/pos-tablet',
  },
  reception: {
    label: 'Reception',
    labelTr: 'Resepsiyon',
    icon: Calendar,
    color: 'from-pink-500 to-rose-600',
    bgColor: 'bg-pink-100',
    permissions: ['reservations', 'tables'],
    allowedRoutes: ['/reception', '/reception-tablet', '/reservations', '/tables'],
    defaultRoute: '/reception-tablet',
  },
};

export function canAccessRoute(role: UserRole, route: string): boolean {
  const config = ROLE_CONFIG[role];
  if (!config) return false;
  if (config.allowedRoutes.includes('*')) return true;
  return config.allowedRoutes.some(r => route.startsWith(r));
}

export function getDefaultRoute(role: UserRole): string {
  return ROLE_CONFIG[role]?.defaultRoute || '/';
}
