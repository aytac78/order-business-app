'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { useTranslations } from 'next-intl';
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
  Loader2
} from 'lucide-react';

interface KitchenOrderItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
  status: 'pending' | 'preparing' | 'ready';
}

interface KitchenOrder {
  id: string;
  orderNumber: string;
  table?: string;
  type: 'dine_in' | 'takeaway' | 'delivery' | 'qr_order';
  items: KitchenOrderItem[];
  createdAt: string;
  priority: 'normal' | 'rush';
  customerName?: string;
}

export default function KitchenPage() {
  const { currentVenue } = useVenueStore();
  const t = useTranslations('kitchen');
  const tOrders = useTranslations('orders');
  const tCommon = useTranslations('common');
  
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [displayTime, setDisplayTime] = useState<string>('--:--:--');

  // Type labels with translations
  const typeLabels = {
    dine_in: { text: tOrders('dineIn'), color: 'bg-blue-600' },
    takeaway: { text: tOrders('takeaway'), color: 'bg-purple-600' },
    delivery: { text: tOrders('delivery'), color: 'bg-green-600' },
    qr_order: { text: tOrders('qrOrder'), color: 'bg-cyan-600' }
  };

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      setDisplayTime(new Date().toLocaleTimeString('tr-TR'));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load orders from database
  const loadOrders = useCallback(async () => {
    if (!currentVenue?.id) return;

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
      .order('created_at', { ascending: true });

    if (data) {
      const kitchenOrders: KitchenOrder[] = data.map(order => ({
        id: order.id,
        orderNumber: order.order_number || `ORD-${order.id.slice(0, 4).toUpperCase()}`,
        table: order.table_number,
        type: order.type || 'dine_in',
        priority: order.priority || 'normal',
        customerName: order.customer_name,
        createdAt: order.created_at,
        items: (order.items || []).map((item: any, idx: number) => ({
          id: `${order.id}-${idx}`,
          name: item.name || item.product_name,
          quantity: item.quantity,
          notes: item.notes,
          status: order.status === 'ready' ? 'ready' : order.status === 'preparing' ? 'preparing' : 'pending'
        }))
      }));
      setOrders(kitchenOrders);
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
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders', filter: `venue_id=eq.${currentVenue.id}` },
        () => {
          loadOrders();
          if (soundEnabled) {
            // Play notification sound
          }
        }
      )
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

  const getOrderStatus = (order: KitchenOrder): 'pending' | 'preparing' | 'ready' => {
    if (order.items.every(item => item.status === 'ready')) return 'ready';
    if (order.items.some(item => item.status === 'preparing')) return 'preparing';
    return 'pending';
  };

  // Group orders by status
  const pendingOrders = orders.filter(o => getOrderStatus(o) === 'pending');
  const preparingOrders = orders.filter(o => getOrderStatus(o) === 'preparing');
  const readyOrders = orders.filter(o => getOrderStatus(o) === 'ready');

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!currentVenue) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">{tCommon('selectVenue')}</h2>
          <p className="text-gray-400">{t('title')}</p>
        </div>
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
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-gray-400 text-sm">{displayTime}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Stats */}
          <div className="flex items-center gap-6 bg-gray-800 rounded-xl px-6 py-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-500">{pendingOrders.length}</p>
              <p className="text-xs text-gray-400">{t('pendingOrders')}</p>
            </div>
            <div className="w-px h-8 bg-gray-700" />
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-500">{preparingOrders.length}</p>
              <p className="text-xs text-gray-400">{t('preparingOrders')}</p>
            </div>
            <div className="w-px h-8 bg-gray-700" />
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{readyOrders.length}</p>
              <p className="text-xs text-gray-400">{t('readyOrders')}</p>
            </div>
          </div>

          {/* Refresh */}
          <button
            onClick={loadOrders}
            className="p-3 rounded-xl bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-3 rounded-xl transition-colors ${
              soundEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : (
        /* Kanban Board */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* PENDING */}
          <div className="bg-gray-800/50 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
              <div className="w-12 h-12 rounded-xl bg-amber-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{t('pendingOrders')}</h2>
                <p className="text-sm text-gray-400">{pendingOrders.length} {tOrders('title').toLowerCase()}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {pendingOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  typeLabels={typeLabels}
                  t={t}
                  tOrders={tOrders}
                  variant="pending"
                  onAction={() => handleStartOrder(order.id)}
                  actionLabel={t('startPreparing')}
                  actionIcon={<Play className="w-5 h-5" />}
                />
              ))}
              
              {pendingOrders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{t('noOrdersInQueue')}</p>
                </div>
              )}
            </div>
          </div>

          {/* PREPARING */}
          <div className="bg-gray-800/50 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
              <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center animate-pulse">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{t('preparingOrders')}</h2>
                <p className="text-sm text-gray-400">{preparingOrders.length} {tOrders('title').toLowerCase()}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {preparingOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  typeLabels={typeLabels}
                  t={t}
                  tOrders={tOrders}
                  variant="preparing"
                  onAction={() => handleCompleteOrder(order.id)}
                  actionLabel={t('markAllReady')}
                  actionIcon={<CheckCircle className="w-5 h-5" />}
                />
              ))}
              
              {preparingOrders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Flame className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{t('noOrdersInQueue')}</p>
                </div>
              )}
            </div>
          </div>

          {/* READY */}
          <div className="bg-gray-800/50 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
              <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center animate-bounce">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{t('readyOrders')}</h2>
                <p className="text-sm text-gray-400">{readyOrders.length} {tOrders('title').toLowerCase()}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {readyOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  typeLabels={typeLabels}
                  t={t}
                  tOrders={tOrders}
                  variant="ready"
                  onAction={() => handleServeOrder(order.id)}
                  actionLabel={t('orderServed')}
                  actionIcon={<Bell className="w-5 h-5" />}
                />
              ))}
              
              {readyOrders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{t('noOrdersInQueue')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Order Card Component
function OrderCard({ 
  order, typeLabels, t, tOrders, variant, onAction, actionLabel, actionIcon 
}: { 
  order: KitchenOrder; 
  typeLabels: any; 
  t: any; 
  tOrders: any;
  variant: 'pending' | 'preparing' | 'ready';
  onAction: () => void;
  actionLabel: string;
  actionIcon: React.ReactNode;
}) {
  const variantStyles = {
    pending: {
      header: 'bg-amber-600',
      button: 'bg-purple-600 hover:bg-purple-500',
      card: order.priority === 'rush' ? 'bg-red-900/50 border-2 border-red-500' : 'bg-gray-700',
      itemBg: 'bg-amber-600',
      itemWrapper: 'bg-gray-600/50'
    },
    preparing: {
      header: 'bg-purple-600',
      button: 'bg-green-600 hover:bg-green-500',
      card: order.priority === 'rush' ? 'bg-red-900/50 border-2 border-red-500' : 'bg-gray-700',
      itemBg: 'bg-purple-600',
      itemWrapper: 'bg-purple-600/30'
    },
    ready: {
      header: 'bg-green-600',
      button: 'bg-white text-green-700 hover:bg-green-100',
      card: 'bg-green-900/50 border-2 border-green-500',
      itemBg: 'bg-green-600',
      itemWrapper: 'bg-green-600/30'
    }
  };

  const styles = variantStyles[variant];
  const typeLabel = typeLabels[order.type] || typeLabels.dine_in;

  return (
    <div className={`rounded-xl overflow-hidden ${styles.card}`}>
      {/* Order Header */}
      <div className={`px-4 py-3 ${styles.header} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">{order.orderNumber}</span>
          {order.priority === 'rush' && <Flame className="w-5 h-5 text-yellow-300" />}
          {variant === 'ready' && <Bell className="w-5 h-5 animate-pulse" />}
        </div>
        <div className="flex items-center gap-2">
          {order.table && (
            <span className="bg-white/20 px-2 py-1 rounded text-sm">
              {tOrders('dineIn')} #{order.table}
            </span>
          )}
          <span className={`px-2 py-1 rounded text-sm ${typeLabel.color}`}>
            {typeLabel.text}
          </span>
        </div>
      </div>
      
      {/* Items */}
      <div className="p-4 space-y-2">
        {order.items.map(item => (
          <div key={item.id} className={`flex items-center gap-3 p-2 ${styles.itemWrapper} rounded-lg`}>
            <span className={`w-8 h-8 ${styles.itemBg} rounded-lg flex items-center justify-center font-bold`}>
              {variant === 'ready' ? <CheckCircle className="w-5 h-5" /> : item.quantity}
            </span>
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              {item.notes && <p className="text-xs text-amber-400">⚠️ {item.notes}</p>}
            </div>
            {variant === 'ready' && <span className="text-xs">x{item.quantity}</span>}
          </div>
        ))}
      </div>
      
      {/* Action */}
      <div className="p-4 pt-0">
        <button
          onClick={onAction}
          className={`w-full py-3 ${styles.button} rounded-xl font-bold flex items-center justify-center gap-2`}
        >
          {actionIcon}
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
