import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type StaffRole = 'owner' | 'manager' | 'cashier' | 'waiter' | 'kitchen' | 'reception';

export interface AuthStaff {
  id: string;
  name: string;
  role: StaffRole;
  pin_code?: string;
  venue_id?: string;
}

interface AuthState {
  currentStaff: AuthStaff | null;
  isAuthenticated: boolean;
  allowedRoutes: string[];
  lastActivity: number;
  
  login: (staff: AuthStaff, routes?: string[]) => void;
  logout: () => void;
  updateActivity: () => void;
  hasAccess: (route: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentStaff: null,
      isAuthenticated: false,
      allowedRoutes: [],
      lastActivity: Date.now(),
      
      login: (staff, routes = []) => set({ 
        currentStaff: staff, 
        isAuthenticated: true,
        allowedRoutes: routes,
        lastActivity: Date.now() 
      }),
      
      logout: () => set({ 
        currentStaff: null, 
        isAuthenticated: false,
        allowedRoutes: []
      }),
      
      updateActivity: () => set({ lastActivity: Date.now() }),
      
      hasAccess: (route: string) => {
        const { allowedRoutes } = get();
        if (allowedRoutes.includes('*')) return true;
        return allowedRoutes.some(r => route.startsWith(r));
      },
    }),
    {
      name: 'order-auth-storage',
      partialize: (state) => ({
        currentStaff: state.currentStaff,
        isAuthenticated: state.isAuthenticated,
        allowedRoutes: state.allowedRoutes,
      }),
    }
  )
);

// Role configuration
export const roleConfig: Record<StaffRole, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  defaultRoute: string;
}> = {
  owner: { 
    label: 'Yönetici', 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-100',
    icon: '👑', 
    defaultRoute: '/dashboard' 
  },
  manager: { 
    label: 'Müdür', 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-100',
    icon: '💼', 
    defaultRoute: '/dashboard' 
  },
  cashier: { 
    label: 'Kasiyer', 
    color: 'text-green-600', 
    bgColor: 'bg-green-100',
    icon: '💰', 
    defaultRoute: '/pos-tablet' 
  },
  waiter: { 
    label: 'Garson', 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-100',
    icon: '🍽️', 
    defaultRoute: '/waiter-tablet' 
  },
  kitchen: { 
    label: 'Mutfak', 
    color: 'text-red-600', 
    bgColor: 'bg-red-100',
    icon: '👨‍🍳', 
    defaultRoute: '/kitchen-tablet' 
  },
  reception: { 
    label: 'Resepsiyon', 
    color: 'text-pink-600', 
    bgColor: 'bg-pink-100',
    icon: '📋', 
    defaultRoute: '/reception-tablet' 
  },
};
