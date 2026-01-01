'use client';
import { useState, useEffect, useCallback } from 'react';
import { Lock, Delete, X, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores';
import { createBrowserClient } from '@supabase/ssr';

interface Staff { id: string; name: string; role: string; pin_code: string; }

interface PinLoginProps {
  venueId?: string;
  onLogin?: (staff: Staff) => void;
  onCancel?: () => void;
  title?: string;
}

export function PinLogin({ venueId, onLogin, onCancel, title = 'Personel Girişi' }: PinLoginProps) {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { login } = useAuthStore();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Supabase'den personel listesini çek
  useEffect(() => {
    const fetchStaff = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('staff')
          .select('id, name, role, pin_code')
          .eq('is_active', true)
          .not('pin_code', 'is', null);

        if (venueId) {
          query = query.eq('venue_id', venueId);
        }

        const { data, error } = await query.order('name');

        if (error) throw error;
        setStaffList(data || []);
      } catch (err) {
        console.error('Personel listesi çekilemedi:', err);
        setError('Personel listesi yüklenemedi');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaff();
  }, [venueId, supabase]);

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
        if (newPin === selectedStaff.pin_code) {
          handleLogin(selectedStaff);
        } else {
          setError('Yanlış PIN kodu');
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  }, [pin, selectedStaff]);

  const handleDelete = useCallback(() => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  }, []);

  const handleClear = useCallback(() => {
    setPin('');
    setError('');
  }, []);

  const handleBack = useCallback(() => {
    setSelectedStaff(null);
    setPin('');
    setError('');
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500" />
          <p className="mt-4 text-gray-600">Personel listesi yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Personel seçimi
  if (!selectedStaff) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            {onCancel && (
              <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {staffList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Lock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Kayıtlı personel bulunamadı</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {staffList.map((staff) => (
                <button
                  key={staff.id}
                  onClick={() => setSelectedStaff(staff)}
                  className="w-full p-4 bg-gray-50 hover:bg-orange-50 rounded-xl text-left transition-colors flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="font-bold text-orange-600">
                      {staff.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{staff.name}</p>
                    <p className="text-sm text-gray-500 capitalize">{staff.role}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // PIN girişi
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl font-bold text-orange-600">
              {selectedStaff.name.charAt(0)}
            </span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">{selectedStaff.name}</h2>
          <p className="text-sm text-gray-500 capitalize">{selectedStaff.role}</p>
        </div>

        {/* PIN göstergesi */}
        <div className="flex justify-center gap-3 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-colors ${
                i < pin.length ? 'bg-orange-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handlePinInput(num.toString())}
              className="h-14 bg-gray-100 hover:bg-gray-200 rounded-xl text-xl font-semibold transition-colors"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleBack}
            className="h-14 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors"
          >
            Geri
          </button>
          <button
            onClick={() => handlePinInput('0')}
            className="h-14 bg-gray-100 hover:bg-gray-200 rounded-xl text-xl font-semibold transition-colors"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-14 bg-gray-100 hover:bg-red-100 rounded-xl flex items-center justify-center transition-colors"
          >
            <Delete className="w-5 h-5 text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
