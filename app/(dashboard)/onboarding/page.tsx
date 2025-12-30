'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVenueStore } from '@/stores';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import {
  Building2, MapPin, Phone, Clock, UtensilsCrossed, Coffee,
  Wine, Umbrella, Music, Hotel, Check, ChevronRight, ChevronLeft,
  Sparkles, Loader2
} from 'lucide-react';

interface VenueData {
  name: string;
  type: string;
  address: string;
  city: string;
  district: string;
  phone: string;
  email: string;
}

const venueTypes = [
  { id: 'restaurant', label: 'Restoran', icon: UtensilsCrossed, color: 'from-orange-500 to-red-500' },
  { id: 'cafe', label: 'Kafe', icon: Coffee, color: 'from-amber-500 to-orange-500' },
  { id: 'bar', label: 'Bar', icon: Wine, color: 'from-purple-500 to-pink-500' },
  { id: 'beach_club', label: 'Beach Club', icon: Umbrella, color: 'from-cyan-500 to-blue-500' },
  { id: 'nightclub', label: 'Gece Kulübü', icon: Music, color: 'from-violet-500 to-purple-500' },
  { id: 'hotel_restaurant', label: 'Otel Restoranı', icon: Hotel, color: 'from-emerald-500 to-teal-500' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { setCurrentVenue, setVenues } = useVenueStore();
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [venueData, setVenueData] = useState<VenueData>({
    name: '',
    type: 'restaurant',
    address: '',
    city: '',
    district: '',
    phone: '',
    email: ''
  });

  const steps = [
    { number: 1, title: 'Mekan Tipi', description: 'İşletme türünüzü seçin' },
    { number: 2, title: 'Temel Bilgiler', description: 'Mekan bilgilerini girin' },
    { number: 3, title: 'İletişim', description: 'İletişim bilgilerini ekleyin' },
    { number: 4, title: 'Tamamlandı', description: 'Hazırsınız!' }
  ];

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = async () => {
    setLoading(true);

    try {
      const { data: venue, error } = await supabase
        .from('venues')
        .insert({
          name: venueData.name,
          slug: venueData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          type: venueData.type,
          address: venueData.address,
          city: venueData.city,
          district: venueData.district,
          phone: venueData.phone,
          email: venueData.email,
          currency: 'TRY',
          timezone: 'Europe/Istanbul',
          is_active: true,
          settings: {
            working_hours: {
              monday: { is_open: true, open: '09:00', close: '22:00' },
              tuesday: { is_open: true, open: '09:00', close: '22:00' },
              wednesday: { is_open: true, open: '09:00', close: '22:00' },
              thursday: { is_open: true, open: '09:00', close: '22:00' },
              friday: { is_open: true, open: '09:00', close: '23:00' },
              saturday: { is_open: true, open: '09:00', close: '23:00' },
              sunday: { is_open: true, open: '10:00', close: '22:00' },
            },
            reservation_enabled: true,
            qr_menu_enabled: true,
            online_ordering_enabled: true,
            tax_rate: 8,
            auto_accept_orders: false,
            notification_sounds: true,
            theme_color: '#f97316'
          }
        })
        .select()
        .single();

      if (venue && !error) {
        setCurrentVenue(venue as any);
        setVenues([venue as any]);
        setStep(4);
      }
    } catch (err) {
      console.error('Error creating venue:', err);
    }

    setLoading(false);
  };

  const canProceed = () => {
    if (step === 1) return venueData.type !== '';
    if (step === 2) return venueData.name !== '' && venueData.city !== '' && venueData.district !== '';
    if (step === 3) return venueData.phone !== '' && venueData.email !== '';
    return true;
  };

  return (
    <div className="min-h-screen bg-gray-900 -m-6 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('onboarding')}</h1>
          <p className="text-gray-400">Mekanınızı birkaç adımda kurun</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, index) => (
            <div key={s.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step > s.number 
                    ? 'bg-green-500 text-white' 
                    : step === s.number 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-700 text-gray-400'
                }`}>
                  {step > s.number ? <Check className="w-5 h-5" /> : s.number}
                </div>
                <span className={`text-xs mt-1 ${step >= s.number ? 'text-white' : 'text-gray-500'}`}>
                  {s.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-1 mx-2 rounded ${
                  step > s.number ? 'bg-green-500' : 'bg-gray-700'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
          {/* Step 1: Venue Type */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Mekan Tipini Seçin</h2>
              <p className="text-gray-400 mb-6">İşletmenizin türünü belirleyin</p>
              
              <div className="grid grid-cols-2 gap-4">
                {venueTypes.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setVenueData({ ...venueData, type: type.id })}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        venueData.type === type.id
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-3`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <p className="font-medium text-white">{type.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Basic Info */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Temel Bilgiler</h2>
              <p className="text-gray-400 mb-6">Mekanınızın adını ve konumunu girin</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Mekan Adı *</label>
                  <input
                    type="text"
                    value={venueData.name}
                    onChange={(e) => setVenueData({ ...venueData, name: e.target.value })}
                    placeholder="Örn: Lezzet Restoran"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Şehir *</label>
                    <input
                      type="text"
                      value={venueData.city}
                      onChange={(e) => setVenueData({ ...venueData, city: e.target.value })}
                      placeholder="Örn: İstanbul"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">İlçe *</label>
                    <input
                      type="text"
                      value={venueData.district}
                      onChange={(e) => setVenueData({ ...venueData, district: e.target.value })}
                      placeholder="Örn: Kadıköy"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Adres</label>
                  <textarea
                    value={venueData.address}
                    onChange={(e) => setVenueData({ ...venueData, address: e.target.value })}
                    placeholder="Tam adres"
                    rows={2}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Contact */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-2">İletişim Bilgileri</h2>
              <p className="text-gray-400 mb-6">Müşterilerinizin ulaşabileceği bilgiler</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Telefon *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={venueData.phone}
                      onChange={(e) => setVenueData({ ...venueData, phone: e.target.value })}
                      placeholder="+90 555 123 4567"
                      className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">E-posta *</label>
                  <input
                    type="email"
                    value={venueData.email}
                    onChange={(e) => setVenueData({ ...venueData, email: e.target.value })}
                    placeholder="info@mekaniniz.com"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 4 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Tebrikler!</h2>
              <p className="text-gray-400 mb-6">
                <strong>{venueData.name}</strong> başarıyla oluşturuldu.
              </p>
              <div className="bg-gray-700/50 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-gray-400 mb-2">Şimdi yapabilecekleriniz:</p>
                <ul className="space-y-2 text-sm text-white">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Menünüzü oluşturun
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Masalarınızı ekleyin
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Personelinizi tanımlayın
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    QR menü oluşturun
                  </li>
                </ul>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold"
              >
                Dashboard'a Git
              </button>
            </div>
          )}

          {/* Navigation */}
          {step < 4 && (
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-700">
              <button
                onClick={handleBack}
                disabled={step === 1}
                className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Geri
              </button>
              
              {step === 3 ? (
                <button
                  onClick={handleComplete}
                  disabled={!canProceed() || loading}
                  className="flex items-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white rounded-xl font-medium"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Tamamla
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white rounded-xl font-medium"
                >
                  Devam
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
