'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, StaffRole, roleConfig } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';

interface Staff {
  id: string;
  full_name: string;
  role: string;
  venue_id: string;
  pin_code?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, logout } = useAuthStore();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    logout();
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase.from('staff').select('*').eq('is_active', true).order('role');
      if (error) throw error;
      setStaff(data || []);
    } catch (err) {
      setError('Personel listesi yüklenemedi');
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const handlePinSubmit = async (pinCode: string) => {
    if (!selectedStaff) return;
    setIsLoading(true);
    setError('');
    try {
      const { data, error } = await supabase.from('staff').select('*').eq('id', selectedStaff.id).eq('pin_code', pinCode).eq('is_active', true).single();
      if (error || !data) { setError('Yanlış PIN kodu'); setPin(''); return; }
      const role = data.role as StaffRole;
      login({ id: data.id, name: data.full_name, role, venue_id: data.venue_id });
      router.push(roleConfig[role].defaultRoute);
    } catch { setError('Bir hata oluştu'); setPin(''); } finally { setIsLoading(false); }
  };

  const handleNumber = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) setTimeout(() => handlePinSubmit(newPin), 300);
    }
  };

  if (!mounted) return <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center"><div className="text-white">Yükleniyor...</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4"><span className="text-3xl">🍽️</span></div>
          <h1 className="text-2xl font-bold text-white">ORDER Business</h1>
          <p className="text-gray-400 mt-1">Personel Girişi</p>
        </div>
        {!selectedStaff ? (
          <div className="bg-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Personel Seçin</h2>
            {isLoadingStaff ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-orange-500 animate-spin" /></div> : staff.length === 0 ? <div className="text-center py-8"><AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-3" /><p className="text-gray-400">Henüz personel kaydı yok</p></div> : (
              <div className="grid grid-cols-2 gap-3">
                {staff.map((s) => { const config = roleConfig[s.role as StaffRole] || roleConfig.waiter; return (
                  <button key={s.id} onClick={() => { setSelectedStaff(s); setPin(''); setError(''); }} className="p-4 bg-gray-700 hover:bg-gray-600 rounded-xl text-left transition-all">
                    <div className={`w-10 h-10 ${config.bgColor} rounded-lg flex items-center justify-center mb-2`}><span className="text-xl">{config.icon}</span></div>
                    <p className="font-medium text-white text-sm">{s.full_name}</p>
                    <p className={`text-xs ${config.color}`}>{config.label}</p>
                  </button>
                ); })}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-2xl p-6">
            <button onClick={() => { setSelectedStaff(null); setPin(''); setError(''); }} className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"><ArrowLeft className="w-4 h-4" /><span className="text-sm">Geri</span></button>
            <div className="text-center mb-6">
              {(() => { const config = roleConfig[selectedStaff.role as StaffRole] || roleConfig.waiter; return (<><div className={`w-16 h-16 ${config.bgColor} rounded-xl flex items-center justify-center mx-auto mb-3`}><span className="text-2xl">{config.icon}</span></div><p className="font-semibold text-white">{selectedStaff.full_name}</p><p className={`text-sm ${config.color}`}>{config.label}</p></>); })()}
            </div>
            <div className="flex justify-center gap-3 mb-6">{[0,1,2,3].map(i => <div key={i} className={`w-4 h-4 rounded-full ${pin.length > i ? 'bg-orange-500' : 'bg-gray-600'}`} />)}</div>
            {error && <div className="flex items-center justify-center gap-2 text-red-400 mb-4"><AlertCircle className="w-4 h-4" /><span className="text-sm">{error}</span></div>}
            <div className="grid grid-cols-3 gap-2">
              {['1','2','3','4','5','6','7','8','9','','0','del'].map(key => <button key={key} onClick={() => { if (key === 'del') setPin(pin.slice(0,-1)); else if (key) handleNumber(key); }} disabled={isLoading || key === ''} className={`h-14 rounded-xl font-bold text-xl ${key === '' ? 'invisible' : key === 'del' ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-700 hover:bg-gray-600 text-white'} disabled:opacity-50`}>{key === 'del' ? '⌫' : key}</button>)}
            </div>
            {isLoading && <div className="flex justify-center mt-4"><Loader2 className="w-6 h-6 text-orange-500 animate-spin" /></div>}
          </div>
        )}
      </div>
    </div>
  );
}
