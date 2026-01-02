'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import {
  Plus, X, Edit2, Trash2, AlertCircle, Loader2, RefreshCw,
  Users, Star, Phone, Mail, Calendar, DollarSign, Search,
  Crown, Tag
} from 'lucide-react';

interface Customer {
  id: string;
  venue_id: string;
  name: string;
  phone: string;
  email?: string;
  total_visits: number;
  total_spent: number;
  last_visit?: string;
  tags?: string[];
  notes?: string;
  is_vip: boolean;
  created_at: string;
}

export default function CRMPage() {
  const { currentVenue } = useVenueStore();
  const t = useTranslations('crm');
  const tCommon = useTranslations('common');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVip, setFilterVip] = useState<boolean | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const loadCustomers = useCallback(async () => {
    if (!currentVenue?.id) return;

    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .order('total_spent', { ascending: false });

    if (data) setCustomers(data);
    setLoading(false);
  }, [currentVenue?.id]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleSaveCustomer = async (data: Partial<Customer>) => {
    if (!currentVenue?.id) return;

    if (editingCustomer) {
      await supabase.from('customers').update(data).eq('id', editingCustomer.id);
    } else {
      await supabase.from('customers').insert({
        ...data,
        venue_id: currentVenue.id,
        total_visits: 0,
        total_spent: 0
      });
    }

    setShowModal(false);
    setEditingCustomer(null);
    loadCustomers();
  };

  const handleToggleVip = async (customer: Customer) => {
    await supabase.from('customers').update({ is_vip: !customer.is_vip }).eq('id', customer.id);
    loadCustomers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(tCommon('confirmDelete'))) return;
    await supabase.from('customers').delete().eq('id', id);
    loadCustomers();
  };

  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = searchQuery === '' || 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVip = filterVip === null || customer.is_vip === filterVip;
    return matchesSearch && matchesVip;
  });

  // Stats
  const stats = {
    total: customers.length,
    vip: customers.filter(c => c.is_vip).length,
    totalSpent: customers.reduce((sum, c) => sum + c.total_spent, 0),
    avgSpent: customers.length > 0 ? customers.reduce((sum, c) => sum + c.total_spent, 0) / customers.length : 0
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
          <p className="text-gray-400">{customers.length} {t('customers')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button"
            onClick={loadCustomers}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {tCommon('refresh')}
          </button>
          <button type="button"
            onClick={() => { setEditingCustomer(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('addCustomer')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <Users className="w-10 h-10 text-blue-400 bg-blue-400/20 rounded-xl p-2" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-sm text-gray-400">{t('customers')}</p>
            </div>
          </div>
        </div>
        <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Crown className="w-10 h-10 text-amber-400 bg-amber-400/20 rounded-xl p-2" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.vip}</p>
              <p className="text-sm text-amber-400">VIP</p>
            </div>
          </div>
        </div>
        <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-10 h-10 text-green-400 bg-green-400/20 rounded-xl p-2" />
            <div>
              <p className="text-2xl font-bold text-white">₺{stats.totalSpent.toLocaleString()}</p>
              <p className="text-sm text-green-400">{t('totalSpent')}</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-500/20 border border-purple-500/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Star className="w-10 h-10 text-purple-400 bg-purple-400/20 rounded-xl p-2" />
            <div>
              <p className="text-2xl font-bold text-white">₺{stats.avgSpent.toFixed(0)}</p>
              <p className="text-sm text-purple-400">Ort. Harcama</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={`${tCommon('search')}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white"
          />
        </div>
        <div className="flex gap-2">
          <button type="button"
            onClick={() => setFilterVip(null)}
            className={`px-4 py-2 rounded-xl transition-colors ${
              filterVip === null ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {tCommon('all')}
          </button>
          <button type="button"
            onClick={() => setFilterVip(true)}
            className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-2 ${
              filterVip === true ? 'bg-amber-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Crown className="w-4 h-4" />
            VIP
          </button>
        </div>
      </div>

      {/* Customers List */}
      {filteredCustomers.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/50 rounded-xl">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">{t('noCustomers')}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map(customer => (
            <div
              key={customer.id}
              className={`bg-gray-800 rounded-xl p-4 border ${
                customer.is_vip ? 'border-amber-500/50' : 'border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    customer.is_vip ? 'bg-amber-500' : 'bg-gray-700'
                  }`}>
                    {customer.is_vip ? (
                      <Crown className="w-6 h-6 text-white" />
                    ) : (
                      <span className="text-xl font-bold text-white">
                        {customer.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">{customer.name}</p>
                    {customer.is_vip && (
                      <span className="text-xs text-amber-400">VIP Müşteri</span>
                    )}
                  </div>
                </div>
                <button type="button"
                  onClick={() => handleToggleVip(customer)}
                  className={`p-2 rounded-lg transition-colors ${
                    customer.is_vip 
                      ? 'bg-amber-500/20 text-amber-400' 
                      : 'bg-gray-700 text-gray-400 hover:text-amber-400'
                  }`}
                >
                  <Star className={`w-4 h-4 ${customer.is_vip ? 'fill-current' : ''}`} />
                </button>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <Phone className="w-4 h-4" />
                  <span>{customer.phone}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
                {customer.last_visit && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{t('lastVisit')}: {new Date(customer.last_visit).toLocaleDateString('tr-TR')}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                <div className="flex gap-4 text-sm">
                  <span className="text-gray-400">
                    {customer.total_visits} {t('totalVisits')}
                  </span>
                  <span className="text-green-400 font-medium">
                    ₺{customer.total_spent.toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button type="button"
                    onClick={() => { setEditingCustomer(customer); setShowModal(true); }}
                    className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button type="button"
                    onClick={() => handleDelete(customer.id)}
                    className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customer Modal */}
      {showModal && (
        <CustomerModal
          customer={editingCustomer}
          t={t}
          tCommon={tCommon}
          onClose={() => { setShowModal(false); setEditingCustomer(null); }}
          onSave={handleSaveCustomer}
        />
      )}
    </div>
  );
}

// Customer Modal
function CustomerModal({
  customer, t, tCommon, onClose, onSave
}: {
  customer: Customer | null;
  t: any;
  tCommon: any;
  onClose: () => void;
  onSave: (data: Partial<Customer>) => void;
}) {
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [notes, setNotes] = useState(customer?.notes || '');
  const [isVip, setIsVip] = useState(customer?.is_vip || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, phone, email: email || undefined, notes: notes || undefined, is_vip: isVip });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {customer ? t('editCustomer') : t('addCustomer')}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t('customerName')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Telefon</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{tCommon('notes')}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isVip}
              onChange={(e) => setIsVip(e.target.checked)}
              className="w-5 h-5 rounded"
            />
            <span className="text-white flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              {t('vipCustomer')}
            </span>
          </label>
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