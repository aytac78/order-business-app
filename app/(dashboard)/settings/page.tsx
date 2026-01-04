'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  Save, AlertCircle, Loader2, Building, Clock, CreditCard, Bell,
  QrCode, Trash2, ToggleLeft, ToggleRight, AlertTriangle, X, CheckCircle
} from 'lucide-react';

interface VenueSettings {
  currency?: string;
  timezone?: string;
  working_hours?: {
    [key: string]: { is_open: boolean; open: string; close: string };
  };
  reservation_enabled?: boolean;
  qr_menu_enabled?: boolean;
  online_ordering_enabled?: boolean;
  min_order_amount?: number;
  service_charge_percent?: number;
  tax_rate?: number;
  auto_accept_orders?: boolean;
  notification_sounds?: boolean;
  theme_color?: string;
}

const defaultWorkingHours = {
  monday: { is_open: true, open: '09:00', close: '22:00' },
  tuesday: { is_open: true, open: '09:00', close: '22:00' },
  wednesday: { is_open: true, open: '09:00', close: '22:00' },
  thursday: { is_open: true, open: '09:00', close: '22:00' },
  friday: { is_open: true, open: '09:00', close: '23:00' },
  saturday: { is_open: true, open: '09:00', close: '23:00' },
  sunday: { is_open: true, open: '10:00', close: '22:00' },
};

export default function SettingsPage() {
  const router = useRouter();
  const { currentVenue, setCurrentVenue, venues, setVenues } = useVenueStore();
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [activeTab, setActiveTab] = useState('general');

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState('TRY');
  const [timezone, setTimezone] = useState('Europe/Istanbul');

  // Settings
  const [settings, setSettings] = useState<VenueSettings>({
    working_hours: defaultWorkingHours,
    reservation_enabled: true,
    qr_menu_enabled: true,
    online_ordering_enabled: true,
    min_order_amount: 0,
    service_charge_percent: 0,
    tax_rate: 8,
    auto_accept_orders: false,
    notification_sounds: true,
    theme_color: '#f97316',
  });

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const dayNames: Record<string, string> = {
    monday: t('monday'),
    tuesday: t('tuesday'),
    wednesday: t('wednesday'),
    thursday: t('thursday'),
    friday: t('friday'),
    saturday: t('saturday'),
    sunday: t('sunday'),
  };

  const loadVenue = useCallback(async () => {
    if (!currentVenue?.id) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('venues')
      .select('*')
      .eq('id', currentVenue.id)
      .single();

    if (data) {
      setName(data.name || '');
      setPhone(data.phone || '');
      setEmail(data.email || '');
      setAddress(data.address || '');
      
      // Settings içinden currency ve timezone al
      const venueSettings = data.settings || {};
      setCurrency(venueSettings.currency || 'TRY');
      setTimezone(venueSettings.timezone || 'Europe/Istanbul');
      
      setSettings({
        working_hours: venueSettings.working_hours || defaultWorkingHours,
        reservation_enabled: venueSettings.reservation_enabled ?? true,
        qr_menu_enabled: venueSettings.qr_menu_enabled ?? true,
        online_ordering_enabled: venueSettings.online_ordering_enabled ?? true,
        min_order_amount: venueSettings.min_order_amount || 0,
        service_charge_percent: venueSettings.service_charge_percent || 0,
        tax_rate: venueSettings.tax_rate || 8,
        auto_accept_orders: venueSettings.auto_accept_orders ?? false,
        notification_sounds: venueSettings.notification_sounds ?? true,
        theme_color: venueSettings.theme_color || '#f97316',
      });
    }
    setLoading(false);
  }, [currentVenue?.id]);

  useEffect(() => {
    loadVenue();
  }, [loadVenue]);

  const handleSave = async () => {
    if (!currentVenue?.id) return;
    setSaving(true);
    setSaveMessage(null);

    // Settings içine currency ve timezone ekle
    const updatedSettings = {
      ...settings,
      currency,
      timezone,
    };

    const { data, error } = await supabase
      .from('venues')
      .update({
        name,
        phone,
        email,
        address,
        settings: updatedSettings,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentVenue.id)
      .select()
      .single();

    if (error) {
      console.error('Save error:', error);
      setSaveMessage({ type: 'error', text: 'Kaydetme hatası: ' + error.message });
    } else if (data) {
      setCurrentVenue({ ...currentVenue, ...data });
      setSaveMessage({ type: 'success', text: 'Ayarlar başarıyla kaydedildi!' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
    
    setSaving(false);
  };

  const handleDeleteVenue = async () => {
    if (!currentVenue?.id || deleteConfirmText !== currentVenue.name) return;
    
    setDeleting(true);

    // Delete related data first (ignore errors for tables that might not exist)
    await supabase.from('orders').delete().eq('venue_id', currentVenue.id);
    await supabase.from('tables').delete().eq('venue_id', currentVenue.id);
    await supabase.from('products').delete().eq('venue_id', currentVenue.id);
    await supabase.from('categories').delete().eq('venue_id', currentVenue.id);
    await supabase.from('reservations').delete().eq('venue_id', currentVenue.id);
    await supabase.from('staff').delete().eq('venue_id', currentVenue.id);

    // Delete venue
    const { error } = await supabase
      .from('venues')
      .delete()
      .eq('id', currentVenue.id);

    if (!error) {
      const remainingVenues = venues.filter(v => v.id !== currentVenue.id);
      setVenues(remainingVenues);
      
      if (remainingVenues.length > 0) {
        setCurrentVenue(remainingVenues[0]);
      } else {
        setCurrentVenue(null);
      }
      
      router.push('/dashboard');
    }

    setDeleting(false);
    setShowDeleteModal(false);
  };

  const updateWorkingHours = (day: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      working_hours: {
        ...(prev.working_hours || defaultWorkingHours),
        [day]: {
          ...(prev.working_hours?.[day] || defaultWorkingHours.monday),
          [field]: value
        }
      }
    }));
  };

  const tabs = [
    { id: 'general', label: t('general'), icon: Building },
    { id: 'hours', label: t('workingHours'), icon: Clock },
    { id: 'ordering', label: t('orderSettings'), icon: QrCode },
    { id: 'payment', label: t('paymentSettings'), icon: CreditCard },
    { id: 'notifications', label: t('notifications'), icon: Bell },
    { id: 'danger', label: t('dangerZone'), icon: AlertTriangle, danger: true },
  ];

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-gray-400">{tCommon('selectVenue')}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const workingHours = settings.working_hours || defaultWorkingHours;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="text-gray-400">{currentVenue.name}</p>
        </div>
        {activeTab !== 'danger' && (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white rounded-xl transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {tCommon('save')}
          </button>
        )}
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          saveMessage.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {saveMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {saveMessage.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? tab.danger ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'
                  : tab.danger ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white mb-4">{t('general')}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('venueName')}</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('phone')}</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('email')}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('currency')}</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white">
                  <option value="TRY">TRY (₺)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('address')}</label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('timezone')}</label>
                <select value={timezone} onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white">
                  <option value="Europe/Istanbul">Europe/Istanbul (UTC+3)</option>
                  <option value="Europe/Rome">Europe/Rome (UTC+1)</option>
                  <option value="Asia/Dubai">Asia/Dubai (UTC+4)</option>
                  <option value="Asia/Tehran">Asia/Tehran (UTC+3:30)</option>
                  <option value="Asia/Jakarta">Asia/Jakarta (UTC+7)</option>
                  <option value="Asia/Bangkok">Asia/Bangkok (UTC+7)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Working Hours */}
        {activeTab === 'hours' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white mb-4">{t('workingHours')}</h2>
            <div className="space-y-4">
              {Object.entries(workingHours).map(([day, hours]) => (
                <div key={day} className="flex items-center gap-4 p-4 bg-gray-700/50 rounded-xl">
                  <div className="w-32">
                    <span className="font-medium text-white">{dayNames[day] || day}</span>
                  </div>
                  <button type="button" onClick={() => updateWorkingHours(day, 'is_open', !hours.is_open)}
                    className={`p-2 rounded-lg ${hours.is_open ? 'bg-green-500' : 'bg-gray-600'}`}>
                    {hours.is_open ? <ToggleRight className="w-5 h-5 text-white" /> : <ToggleLeft className="w-5 h-5 text-white" />}
                  </button>
                  {hours.is_open ? (
                    <>
                      <input type="time" value={hours.open} onChange={(e) => updateWorkingHours(day, 'open', e.target.value)}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
                      <span className="text-gray-400">-</span>
                      <input type="time" value={hours.close} onChange={(e) => updateWorkingHours(day, 'close', e.target.value)}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
                    </>
                  ) : (
                    <span className="text-gray-500">{t('closed')}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ordering Settings */}
        {activeTab === 'ordering' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white mb-4">{t('orderSettings')}</h2>
            <div className="space-y-4">
              {[
                { key: 'qr_menu_enabled', label: t('qrMenuEnabled'), desc: t('qrMenuDescription') },
                { key: 'online_ordering_enabled', label: t('onlineOrderingEnabled'), desc: t('onlineOrderingDescription') },
                { key: 'reservation_enabled', label: t('reservationsEnabled'), desc: t('reservationsDescription') },
                { key: 'auto_accept_orders', label: t('autoAcceptOrders'), desc: t('autoAcceptDescription') },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-xl">
                  <div>
                    <p className="font-medium text-white">{item.label}</p>
                    <p className="text-sm text-gray-400">{item.desc}</p>
                  </div>
                  <button type="button"
                    onClick={() => setSettings(prev => ({ ...prev, [item.key]: !prev[item.key as keyof VenueSettings] }))}
                    className={`p-2 rounded-lg ${settings[item.key as keyof VenueSettings] ? 'bg-green-500' : 'bg-gray-600'}`}>
                    {settings[item.key as keyof VenueSettings] ? <ToggleRight className="w-6 h-6 text-white" /> : <ToggleLeft className="w-6 h-6 text-white" />}
                  </button>
                </div>
              ))}
              <div className="p-4 bg-gray-700/50 rounded-xl">
                <label className="block font-medium text-white mb-2">{t('minOrderAmount')}</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={settings.min_order_amount || 0}
                    onChange={(e) => setSettings(prev => ({ ...prev, min_order_amount: parseFloat(e.target.value) || 0 }))}
                    min="0" className="w-32 px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white" />
                  <span className="text-gray-400">₺</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Settings */}
        {activeTab === 'payment' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white mb-4">{t('paymentSettings')}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-700/50 rounded-xl">
                <label className="block font-medium text-white mb-2">{t('taxRate')}</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={settings.tax_rate || 0}
                    onChange={(e) => setSettings(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
                    min="0" max="100" className="w-24 px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white" />
                  <span className="text-gray-400">%</span>
                </div>
              </div>
              <div className="p-4 bg-gray-700/50 rounded-xl">
                <label className="block font-medium text-white mb-2">{t('serviceCharge')}</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={settings.service_charge_percent || 0}
                    onChange={(e) => setSettings(prev => ({ ...prev, service_charge_percent: parseFloat(e.target.value) || 0 }))}
                    min="0" max="100" className="w-24 px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white" />
                  <span className="text-gray-400">%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white mb-4">{t('notifications')}</h2>
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-xl">
              <div>
                <p className="font-medium text-white">{t('notificationSounds')}</p>
                <p className="text-sm text-gray-400">{t('notificationSoundsDescription')}</p>
              </div>
              <button type="button"
                onClick={() => setSettings(prev => ({ ...prev, notification_sounds: !prev.notification_sounds }))}
                className={`p-2 rounded-lg ${settings.notification_sounds ? 'bg-green-500' : 'bg-gray-600'}`}>
                {settings.notification_sounds ? <ToggleRight className="w-6 h-6 text-white" /> : <ToggleLeft className="w-6 h-6 text-white" />}
              </button>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        {activeTab === 'danger' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-lg font-semibold">{t('dangerZone')}</h2>
            </div>
            <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl">
              <h3 className="text-lg font-medium text-white mb-2">{t('deleteVenue')}</h3>
              <p className="text-gray-400 mb-4">{t('deleteVenueWarning')}</p>
              <ul className="text-sm text-gray-400 mb-6 space-y-1">
                <li>• {t('deleteWarning1')}</li>
                <li>• {t('deleteWarning2')}</li>
                <li>• {t('deleteWarning3')}</li>
                <li>• {t('deleteWarning4')}</li>
              </ul>
              <button type="button" onClick={() => setShowDeleteModal(true)}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium flex items-center gap-2 transition-colors">
                <Trash2 className="w-5 h-5" />
                {t('deleteVenueButton')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3 text-red-500">
                <AlertTriangle className="w-6 h-6" />
                <h2 className="text-xl font-bold">{t('confirmDelete')}</h2>
              </div>
              <button type="button" onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-300">{t('deleteConfirmMessage')}</p>
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-sm text-gray-400 mb-2">{t('typeToConfirm')}</p>
                <p className="text-white font-mono font-bold mb-3">{currentVenue.name}</p>
                <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={t('typeVenueName')} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors">
                  {tCommon('cancel')}
                </button>
                <button type="button" onClick={handleDeleteVenue}
                  disabled={deleteConfirmText !== currentVenue.name || deleting}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
                  {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                  {t('permanentlyDelete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
