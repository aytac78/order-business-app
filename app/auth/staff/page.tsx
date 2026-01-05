'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore, StaffRole, roleConfig } from '@/stores/authStore';
import {
  ArrowLeft,
  QrCode,
  Users,
  AlertCircle,
  Loader2,
  Building2,
  CheckCircle
} from 'lucide-react';
import {
  Language,
  getSavedLanguage,
  getTranslation,
  isRTL
} from '@/lib/i18n';

interface StaffMember {
  id: string;
  full_name: string;
  role: string;
  venue_name?: string;
}

type Step = 'code' | 'select' | 'pin';

export default function StaffLoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  
  // Language
  const [language, setLanguage] = useState<Language>('en');
  const t = getTranslation(language);
  const rtl = isRTL(language);

  // State
  const [step, setStep] = useState<Step>('code');
  const [venueCode, setVenueCode] = useState('');
  const [venueId, setVenueId] = useState<string | null>(null);
  const [venueName, setVenueName] = useState('');
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = getSavedLanguage();
    if (saved) setLanguage(saved);
  }, []);

  // Venue kodu ile personel listesini çek
  const handleCodeSubmit = async () => {
    if (!venueCode.trim()) {
      setError(t.errors.required);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Önce venue'yu bul
      const { data: venue, error: venueError } = await supabase
        .from('venues')
        .select('id, name')
        .eq('venue_code', venueCode.toUpperCase().trim())
        .single();

      if (venueError || !venue) {
        setError(t.staff.wrongCode);
        setIsLoading(false);
        return;
      }

      setVenueId(venue.id);
      setVenueName(venue.name);

      // Personel listesini çek (owner hariç)
      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('id, full_name, role')
        .eq('venue_id', venue.id)
        .eq('is_active', true)
        .eq('is_owner', false)
        .order('full_name');

      if (staffError) throw staffError;

      if (!staff || staff.length === 0) {
        setError(t.staff.noStaff);
        setIsLoading(false);
        return;
      }

      setStaffList(staff);
      setStep('select');
    } catch (err) {
      setError(t.errors.networkError);
    } finally {
      setIsLoading(false);
    }
  };

  // Personel seçimi
  const handleStaffSelect = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setPin('');
    setError('');
    setStep('pin');
  };

  // PIN doğrulama
  const handlePinSubmit = async (pinCode: string) => {
    if (!selectedStaff || !venueId) return;

    setIsLoading(true);
    setError('');

    try {
      // PIN doğrula
      const { data, error: pinError } = await supabase
        .from('staff')
        .select('id, full_name, role, venue_id')
        .eq('id', selectedStaff.id)
        .eq('pin_code', pinCode)
        .eq('is_active', true)
        .single();

      if (pinError || !data) {
        setError(t.staff.wrongPin);
        setPin('');
        setIsLoading(false);
        return;
      }

      // Son giriş zamanını güncelle
      await supabase
        .from('staff')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id);

      // Auth store'a kaydet
      const role = data.role as StaffRole;
      login({
        id: data.id,
        name: data.full_name,
        role,
        venue_id: data.venue_id
      });

      // Rol bazlı yönlendirme
      const config = roleConfig[role];
      router.push(config?.defaultRoute || '/dashboard');
    } catch (err) {
      setError(t.errors.unknownError);
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  // PIN tuşu
  const handlePinKey = (key: string) => {
    if (key === 'del') {
      setPin(pin.slice(0, -1));
    } else if (pin.length < 4) {
      const newPin = pin + key;
      setPin(newPin);
      if (newPin.length === 4) {
        setTimeout(() => handlePinSubmit(newPin), 300);
      }
    }
  };

  // Geri butonu
  const handleBack = () => {
    if (step === 'pin') {
      setSelectedStaff(null);
      setPin('');
      setError('');
      setStep('select');
    } else if (step === 'select') {
      setStaffList([]);
      setVenueId(null);
      setVenueName('');
      setError('');
      setStep('code');
    } else {
      router.push('/');
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4"
      dir={rtl ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">{t.staff.title}</h1>
          {venueName && (
            <p className="text-purple-400 mt-1">{venueName}</p>
          )}
        </div>

        {/* Content Card */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
          {/* Back Button */}
          <button type="button"
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className={`w-4 h-4 ${rtl ? 'rotate-180' : ''}`} />
            <span className="text-sm">{t.common.back}</span>
          </button>

          {/* STEP 1: Enter Code */}
          {step === 'code' && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">
                {t.staff.enterCode}
              </h2>
              
              <input
                type="text"
                value={venueCode}
                onChange={(e) => {
                  setVenueCode(e.target.value.toUpperCase());
                  setError('');
                }}
                placeholder={t.staff.codePlaceholder}
                className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white text-center text-xl tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                maxLength={12}
                autoFocus
              />

              {error && (
                <div className="flex items-center gap-2 text-red-400 mt-3">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button type="button"
                onClick={handleCodeSubmit}
                disabled={isLoading || !venueCode.trim()}
                className="w-full mt-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>{t.common.next}</span>
                  </>
                )}
              </button>

              {/* QR Scanner Option */}
              <button type="button"
                className="w-full mt-3 py-3 border border-gray-600 text-gray-400 rounded-xl hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <QrCode className="w-5 h-5" />
                <span>{t.staff.scanQR}</span>
              </button>
            </div>
          )}

          {/* STEP 2: Select Staff */}
          {step === 'select' && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">
                {t.staff.selectStaff}
              </h2>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {staffList.map((staff) => {
                  const config = roleConfig[staff.role as StaffRole] || roleConfig.waiter;
                  return (
                    <button type="button"
                      key={staff.id}
                      onClick={() => handleStaffSelect(staff)}
                      className="w-full p-4 bg-gray-700 hover:bg-gray-600 rounded-xl text-left transition-colors flex items-center gap-4"
                    >
                      <div className={`w-12 h-12 ${config.bgColor} rounded-xl flex items-center justify-center`}>
                        <span className="text-2xl">{config.icon}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white">{staff.full_name}</p>
                        <p className={`text-sm ${config.color}`}>{config.label}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Enter PIN */}
          {step === 'pin' && selectedStaff && (
            <div>
              {/* Selected Staff Info */}
              <div className="text-center mb-6">
                {(() => {
                  const config = roleConfig[selectedStaff.role as StaffRole] || roleConfig.waiter;
                  return (
                    <>
                      <div className={`w-16 h-16 ${config.bgColor} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                        <span className="text-3xl">{config.icon}</span>
                      </div>
                      <p className="font-semibold text-white">{selectedStaff.full_name}</p>
                      <p className={`text-sm ${config.color}`}>{config.label}</p>
                    </>
                  );
                })()}
              </div>

              {/* PIN Title */}
              <p className="text-center text-gray-400 mb-4">{t.staff.enterPin}</p>

              {/* PIN Dots */}
              <div className="flex justify-center gap-3 mb-6">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full transition-colors ${
                      pin.length > i ? 'bg-purple-500' : 'bg-gray-600'
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

              {/* PIN Pad */}
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) => (
                  <button type="button"
                    key={key}
                    onClick={() => key && handlePinKey(key)}
                    disabled={isLoading || key === ''}
                    className={`h-14 rounded-xl font-bold text-xl transition-colors ${
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

              {/* Loading */}
              {isLoading && (
                <div className="flex justify-center mt-4">
                  <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}