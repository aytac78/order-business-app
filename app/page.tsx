'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore, StaffMember, StaffRole, roleConfig } from '@/stores/authStore';
import { fetchStaffMembers, verifyPin, getRolePermissions, updateLastLogin } from '@/lib/services/auth';
import { 
  Lock, LogIn, X, Delete, ArrowLeft, Clock, Users, 
  ChefHat, UtensilsCrossed, CreditCard, ClipboardList, Crown, Briefcase
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, currentStaff } = useAuthStore();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Zaten giriş yapılmışsa yönlendir
    if (isAuthenticated && currentStaff) {
      const config = roleConfig[currentStaff.role];
      router.push(config.defaultRoute);
      return;
    }
    
    loadStaff();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [isAuthenticated, currentStaff, router]);

  const loadStaff = async () => {
    try {
      const data = await fetchStaffMembers();
      setStaff(data);
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinInput = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');
      
      // 4 haneli PIN tamamlandığında otomatik doğrula
      if (newPin.length === 4) {
        verifyAndLogin(newPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const verifyAndLogin = async (pinCode: string) => {
    if (!selectedStaff) return;
    
    setIsVerifying(true);
    setError('');
    
    try {
      const isValid = await verifyPin(selectedStaff.id, pinCode);
      
      if (isValid) {
        const routes = await getRolePermissions(selectedStaff.role);
        await updateLastLogin(selectedStaff.id);
        
        login(selectedStaff, routes);
        
        // Role göre yönlendir
        const config = roleConfig[selectedStaff.role];
        router.push(config.defaultRoute);
      } else {
        setError('Yanlış PIN kodu');
        setPin('');
      }
    } catch (error) {
      setError('Bir hata oluştu');
      setPin('');
    } finally {
      setIsVerifying(false);
    }
  };

  const getRoleIcon = (role: StaffRole) => {
    switch (role) {
      case 'owner': return <Crown className="w-8 h-8" />;
      case 'manager': return <Briefcase className="w-8 h-8" />;
      case 'cashier': return <CreditCard className="w-8 h-8" />;
      case 'waiter': return <UtensilsCrossed className="w-8 h-8" />;
      case 'kitchen': return <ChefHat className="w-8 h-8" />;
      case 'reception': return <ClipboardList className="w-8 h-8" />;
      default: return <Users className="w-8 h-8" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">O</span>
          </div>
          <div>
            <h1 className="text-white text-xl font-bold">ORDER Business</h1>
            <p className="text-gray-400 text-sm">Personel Girişi</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white text-2xl font-bold">{currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
          <p className="text-gray-400 text-sm">{currentTime.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        {!selectedStaff ? (
          // Staff Selection
          <div className="w-full max-w-4xl">
            <h2 className="text-white text-2xl font-bold text-center mb-8">Personel Seçin</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {staff.map((member) => {
                const config = roleConfig[member.role];
                return (
                  <button
                    key={member.id}
                    onClick={() => setSelectedStaff(member)}
                    className="bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-gray-600 rounded-2xl p-6 transition-all duration-200 hover:scale-105 hover:shadow-xl group"
                  >
                    <div className={`w-16 h-16 ${config.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                      <span className={config.color}>
                        {getRoleIcon(member.role)}
                      </span>
                    </div>
                    <h3 className="text-white font-bold text-lg text-center mb-1">{member.name}</h3>
                    <p className={`text-center text-sm ${config.color}`}>{config.label}</p>
                  </button>
                );
              })}
            </div>
            
            {staff.length === 0 && (
              <div className="text-center text-gray-400 py-12">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Henüz personel eklenmemiş</p>
              </div>
            )}
          </div>
        ) : (
          // PIN Entry
          <div className="w-full max-w-sm">
            <button
              onClick={() => { setSelectedStaff(null); setPin(''); setError(''); }}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Geri
            </button>

            <div className="bg-gray-800/50 border border-gray-700 rounded-3xl p-8">
              {/* Selected Staff */}
              <div className="text-center mb-8">
                <div className={`w-20 h-20 ${roleConfig[selectedStaff.role].bgColor} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <span className={roleConfig[selectedStaff.role].color}>
                    {getRoleIcon(selectedStaff.role)}
                  </span>
                </div>
                <h3 className="text-white font-bold text-xl">{selectedStaff.name}</h3>
                <p className={`text-sm ${roleConfig[selectedStaff.role].color}`}>
                  {roleConfig[selectedStaff.role].label}
                </p>
              </div>

              {/* PIN Display */}
              <div className="flex justify-center gap-3 mb-6">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all ${
                      pin.length > i
                        ? 'border-orange-500 bg-orange-500/20'
                        : 'border-gray-600 bg-gray-700/50'
                    }`}
                  >
                    {pin.length > i && (
                      <div className="w-4 h-4 bg-orange-500 rounded-full" />
                    )}
                  </div>
                ))}
              </div>

              {/* Error Message */}
              {error && (
                <p className="text-red-500 text-center text-sm mb-4">{error}</p>
              )}

              {/* PIN Pad */}
              <div className="grid grid-cols-3 gap-3">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (key === 'del') handleBackspace();
                      else if (key) handlePinInput(key);
                    }}
                    disabled={isVerifying || key === ''}
                    className={`h-16 rounded-xl font-bold text-xl transition-all ${
                      key === ''
                        ? 'invisible'
                        : key === 'del'
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        : 'bg-gray-700 text-white hover:bg-gray-600 active:scale-95'
                    } disabled:opacity-50`}
                  >
                    {key === 'del' ? <Delete className="w-6 h-6 mx-auto" /> : key}
                  </button>
                ))}
              </div>

              {/* Loading */}
              {isVerifying && (
                <div className="mt-6 text-center text-gray-400">
                  <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-2" />
                  Doğrulanıyor...
                </div>
              )}
            </div>

            {/* Hint */}
            <p className="text-center text-gray-500 text-sm mt-6">
              Demo PIN: {selectedStaff.role === 'owner' ? '1234' : 
                        selectedStaff.role === 'kitchen' ? '1111' :
                        selectedStaff.role === 'waiter' ? '2222' :
                        selectedStaff.role === 'cashier' ? '3333' :
                        selectedStaff.role === 'reception' ? '4444' : '5555'}
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-gray-500 text-sm">
        © 2025 ORDER Business • TiT Ecosystem
      </footer>
    </div>
  );
}
