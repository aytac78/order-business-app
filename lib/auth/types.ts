// Auth Types and Constants
// /lib/auth/types.ts

export type UserRole = 'admin' | 'manager' | 'chef' | 'waiter' | 'cashier' | 'host';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  venueId: string;
  venueName: string;
  avatarUrl?: string;
  pin?: string; // For quick login
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Role configurations
export const ROLE_CONFIG: Record<UserRole, {
  label: string;
  labelTr: string;
  defaultRoute: string;
  allowedRoutes: string[];
  color: string;
  icon: string;
}> = {
  admin: {
    label: 'Administrator',
    labelTr: 'Yönetici',
    defaultRoute: '/admin',
    allowedRoutes: ['/', '/kitchen', '/waiter', '/pos', '/reception', '/settings', '/reports', '/menu', '/staff'],
    color: 'from-purple-500 to-pink-600',
    icon: '👔',
  },
  manager: {
    label: 'Manager',
    labelTr: 'Müdür',
    defaultRoute: '/admin',
    allowedRoutes: ['/', '/kitchen', '/waiter', '/pos', '/reception', '/reports'],
    color: 'from-blue-500 to-indigo-600',
    icon: '📊',
  },
  chef: {
    label: 'Chef',
    labelTr: 'Aşçı',
    defaultRoute: '/kitchen',
    allowedRoutes: ['/kitchen'],
    color: 'from-orange-500 to-red-600',
    icon: '🍳',
  },
  waiter: {
    label: 'Waiter',
    labelTr: 'Garson',
    defaultRoute: '/waiter',
    allowedRoutes: ['/waiter'],
    color: 'from-blue-500 to-cyan-600',
    icon: '🧑‍🍳',
  },
  cashier: {
    label: 'Cashier',
    labelTr: 'Kasiyer',
    defaultRoute: '/pos',
    allowedRoutes: ['/pos'],
    color: 'from-emerald-500 to-teal-600',
    icon: '💳',
  },
  host: {
    label: 'Host',
    labelTr: 'Karşılama',
    defaultRoute: '/reception',
    allowedRoutes: ['/reception'],
    color: 'from-purple-500 to-pink-600',
    icon: '📅',
  },
};

// Check if user can access a route
export function canAccessRoute(role: UserRole, route: string): boolean {
  const config = ROLE_CONFIG[role];
  if (!config) return false;
  
  // Admin can access everything
  if (role === 'admin') return true;
  
  // Check if route is in allowed routes
  return config.allowedRoutes.some(allowed => 
    route === allowed || route.startsWith(allowed + '/')
  );
}

// Get default route for role
export function getDefaultRoute(role: UserRole): string {
  return ROLE_CONFIG[role]?.defaultRoute || '/';
}
