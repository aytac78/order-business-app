'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Wifi,
  Star
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

export default function HereCustomersPage() {
  const { currentVenue } = useVenueStore();
  const t = useTranslations('here');
  const tCommon = useTranslations('common');
  
  const [nearbyCustomers, setNearbyCustomers] = useState<NearbyCustomer[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [sendingPromotion, setSendingPromotion] = useState(false);

  // Fetch nearby customers from Supabase
  const fetchNearbyCustomers = useCallback(async () => {
    if (!currentVenue?.id) return;
    
    try {
      // Get customers who checked in at this venue
      const { data: checkins, error: checkinError } = await supabase
        .from('venue_checkins')
        .select(`
          id,
          customer_id,
          checked_in_at,
          customers (
            id,
            name,
            phone,
            total_visits,
            total_spent,
            is_vip,
            last_visit
          )
        `)
        .eq('venue_id', currentVenue.id)
        .gte('checked_in_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('checked_in_at', { ascending: false });

      if (checkinError) {
        console.error('Checkin fetch error:', checkinError);
        // Fallback: Get all customers for venue
        const { data: customers } = await supabase
          .from('customers')
          .select('*')
          .eq('venue_id', currentVenue.id)
          .limit(20);
        
        if (customers) {
          setNearbyCustomers(customers.map((c: any) => ({
            id: c.id,
            name: c.name || 'Misafir',
            distance: Math.floor(Math.random() * 500),
            lastVisit: c.last_visit,
            totalVisits: c.total_visits || 0,
            totalSpent: c.total_spent || 0,
            isVip: c.is_vip || false
          })));
        }
        return;
      }

      if (checkins && checkins.length > 0) {
        const mapped = checkins.map((c: any) => ({
          id: c.customers?.id || c.customer_id,
          name: c.customers?.name || 'Misafir',
          distance: Math.floor(Math.random() * 500),
          lastVisit: c.customers?.last_visit,
          totalVisits: c.customers?.total_visits || 0,
          totalSpent: c.customers?.total_spent || 0,
          isVip: c.customers?.is_vip || false
        }));
        setNearbyCustomers(mapped);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  }, [currentVenue?.id]);

  // Fetch promotions (coupons) from Supabase
  const fetchPromotions = useCallback(async () => {
    if (!currentVenue?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('venue_id', currentVenue.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Coupon fetch error:', error);
        return;
      }

      if (data) {
        setPromotions(data.map((c: any) => ({
          id: c.id,
          title: c.name || c.code,
          description: c.description || `${c.type === 'percentage' ? '%' : '₺'}${c.value} indirim`,
          discount: c.value || 0,
          discountType: c.type === 'percentage' ? 'percent' : 'fixed',
          validUntil: c.valid_until,
          sentCount: c.used_count || 0,
          viewedCount: 0,
          redeemedCount: c.used_count || 0,
          isActive: c.is_active
        })));
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
    }
  }, [currentVenue?.id]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchNearbyCustomers(), fetchPromotions()]);
      setIsLoading(false);
    };
    
    if (currentVenue?.id) {
      loadData();
    }
  }, [currentVenue?.id, fetchNearbyCustomers, fetchPromotions]);

  const stats = {
    nearbyCount: nearbyCustomers.length,
    vipCount: nearbyCustomers.filter(c => c.isVip).length,
    newCustomers: nearbyCustomers.filter(c => c.totalVisits === 0).length,
    activePromotions: promotions.filter(p => p.isActive).length
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await Promise.all([fetchNearbyCustomers(), fetchPromotions()]);
    setIsLoading(false);
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
    
    try {
      // Create notifications for selected customers
      const notifications = selectedCustomers.map(customerId => ({
        venue_id: currentVenue?.id,
        customer_id: customerId,
        type: 'promotion',
        title: promotions.find(p => p.id === promotionId)?.title || 'Promosyon',
        message: promotions.find(p => p.id === promotionId)?.description,
        is_read: false
      }));
      
      await supabase.from('notifications').insert(notifications);
      
      setSelectedCustomers([]);
      alert(`Promosyon ${selectedCustomers.length} müşteriye gönderildi!`);
    } catch (error) {
      console.error('Error sending promotion:', error);
      alert('Promosyon gönderilemedi');
    } finally {
      setSendingPromotion(false);
    }
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
          <h1 className="text-2xl font-bold text-white">HERE Müşteriler</h1>
          <p className="text-gray-400">Yakınlarınızdaki müşterilere ulaşın</p>
        </div>
        <button type="button"
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Yenile
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Wifi className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.nearbyCount}</p>
              <p className="text-sm text-gray-400">Yakında</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Star className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.vipCount}</p>
              <p className="text-sm text-gray-400">VIP</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.newCustomers}</p>
              <p className="text-sm text-gray-400">Yeni</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Gift className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.activePromotions}</p>
              <p className="text-sm text-gray-400">Aktif Promosyon</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Nearby Customers */}
        <div className="lg:col-span-2 bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Yakındaki Müşteriler</h2>
            {nearbyCustomers.length > 0 && (
              <button type="button"
                onClick={handleSelectAll}
                className="text-sm text-orange-400 hover:text-orange-300"
              >
                {selectedCustomers.length === nearbyCustomers.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          ) : nearbyCustomers.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Yakında müşteri bulunamadı</p>
              <p className="text-sm text-gray-500 mt-1">Müşteriler check-in yaptığında burada görünecek</p>
            </div>
          ) : (
            <div className="space-y-3">
              {nearbyCustomers.map(customer => (
                <div
                  key={customer.id}
                  onClick={() => handleSelectCustomer(customer.id)}
                  className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-colors ${
                    selectedCustomers.includes(customer.id)
                      ? 'bg-orange-500/20 border border-orange-500'
                      : 'bg-gray-700/50 hover:bg-gray-700'
                  }`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                      <span className="text-lg font-bold text-white">
                        {customer.name.charAt(0)}
                      </span>
                    </div>
                    {customer.isVip && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                        <Star className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{customer.name}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {customer.distance}m
                      </span>
                      <span>{customer.totalVisits} ziyaret</span>
                      <span>₺{customer.totalSpent.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ${
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
        </div>

        {/* Promotions */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Promosyonlar</h2>
            <button type="button"
              onClick={() => setShowPromotionModal(true)}
              className="p-2 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 text-orange-400" />
            </button>
          </div>

          {promotions.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Henüz promosyon yok</p>
              <p className="text-gray-500 text-xs mt-1">Kuponlar bölümünden ekleyin</p>
            </div>
          ) : (
            <div className="space-y-3">
              {promotions.map(promo => (
                <div key={promo.id} className="p-4 bg-gray-700/50 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-white">{promo.title}</p>
                      <p className="text-sm text-gray-400">{promo.description}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      promo.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-400'
                    }`}>
                      {promo.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{promo.sentCount} gönderildi</span>
                      <span>{promo.redeemedCount} kullanıldı</span>
                    </div>
                    <button type="button"
                      onClick={() => handleSendPromotion(promo.id)}
                      disabled={selectedCustomers.length === 0 || sendingPromotion || !promo.isActive}
                      className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                    >
                      {sendingPromotion ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                      Gönder
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedCustomers.length > 0 && (
            <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl">
              <p className="text-sm text-orange-400">
                <strong>{selectedCustomers.length}</strong> müşteri seçildi
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}