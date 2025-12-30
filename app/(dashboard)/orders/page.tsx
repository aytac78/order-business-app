'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import {
  Clock, CheckCircle, AlertCircle, Loader2, RefreshCw,
  ChefHat, Utensils, Package, Truck, QrCode, X,
  Eye, Printer, Phone, User, DollarSign, Calendar
} from 'lucide-react';

interface OrderItem {
  id?: string;
  product_id?: string;
  name?: string;
  product_name?: string;
  quantity: number;
  unit_price?: number;
  price?: number;
  notes?: string;
}

interface Order {
  id: string;
  venue_id: string;
  order_number: string;
  table_number?: string;
  type: 'dine_in' | 'takeaway' | 'delivery' | 'qr_order';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  items: OrderItem[];
  total: number;
  customer_name?: string;
  customer_phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export default function OrdersPage() {
  const { currentVenue } = useVenueStore();
  const t = useTranslations('orders');
  const tCommon = useTranslations('common');
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [filterType, setFilterType] = useState<string>('all');

  // Status config
  const statusConfig = {
    pending: { label: t('pending'), color: 'bg-amber-500', icon: Clock },
    confirmed: { label: t('confirmed'), color: 'bg-blue-500', icon: CheckCircle },
    preparing: { label: t('preparing'), color: 'bg-purple-500', icon: ChefHat },
    ready: { label: t('ready'), color: 'bg-green-500', icon: CheckCircle },
    served: { label: t('served'), color: 'bg-teal-500', icon: Utensils },
    completed: { label: t('completed'), color: 'bg-gray-500', icon: CheckCircle },
    cancelled: { label: t('cancelled'), color: 'bg-red-500', icon: X },
  };

  // Type config
  const typeConfig = {
    dine_in: { label: t('dineIn'), icon: Utensils, color: 'text-blue-400' },
    takeaway: { label: t('takeaway'), icon: Package, color: 'text-purple-400' },
    delivery: { label: t('delivery'), icon: Truck, color: 'text-green-400' },
    qr_order: { label: t('qrOrder'), icon: QrCode, color: 'text-cyan-400' },
  };

  const loadOrders = useCallback(async () => {
    if (!currentVenue?.id) return;

    let query = supabase
      .from('orders')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .order('created_at', { ascending: false });

    if (filterStatus === 'active') {
      query = query.in('status', ['pending', 'confirmed', 'preparing', 'ready', 'served']);
    } else if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }

    if (filterType !== 'all') {
      query = query.eq('type', filterType);
    }

    const { data } = await query.limit(100);
    if (data) setOrders(data);
    setLoading(false);
  }, [currentVenue?.id, filterStatus, filterType]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Real-time subscription
  useEffect(() => {
    if (!currentVenue?.id) return;

    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders', filter: `venue_id=eq.${currentVenue.id}` },
        loadOrders
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [currentVenue?.id, loadOrders]);

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    loadOrders();
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} ${t('estimatedTime').includes('dk') ? 'dk' : 'min'}`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m`;
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

  // Stats
  const stats = {
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    total: orders.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="text-gray-400">{orders.length} {t('title').toLowerCase()}</p>
        </div>
        <button
          onClick={loadOrders}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {tCommon('refresh')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4">
          <p className="text-amber-400 text-sm">{t('pending')}</p>
          <p className="text-2xl font-bold text-white">{stats.pending}</p>
        </div>
        <div className="bg-purple-500/20 border border-purple-500/50 rounded-xl p-4">
          <p className="text-purple-400 text-sm">{t('preparing')}</p>
          <p className="text-2xl font-bold text-white">{stats.preparing}</p>
        </div>
        <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
          <p className="text-green-400 text-sm">{t('ready')}</p>
          <p className="text-2xl font-bold text-white">{stats.ready}</p>
        </div>
        <div className="bg-gray-500/20 border border-gray-500/50 rounded-xl p-4">
          <p className="text-gray-400 text-sm">{tCommon('total')}</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white"
          >
            <option value="active">{t('activeOrders')}</option>
            <option value="all">{t('allOrders')}</option>
            <option value="pending">{t('pending')}</option>
            <option value="confirmed">{t('confirmed')}</option>
            <option value="preparing">{t('preparing')}</option>
            <option value="ready">{t('ready')}</option>
            <option value="served">{t('served')}</option>
            <option value="completed">{t('completed')}</option>
            <option value="cancelled">{t('cancelled')}</option>
          </select>
        </div>
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white"
          >
            <option value="all">{tCommon('all')}</option>
            <option value="dine_in">{t('dineIn')}</option>
            <option value="takeaway">{t('takeaway')}</option>
            <option value="delivery">{t('delivery')}</option>
            <option value="qr_order">{t('qrOrder')}</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="grid gap-4">
        {orders.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/50 rounded-xl">
            <Utensils className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">{t('noOrders')}</p>
          </div>
        ) : (
          orders.map(order => {
            const status = statusConfig[order.status];
            const type = typeConfig[order.type] || typeConfig.dine_in;
            const StatusIcon = status.icon;
            const TypeIcon = type.icon;

            return (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="bg-gray-800 rounded-xl p-4 cursor-pointer hover:bg-gray-750 transition-colors border border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Order Number */}
                    <div className="text-center">
                      <p className="text-xs text-gray-500">{t('orderNumber')}</p>
                      <p className="text-lg font-bold text-white">{order.order_number || `#${order.id.slice(0, 4)}`}</p>
                    </div>

                    {/* Type */}
                    <div className={`flex items-center gap-2 ${type.color}`}>
                      <TypeIcon className="w-4 h-4" />
                      <span className="text-sm">{type.label}</span>
                      {order.table_number && (
                        <span className="px-2 py-0.5 bg-gray-700 rounded text-white text-sm">
                          #{order.table_number}
                        </span>
                      )}
                    </div>

                    {/* Items count */}
                    <div className="text-gray-400 text-sm">
                      {order.items?.length || 0} {tCommon('items')}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Time */}
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{getTimeAgo(order.created_at)}</p>
                    </div>

                    {/* Total */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-orange-400">₺{order.total?.toFixed(2) || '0.00'}</p>
                    </div>

                    {/* Status Badge */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 ${status.color} rounded-full text-white text-sm`}>
                      <StatusIcon className="w-4 h-4" />
                      {status.label}
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                {(order.customer_name || order.customer_phone) && (
                  <div className="mt-3 pt-3 border-t border-gray-700 flex items-center gap-4 text-sm text-gray-400">
                    {order.customer_name && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {order.customer_name}
                      </span>
                    )}
                    {order.customer_phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {order.customer_phone}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          statusConfig={statusConfig}
          typeConfig={typeConfig}
          t={t}
          tCommon={tCommon}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={(status) => handleStatusChange(selectedOrder.id, status)}
        />
      )}
    </div>
  );
}

// Order Detail Modal
function OrderDetailModal({
  order, statusConfig, typeConfig, t, tCommon, onClose, onStatusChange
}: {
  order: Order;
  statusConfig: any;
  typeConfig: any;
  t: any;
  tCommon: any;
  onClose: () => void;
  onStatusChange: (status: Order['status']) => void;
}) {
  const status = statusConfig[order.status];
  const type = typeConfig[order.type] || typeConfig.dine_in;
  const TypeIcon = type.icon;

  const statusFlow: Order['status'][] = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed'];
  const currentIndex = statusFlow.indexOf(order.status);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">
                {t('orderNumber')} {order.order_number || `#${order.id.slice(0, 4)}`}
              </h2>
              <span className={`px-3 py-1 ${status.color} rounded-full text-white text-sm`}>
                {status.label}
              </span>
            </div>
            <div className={`flex items-center gap-2 mt-1 ${type.color}`}>
              <TypeIcon className="w-4 h-4" />
              <span>{type.label}</span>
              {order.table_number && <span>• {t('dineIn')} #{order.table_number}</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer Info */}
          {(order.customer_name || order.customer_phone) && (
            <div className="bg-gray-700/50 rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">{t('customer')}</h3>
              <div className="flex items-center gap-4">
                {order.customer_name && (
                  <span className="flex items-center gap-2 text-white">
                    <User className="w-4 h-4 text-gray-400" />
                    {order.customer_name}
                  </span>
                )}
                {order.customer_phone && (
                  <span className="flex items-center gap-2 text-white">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {order.customer_phone}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Order Items */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">{t('orderItems')}</h3>
            <div className="bg-gray-700/50 rounded-xl divide-y divide-gray-600">
              {order.items?.map((item, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
                      {item.quantity}
                    </span>
                    <div>
                      <p className="text-white font-medium">{item.name || item.product_name}</p>
                      {item.notes && <p className="text-sm text-amber-400">⚠️ {item.notes}</p>}
                    </div>
                  </div>
                  <p className="text-white font-medium">
                    ₺{((item.unit_price || item.price || 0) * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4">
              <h3 className="text-sm font-medium text-amber-400 mb-1">{tCommon('notes')}</h3>
              <p className="text-white">{order.notes}</p>
            </div>
          )}

          {/* Total */}
          <div className="bg-gray-700/50 rounded-xl p-4 flex items-center justify-between">
            <span className="text-gray-400">{tCommon('total')}</span>
            <span className="text-2xl font-bold text-orange-400">₺{order.total?.toFixed(2) || '0.00'}</span>
          </div>

          {/* Status Actions */}
          {order.status !== 'completed' && order.status !== 'cancelled' && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">{t('orderDetails')}</h3>
              <div className="grid grid-cols-2 gap-2">
                {statusFlow.slice(currentIndex + 1, currentIndex + 3).map(nextStatus => (
                  <button
                    key={nextStatus}
                    onClick={() => onStatusChange(nextStatus)}
                    className={`py-3 px-4 ${statusConfig[nextStatus].color} text-white rounded-xl font-medium hover:opacity-90 transition-opacity`}
                  >
                    {nextStatus === 'confirmed' && t('confirmOrder')}
                    {nextStatus === 'preparing' && t('startPreparing')}
                    {nextStatus === 'ready' && t('markReady')}
                    {nextStatus === 'served' && t('markServed')}
                    {nextStatus === 'completed' && t('completeOrder')}
                  </button>
                ))}
                <button
                  onClick={() => onStatusChange('cancelled')}
                  className="py-3 px-4 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
                >
                  {t('cancelOrder')}
                </button>
              </div>
            </div>
          )}

          {/* Print & Close */}
          <div className="flex gap-3">
            <button className="flex-1 py-3 bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-600 flex items-center justify-center gap-2">
              <Printer className="w-4 h-4" />
              {t('printOrder')}
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600"
            >
              {tCommon('close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
