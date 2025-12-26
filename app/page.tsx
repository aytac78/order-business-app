'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, StaffRole, roleConfig } from '@/stores/authStore';
import { Lock, User, ArrowLeft, AlertCircle } from 'lucide-react';

interface Staff {
  id: string;
  name: string;
  role: string;
  venue_id?: string;
  pin_code?: string;
}

// Demo staff data
const demoStaff: Staff[] = [
  { id: '1', name: 'Aytaç Gör', role: 'owner', pin_code: '1234' },
  { id: '2', name: 'Mehmet Şef', role: 'kitchen', pin_code: '1111' },
  { id: '3', name: 'Ayşe Garson', role: 'waiter', pin_code: '2222' },
  { id: '4', name: 'Fatma Kasa', role: 'cashier', pin_code: '3333' },
  { id: '5', name: 'Ali Resepsiyon', role: 'reception', pin_code: '4444' },
  { id: '6', name: 'Zeynep Müdür', role: 'manager', pin_code: '5555' },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, logout } = useAuthStore();
  
  const [staff, setStaff] = useState<Staff[]>(demoStaff);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    logout(); // Her zaman logout yap
  }, [logout]);

  const handleStaffSelect = (s: Staff) => {
    setSelectedStaff(s);
    setPin('');
    setError('');
  };

  const handlePinSubmit = async (pinCode: string) => {
    if (!selectedStaff) return;
    
    setIsLoading(true);
    setError('');

    try {
      // PIN doğrula
      if (pinCode === selectedStaff.pin_code) {
        const role = selectedStaff.role as StaffRole;
        const config = roleConfig[role];
        
        login({
          id: selectedStaff.id,
          name: selectedStaff.name,
          role: role,
          venue_id: selectedStaff.venue_id,
        });
        
        router.push(config.defaultRoute);
      } else {
        setError('Yanlış PIN kodu');
        setPin('');
      }
    } catch (err) {
      setError('Bir hata oluştu');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNumber = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        setTimeout(() => handlePinSubmit(newPin), 300);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handleBack = () => {
    setSelectedStaff(null);
    setPin('');
    setError('');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🍽️</span>
          </div>
          <h1 className="text-2xl font-bold text-white">ORDER Business</h1>
          <p className="text-gray-400 mt-1">Personel Girişi</p>
        </div>

        {!selectedStaff ? (
          /* Staff Selection */
          <div className="bg-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Personel Seçin</h2>
            <div className="grid grid-cols-2 gap-3">
              {staff.map((s) => {
                const role = s.role as StaffRole;
                const config = roleConfig[role];
                return (
                  <button
                    key={s.id}
                    onClick={() => handleStaffSelect(s)}
                    className="p-4 bg-gray-700 hover:bg-gray-600 rounded-xl text-left transition-all"
                  >
                    <div className={`w-10 h-10 ${config.bgColor} rounded-lg flex items-center justify-center mb-2`}>
                      <span className="text-xl">{config.icon}</span>
                    </div>
                    <p className="font-medium text-white text-sm">{s.name}</p>
                    <p className={`text-xs ${config.color}`}>{config.label}</p>
                  </button>
                );
              })}
            </div>
            
            {/* Demo PIN bilgisi */}
            <div className="mt-6 p-4 bg-gray-700/50 rounded-xl">
              <p className="text-xs text-gray-400 text-center">
                Demo PIN kodları: Yönetici: 1234 | Mutfak: 1111 | Garson: 2222 | Kasa: 3333
              </p>
            </div>
          </div>
        ) : (
          /* PIN Entry */
          <div className="bg-gray-800 rounded-2xl p-6">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Geri</span>
            </button>

            <div className="text-center mb-6">
              {(() => {
                const role = selectedStaff.role as StaffRole;
                const config = roleConfig[role];
                return (
                  <>
                    <div className={`w-16 h-16 ${config.bgColor} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                      <span className="text-2xl">{config.icon}</span>
                    </div>
                    <p className="font-semibold text-white">{selectedStaff.name}</p>
                    <p className={`text-sm ${config.color}`}>{config.label}</p>
                  </>
                );
              })()}
            </div>

            {/* PIN Dots */}
            <div className="flex justify-center gap-3 mb-6">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full transition-all ${
                    pin.length > i ? 'bg-orange-500' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center justify-center gap-2 text-red-400 mb-4">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Number Pad */}
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    if (key === 'del') handleDelete();
                    else if (key) handleNumber(key);
                  }}
                  disabled={isLoading || key === ''}
                  className={`h-14 rounded-xl font-bold text-xl transition-all ${
                    key === ''
                      ? 'invisible'
                      : key === 'del'
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                  } disabled:opacity-50`}
                >
                  {key === 'del' ? '⌫' : key}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
