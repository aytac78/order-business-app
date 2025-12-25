'use client';
import { useState, useEffect, useCallback } from 'react';
import { Lock, Delete, X } from 'lucide-react';
import { useAuthStore } from '@/stores';

interface Staff { id: string; name: string; role: string; pin_code: string; }

// Demo personel listesi - gerçek uygulamada Supabase'den gelecek
const demoStaff: Staff[] = [
  { id: '1', name: 'Ahmet Yılmaz', role: 'owner', pin_code: '1234' },
  { id: '2', name: 'Mehmet Demir', role: 'manager', pin_code: '5678' },
  { id: '3', name: 'Ayşe Kaya', role: 'cashier', pin_code: '1111' },
  { id: '4', name: 'Fatma Çelik', role: 'waiter', pin_code: '2222' },
  { id: '5', name: 'Ali Öztürk', role: 'kitchen', pin_code: '3333' },
];

interface PinLoginProps {
  staff?: Staff[];
  onLogin?: (staff: Staff) => void;
  onCancel?: () => void;
  title?: string;
}

export function PinLogin({ staff = demoStaff, onLogin, onCancel, title = 'Personel Girişi' }: PinLoginProps) {
  const { login } = useAuthStore();
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (staffMember: Staff) => {
    login({
      id: staffMember.id,
      name: staffMember.name,
      role: staffMember.role as any,
    });
    onLogin?.(staffMember);
  };

  const handlePinInput = useCallback((digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');
      if (newPin.length === 4 && selectedStaff) {
        setTimeout(() => {
          if (newPin === selectedStaff.pin_code) { 
            handleLogin(selectedStaff); 
          }
          else { 
            setError('Yanlış PIN'); 
            setPin(''); 
          }
        }, 100);
      }
    }
  }, [pin, selectedStaff]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedStaff) return;
      if (e.key >= '0' && e.key <= '9') handlePinInput(e.key);
      else if (e.key === 'Backspace') setPin(p => p.slice(0, -1));
      else if (e.key === 'Escape') {
        if (selectedStaff) {
          setSelectedStaff(null);
          setPin('');
          setError('');
        } else {
          onCancel?.();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStaff, handlePinInput, onCancel]);

  const roleLabels: Record<string, string> = { 
    owner: 'Patron', 
    manager: 'Müdür', 
    cashier: 'Kasiyer', 
    waiter: 'Garson', 
    kitchen: 'Mutfak' 
  };

  const roleColors: Record<string, string> = {
    owner: 'from-purple-500 to-indigo-600',
    manager: 'from-blue-500 to-cyan-500',
    cashier: 'from-green-500 to-emerald-500',
    waiter: 'from-orange-500 to-red-500',
    kitchen: 'from-amber-500 to-orange-500',
  };

  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">{title}</h2>
                <p className="text-orange-100 text-sm">
                  {selectedStaff ? `${selectedStaff.name} - PIN girin` : 'Personel seçin'}
                </p>
              </div>
            </div>
            {selectedStaff && (
              <button 
                onClick={() => { setSelectedStaff(null); setPin(''); setError(''); }} 
                className="p-2 hover:bg-white/20 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {!selectedStaff ? (
          // Staff Selection
          <div className="p-6 grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
            {staff.map(s => (
              <button 
                key={s.id} 
                onClick={() => setSelectedStaff(s)} 
                className="p-4 bg-gray-50 hover:bg-orange-50 rounded-xl text-left transition-colors border-2 border-transparent hover:border-orange-200"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${roleColors[s.role] || 'from-gray-400 to-gray-500'} rounded-full flex items-center justify-center text-white font-bold mb-3`}>
                  {s.name.charAt(0)}
                </div>
                <p className="font-bold text-gray-900">{s.name}</p>
                <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                  {roleLabels[s.role] || s.role}
                </span>
              </button>
            ))}
          </div>
        ) : (
          // PIN Entry
          <div className="p-6">
            {/* PIN Dots */}
            <div className="flex justify-center gap-4 mb-6">
              {[0, 1, 2, 3].map(i => (
                <div 
                  key={i} 
                  className={`w-4 h-4 rounded-full transition-all ${
                    pin.length > i 
                      ? 'bg-orange-500 scale-110' 
                      : 'bg-gray-200'
                  }`} 
                />
              ))}
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-500 text-center text-sm mb-4 animate-pulse">{error}</p>
            )}

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((num, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (num === 'del') setPin(p => p.slice(0, -1));
                    else if (num !== null) handlePinInput(num.toString());
                  }}
                  disabled={num === null}
                  className={`h-16 rounded-xl font-bold text-xl transition-all ${
                    num === null 
                      ? 'invisible' 
                      : num === 'del'
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        : 'bg-gray-50 hover:bg-orange-50 text-gray-900 hover:text-orange-600'
                  }`}
                >
                  {num === 'del' ? <Delete className="w-6 h-6 mx-auto" /> : num}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
