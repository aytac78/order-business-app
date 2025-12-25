'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  ChefHat, User, CreditCard, Calendar, Shield,
  UtensilsCrossed, Delete, ArrowLeft, Loader2
} from 'lucide-react';

// ============================================
// ROLLER VE YÖNLENDİRMELER
// ============================================

interface RoleConfig {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  route: string;
  description: string;
  pins: string[];
}

const roles: RoleConfig[] = [
  {
    id: 'admin',
    name: 'Yönetici',
    icon: Shield,
    color: 'text-purple-400',
    bgColor: 'from-purple-500 to-indigo-600',
    route: '/admin',
    description: 'Tüm yönetim paneli',
    pins: ['1234', '0000'],
  },
  {
    id: 'kitchen',
    name: 'Mutfak',
    icon: ChefHat,
    color: 'text-orange-400',
    bgColor: 'from-orange-500 to-red-600',
    route: '/kitchen',
    description: 'Sipariş hazırlama',
    pins: ['1111', '2222'],
  },
  {
    id: 'waiter',
    name: 'Garson',
    icon: UtensilsCrossed,
    color: 'text-blue-400',
    bgColor: 'from-blue-500 to-cyan-600',
    route: '/waiter',
    description: 'Masa ve sipariş takibi',
    pins: ['3333', '4444'],
  },
  {
    id: 'pos',
    name: 'Kasa',
    icon: CreditCard,
    color: 'text-emerald-400',
    bgColor: 'from-emerald-500 to-teal-600',
    route: '/pos',
    description: 'Ödeme işlemleri',
    pins: ['5555', '6666'],
  },
  {
    id: 'reception',
    name: 'Resepsiyon',
    icon: Calendar,
    color: 'text-pink-400',
    bgColor: 'from-pink-500 to-rose-600',
    route: '/reception',
    description: 'Rezervasyon yönetimi',
    pins: ['7777', '8888'],
  },
];

// ============================================
// PIN PAD COMPONENT
// ============================================

function PinPad({ 
  pin, 
  setPin, 
  onSubmit, 
  onBack, 
  role, 
  error,
  loading 
}: { 
  pin: string;
  setPin: (pin: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  role: RoleConfig;
  error: string;
  loading: boolean;
}) {
  const handleNumber = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        setTimeout(() => onSubmit(newPin), 500);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const Icon = role.icon;

  return (
    <div className="w-full max-w-sm mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Geri</span>
      </button>

      <div className="text-center mb-8">
        <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${role.bgColor} flex items-center justify-center mb-4`}>
          <Icon className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">{role.name}</h2>
        <p className="text-zinc-400 text-sm mt-1">{role.description}</p>
      </div>

      <div className="flex justify-center gap-4 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all ${
              pin.length > i
                ? 'border-blue-500 bg-blue-500/20'
                : 'border-zinc-700 bg-zinc-800/50'
            }`}
          >
            {pin.length > i && (
              <div className="w-4 h-4 rounded-full bg-blue-500" />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="text-center text-red-400 text-sm mb-4 animate-pulse">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center mb-4">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (key === 'del') handleDelete();
              else if (key) handleNumber(key);
            }}
            disabled={!key || loading}
            className={`h-16 rounded-xl text-2xl font-bold transition-all ${
              !key
                ? 'invisible'
                : key === 'del'
                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
                : 'bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-white'
            }`}
          >
            {key === 'del' ? <Delete className="w-6 h-6 mx-auto" /> : key}
          </button>
        ))}
      </div>

      <p className="text-center text-zinc-600 text-xs mt-6">
        Demo PIN: {role.pins[0]}
      </p>
    </div>
  );
}

// ============================================
// ROLE SELECTION COMPONENT
// ============================================

function RoleSelection({ onSelect }: { onSelect: (role: RoleConfig) => void }) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-12">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
          <UtensilsCrossed className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">ORDER Business</h1>
        <p className="text-zinc-400">Giriş yapmak için rolünüzü seçin</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <button
              key={role.id}
              onClick={() => onSelect(role)}
              className="group p-6 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 rounded-2xl transition-all"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${role.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{role.name}</h3>
              <p className="text-xs text-zinc-500">{role.description}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <p className="text-zinc-600 text-sm">
          Demo Restaurant • ORDER Business v1.0
        </p>
      </div>
    </div>
  );
}

// ============================================
// MAIN LOGIN PAGE
// ============================================

export default function LoginPage() {
  const router = useRouter();
  const { loginWithPin } = useAuth();
  const [step, setStep] = useState<'role' | 'pin'>('role');
  const [selectedRole, setSelectedRole] = useState<RoleConfig | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (role: RoleConfig) => {
    setSelectedRole(role);
    setStep('pin');
    setPin('');
    setError('');
  };

  const handlePinSubmit = (submittedPin?: string) => { const pinToCheck = submittedPin || pin;
    if (!selectedRole) return;
    
    setLoading(true);
    setError('');

    setTimeout(() => {
      console.log("PIN:", pinToCheck, "Expected:", selectedRole.pins); if (selectedRole.pins.includes(pinToCheck)) {
        loginWithPin(pinToCheck).then(() => router.push(selectedRole.route));
      } else {
        setError('Yanlış PIN kodu');
        setPin('');
        setLoading(false);
      }
    }, 500);
  };

  const handleBack = () => {
    setStep('role');
    setSelectedRole(null);
    setPin('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      {step === 'role' && (
        <RoleSelection onSelect={handleRoleSelect} />
      )}
      
      {step === 'pin' && selectedRole && (
        <PinPad
          pin={pin}
          setPin={setPin}
          onSubmit={handlePinSubmit}
          onBack={handleBack}
          role={selectedRole}
          error={error}
          loading={loading}
        />
      )}
    </div>
  );
}
