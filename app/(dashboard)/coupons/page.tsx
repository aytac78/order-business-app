'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import {
  Plus, X, Edit2, Trash2, AlertCircle, Loader2, RefreshCw,
  Ticket, Percent, DollarSign, Gift, Copy, CheckCircle,
  Calendar, Hash, ToggleLeft, ToggleRight
} from 'lucide-react';

interface Coupon {
  id: string;
  venue_id: string;
  code: string;
  name: string;
  type: 'percentage' | 'fixed' | 'free_item';
  value: number;
  min_order_amount?: number;
  max_uses?: number;
  used_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
}

export default function CouponsPage() {
  const { currentVenue } = useVenueStore();
  const t = useTranslations('coupons');
  const tCommon = useTranslations('common');

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Type config
  const typeConfig = {
    percentage: { label: t('percentage'), icon: Percent, color: 'bg-blue-500' },
    fixed: { label: t('fixedAmount'), icon: DollarSign, color: 'bg-green-500' },
    free_item: { label: t('freeItem'), icon: Gift, color: 'bg-purple-500' },
  };

  const loadCoupons = useCallback(async () => {
    if (!currentVenue?.id) return;

    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .order('created_at', { ascending: false });

    if (data) setCoupons(data);
    setLoading(false);
  }, [currentVenue?.id]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const handleSaveCoupon = async (data: Partial<Coupon>) => {
    if (!currentVenue?.id) return;

    if (editingCoupon) {
      await supabase.from('coupons').update(data).eq('id', editingCoupon.id);
    } else {
      await supabase.from('coupons').insert({
        ...data,
        venue_id: currentVenue.id,
        used_count: 0,
        is_active: true
      });
    }

    setShowModal(false);
    setEditingCoupon(null);
    loadCoupons();
  };

  const handleToggleActive = async (coupon: Coupon) => {
    await supabase.from('coupons').update({ is_active: !coupon.is_active }).eq('id', coupon.id);
    loadCoupons();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(tCommon('confirmDelete'))) return;
    await supabase.from('coupons').delete().eq('id', id);
    loadCoupons();
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isExpired = (date: string) => new Date(date) < new Date();
  const isNotStarted = (date: string) => new Date(date) > new Date();

  // Stats
  const stats = {
    total: coupons.length,
    active: coupons.filter(c => c.is_active && !isExpired(c.valid_until)).length,
    expired: coupons.filter(c => isExpired(c.valid_until)).length,
    totalUsed: coupons.reduce((sum, c) => sum + c.used_count, 0),
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
          <p className="text-gray-400">{coupons.length} {tCommon('items')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadCoupons}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {tCommon('refresh')}
          </button>
          <button
            onClick={() => { setEditingCoupon(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('addCoupon')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">{tCommon('total')}</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
          <p className="text-green-400 text-sm">{t('active')}</p>
          <p className="text-2xl font-bold text-white">{stats.active}</p>
        </div>
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
          <p className="text-red-400 text-sm">Süresi Dolmuş</p>
          <p className="text-2xl font-bold text-white">{stats.expired}</p>
        </div>
        <div className="bg-purple-500/20 border border-purple-500/50 rounded-xl p-4">
          <p className="text-purple-400 text-sm">{t('usedCount')}</p>
          <p className="text-2xl font-bold text-white">{stats.totalUsed}</p>
        </div>
      </div>

      {/* Coupons Grid */}
      {coupons.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/50 rounded-xl">
          <Ticket className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">{t('noCoupons')}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map(coupon => {
            const typeInfo = typeConfig[coupon.type];
            const TypeIcon = typeInfo.icon;
            const expired = isExpired(coupon.valid_until);
            const notStarted = isNotStarted(coupon.valid_from);

            return (
              <div
                key={coupon.id}
                className={`bg-gray-800 rounded-xl overflow-hidden border ${
                  expired ? 'border-red-500/50 opacity-60' : 
                  !coupon.is_active ? 'border-gray-700 opacity-60' : 
                  'border-gray-700'
                }`}
              >
                {/* Header */}
                <div className={`${typeInfo.color} px-4 py-3 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <TypeIcon className="w-5 h-5 text-white" />
                    <span className="font-medium text-white">{typeInfo.label}</span>
                  </div>
                  <button
                    onClick={() => handleToggleActive(coupon)}
                    className="p-1 bg-white/20 rounded-lg"
                  >
                    {coupon.is_active ? 
                      <ToggleRight className="w-5 h-5 text-white" /> : 
                      <ToggleLeft className="w-5 h-5 text-white/60" />
                    }
                  </button>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-white">{coupon.name}</h3>
                    <span className="text-2xl font-bold text-orange-400">
                      {coupon.type === 'percentage' ? `%${coupon.value}` : 
                       coupon.type === 'fixed' ? `₺${coupon.value}` : 'Hediye'}
                    </span>
                  </div>

                  {/* Code */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 px-3 py-2 bg-gray-700 rounded-lg font-mono text-white">
                      {coupon.code}
                    </div>
                    <button
                      onClick={() => handleCopyCode(coupon.code)}
                      className={`p-2 rounded-lg transition-colors ${
                        copiedCode === coupon.code 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-400'
                      }`}
                    >
                      {copiedCode === coupon.code ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm text-gray-400 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(coupon.valid_from).toLocaleDateString()} - {new Date(coupon.valid_until).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4" />
                      <span>{t('usedCount')}: {coupon.used_count}{coupon.max_uses ? `/${coupon.max_uses}` : ''}</span>
                    </div>
                    {coupon.min_order_amount && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span>{t('minOrder')}: ₺{coupon.min_order_amount}</span>
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  {expired && (
                    <div className="text-xs text-red-400 mb-3">⚠️ Süresi dolmuş</div>
                  )}
                  {notStarted && (
                    <div className="text-xs text-amber-400 mb-3">⏳ Henüz başlamadı</div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingCoupon(coupon); setShowModal(true); }}
                      className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm flex items-center justify-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      {tCommon('edit')}
                    </button>
                    <button
                      onClick={() => handleDelete(coupon.id)}
                      className="py-2 px-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Coupon Modal */}
      {showModal && (
        <CouponModal
          coupon={editingCoupon}
          t={t}
          tCommon={tCommon}
          onClose={() => { setShowModal(false); setEditingCoupon(null); }}
          onSave={handleSaveCoupon}
        />
      )}
    </div>
  );
}

// Coupon Modal
function CouponModal({
  coupon, t, tCommon, onClose, onSave
}: {
  coupon: Coupon | null;
  t: any;
  tCommon: any;
  onClose: () => void;
  onSave: (data: Partial<Coupon>) => void;
}) {
  const [code, setCode] = useState(coupon?.code || '');
  const [name, setName] = useState(coupon?.name || '');
  const [type, setType] = useState<Coupon['type']>(coupon?.type || 'percentage');
  const [value, setValue] = useState(coupon?.value?.toString() || '10');
  const [minOrderAmount, setMinOrderAmount] = useState(coupon?.min_order_amount?.toString() || '');
  const [maxUses, setMaxUses] = useState(coupon?.max_uses?.toString() || '');
  const [validFrom, setValidFrom] = useState(coupon?.valid_from?.split('T')[0] || new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(coupon?.valid_until?.split('T')[0] || '');

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(result);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      code: code.toUpperCase(),
      name,
      type,
      value: parseFloat(value),
      min_order_amount: minOrderAmount ? parseFloat(minOrderAmount) : undefined,
      max_uses: maxUses ? parseInt(maxUses) : undefined,
      valid_from: validFrom,
      valid_until: validUntil
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800">
          <h2 className="text-xl font-bold text-white">
            {coupon ? t('editCoupon') : t('addCoupon')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t('couponCode')}</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white font-mono"
                maxLength={12}
                required
              />
              <button
                type="button"
                onClick={generateCode}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl"
              >
                Oluştur
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t('couponName')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t('couponType')}</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Coupon['type'])}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
            >
              <option value="percentage">{t('percentage')}</option>
              <option value="fixed">{t('fixedAmount')}</option>
              <option value="free_item">{t('freeItem')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {t('value')} {type === 'percentage' ? '(%)' : type === 'fixed' ? '(₺)' : ''}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              min="0"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('minOrder')} (₺)</label>
              <input
                type="number"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                min="0"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('maxUses')}</label>
              <input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                min="1"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('validFrom')}</label>
              <input
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('validUntil')}</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
                required
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-600"
            >
              {tCommon('cancel')}
            </button>
            <button
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
