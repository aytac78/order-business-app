'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import {
  Plus, X, Edit2, Trash2, AlertCircle, Loader2, RefreshCw,
  User, Phone, Mail, Key, Shield, CheckCircle, XCircle,
  Search, ChefHat, Utensils, CreditCard, Users
} from 'lucide-react';

interface Staff {
  id: string;
  venue_id: string;
  name: string;
  role: 'owner' | 'manager' | 'cashier' | 'waiter' | 'kitchen' | 'reception';
  phone?: string;
  email?: string;
  hourly_rate?: number;
  pin_code?: string;
  is_active: boolean;
  created_at: string;
}

export default function StaffPage() {
  const { currentVenue } = useVenueStore();
  const t = useTranslations('staff');
  const tCommon = useTranslations('common');

  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // Role config
  const roleConfig = {
    owner: { label: t('owner'), color: 'bg-purple-500', icon: Shield },
    manager: { label: t('manager'), color: 'bg-blue-500', icon: Users },
    cashier: { label: t('cashier'), color: 'bg-green-500', icon: CreditCard },
    waiter: { label: t('waiterRole'), color: 'bg-orange-500', icon: Utensils },
    kitchen: { label: t('kitchenRole'), color: 'bg-red-500', icon: ChefHat },
    reception: { label: t('receptionRole'), color: 'bg-cyan-500', icon: User },
  };

  const loadStaff = useCallback(async () => {
    if (!currentVenue?.id) return;

    const { data } = await supabase
      .from('staff')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .order('name');

    if (data) setStaff(data);
    setLoading(false);
  }, [currentVenue?.id]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  // Filter staff
  const filteredStaff = staff.filter(s => {
    const matchesSearch = !searchQuery || 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone?.includes(searchQuery);
    const matchesRole = filterRole === 'all' || s.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Stats
  const stats = {
    total: staff.length,
    active: staff.filter(s => s.is_active).length,
    inactive: staff.filter(s => !s.is_active).length,
  };

  const handleSaveStaff = async (data: Partial<Staff>) => {
    if (!currentVenue?.id) return;

    if (editingStaff) {
      await supabase.from('staff').update(data).eq('id', editingStaff.id);
    } else {
      await supabase.from('staff').insert({
        ...data,
        venue_id: currentVenue.id,
        is_active: true
      });
    }

    setShowModal(false);
    setEditingStaff(null);
    loadStaff();
  };

  const handleToggleActive = async (staffMember: Staff) => {
    await supabase.from('staff').update({ is_active: !staffMember.is_active }).eq('id', staffMember.id);
    loadStaff();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(tCommon('confirmDelete'))) return;
    await supabase.from('staff').delete().eq('id', id);
    loadStaff();
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="text-gray-400">{staff.length} {tCommon('items')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button"
            onClick={loadStaff}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {tCommon('refresh')}
          </button>
          <button type="button"
            onClick={() => { setEditingStaff(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('addStaff')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">{tCommon('total')}</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
          <p className="text-green-400 text-sm">{t('active')}</p>
          <p className="text-2xl font-bold text-white">{stats.active}</p>
        </div>
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
          <p className="text-red-400 text-sm">{t('inactive')}</p>
          <p className="text-2xl font-bold text-white">{stats.inactive}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`${tCommon('search')}...`}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white"
        >
          <option value="all">{tCommon('all')} {t('role')}</option>
          {Object.entries(roleConfig).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
      </div>

      {/* Staff Grid */}
      {filteredStaff.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/50 rounded-xl">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">{t('noStaff')}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map(staffMember => {
            const role = roleConfig[staffMember.role];
            const RoleIcon = role.icon;

            return (
              <div
                key={staffMember.id}
                className={`bg-gray-800 rounded-xl p-4 border border-gray-700 ${
                  !staffMember.is_active ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${role.color} rounded-xl flex items-center justify-center`}>
                      <RoleIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{staffMember.name}</h3>
                      <span className={`text-xs px-2 py-0.5 ${role.color} text-white rounded-full`}>
                        {role.label}
                      </span>
                    </div>
                  </div>
                  <button type="button"
                    onClick={() => handleToggleActive(staffMember)}
                    className={`p-1.5 rounded-lg ${
                      staffMember.is_active 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {staffMember.is_active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  {staffMember.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Phone className="w-4 h-4" />
                      <span>{staffMember.phone}</span>
                    </div>
                  )}
                  {staffMember.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Mail className="w-4 h-4" />
                      <span>{staffMember.email}</span>
                    </div>
                  )}
                  {staffMember.hourly_rate && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <CreditCard className="w-4 h-4" />
                      <span>₺{staffMember.hourly_rate}/{t('hourlyRate').split(' ')[0]}</span>
                    </div>
                  )}
                  {staffMember.pin_code && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Key className="w-4 h-4" />
                      <span>PIN: ****</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button type="button"
                    onClick={() => { setEditingStaff(staffMember); setShowModal(true); }}
                    className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm flex items-center justify-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    {tCommon('edit')}
                  </button>
                  <button type="button"
                    onClick={() => handleDelete(staffMember.id)}
                    className="py-2 px-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Staff Modal */}
      {showModal && (
        <StaffModal
          staff={editingStaff}
          roleConfig={roleConfig}
          t={t}
          tCommon={tCommon}
          onClose={() => { setShowModal(false); setEditingStaff(null); }}
          onSave={handleSaveStaff}
        />
      )}
    </div>
  );
}

// Staff Modal
function StaffModal({
  staff, roleConfig, t, tCommon, onClose, onSave
}: {
  staff: Staff | null;
  roleConfig: any;
  t: any;
  tCommon: any;
  onClose: () => void;
  onSave: (data: Partial<Staff>) => void;
}) {
  const [name, setName] = useState(staff?.name || '');
  const [role, setRole] = useState<Staff['role']>(staff?.role || 'waiter');
  const [phone, setPhone] = useState(staff?.phone || '');
  const [email, setEmail] = useState(staff?.email || '');
  const [hourlyRate, setHourlyRate] = useState(staff?.hourly_rate?.toString() || '');
  const [pinCode, setPinCode] = useState(staff?.pin_code || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      role,
      phone: phone || undefined,
      email: email || undefined,
      hourly_rate: hourlyRate ? parseFloat(hourlyRate) : undefined,
      pin_code: pinCode || undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800">
          <h2 className="text-xl font-bold text-white">
            {staff ? t('editStaff') : t('addStaff')}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t('staffName')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t('role')}</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Staff['role'])}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
            >
              {Object.entries(roleConfig).map(([key, config]: [string, any]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('phone')}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('hourlyRate')} (₺)</label>
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('pinCode')}</label>
              <input
                type="password"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                maxLength={6}
                placeholder="••••••"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button"
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-600"
            >
              {tCommon('cancel')}
            </button>
            <button type="button"
              type="submit"
              className="flex-1 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600"
            >
              {tCommon('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}