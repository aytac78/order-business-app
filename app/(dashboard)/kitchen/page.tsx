'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import {
  Clock, CheckCircle, Loader2, RefreshCw, ChefHat, Flame,
  Volume2, VolumeX, AlertCircle, Play
} from 'lucide-react';

interface KitchenOrder {
  id: string;
  order_number: string;
  table_number: string;
  status: string;
  items: any[];
  created_at: string;
  priority?: 'normal' | 'rush';
}

export default function KitchenPage() {
  const { currentVenue } = useVenueStore();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [displayTime, setDisplayTime] = useState('--:--:--');

  useEffect(() => {
    const updateTime = () => {
      setDisplayTime(new Date().toLocaleTimeString('tr-TR'));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadOrders = useCallback(async () => {
    if (!currentVenue?.id) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
      .not('table_number', 'is', null)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  }, [currentVenue?.id]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Real-time subscription
  useEffect(() => {
    if (!currentVenue?.id) return;

    const channel = supabase
      .channel('kitchen-orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `venue_id=eq.${currentVenue.id}`
      }, () => {
        loadOrders();
        if (soundEnabled) {
          // Play notification sound
          try {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(() => {});
          } catch (e) {}
        }
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [currentVenue?.id, loadOrders, soundEnabled]);

  const handleStartOrder = async (orderId: string) => {
    await supabase
      .from('orders')
      .update({ status: 'preparing' })
      .eq('id', orderId);
    loadOrders();
  };

  const handleCompleteOrder = async (orderId: string) => {
    await supabase
      .from('orders')
      .update({ status: 'ready' })
      .eq('id', orderId);
    loadOrders();
  };

  const handleServeOrder = async (orderId: string) => {
    await supabase
      .from('orders')
      .update({ status: 'served' })
      .eq('id', orderId);
    loadOrders();
  };

  // Siparişleri duruma göre grupla
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  const getOrderDuration = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / 60000);
  };

  if (!currentVenue) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Mekan Seçimi Gerekli</h2>
          <p className="text-gray-400">Mutfak ekranı için lütfen bir mekan seçin.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white -m-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <ChefHat className="w-8 h-8 text-orange-500" />
          <div>
            <h1 className="text-2xl font-bold">Mutfak Ekranı</h1>
            <p className="text-gray-400 text-sm">{displayTime}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Stats */}
          <div className="flex items-center gap-6 bg-gray-800 rounded-xl px-6 py-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-500">{pendingOrders.length}</p>
              <p className="text-xs text-gray-400">Bekliyor</p>
            </div>
            <div className="w-px h-8 bg-gray-700" />
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-500">{preparingOrders.length}</p>
              <p className="text-xs text-gray-400">Hazırlanıyor</p>
            </div>
            <div className="w-px h-8 bg-gray-700" />
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{readyOrders.length}</p>
              <p className="text-xs text-gray-400">Hazır</p>
            </div>
          </div>

          {/* Refresh */}
          <button type="button"
            onClick={loadOrders}
            className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {/* Sound Toggle */}
          <button type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-3 rounded-xl transition-colors ${
              soundEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* BEKLEYEN */}
        <div className="bg-gray-800/50 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
            <div className="w-12 h-12 rounded-xl bg-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Bekleyen</h2>
              <p className="text-sm text-gray-400">{pendingOrders.length} sipariş</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {pendingOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                status="pending"
                duration={getOrderDuration(order.created_at)}
                onAction={() => handleStartOrder(order.id)}
                actionLabel="Hazırlamaya Başla"
                actionIcon={<Play className="w-5 h-5" />}
              />
            ))}
            
            {pendingOrders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Bekleyen sipariş yok</p>
              </div>
            )}
          </div>
        </div>

        {/* HAZIRLANIYOR */}
        <div className="bg-gray-800/50 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
            <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center animate-pulse">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Hazırlanıyor</h2>
              <p className="text-sm text-gray-400">{preparingOrders.length} sipariş</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {preparingOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                status="preparing"
                duration={getOrderDuration(order.created_at)}
                onAction={() => handleCompleteOrder(order.id)}
                actionLabel="Tümü Hazır"
                actionIcon={<CheckCircle className="w-5 h-5" />}
              />
            ))}
            
            {preparingOrders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Flame className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Hazırlanan sipariş yok</p>
              </div>
            )}
          </div>
        </div>

        {/* HAZIR */}
        <div className="bg-gray-800/50 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
            <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Hazır</h2>
              <p className="text-sm text-gray-400">{readyOrders.length} sipariş</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {readyOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                status="ready"
                duration={getOrderDuration(order.created_at)}
                onAction={() => handleServeOrder(order.id)}
                actionLabel="Servis Edildi"
                actionIcon={<CheckCircle className="w-5 h-5" />}
                isReady
              />
            ))}
            
            {readyOrders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Hazır sipariş yok</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Order Card Component
function OrderCard({
  order,
  status,
  duration,
  onAction,
  actionLabel,
  actionIcon,
  isReady = false
}: {
  order: KitchenOrder;
  status: 'pending' | 'preparing' | 'ready';
  duration: number;
  onAction: () => void;
  actionLabel: string;
  actionIcon: React.ReactNode;
  isReady?: boolean;
}) {
  const statusColors = {
    pending: 'bg-amber-600',
    preparing: 'bg-purple-600',
    ready: 'bg-green-600'
  };

  const cardBg = isReady ? 'bg-green-900/50 border-2 border-green-500' : 'bg-gray-700';

  return (
    <div className={`rounded-xl overflow-hidden ${cardBg}`}>
      {/* Order Header */}
      <div className={`px-4 py-3 ${statusColors[status]} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">{order.order_number}</span>
          {duration > 15 && <Flame className="w-5 h-5 text-yellow-300" />}
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-white/20 px-2 py-1 rounded text-sm">
            Masa #{order.table_number}
          </span>
          <span className="bg-white/20 px-2 py-1 rounded text-sm">
            {duration} dk
          </span>
        </div>
      </div>
      
      {/* Items */}
      <div className="p-4 space-y-2">
        {order.items?.map((item: any, idx: number) => (
          <div key={idx} className="flex items-center gap-3 p-2 bg-gray-600/50 rounded-lg">
            <span className={`w-8 h-8 ${statusColors[status]} rounded-lg flex items-center justify-center font-bold`}>
              {item.quantity}
            </span>
            <div className="flex-1">
              <p className="font-medium text-white">{item.product_name}</p>
              {item.notes && <p className="text-xs text-amber-400">⚠️ {item.notes}</p>}
            </div>
          </div>
        ))}
      </div>
      
      {/* Action */}
      <div className="p-4 pt-0">
        <button type="button"
          onClick={onAction}
          className={`w-full py-3 ${
            isReady 
              ? 'bg-white text-green-700 hover:bg-green-100' 
              : status === 'pending' 
                ? 'bg-purple-600 hover:bg-purple-500' 
                : 'bg-green-600 hover:bg-green-500'
          } rounded-xl font-bold flex items-center justify-center gap-2 transition-colors`}
        >
          {actionIcon}
          {actionLabel}
        </button>
      </div>
    </div>
  );
}