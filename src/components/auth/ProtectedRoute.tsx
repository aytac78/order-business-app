'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { PinLogin } from './PinLogin';
import { LogOut, Clock, Shield } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  title?: string;
}

const demoStaff = [
  { id: '1', name: 'Ahmet Yılmaz', role: 'owner', pin_code: '1234' },
  { id: '2', name: 'Mehmet Demir', role: 'manager', pin_code: '5678' },
  { id: '3', name: 'Ayşe Kaya', role: 'cashier', pin_code: '1111' },
  { id: '4', name: 'Fatma Çelik', role: 'waiter', pin_code: '2222' },
  { id: '5', name: 'Ali Öztürk', role: 'kitchen', pin_code: '3333' },
];

export function ProtectedRoute({ children, requiredRoles, title = 'Güvenli Alan' }: ProtectedRouteProps) {
  const { currentStaff, login, logout, isSessionValid, updateActivity, sessionTimeoutMinutes } = useAuthStore();
  const [remainingTime, setRemainingTime] = useState<number | null>(null);

  useEffect(() => {
    const check = () => { if (currentStaff && !isSessionValid()) logout(); };
    check();
    const i = setInterval(check, 10000);
    return () => clearInterval(i);
  }, [currentStaff, isSessionValid, logout]);

  useEffect(() => {
    if (!currentStaff) return;
    const update = () => {
      const last = useAuthStore.getState().lastActivity;
      const timeout = sessionTimeoutMinutes * 60 * 1000;
      setRemainingTime(Math.max(0, Math.ceil((timeout - (Date.now() - last)) / 1000)));
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [currentStaff, sessionTimeoutMinutes]);

  useEffect(() => {
    if (!currentStaff) return;
    const events = ['mousedown', 'keydown', 'touchstart'];
    const handler = () => updateActivity();
    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    return () => events.forEach(e => window.removeEventListener(e, handler));
  }, [currentStaff, updateActivity]);

  if (!currentStaff || !isSessionValid()) {
    return <PinLogin staff={demoStaff} onLogin={login} title={title} />;
  }

  if (requiredRoles?.length && !requiredRoles.includes(currentStaff.role) && currentStaff.role !== 'owner') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Erişim Reddedildi</h2>
          <button onClick={logout} className="mt-4 px-6 py-3 bg-gray-900 text-white rounded-xl">Farklı Kullanıcı</button>
        </div>
      </div>
    );
  }

  const roleLabels: Record<string, string> = { owner: 'Patron', manager: 'Müdür', cashier: 'Kasiyer', waiter: 'Garson', kitchen: 'Mutfak' };

  return (
    <div className="relative">
      <div className="fixed top-4 right-4 z-40 flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-lg border">
        <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
          {currentStaff.name.charAt(0)}
        </div>
        <div className="text-sm">
          <p className="font-medium">{currentStaff.name}</p>
          <p className="text-xs text-gray-500">{roleLabels[currentStaff.role]}</p>
        </div>
        {remainingTime !== null && remainingTime < 60 && (
          <span className="text-amber-600 text-sm flex items-center gap-1"><Clock className="w-4 h-4" />{Math.floor(remainingTime/60)}:{(remainingTime%60).toString().padStart(2,'0')}</span>
        )}
        <button onClick={logout} className="p-2 hover:bg-gray-100 rounded-full"><LogOut className="w-4 h-4 text-gray-500" /></button>
      </div>
      {children}
    </div>
  );
}
