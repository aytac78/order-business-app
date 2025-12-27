'use client';

import { useState, useEffect } from 'react';
import { useVenueStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import {
  Settings,
  LayoutDashboard,
  Grid3X3,
  ClipboardList,
  UtensilsCrossed,
  ChefHat,
  Users,
  CreditCard,
  CalendarCheck,
  Package,
  Save,
  CheckCircle,
  AlertCircle,
  Building2,
  Bell,
  ToggleLeft,
  ToggleRight,
  Info
} from 'lucide-react';

// Panel tanımları
const PANELS = [
  { 
    id: 'dashboard', 
    name: 'Dashboard', 
    description: 'Genel bakış ve istatistikler',
    icon: LayoutDashboard,
    required: true
  },
  { 
    id: 'tables', 
    name: 'Masalar', 
    description: 'Masa yönetimi ve oturma düzeni',
    icon: Grid3X3,
    recommended: ['restaurant', 'cafe', 'bar', 'beach_club']
  },
  { 
    id: 'orders', 
    name: 'Siparişler', 
    description: 'Sipariş listesi ve takibi',
    icon: ClipboardList,
    required: true
  },
  { 
    id: 'waiter', 
    name: 'Garson Paneli', 
    description: 'Garsonlar için sipariş alma ekranı',
    icon: UtensilsCrossed,
    recommended: ['restaurant', 'beach_club']
  },
  { 
    id: 'kitchen', 
    name: 'Mutfak', 
    description: 'Mutfak siparişleri ve hazırlık takibi',
    icon: ChefHat,
    recommended: ['restaurant', 'cafe', 'beach_club']
  },
  { 
    id: 'reception', 
    name: 'Resepsiyon', 
    description: 'Rezervasyonlar ve müşteri karşılama',
    icon: Users,
    recommended: ['restaurant', 'beach_club', 'hotel_restaurant']
  },
  { 
    id: 'pos', 
    name: 'Kasa / POS', 
    description: 'Ödeme alma ve hesap kapatma',
    icon: CreditCard,
    required: true
  },
  { 
    id: 'stock', 
    name: 'Stok Yönetimi', 
    description: 'Stok takibi ve envanter yönetimi',
    icon: Package,
    recommended: ['restaurant', 'cafe', 'bar', 'beach_club']
  },
  { 
    id: 'reservations', 
    name: 'Rezervasyonlar', 
    description: 'Rezervasyon yönetimi',
    icon: CalendarCheck,
    recommended: ['restaurant', 'beach_club', 'hotel_restaurant']
  },
];

// İşletme tipi presetleri
const VENUE_PRESETS: Record<string, { name: string; panels: string[] }> = {
  coffee_shop: {
    name: '☕ Kahve Dükkanı / Takeaway',
    panels: ['dashboard', 'orders', 'pos']
  },
  fast_food: {
    name: '🍔 Fast Food / Quick Service',
    panels: ['dashboard', 'orders', 'kitchen', 'pos']
  },
  restaurant: {
    name: '🍽️ Restaurant',
    panels: ['dashboard', 'tables', 'orders', 'waiter', 'kitchen', 'pos', 'stock', 'reservations']
  },
  cafe: {
    name: '🥐 Kafe',
    panels: ['dashboard', 'tables', 'orders', 'kitchen', 'pos', 'stock']
  },
  bar: {
    name: '🍺 Bar / Pub',
    panels: ['dashboard', 'tables', 'orders', 'pos', 'stock']
  },
  beach_club: {
    name: '🏖️ Beach Club / Fine Dining',
    panels: ['dashboard', 'tables', 'orders', 'waiter', 'kitchen', 'reception', 'pos', 'stock', 'reservations']
  },
  custom: {
    name: '⚙️ Özel Ayarlar',
    panels: []
  }
};

interface PanelSettings {
  dashboard: boolean;
  tables: boolean;
  orders: boolean;
  waiter: boolean;
  kitchen: boolean;
  reception: boolean;
  pos: boolean;
  stock: boolean;
  reservations: boolean;
}

const defaultPanels: PanelSettings = {
  dashboard: true,
  tables: true,
  orders: true,
  waiter: true,
  kitchen: true,
  reception: true,
  pos: true,
  stock: true,
  reservations: true
};

export default function SettingsPage() {
  const { currentVenue } = useVenueStore();
  const [activeTab, setActiveTab] = useState<'panels' | 'general' | 'notifications'>('panels');
  const [panels, setPanels] = useState<PanelSettings>(defaultPanels);
  const [selectedPreset, setSelectedPreset] = useState<string>('custom');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    if (currentVenue?.id) {
      const saved = localStorage.getItem(`venue_panels_${currentVenue.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setPanels({ ...defaultPanels, ...parsed.panels });
          setSelectedPreset(parsed.preset || 'custom');
        } catch {
          // ignore
        }
      }
    }
  }, [currentVenue?.id]);

  // Apply preset
  const applyPreset = (presetKey: string) => {
    setSelectedPreset(presetKey);
    
    if (presetKey === 'custom') return;
    
    const preset = VENUE_PRESETS[presetKey];
    if (!preset) return;

    const newPanels: PanelSettings = {
      dashboard: true,
      tables: preset.panels.includes('tables'),
      orders: true,
      waiter: preset.panels.includes('waiter'),
      kitchen: preset.panels.includes('kitchen'),
      reception: preset.panels.includes('reception'),
      pos: true,
      stock: preset.panels.includes('stock'),
      reservations: preset.panels.includes('reservations')
    };

    setPanels(newPanels);
  };

  // Toggle single panel
  const togglePanel = (panelId: string) => {
    const panel = PANELS.find(p => p.id === panelId);
    if (panel?.required) return;

    setPanels(prev => ({
      ...prev,
      [panelId]: !prev[panelId as keyof PanelSettings]
    }));
    setSelectedPreset('custom');
  };

  // Save settings
  const saveSettings = async () => {
    if (!currentVenue?.id) return;
    
    setIsSaving(true);
    
    // Save to localStorage
    localStorage.setItem(`venue_panels_${currentVenue.id}`, JSON.stringify({
      panels,
      preset: selectedPreset
    }));

    // Broadcast to Sidebar
    window.dispatchEvent(new CustomEvent('panelSettingsChanged', { detail: panels }));

    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-gray-400">Lütfen bir mekan seçin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Ayarlar</h1>
          <p className="text-gray-400">{currentVenue.name} • Sistem ayarları</p>
        </div>
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
            saveSuccess 
              ? 'bg-green-500 text-white' 
              : 'bg-orange-500 hover:bg-orange-600 text-white'
          }`}
        >
          {saveSuccess ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Kaydedildi!
            </>
          ) : (
            <>
              <Save className={`w-5 h-5 ${isSaving ? 'animate-spin' : ''}`} />
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {[
          { id: 'panels', label: 'Panel Yönetimi', icon: Grid3X3 },
          { id: 'general', label: 'Genel', icon: Building2 },
          { id: 'notifications', label: 'Bildirimler', icon: Bell },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-orange-500/20 text-orange-400'
                : 'text-gray-400 hover:bg-gray-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel Management Tab */}
      {activeTab === 'panels' && (
        <div className="space-y-6">
          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-300">Panel Yönetimi</p>
              <p className="text-sm text-blue-400">
                İşletme tipinize göre gereksiz panelleri kapatarak arayüzü sadeleştirebilirsiniz. 
                Kapatılan paneller sidebar'dan kaldırılır.
              </p>
            </div>
          </div>

          {/* Preset Selection */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Hızlı Ayar (İşletme Tipi)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(VENUE_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedPreset === key
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-gray-700 hover:border-gray-600 bg-gray-900'
                  }`}
                >
                  <p className="font-semibold text-white">{preset.name}</p>
                  {key !== 'custom' && (
                    <p className="text-xs text-gray-400 mt-1">
                      {preset.panels.length} panel aktif
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Panel Toggles */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Panel Ayarları
            </h3>
            <div className="space-y-3">
              {PANELS.map(panel => {
                const isEnabled = panels[panel.id as keyof PanelSettings];
                const Icon = panel.icon;

                return (
                  <div
                    key={panel.id}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                      isEnabled 
                        ? 'border-green-500/30 bg-green-500/10' 
                        : 'border-gray-700 bg-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isEnabled ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white">{panel.name}</p>
                          {panel.required && (
                            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                              Zorunlu
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{panel.description}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => togglePanel(panel.id)}
                      disabled={panel.required}
                      className={`p-2 rounded-lg transition-colors ${
                        panel.required ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-700'
                      }`}
                    >
                      {isEnabled ? (
                        <ToggleRight className="w-10 h-10 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-10 h-10 text-gray-500" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Panels Summary */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-sm text-gray-400">
              <span className="font-semibold text-white">Aktif Paneller:</span>{' '}
              {PANELS.filter(p => panels[p.id as keyof PanelSettings]).map(p => p.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <h3 className="font-bold text-white mb-4">Genel Ayarlar</h3>
          <p className="text-gray-400">Yakında eklenecek...</p>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <h3 className="font-bold text-white mb-4">Bildirim Ayarları</h3>
          <p className="text-gray-400">Yakında eklenecek...</p>
        </div>
      )}
    </div>
  );
}