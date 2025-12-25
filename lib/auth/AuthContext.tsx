'use client';

// Auth Context Provider
// /lib/auth/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthState, UserRole, getDefaultRoute } from './types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithPin: (pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchRole: (role: UserRole) => void; // For demo purposes
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo - Replace with Supabase auth
const MOCK_USERS: (User & { password: string })[] = [
  {
    id: '1',
    email: 'admin@order.app',
    password: 'admin123',
    name: 'Ahmet Yılmaz',
    role: 'admin',
    venueId: 'venue-1',
    venueName: 'Demo Restaurant',
    pin: '1234',
  },
  {
    id: '2',
    email: 'chef@order.app',
    password: 'chef123',
    name: 'Mehmet Usta',
    role: 'chef',
    venueId: 'venue-1',
    venueName: 'Demo Restaurant',
    pin: '1111', // kitchen
  },
  {
    id: '3',
    email: 'waiter@order.app',
    password: 'waiter123',
    name: 'Elif Demir',
    role: 'waiter',
    venueId: 'venue-1',
    venueName: 'Demo Restaurant',
    pin: '5555', // cashier/pos // waiter
  },
  {
    id: '4',
    email: 'cashier@order.app',
    password: 'cashier123',
    name: 'Can Özkan',
    role: 'cashier',
    venueId: 'venue-1',
    venueName: 'Demo Restaurant',
    pin: '5555', // cashier/pos
  },
  {
    id: '5',
    email: 'host@order.app',
    password: 'host123',
    name: 'Zeynep Kaya',
    role: 'host',
    venueId: 'venue-1',
    venueName: 'Demo Restaurant',
    pin: '7777', // host/reception
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = () => {
      try {
        const savedUser = localStorage.getItem('order_business_user');
        if (savedUser) {
          const user = JSON.parse(savedUser) as User;
          setState({
            user,
            isLoading: false,
            isAuthenticated: true,
          });
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkSession();
  }, []);

  // Login with email/password
  const login = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }));

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = MOCK_USERS.find(u => u.email === email && u.password === password);

    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      localStorage.setItem('order_business_user', JSON.stringify(userWithoutPassword));
      setState({
        user: userWithoutPassword,
        isLoading: false,
        isAuthenticated: true,
      });
      return { success: true };
    }

    setState(prev => ({ ...prev, isLoading: false }));
    return { success: false, error: 'Geçersiz email veya şifre' };
  }, []);

  // Login with PIN (quick login for staff)
  const loginWithPin = useCallback(async (pin: string) => {
    setState(prev => ({ ...prev, isLoading: true }));

    await new Promise(resolve => setTimeout(resolve, 300));

    const user = MOCK_USERS.find(u => u.pin === pin);

    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      localStorage.setItem('order_business_user', JSON.stringify(userWithoutPassword));
      setState({
        user: userWithoutPassword,
        isLoading: false,
        isAuthenticated: true,
      });
      return { success: true };
    }

    setState(prev => ({ ...prev, isLoading: false }));
    return { success: false, error: 'Geçersiz PIN' };
  }, []);

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem('order_business_user');
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  // Switch role (for demo only)
  const switchRole = useCallback((role: UserRole) => {
    const user = MOCK_USERS.find(u => u.role === role);
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      localStorage.setItem('order_business_user', JSON.stringify(userWithoutPassword));
      setState({
        user: userWithoutPassword,
        isLoading: false,
        isAuthenticated: true,
      });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, loginWithPin, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook to require authentication
export function useRequireAuth(allowedRoles?: UserRole[]) {
  const { user, isLoading, isAuthenticated } = useAuth();

  const isAuthorized = isAuthenticated && user && (
    !allowedRoles || 
    allowedRoles.includes(user.role) || 
    user.role === 'admin'
  );

  return {
    user,
    isLoading,
    isAuthenticated,
    isAuthorized,
  };
}
