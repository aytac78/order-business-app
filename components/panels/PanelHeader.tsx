'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, LogOut, Volume2, VolumeX, X, Lock } from 'lucide-react';

interface PanelHeaderProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  soundEnabled?: boolean;
  onSoundToggle?: () => void;
  showSound?: boolean;
  children?: React.ReactNode;
}

export function PanelHeader({
  title,
  subtitle,
  icon,
  iconBgColor = 'text-orange-500',
  soundEnabled = true,
  onSoundToggle,
  showSound = true,
  children
}: PanelHeaderProps) {
  const router = useRouter();
  const [showExitModal, setShowExitModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const MANAGER_PIN = '1234'; // Gerçek uygulamada Supabase'den gelecek

  const handleExit = () => {
    setShowExitModal(true);
    setPin('');
    setPinError(false);
  };

  const handlePinSubmit = () => {
    if (pin === MANAGER_PIN) {
      setShowExitModal(false);
      router.push('/admin');
    } else {
      setPinError(true);
      setPin('');
    }
  };

  const handlePinKeyPress = (key: string) => {
    if (key === 'clear') {
      setPin('');
      setPinError(false);
    } else if (key === 'back') {
      setPin(prev => prev.slice(0, -1));
      setPinError(false);
    } else if (pin.length < 6) {
      const newPin = pin + key;
      setPin(newPin);
      setPinError(false);
      // Otomatik submit
      if (newPin.length === 4) {
        setTimeout(() => {
          if (newPin === MANAGER_PIN) {
            setShowExitModal(false);
            router.push('/admin');
          } else {
            setPinError(true);
            setPin('');
          }
        }, 200);
      }
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={iconBgColor}>
            {icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle && <p className="text-gray-400 text-sm">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {children}
          
          {/* Sound Toggle */}
          {showSound && onSoundToggle && (
            <button type="button"
              onClick={onSoundToggle}
              className={`p-3 rounded-xl transition-colors ${
                soundEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          )}

          {/* Home Button */}
          <button type="button"
            onClick={() => router.push('/admin')}
            className="p-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors"
            title="Ana Sayfa"
          >
            <Home className="w-5 h-5" />
          </button>

          {/* Exit Button */}
          <button type="button"
            onClick={handleExit}
            className="p-3 rounded-xl bg-red-600 hover:bg-red-700 transition-colors"
            title="Çıkış (PIN Gerekli)"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Exit PIN Modal */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Lock className="w-6 h-6 text-red-500" />
                <h2 className="text-xl font-bold text-white">Çıkış PIN</h2>
              </div>
              <button type="button"
                onClick={() => setShowExitModal(false)}
                className="p-2 hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <p className="text-gray-400 text-sm mb-4 text-center">
              Panelden çıkmak için yönetici PIN kodunu girin
            </p>

            {/* PIN Display */}
            <div className="flex justify-center gap-2 mb-6">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl font-bold ${
                    pinError 
                      ? 'border-red-500 bg-red-500/20' 
                      : pin.length > i 
                        ? 'border-orange-500 bg-orange-500/20' 
                        : 'border-gray-600 bg-gray-700'
                  }`}
                >
                  {pin.length > i ? '●' : ''}
                </div>
              ))}
            </div>

            {pinError && (
              <p className="text-red-500 text-sm text-center mb-4">
                Hatalı PIN! Tekrar deneyin.
              </p>
            )}

            {/* Number Pad */}
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'].map((key) => (
                <button type="button"
                  key={key}
                  onClick={() => handlePinKeyPress(key)}
                  className={`py-4 rounded-xl font-bold text-xl transition-colors ${
                    key === 'clear'
                      ? 'bg-red-600 hover:bg-red-700 text-white text-sm'
                      : key === 'back'
                        ? 'bg-gray-600 hover:bg-gray-500 text-white text-sm'
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  {key === 'clear' ? 'Temizle' : key === 'back' ? '←' : key}
                </button>
              ))}
            </div>

            <button type="button"
              onClick={() => setShowExitModal(false)}
              className="w-full mt-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium"
            >
              İptal
            </button>
          </div>
        </div>
      )}
    </>
  );
}