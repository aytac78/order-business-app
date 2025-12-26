'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Bell,
  Volume2,
  VolumeX,
  RefreshCw,
  ChefHat,
  Flame,
  Play,
  LogOut
} from 'lucide-react';

interface OrderItem {
  product_name: string;
  quantity: number;
  notes?: string;
}

interface KitchenOrder {
  id: string;
  order_number: string;
  table_number?: string;
  type: string;
  status: string;
  items: OrderItem[];
  created_at: string;
  notes?: string;
}

const typeLabels: Record<string, { text: string; color: string }> = {
  dine_in: { text: 'Masada', color: 'bg-blue-600' },
  takeaway: { text: 'Paket', color: 'bg-purple-600' },
  delivery: { text: 'Teslimat', color: 'bg-green-600' },
  qr_order: { text: 'QR', color: 'bg-orange-600' }
};

export default function KitchenTabletPage() {
  const { currentVenue } = useVenueStore();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [displayTime, setDisplayTime] = useState('--:--:--');

  useEffect(() => {
    const updateTime = () => setDisplayTime(new Date().toLocaleTimeString('tr-TR'));
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Siparişleri yükle
  const loadOrders = useCallback(async () => {
    if (!currentVenue?.id) return;
    setIsLoading(true);

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
      .order('created_at', { ascending: true });

    if (!error) setOrders(data || []);
    setIsLoading(false);
  }, [currentVenue?.id]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Real-time
  useEffect(() => {
    if (!currentVenue?.id) return;

    const channel = supabase
      .channel('kitchen-tablet')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders', filter: `venue_id=eq.${currentVenue.id}` },
        (payload) => {
          loadOrders();
          if (payload.eventType === 'INSERT' && soundEnabled) {
            playSound();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentVenue?.id, loadOrders, soundEnabled]);

  const playSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {});
    } catch (e) {}
  };

  // Sipariş durumunu güncelle
  const updateStatus = async (orderId: string, newStatus: string) => {
    await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId);
  };

  // Siparişleri grupla
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  // Süre hesapla
  const getDuration = (createdAt: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(createdAt).getTime()) / 60000);
    return diff;
  };

  if (!currentVenue) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-amber-500" />
          <p>Mekan seçimi gerekli</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-orange-500 flex items-center justify-center">
            <ChefHat className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">MUTFAK</h1>
            <p className="text-orange-400">{displayTime}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 bg-gray-800 rounded-xl px-6 py-3">
          <div className="text-center">
            <p className="text-3xl font-bold text-amber-500">{pendingOrders.length}</p>
            <p className="text-xs text-gray-400">Bekliyor</p>
          </div>
          <div className="w-px h-10 bg-gray-700" />
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-500">{preparingOrders.length}</p>
            <p className="text-xs text-gray-400">Hazırlanıyor</p>
          </div>
          <div className="w-px h-10 bg-gray-700" />
          <div className="text-center">
            <p className="text-3xl font-bold text-green-500">{readyOrders.length}</p>
            <p className="text-xs text-gray-400">Hazır</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-3 rounded-xl ${soundEnabled ? 'bg-green-600' : 'bg-gray-700'}`}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button
            onClick={loadOrders}
            className="p-3 bg-gray-700 hover:bg-gray-600 rounded-xl"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button className="p-3 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-red-400">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-3 gap-6 h-[calc(100vh-120px)]">
        {/* BEKLEYEN */}
        <div className="bg-gray-800/50 rounded-2xl p-4 flex flex-col">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
            <div className="w-12 h-12 rounded-xl bg-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Bekleyen</h2>
              <p className="text-sm text-gray-400">{pendingOrders.length} sipariş</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4">
            {pendingOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order}
                statusColor="bg-amber-600"
                onAction={() => updateStatus(order.id, 'preparing')}
                actionLabel="Hazırlamaya Başla"
                actionIcon={<Play className="w-5 h-5" />}
                actionColor="bg-purple-600 hover:bg-purple-500"
                getDuration={getDuration}
              />
            ))}
            {pendingOrders.length === 0 && (
              <EmptyState icon={<Clock className="w-12 h-12" />} text="Bekleyen sipariş yok" />
            )}
          </div>
        </div>

        {/* HAZIRLANIYOR */}
        <div className="bg-gray-800/50 rounded-2xl p-4 flex flex-col">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
            <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center animate-pulse">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Hazırlanıyor</h2>
              <p className="text-sm text-gray-400">{preparingOrders.length} sipariş</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4">
            {preparingOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order}
                statusColor="bg-purple-600"
                onAction={() => updateStatus(order.id, 'ready')}
                actionLabel="Tümü Hazır"
                actionIcon={<CheckCircle className="w-5 h-5" />}
                actionColor="bg-green-600 hover:bg-green-500"
                getDuration={getDuration}
              />
            ))}
            {preparingOrders.length === 0 && (
              <EmptyState icon={<Flame className="w-12 h-12" />} text="Hazırlanan sipariş yok" />
            )}
          </div>
        </div>

        {/* HAZIR */}
        <div className="bg-gray-800/50 rounded-2xl p-4 flex flex-col">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
            <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center animate-bounce">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Hazır</h2>
              <p className="text-sm text-gray-400">{readyOrders.length} sipariş</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4">
            {readyOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order}
                statusColor="bg-green-600"
                onAction={() => updateStatus(order.id, 'served')}
                actionLabel="Servis Edildi"
                actionIcon={<Bell className="w-5 h-5" />}
                actionColor="bg-white text-green-700 hover:bg-green-100"
                getDuration={getDuration}
                isReady
              />
            ))}
            {readyOrders.length === 0 && (
              <EmptyState icon={<CheckCircle className="w-12 h-12" />} text="Hazır sipariş yok" />
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
  statusColor,
  onAction, 
  actionLabel,
  actionIcon,
  actionColor,
  getDuration,
  isReady = false
}: { 
  order: KitchenOrder;
  statusColor: string;
  onAction: () => void;
  actionLabel: string;
  actionIcon: React.ReactNode;
  actionColor: string;
  getDuration: (createdAt: string) => number;
  isReady?: boolean;
}) {
  const duration = getDuration(order.created_at);
  const isUrgent = duration > 15 && !isReady;
  const typeInfo = typeLabels[order.type] || typeLabels.dine_in;

  return (
    <div className={`rounded-xl overflow-hidden ${
      isUrgent ? 'bg-red-900/50 border-2 border-red-500' : 
      isReady ? 'bg-green-900/50 border-2 border-green-500' : 
      'bg-gray-700'
    }`}>
      {/* Header - MASA NUMARASI BURADA! */}
      <div className={`px-4 py-3 ${statusColor} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">{order.order_number}</span>
          {isUrgent && <Flame className="w-5 h-5 text-yellow-300 animate-pulse" />}
          {isReady && <Bell className="w-5 h-5 animate-bounce" />}
        </div>
        <div className="flex items-center gap-2">
          {/* MASA NUMARASI - BÜYÜK VE BELİRGİN */}
          {order.table_number && (
            <span className="px-3 py-1.5 bg-white/30 rounded-lg font-bold text-lg">
              MASA #{order.table_number}
            </span>
          )}
          <span className={`px-2 py-1 rounded text-sm ${typeInfo.color}`}>
            {typeInfo.text}
          </span>
        </div>
      </div>
      
      {/* Items */}
      <div className="p-4 space-y-2">
        {(order.items || []).map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 p-2 bg-gray-600/50 rounded-lg">
            <span className={`w-10 h-10 ${statusColor} rounded-lg flex items-center justify-center font-bold text-lg`}>
              {item.quantity}
            </span>
            <div className="flex-1">
              <p className="font-medium text-lg">{item.product_name}</p>
              {item.notes && <p className="text-sm text-amber-400">⚠️ {item.notes}</p>}
            </div>
          </div>
        ))}

        {order.notes && (
          <div className="p-2 bg-amber-600/20 rounded-lg border border-amber-600/50">
            <p className="text-sm text-amber-400">📝 Sipariş Notu: {order.notes}</p>
          </div>
        )}
      </div>

      {/* Duration & Action */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-3 text-sm text-gray-400">
          <span className={`flex items-center gap-1 ${isUrgent ? 'text-red-400 font-bold text-base' : ''}`}>
            ⏱️ {duration} dk önce
          </span>
          <span>
            {new Date(order.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <button
          onClick={onAction}
          className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors ${actionColor}`}
        >
          {actionIcon}
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

// Empty State
function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-500">
      <div className="text-center">
        <div className="opacity-50 mb-2">{icon}</div>
        <p>{text}</p>
      </div>
    </div>
  );
}
