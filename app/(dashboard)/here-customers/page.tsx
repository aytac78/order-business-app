'use client';

import { useState, useEffect } from 'react';
import { useVenueStore } from '@/stores';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import {
  MapPin,
  Users,
  Send,
  Bell,
  Gift,
  Clock,
  TrendingUp,
  Eye,
  MessageSquare,
  Percent,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Smartphone,
  Wifi
} from 'lucide-react';

interface NearbyCustomer {
  id: string;
  name: string;
  avatar?: string;
  distance: number;
  lastVisit?: string;
  totalVisits: number;
  totalSpent: number;
  isVip: boolean;
}

interface Promotion {
  id: string;
  title: string;
  description: string;
  discount: number;
  discountType: 'percent' | 'fixed';
  validUntil: string;
  sentCount: number;
  viewedCount: number;
  redeemedCount: number;
  isActive: boolean;
}

// Demo data
const demoNearbyCustomers: NearbyCustomer[] = [
  { id: '1', name: 'Ahmet Yılmaz', distance: 50, lastVisit: '2 gün önce', totalVisits: 12, totalSpent: 2450, isVip: true },
  { id: '2', name: 'Ayşe Demir', distance: 120, lastVisit: '1 hafta önce', totalVisits: 5, totalSpent: 890, isVip: false },
  { id: '3', name: 'Mehmet Kaya', distance: 200, lastVisit: 'Bugün', totalVisits: 28, totalSpent: 5670, isVip: true },
  { id: '4', name: 'Fatma Çelik', distance: 350, totalVisits: 0, totalSpent: 0, isVip: false },
  { id: '5', name: 'Ali Öztürk', distance: 180, lastVisit: '3 gün önce', totalVisits: 8, totalSpent: 1230, isVip: false },
];

const demoPromotions: Promotion[] = [
  {
    id: '1',
    title: 'Hoş Geldin İndirimi',
    description: 'İlk siparişinize özel %20 indirim',
    discount: 20,
    discountType: 'percent',
    validUntil: '2025-01-31',
    sentCount: 145,
    viewedCount: 89,
    redeemedCount: 23,
    isActive: true
  },
  {
    id: '2',
    title: 'VIP Özel Fırsat',
    description: 'VIP müşterilerimize özel ₺100 indirim',
    discount: 100,
    discountType: 'fixed',
    validUntil: '2025-01-15',
    sentCount: 34,
    viewedCount: 28,
    redeemedCount: 12,
    isActive: true
  },
];

export default function HereCustomersPage() {
  const { currentVenue } = useVenueStore();
  const t = useTranslations('here');
  const tCommon = useTranslations('common');
  
  const [nearbyCustomers, setNearbyCustomers] = useState<NearbyCustomer[]>(demoNearbyCustomers);
  const [promotions, setPromotions] = useState<Promotion[]>(demoPromotions);
  const [isLoading, setIsLoading] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [sendingPromotion, setSendingPromotion] = useState(false);

  const stats = {
    nearbyCount: nearbyCustomers.length,
    vipCount: nearbyCustomers.filter(c => c.isVip).length,
    newCustomers: nearbyCustomers.filter(c => c.totalVisits === 0).length,
    activePromotions: promotions.filter(p => p.isActive).length
  };

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate refresh
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleSelectCustomer = (id: string) => {
    setSelectedCustomers(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === nearbyCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(nearbyCustomers.map(c => c.id));
    }
  };

  const handleSendPromotion = async (promotionId: string) => {
    if (selectedCustomers.length === 0) {
      alert('Lütfen en az bir müşteri seçin');
      return;
    }
    
    setSendingPromotion(true);
    // Simulate sending
    setTimeout(() => {
      setSendingPromotion(false);
      setSelectedCustomers([]);
      alert(`Promosyon ${selectedCustomers.length} müşteriye gönderildi!`);
    }, 1500);
  };

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Mekan Seçimi Gerekli</h2>
          <p className="text-gray-400">{tCommon('selectVenue')}</p>
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
          <p className="text-gray-400">{currentVenue.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {tCommon('refresh')}
          </button>
          <button
            onClick={() => setShowPromotionModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('sendPromotion')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Wifi className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.nearbyCount}</p>
              <p className="text-sm text-blue-400">{t('nearbyCustomers')}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/30 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Gift className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.vipCount}</p>
              <p className="text-sm text-amber-400">VIP Müşteri</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.newCustomers}</p>
              <p className="text-sm text-green-400">Yeni Müşteri</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.activePromotions}</p>
              <p className="text-sm text-purple-400">{t('activePromotions')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Nearby Customers */}
        <div className="lg:col-span-2 bg-gray-800/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-500" />
              {t('nearbyCustomers')}
            </h2>
            <button
              onClick={handleSelectAll}
              className="text-sm text-orange-400 hover:text-orange-300"
            >
              {selectedCustomers.length === nearbyCustomers.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : (
            <div className="space-y-3">
              {nearbyCustomers.map(customer => (
                <div
                  key={customer.id}
                  onClick={() => handleSelectCustomer(customer.id)}
                  className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                    selectedCustomers.includes(customer.id)
                      ? 'bg-orange-500/20 border-2 border-orange-500'
                      : 'bg-gray-700/50 hover:bg-gray-700 border-2 border-transparent'
                  }`}
                >
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                    customer.isVip ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gray-600'
                  }`}>
                    {customer.name.charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{customer.name}</p>
                      {customer.isVip && (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">VIP</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {customer.distance}m
                      </span>
                      {customer.lastVisit && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {customer.lastVisit}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <p className="text-white font-medium">₺{customer.totalSpent.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">{customer.totalVisits} ziyaret</p>
                  </div>

                  {/* Checkbox */}
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedCustomers.includes(customer.id)
                      ? 'bg-orange-500 border-orange-500'
                      : 'border-gray-500'
                  }`}>
                    {selectedCustomers.includes(customer.id) && (
                      <CheckCircle className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedCustomers.length > 0 && (
            <div className="mt-4 p-4 bg-orange-500/20 rounded-xl flex items-center justify-between">
              <p className="text-orange-300">
                <span className="font-bold">{selectedCustomers.length}</span> müşteri seçildi
              </p>
              <button
                onClick={() => setShowPromotionModal(true)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Promosyon Gönder
              </button>
            </div>
          )}
        </div>

        {/* Active Promotions */}
        <div className="bg-gray-800/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-500" />
            {t('activePromotions')}
          </h2>

          <div className="space-y-4">
            {promotions.filter(p => p.isActive).map(promo => (
              <div key={promo.id} className="bg-gray-700/50 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-white">{promo.title}</h3>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                    Aktif
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-3">{promo.description}</p>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-600/50 rounded-lg p-2">
                    <p className="text-lg font-bold text-white">{promo.sentCount}</p>
                    <p className="text-xs text-gray-400">Gönderildi</p>
                  </div>
                  <div className="bg-gray-600/50 rounded-lg p-2">
                    <p className="text-lg font-bold text-blue-400">{promo.viewedCount}</p>
                    <p className="text-xs text-gray-400">Görüntülendi</p>
                  </div>
                  <div className="bg-gray-600/50 rounded-lg p-2">
                    <p className="text-lg font-bold text-green-400">{promo.redeemedCount}</p>
                    <p className="text-xs text-gray-400">Kullanıldı</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {promo.validUntil}'e kadar geçerli
                  </span>
                  <span className="text-orange-400 font-medium">
                    {promo.discountType === 'percent' ? `%${promo.discount}` : `₺${promo.discount}`} indirim
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 py-3 border-2 border-dashed border-gray-600 rounded-xl text-gray-400 hover:border-orange-500 hover:text-orange-400 transition-colors flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            Yeni Promosyon Oluştur
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">HERE Nasıl Çalışır?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="font-medium text-white">1. Müşteri Tespiti</p>
              <p className="text-sm text-gray-400">ORDER uygulaması açık olan müşteriler otomatik tespit edilir</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Send className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="font-medium text-white">2. Promosyon Gönderimi</p>
              <p className="text-sm text-gray-400">Seçili müşterilere anlık bildirim ile promosyon gönderilir</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="font-medium text-white">3. Dönüşüm Takibi</p>
              <p className="text-sm text-gray-400">Promosyonların görüntülenme ve kullanım oranları izlenir</p>
            </div>
          </div>
        </div>
      </div>

      {/* Promotion Modal */}
      {showPromotionModal && (
        <PromotionModal
          selectedCount={selectedCustomers.length}
          promotions={promotions}
          onSend={handleSendPromotion}
          onClose={() => setShowPromotionModal(false)}
          sending={sendingPromotion}
        />
      )}
    </div>
  );
}

// Promotion Modal
function PromotionModal({
  selectedCount,
  promotions,
  onSend,
  onClose,
  sending
}: {
  selectedCount: number;
  promotions: Promotion[];
  onSend: (promotionId: string) => void;
  onClose: () => void;
  sending: boolean;
}) {
  const [selectedPromotion, setSelectedPromotion] = useState<string>(promotions[0]?.id || '');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Promosyon Gönder</h2>
            <p className="text-gray-400 text-sm">{selectedCount} müşteriye gönderilecek</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-400">Göndermek istediğiniz promosyonu seçin:</p>
          
          {promotions.filter(p => p.isActive).map(promo => (
            <button
              key={promo.id}
              onClick={() => setSelectedPromotion(promo.id)}
              className={`w-full p-4 rounded-xl text-left transition-all ${
                selectedPromotion === promo.id
                  ? 'bg-orange-500/20 border-2 border-orange-500'
                  : 'bg-gray-700/50 border-2 border-transparent hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-white">{promo.title}</p>
                <span className="text-orange-400 font-bold">
                  {promo.discountType === 'percent' ? `%${promo.discount}` : `₺${promo.discount}`}
                </span>
              </div>
              <p className="text-sm text-gray-400">{promo.description}</p>
            </button>
          ))}
        </div>

        <div className="p-6 border-t border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium"
          >
            İptal
          </button>
          <button
            onClick={() => onSend(selectedPromotion)}
            disabled={!selectedPromotion || sending}
            className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Gönder
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
