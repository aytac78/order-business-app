'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import {
  User, Mail, Phone, Camera, Save, Loader2, Shield,
  Globe, Bell, Lock, Eye, EyeOff, CheckCircle, AlertCircle
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  language: string;
  notifications_enabled: boolean;
}

export default function ProfilePage() {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile data
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState('tr');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const loadProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile({
          id: user.id,
          email: user.email || '',
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
          avatar_url: profileData.avatar_url || '',
          language: profileData.language || 'tr',
          notifications_enabled: profileData.notifications_enabled ?? true
        });
        setFullName(profileData.full_name || '');
        setPhone(profileData.phone || '');
        setLanguage(profileData.language || 'tr');
        setNotificationsEnabled(profileData.notifications_enabled ?? true);
      } else {
        // Create profile if not exists
        setProfile({
          id: user.id,
          email: user.email || '',
          full_name: '',
          phone: '',
          avatar_url: '',
          language: 'tr',
          notifications_enabled: true
        });
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    setMessage(null);

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: profile.id,
        full_name: fullName,
        phone,
        language,
        notifications_enabled: notificationsEnabled,
        updated_at: new Date().toISOString()
      });

    if (error) {
      setMessage({ type: 'error', text: t('saveError') });
    } else {
      setMessage({ type: 'success', text: t('saveSuccess') });
      // Update language cookie if changed
      if (language !== profile.language) {
        document.cookie = `NEXT_LOCALE=${language};path=/;max-age=31536000`;
        window.location.reload();
      }
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: t('passwordMismatch') });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: t('passwordTooShort') });
      return;
    }

    setSaving(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: t('passwordChanged') });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setSaving(false);
  };

  const tabs = [
    { id: 'general', label: t('generalInfo'), icon: User },
    { id: 'preferences', label: t('preferences'), icon: Globe },
    { id: 'security', label: t('security'), icon: Shield },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-400">{t('notLoggedIn')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="text-gray-400">{profile.email}</p>
        </div>
        {activeTab !== 'security' && (
          <button type="button"
            type="button"
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white rounded-xl transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {tCommon('save')}
          </button>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button type="button"
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
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
        {/* General Info */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white mb-4">{t('generalInfo')}</h2>

            {/* Avatar */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-3xl font-bold">
                  {fullName ? fullName.charAt(0).toUpperCase() : profile.email.charAt(0).toUpperCase()}
                </div>
                <button type="button"
                  type="button"
                  className="absolute bottom-0 right-0 p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
              </div>
              <div>
                <p className="text-white font-medium">{t('profilePhoto')}</p>
                <p className="text-sm text-gray-400">{t('photoHint')}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  <User className="w-4 h-4 inline mr-2" />
                  {t('fullName')}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
                  placeholder={t('fullNamePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  <Mail className="w-4 h-4 inline mr-2" />
                  {t('email')}
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-4 py-2 bg-gray-600 border border-gray-600 rounded-xl text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">{t('emailCannotChange')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  <Phone className="w-4 h-4 inline mr-2" />
                  {t('phone')}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
                  placeholder="+90 555 123 4567"
                />
              </div>
            </div>
          </div>
        )}

        {/* Preferences */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white mb-4">{t('preferences')}</h2>

            <div className="space-y-4">
              <div className="p-4 bg-gray-700/50 rounded-xl">
                <label className="block font-medium text-white mb-2">
                  <Globe className="w-4 h-4 inline mr-2" />
                  {t('language')}
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
                >
                  <option value="tr">🇹🇷 Türkçe</option>
                  <option value="en">🇬🇧 English</option>
                  <option value="it">🇮🇹 Italiano</option>
                </select>
                <p className="text-xs text-gray-400 mt-2">{t('languageHint')}</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-xl">
                <div>
                  <p className="font-medium text-white">
                    <Bell className="w-4 h-4 inline mr-2" />
                    {t('notifications')}
                  </p>
                  <p className="text-sm text-gray-400">{t('notificationsHint')}</p>
                </div>
                <button type="button"
                  type="button"
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    notificationsEnabled ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    notificationsEnabled ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Security */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white mb-4">{t('changePassword')}</h2>

            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('currentPassword')}</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white pr-10"
                  />
                  <button type="button"
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('newPassword')}</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white pr-10"
                  />
                  <button type="button"
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">{t('passwordRequirements')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('confirmPassword')}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
                />
              </div>

              <button type="button"
                type="button"
                onClick={handleChangePassword}
                disabled={saving || !newPassword || !confirmPassword}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {t('updatePassword')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}