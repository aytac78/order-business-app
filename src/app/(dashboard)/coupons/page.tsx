'use client';

import { useState } from 'react';
import { useCoupons } from '@/hooks/useSupabase';
import { useVenueStore } from '@/stores';
import { Ticket, RefreshCw, Plus, AlertCircle, Percent, Gift } from 'lucide-react';

export default function CouponsPage() {
  const { coupons, isLoading, fetchCoupons } = useCoupons();
  const { currentVenue } = useVenueStore();

  const activeCoupons = coupons.filter(c => c.is_active);

  if (!currentVenue) {
    return <div className="flex items-center justify-center h-96"><AlertCircle className="w-12 h-12 text-gray-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kuponlar</h1>
          <p className="text-gray-500 mt-1">{currentVenue.name} • {coupons.length} kupon</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => fetchCoupons()} className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Yenile
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg">
            <Plus className="w-4 h-4" /> Kupon Oluştur
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">Toplam Kupon</p>
          <p className="text-3xl font-bold text-gray-900">{coupons.length}</p>
        </div>
        <div className="bg-green-50 border-green-200 border rounded-xl p-4">
          <p className="text-sm text-green-700">Aktif Kupon</p>
          <p className="text-3xl font-bold text-green-700">{activeCoupons.length}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((coupon) => (
            <div key={coupon.id} className={`rounded-xl border-2 p-4 ${coupon.is_active ? 'bg-white border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {coupon.type === 'percentage' ? <Percent className="w-5 h-5 text-orange-500" /> : <Gift className="w-5 h-5 text-purple-500" />}
                  <span className="font-mono font-bold text-lg">{coupon.code}</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${coupon.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {coupon.is_active ? 'Aktif' : 'Pasif'}
                </span>
              </div>
              <p className="text-gray-600 mb-2">{coupon.name || coupon.description}</p>
              <div className="text-2xl font-bold text-orange-600 mb-3">
                {coupon.type === 'percentage' ? `%${coupon.value}` : `₺${coupon.value}`} İndirim
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                {coupon.min_order_amount && <p>Min. sipariş: ₺{coupon.min_order_amount}</p>}
                <p>Kullanım: {coupon.used_count || 0} / {coupon.max_uses || '∞'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && coupons.length === 0 && (
        <div className="text-center py-12">
          <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Kupon bulunamadı</p>
        </div>
      )}
    </div>
  );
}
