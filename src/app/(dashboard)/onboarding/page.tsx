'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRScanner } from '@/components/onboarding/QRScanner';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Link,
  Upload,
  Loader2,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Globe,
  FileText,
  Camera,
  Utensils,
  Coffee,
  Wine,
  Umbrella,
  Moon,
  Hotel,
  QrCode,
  Zap
} from 'lucide-react';

const venueTypes = [
  { id: 'restaurant', label: 'Restoran', icon: Utensils },
  { id: 'cafe', label: 'Kafe', icon: Coffee },
  { id: 'bar', label: 'Bar', icon: Wine },
  { id: 'beach_club', label: 'Beach Club', icon: Umbrella },
  { id: 'nightclub', label: 'Gece Kulübü', icon: Moon },
  { id: 'hotel_restaurant', label: 'Otel Restoranı', icon: Hotel },
];

const menuSources = [
  { id: 'qr_scan', label: 'QR Menü Tara', icon: '📷', placeholder: 'Kamera ile QR okut', highlight: true },
  { id: 'yemeksepeti', label: 'Yemeksepeti', icon: '🍽️', placeholder: 'https://www.yemeksepeti.com/restaurant/...' },
  { id: 'getir', label: 'Getir Yemek', icon: '💜', placeholder: 'https://getir.com/yemek/restaurant/...' },
  { id: 'google', label: 'Google Maps', icon: '📍', placeholder: 'https://maps.google.com/...' },
  { id: 'website', label: 'Web Sitesi', icon: '🌐', placeholder: 'https://www.example.com/menu' },
  { id: 'upload', label: 'PDF/Fotoğraf Yükle', icon: '📄', placeholder: '' },
  { id: 'manual', label: 'Manuel Giriş', icon: '✍️', placeholder: '' },
];

type Step = 'basics' | 'type' | 'menu-source' | 'menu-import' | 'review' | 'complete';

interface FormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: string;
  type: string;
  menuSource: string;
  menuUrl: string;
  menuFile: File | null;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('basics');
  const [isLoading, setIsLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importedMenu, setImportedMenu] = useState<any>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    district: '',
    type: '',
    menuSource: '',
    menuUrl: '',
    menuFile: null,
  });

  const updateForm = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleQRScan = (url: string) => {
    setShowQRScanner(false);
    updateForm('menuSource', 'qr_scan');
    updateForm('menuUrl', url);
    setStep('menu-import');
    // Otomatik olarak menüyü çek - URL'yi doğrudan parametre olarak geç
    setTimeout(() => handleMenuImport(url), 500);
  };

  const handleMenuImport = async (overrideUrl?: string) => {
    setIsLoading(true);
    setImportProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // Call scraper API
      const response = await fetch('/api/scrape-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: formData.menuSource,
          url: overrideUrl || formData.menuUrl,
        }),
      });

      const data = await response.json();
      
      clearInterval(progressInterval);
      setImportProgress(100);
      
      if (data.success) {
        setImportedMenu(data.menu);
        setTimeout(() => setStep('review'), 500);
      } else {
        // Demo data for testing
        setImportedMenu(getDemoMenu());
        setTimeout(() => setStep('review'), 500);
      }
    } catch (error) {
      clearInterval(progressInterval);
      // Use demo data on error
      setImportedMenu(getDemoMenu());
      setImportProgress(100);
      setTimeout(() => setStep('review'), 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    
    // Simulate venue creation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setStep('complete');
    setIsLoading(false);
  };

  const getDemoMenu = () => ({
    categories: [
      {
        name: 'Başlangıçlar',
        items: [
          { name: 'Humus', price: 85, description: 'Nohut ezmesi, tahin, zeytinyağı' },
          { name: 'Patlıcan Salatası', price: 75, description: 'Közlenmiş patlıcan, sarımsak, zeytinyağı' },
          { name: 'Atom', price: 65, description: 'Acı biber, domates, sarımsak' },
          { name: 'Haydari', price: 70, description: 'Süzme yoğurt, sarımsak, dereotu' },
        ]
      },
      {
        name: 'Ana Yemekler',
        items: [
          { name: 'Izgara Levrek', price: 320, description: 'Taze levrek, sebze garnitür' },
          { name: 'Karides Güveç', price: 280, description: 'Karides, domates, biber, sarımsak' },
          { name: 'Kuzu Pirzola', price: 350, description: '4 parça pirzola, patates püresi' },
          { name: 'Tavuk Şiş', price: 180, description: 'Marine tavuk, pilav, salata' },
        ]
      },
      {
        name: 'İçecekler',
        items: [
          { name: 'Rakı (70cl)', price: 450, description: 'Yeni Rakı' },
          { name: 'Şarap (Kadeh)', price: 120, description: 'Günün şarabı' },
          { name: 'Bira', price: 80, description: 'Efes Pilsen' },
          { name: 'Meşrubat', price: 40, description: 'Kola, Fanta, Sprite' },
        ]
      }
    ],
    totalItems: 12,
    importedAt: new Date().toISOString()
  });

  const steps: { id: Step; label: string }[] = [
    { id: 'basics', label: 'Temel Bilgiler' },
    { id: 'type', label: 'İşletme Tipi' },
    { id: 'menu-source', label: 'Menü Kaynağı' },
    { id: 'menu-import', label: 'Menü İçe Aktar' },
    { id: 'review', label: 'Önizleme' },
    { id: 'complete', label: 'Tamamlandı' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">ORDER Business</h1>
              <p className="text-xs text-gray-500">Hızlı Kayıt</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Zap className="w-4 h-4 text-orange-500" />
            <span>30 saniyede hazır</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            {steps.slice(0, -1).map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  i < currentStepIndex 
                    ? 'bg-green-500 text-white' 
                    : i === currentStepIndex
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {i < currentStepIndex ? <CheckCircle className="w-5 h-5" /> : i + 1}
                </div>
                {i < steps.length - 2 && (
                  <div className={`w-16 md:w-24 h-1 mx-2 rounded transition-all ${
                    i < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-600">
            {steps[currentStepIndex]?.label}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Step 1: Basics */}
        {step === 'basics' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">İşletme Bilgileri</h2>
              <p className="text-gray-500 mt-2">Temel bilgilerinizi girin</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  İşletme Adı *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Örn: Deniz Restaurant"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateForm('phone', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="+90 555 123 4567"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-posta *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateForm('email', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="info@isletme.com"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adres
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    value={formData.address}
                    onChange={(e) => updateForm('address', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={2}
                    placeholder="Açık adres..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İl</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateForm('city', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Muğla"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İlçe</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => updateForm('district', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Bodrum"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep('type')}
              disabled={!formData.name || !formData.phone || !formData.email}
              className="w-full mt-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Devam Et
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 2: Type */}
        {step === 'type' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">İşletme Tipi</h2>
              <p className="text-gray-500 mt-2">İşletmenizin tipini seçin</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {venueTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => updateForm('type', type.id)}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      formData.type === type.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-200 hover:bg-orange-50/50'
                    }`}
                  >
                    <Icon className={`w-8 h-8 mx-auto mb-3 ${
                      formData.type === type.id ? 'text-orange-500' : 'text-gray-400'
                    }`} />
                    <p className={`font-medium ${
                      formData.type === type.id ? 'text-orange-700' : 'text-gray-700'
                    }`}>{type.label}</p>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep('basics')}
                className="flex-1 py-4 border border-gray-200 rounded-xl font-medium text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-50"
              >
                <ArrowLeft className="w-5 h-5" />
                Geri
              </button>
              <button
                onClick={() => setStep('menu-source')}
                disabled={!formData.type}
                className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50"
              >
                Devam Et
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Menu Source */}
        {step === 'menu-source' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Menünüzü Ekleyin</h2>
              <p className="text-gray-500 mt-2">Menünüzü otomatik olarak içe aktaralım</p>
            </div>

            <div className="space-y-3">
              {menuSources.map((source) => (
                <button
                  key={source.id}
                  onClick={() => {
                    if (source.id === 'qr_scan') {
                      setShowQRScanner(true);
                    } else {
                      updateForm('menuSource', source.id);
                    }
                  }}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                    source.id === 'qr_scan'
                      ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-red-50 hover:shadow-lg'
                      : formData.menuSource === source.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-200'
                  }`}
                >
                  <span className="text-2xl">{source.icon}</span>
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{source.label}</p>
                      {source.id === 'qr_scan' && (
                        <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full font-medium">
                          Önerilen
                        </span>
                      )}
                    </div>
                    {source.placeholder && (
                      <p className="text-xs text-gray-500 truncate max-w-xs">{source.placeholder}</p>
                    )}
                  </div>
                  {formData.menuSource === source.id && source.id !== 'qr_scan' && (
                    <CheckCircle className="w-5 h-5 text-orange-500" />
                  )}
                  {source.id === 'qr_scan' && (
                    <ArrowRight className="w-5 h-5 text-orange-500" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep('type')}
                className="flex-1 py-4 border border-gray-200 rounded-xl font-medium text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-50"
              >
                <ArrowLeft className="w-5 h-5" />
                Geri
              </button>
              <button
                onClick={() => setStep('menu-import')}
                disabled={!formData.menuSource}
                className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50"
              >
                Devam Et
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Menu Import */}
        {step === 'menu-import' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Menü İçe Aktar</h2>
              <p className="text-gray-500 mt-2">
                {formData.menuSource === 'upload' 
                  ? 'Menü dosyanızı yükleyin' 
                  : formData.menuSource === 'manual'
                  ? 'Menünüzü daha sonra ekleyebilirsiniz'
                  : 'Link girerek menünüzü otomatik çekelim'}
              </p>
            </div>

            {formData.menuSource !== 'upload' && formData.menuSource !== 'manual' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {menuSources.find(s => s.id === formData.menuSource)?.label} Linki
                  </label>
                  <div className="relative">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      value={formData.menuUrl}
                      onChange={(e) => updateForm('menuUrl', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder={menuSources.find(s => s.id === formData.menuSource)?.placeholder}
                    />
                  </div>
                </div>

                {isLoading && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Menü içe aktarılıyor...</span>
                      <span className="text-sm font-medium text-orange-600">{importProgress}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300"
                        style={{ width: `${importProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {formData.menuSource === 'upload' && (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-orange-300 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => updateForm('menuFile', e.target.files?.[0] || null)}
                  className="hidden"
                  id="menu-upload"
                />
                <label htmlFor="menu-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="font-medium text-gray-700">
                    {formData.menuFile ? formData.menuFile.name : 'PDF veya fotoğraf yükleyin'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">veya sürükleyip bırakın</p>
                </label>
              </div>
            )}

            {formData.menuSource === 'manual' && (
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Menünüzü kaydolduktan sonra manuel olarak ekleyebilirsiniz.</p>
              </div>
            )}

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep('menu-source')}
                className="flex-1 py-4 border border-gray-200 rounded-xl font-medium text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-50"
              >
                <ArrowLeft className="w-5 h-5" />
                Geri
              </button>
              <button
                onClick={() => formData.menuSource === 'manual' ? setStep('review') : handleMenuImport()}
                disabled={isLoading || (formData.menuSource !== 'manual' && formData.menuSource !== 'upload' && !formData.menuUrl)}
                className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    İçe Aktarılıyor...
                  </>
                ) : (
                  <>
                    {formData.menuSource === 'manual' ? 'Atla' : 'Menüyü Çek'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 'review' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Önizleme</h2>
              <p className="text-gray-500 mt-2">Bilgilerinizi kontrol edin</p>
            </div>

            {/* Venue Info */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-3">İşletme Bilgileri</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Ad:</span> <span className="font-medium">{formData.name}</span></div>
                <div><span className="text-gray-500">Tip:</span> <span className="font-medium">{venueTypes.find(t => t.id === formData.type)?.label}</span></div>
                <div><span className="text-gray-500">Telefon:</span> <span className="font-medium">{formData.phone}</span></div>
                <div><span className="text-gray-500">E-posta:</span> <span className="font-medium">{formData.email}</span></div>
                <div className="col-span-2"><span className="text-gray-500">Konum:</span> <span className="font-medium">{formData.district}, {formData.city}</span></div>
              </div>
            </div>

            {/* Menu Info */}
            {importedMenu && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3">İçe Aktarılan Menü</h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-medium">
                    ✓ {importedMenu.totalItems} ürün bulundu
                  </div>
                  <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium">
                    {importedMenu.categories.length} kategori
                  </div>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {importedMenu.categories.map((cat: any, i: number) => (
                    <div key={i} className="text-sm">
                      <span className="font-medium text-gray-700">{cat.name}</span>
                      <span className="text-gray-400 ml-2">({cat.items.length} ürün)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep('menu-import')}
                className="flex-1 py-4 border border-gray-200 rounded-xl font-medium text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-50"
              >
                <ArrowLeft className="w-5 h-5" />
                Geri
              </button>
              <button
                onClick={handleComplete}
                disabled={isLoading}
                className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    İşletmemi Oluştur
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Complete */}
        {step === 'complete' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Tebrikler! 🎉</h2>
            <p className="text-gray-500 mb-8">
              <span className="font-semibold text-gray-900">{formData.name}</span> başarıyla oluşturuldu.
            </p>

            {/* QR Code Preview */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-8 inline-block">
              <div className="w-40 h-40 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 border-2 border-gray-200">
                <QrCode className="w-24 h-24 text-gray-800" />
              </div>
              <p className="text-sm text-gray-600">QR Menü kodunuz hazır!</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg"
              >
                Dashboard'a Git
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push('/menu')}
                className="w-full py-4 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
              >
                Menüyü Düzenle
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
