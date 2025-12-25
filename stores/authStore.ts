import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthStaff {
  id: string;
  name: string;
  role: string;
  pin_code: string;
}

interface AuthState {
  currentStaff: AuthStaff | null;
  lastActivity: number;
  sessionTimeoutMinutes: number;
  
  login: (staff: AuthStaff) => void;
  logout: () => void;
  updateActivity: () => void;
  isSessionValid: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentStaff: null,
      lastActivity: Date.now(),
      sessionTimeoutMinutes: 5,
      
      login: (staff) => set({ currentStaff: staff, lastActivity: Date.now() }),
      logout: () => set({ currentStaff: null }),
      updateActivity: () => set({ lastActivity: Date.now() }),
      
      isSessionValid: () => {
        const { currentStaff, lastActivity, sessionTimeoutMinutes } = get();
        if (!currentStaff) return false;
        const timeoutMs = sessionTimeoutMinutes * 60 * 1000;
        return (Date.now() - lastActivity) < timeoutMs;
      },
    }),
    {
      name: 'order-auth-storage',
      partialize: (state) => ({
        currentStaff: state.currentStaff,
        lastActivity: state.lastActivity,
      }),
    }
  )
);
