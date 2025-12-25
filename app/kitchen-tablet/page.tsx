'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Home, Clock, CheckCircle, ChefHat, Flame, Play, Bell, Volume2, VolumeX,
  RefreshCw, Truck, Coffee, UtensilsCrossed, X, AlertCircle
} from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
  status: 'pending' | 'preparing' | 'ready';
  category?: string;
}

interface KitchenOrder {
  id: string;
  order_number: string;
  table_number?: string;
  table_id?: string;
  type: 'dine_in' | 'takeaway' | 'delivery';
  status: string;
  items: OrderItem[];
  created_at: string;
  priority?: 'normal' | 'rush';
}

const VENUE_ID = process.env.NEXT_PUBLIC_DEFAULT_VENUE_ID || '';

export default function KitchenTabletPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const loadOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, table:tables(number)')
        .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
        .order('created_at', { ascending: true });

      if (error) throw error;

      const kitchenOrders: KitchenOrder[] = (data || []).map(order => ({
        id: order.id,
        order_number: order.order_number,
        table_number: order.table?.number,
        table_id: order.table_id,
        type: order.type,
        status: order.status,
        items: (order.items || []).map((item: any) => ({
          ...item,
          status: item.status || 'pending'
        })),
        created_at: order.created_at,
        priority: order.notes?.includes('ACELE') ? 'rush' : 'normal'
      }));

      setOrders(kitchenOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('kitchen-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadOrders();
        if (soundEnabled) playSound();
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [loadOrders, soundEnabled]);

  const playSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.play().catch(() => {});
    } catch {}
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId);
    loadOrders();
  };

  const updateItemStatus = async (orderId: string, itemIndex: number, status: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const updatedItems = [...order.items];
    updatedItems[itemIndex] = { ...updatedItems[itemIndex], status: status as any };

    await supabase.from('orders').update({ items: updatedItems }).eq('id', orderId);
    loadOrders();
  };

  const getElapsedTime = (createdAt: string) => {
    const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    return diff;
  };

  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  const typeLabels = {
    dine_in: { text: 'Masa', icon: UtensilsCrossed, color: 'bg-blue-500' },
    takeaway: { text: 'Paket', icon: Coffee, color: 'bg-purple-500' },
    delivery: { text: 'Kurye', icon: Truck, color: 'bg-green-500' }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors">
              <Home className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <ChefHat className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-bold">MUTFAK</h1>
                <p className="text-sm text-gray-400">{currentTime.toLocaleTimeString('tr-TR')}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Stats */}
            <div className="flex items-center gap-6 bg-gray-700/50 rounded-xl px-6 py-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-400">{pendingOrders.length}</p>
                <p className="text-xs text-gray-400">Bekliyor</p>
              </div>
              <div className="w-px h-8 bg-gray-600" />
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">{preparingOrders.length}</p>
                <p className="text-xs text-gray-400">Hazırlanıyor</p>
              </div>
              <div className="w-px h-8 bg-gray-600" />
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{readyOrders.length}</p>
                <p className="text-xs text-gray-400">Hazır</p>
              </div>
            </div>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-3 rounded-xl transition-colors ${soundEnabled ? 'bg-green-600' : 'bg-gray-700'}`}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            <button onClick={loadOrders} className="p-3 bg-gray-700 hover:bg-gray-600 rounded-xl">
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Kanban Board */}
      <div className="p-6 grid grid-cols-3 gap-6 h-[calc(100vh-88px)]">
        {/* BEKLEYEN */}
        <div className="bg-gray-800/50 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold">Bekleyen</h2>
              <p className="text-sm text-gray-400">{pendingOrders.length} sipariş</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {pendingOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                color="amber"
                typeLabels={typeLabels}
                elapsed={getElapsedTime(order.created_at)}
                onStart={() => updateOrderStatus(order.id, 'preparing')}
                onItemClick={(idx) => updateItemStatus(order.id, idx, 'preparing')}
              />
            ))}
            {pendingOrders.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Bekleyen sipariş yok</p>
              </div>
            )}
          </div>
        </div>

        {/* HAZIRLANIYOR */}
        <div className="bg-gray-800/50 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center animate-pulse">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold">Hazırlanıyor</h2>
              <p className="text-sm text-gray-400">{preparingOrders.length} sipariş</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {preparingOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                color="purple"
                typeLabels={typeLabels}
                elapsed={getElapsedTime(order.created_at)}
                onComplete={() => updateOrderStatus(order.id, 'ready')}
                onItemClick={(idx) => updateItemStatus(order.id, idx, 'ready')}
                showItemStatus
              />
            ))}
            {preparingOrders.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Flame className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Hazırlanan sipariş yok</p>
              </div>
            )}
          </div>
        </div>

        {/* HAZIR */}
        <div className="bg-gray-800/50 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold">Hazır</h2>
              <p className="text-sm text-gray-400">{readyOrders.length} sipariş</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {readyOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                color="green"
                typeLabels={typeLabels}
                elapsed={getElapsedTime(order.created_at)}
                onServe={() => updateOrderStatus(order.id, 'served')}
                isReady
              />
            ))}
            {readyOrders.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Hazır sipariş yok</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order, color, typeLabels, elapsed, onStart, onComplete, onServe, onItemClick, showItemStatus, isReady }: {
  order: KitchenOrder;
  color: 'amber' | 'purple' | 'green';
  typeLabels: any;
  elapsed: number;
  onStart?: () => void;
  onComplete?: () => void;
  onServe?: () => void;
  onItemClick?: (idx: number) => void;
  showItemStatus?: boolean;
  isReady?: boolean;
}) {
  const colors = {
    amber: { bg: 'bg-amber-500', light: 'bg-amber-500/20', text: 'text-amber-400' },
    purple: { bg: 'bg-purple-500', light: 'bg-purple-500/20', text: 'text-purple-400' },
    green: { bg: 'bg-green-500', light: 'bg-green-500/20', text: 'text-green-400' }
  };

  const typeInfo = typeLabels[order.type] || typeLabels.dine_in;
  const TypeIcon = typeInfo.icon;
  const isRush = order.priority === 'rush';
  const isLate = elapsed > 15;

  return (
    <div className={`rounded-xl overflow-hidden ${isRush ? 'ring-2 ring-red-500' : ''} ${isReady ? 'ring-2 ring-green-400 animate-pulse' : ''}`}>
      {/* Header */}
      <div className={`${colors[color].bg} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">{order.order_number}</span>
          {isRush && <Flame className="w-5 h-5 text-yellow-300" />}
        </div>
        <div className="flex items-center gap-2">
          {order.table_number && (
            <span className="bg-white/20 px-2 py-1 rounded text-sm">Masa #{order.table_number}</span>
          )}
          <span className={`${typeInfo.color} px-2 py-1 rounded text-sm flex items-center gap-1`}>
            <TypeIcon className="w-3 h-3" />
            {typeInfo.text}
          </span>
        </div>
      </div>

      {/* Timer */}
      <div className={`px-4 py-2 ${colors[color].light} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 ${isLate ? 'text-red-400' : colors[color].text}`} />
          <span className={`font-medium ${isLate ? 'text-red-400' : colors[color].text}`}>{elapsed} dk</span>
        </div>
        {isLate && <span className="text-xs text-red-400">GECİKİYOR!</span>}
      </div>

      {/* Items */}
      <div className="bg-gray-700 p-3 space-y-2">
        {order.items.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onItemClick?.(idx)}
            disabled={!onItemClick}
            className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${
              item.status === 'ready' ? 'bg-green-500/30 line-through opacity-60' :
              item.status === 'preparing' ? 'bg-purple-500/30' :
              'bg-gray-600/50 hover:bg-gray-600'
            } ${onItemClick ? 'cursor-pointer' : ''}`}
          >
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
              item.status === 'ready' ? 'bg-green-500' :
              item.status === 'preparing' ? 'bg-purple-500' :
              colors[color].bg
            }`}>
              {item.status === 'ready' ? <CheckCircle className="w-4 h-4" /> : item.quantity}
            </span>
            <div className="flex-1 text-left">
              <p className="font-medium">{item.name}</p>
              {item.notes && <p className="text-xs text-amber-400">⚠️ {item.notes}</p>}
            </div>
            {showItemStatus && item.status !== 'ready' && (
              <span className="text-xs bg-white/10 px-2 py-1 rounded">Tıkla: Hazır</span>
            )}
          </button>
        ))}
      </div>

      {/* Action */}
      <div className="p-3 bg-gray-700">
        {onStart && (
          <button onClick={onStart} className="w-full py-3 bg-purple-500 hover:bg-purple-400 rounded-xl font-bold flex items-center justify-center gap-2">
            <Play className="w-5 h-5" /> Hazırlamaya Başla
          </button>
        )}
        {onComplete && (
          <button onClick={onComplete} className="w-full py-3 bg-green-500 hover:bg-green-400 rounded-xl font-bold flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5" /> Tümü Hazır
          </button>
        )}
        {onServe && (
          <button onClick={onServe} className="w-full py-3 bg-white text-green-700 hover:bg-green-100 rounded-xl font-bold flex items-center justify-center gap-2">
            <Bell className="w-5 h-5" /> Servis Edildi
          </button>
        )}
      </div>
    </div>
  );
}
