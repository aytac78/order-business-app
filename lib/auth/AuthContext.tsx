'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, UserRole, getDefaultRoute } from './types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users
const DEMO_USERS: (User & { password: string })[] = [
  { id: '1', name: 'Aytaç Gör', email: 'owner@order.com', role: 'owner', password: '1234' },
  { id: '2', name: 'Zeynep Müdür', email: 'manager@order.com', role: 'manager', password: '5555' },
  { id: '3', name: 'Mehmet Şef', email: 'kitchen@order.com', role: 'kitchen', password: '1111' },
  { id: '4', name: 'Ayşe Garson', email: 'waiter@order.com', role: 'waiter', password: '2222' },
  { id: '5', name: 'Fatma Kasa', email: 'cashier@order.com', role: 'cashier', password: '3333' },
  { id: '6', name: 'Ali Resepsiyon', email: 'reception@order.com', role: 'reception', password: '4444' },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const foundUser = DEMO_USERS.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      const { password: _, ...userData } = foundUser;
      setUser(userData);
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    if (user) {
      setUser({ ...user, role });
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
