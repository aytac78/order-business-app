'use client';

import { useState, useEffect } from 'react';
import { useVenueStore, useOrderStore, broadcastSync } from '@/stores';
import { ClipboardList, Clock, CheckCircle, XCircle, AlertCircle, Search, Filter, Eye, Printer, ChevronRight, Users, MapPin, Phone, Flame } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  type: 'dine_in' | 'takeaway' | 'delivery' | 'qr_order';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  waiter?: string;
  priority: 'normal' | 'rush';
  createdAt: string;
  notes?: string;
}

const demoOrders: Order[] = [
  { id: '1', orderNumber: 'ORD-127', type: 'dine_in', status: 'preparing', tableNumber: '5', items: [{ name: 'Izgara Levrek', quantity: 2, price: 320 }, { name: 'Karides Güveç', quantity: 1, price: 280 }], total: 920, waiter: 'Ahmet', priority: 'normal', createdAt: new Date(Date.now() - 15 * 60000).toISOString() },
  { id: '2', orderNumber: 'ORD-126', type: 'dine_in', status: 'pending', tableNumber: '12', items: [{ name: 'Pizza Margherita', quantity: 1, price: 180 }, { name: 'Caesar Salata', quantity: 1, price: 120 }], total: 300, waiter: 'Mehmet', priority: 'normal', createdAt: new Date(Date.now() - 10 * 60000).toISOString() },
  { id: '3', orderNumber: 'ORD-125', type: 'delivery', status: 'ready', customerName: 'Ali Yıldız', customerPhone: '0532 111 2233', items: [{ name: 'Karışık Izgara', quantity: 2, price: 350 }], total: 700, priority: 'rush', createdAt: new Date(Date.now() - 25 * 60000).toISOString(), notes: 'Kapı zili bozuk, arayın' },
  { id: '4', orderNumber: 'ORD-124', type: 'takeaway', status: 'confirmed', customerName: 'Mehmet B.', customerPhone: '0533 222 3344', items: [{ name: 'Adana Kebap', quantity: 3, price: 200 }, { name: 'Lahmacun', quantity: 5, price: 45 }], total: 825, priority: 'normal', createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: '5', orderNumber: 'ORD-123', type: 'dine_in', status: 'served', tableNumber: '8', items: [{ name: 'Biftek', quantity: 2, price: 420 }], total: 840, waiter: 'Ayşe', priority: 'rush', createdAt: new Date(Date.now() - 45 * 60000).toISOString() },
  { id: '6', orderNumber: 'ORD-122', type: 'qr_order', status: 'pending', tableNumber: '3', items: [{ name: 'Mojito', quantity: 4, price: 180 }], total: 720, priority: 'normal', createdAt: new Date(Date.now() - 2 * 60000).toISOString() },
];

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Bekliyor', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  confirmed: { label: 'Onaylı', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  preparing: { label: 'Hazırlanıyor', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  ready: { label: 'Hazır', color: 'text-green-700', bgColor: 'bg-green-100' },
  served: { label: 'Servis Edildi', color: 'text-teal-700', bgColor: 'bg-teal-100' },
  completed: { label: 'Tamamlandı', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  cancelled: { label: 'İptal', color: 'text-red-700', bgColor: 'bg-red-100' },
};

const typeLabels: Record<string, { label: string; color: string }> = {
  dine_in: { label: 'Masada', color: 'bg-blue-500' },
  takeaway: { label: 'Paket', color: 'bg-purple-500' },
  delivery: { label: 'Teslimat', color: 'bg-green-500' },
  qr_order: { label: 'QR Sipariş', color: 'bg-orange-500' },
};

export default function OrdersPage() {
  const { currentVenue } = useVenueStore();
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<Order[]>(demoOrders);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesType = typeFilter === 'all' || o.type === typeFilter;
    const matchesSearch = o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         o.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         o.tableNumber?.includes(searchQuery);
    return matchesStatus && matchesType && matchesSearch;
  });

  const getElapsedTime = (createdAt: string) => Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    broadcastSync({ type: 'ORDER_UPDATED', venue_id: currentVenue?.id || '1', payload: { orderId, status }, timestamp: new Date().toISOString() });
  };

  const stats = {
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    total: orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length,
  };

  if (!mounted) return <div className="animate-pulse bg-gray-100 rounded-2xl h-96" />;

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Mekan Seçimi Gerekli</h2>
          <p className="text-gray-500">Sipariş yönetimi için lütfen bir mekan seçin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Siparişler</h1>
          <p className="text-gray-500">{currentVenue?.name} • {stats.total} aktif sipariş</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><Clock className="w-5 h-5 text-amber-600" /></div>
            <div><p className="text-2xl font-bold text-amber-700">{stats.pending}</p><p className="text-xs text-amber-600">Bekliyor</p></div>
          </div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><Flame className="w-5 h-5 text-purple-600" /></div>
            <div><p className="text-2xl font-bold text-purple-700">{stats.preparing}</p><p className="text-xs text-purple-600">Hazırlanıyor</p></div>
          </div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold text-green-700">{stats.ready}</p><p className="text-xs text-green-600">Hazır</p></div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><ClipboardList className="w-5 h-5 text-gray-600" /></div>
            <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-gray-600">Toplam Aktif</p></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border flex flex-wrap items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Sipariş no, müşteri veya masa ara..." className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-lg">
          <option value="all">Tüm Durumlar</option>
          <option value="pending">Bekliyor</option>
          <option value="confirmed">Onaylı</option>
          <option value="preparing">Hazırlanıyor</option>
          <option value="ready">Hazır</option>
          <option value="served">Servis Edildi</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-4 py-2 border rounded-lg">
          <option value="all">Tüm Tipler</option>
          <option value="dine_in">Masada</option>
          <option value="takeaway">Paket</option>
          <option value="delivery">Teslimat</option>
          <option value="qr_order">QR Sipariş</option>
        </select>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-sm text-gray-500">
                <th className="px-4 py-3 font-medium">Sipariş</th>
                <th className="px-4 py-3 font-medium">Tip</th>
                <th className="px-4 py-3 font-medium">Müşteri/Masa</th>
                <th className="px-4 py-3 font-medium">Ürünler</th>
                <th className="px-4 py-3 font-medium">Toplam</th>
                <th className="px-4 py-3 font-medium">Süre</th>
                <th className="px-4 py-3 font-medium">Durum</th>
                <th className="px-4 py-3 font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{order.orderNumber}</span>
                      {order.priority === 'rush' && <Flame className="w-4 h-4 text-red-500" />}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs text-white ${typeLabels[order.type].color}`}>
                      {typeLabels[order.type].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {order.type === 'dine_in' || order.type === 'qr_order' ? (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>Masa {order.tableNumber}</span>
                        {order.waiter && <span className="text-xs text-gray-400">• {order.waiter}</span>}
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium">{order.customerName}</p>
                        <p className="text-xs text-gray-500">{order.customerPhone}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-600">{order.items.map(i => `${i.quantity}x ${i.name}`).join(', ').slice(0, 40)}...</p>
                  </td>
                  <td className="px-4 py-3 font-bold text-orange-600">₺{order.total}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{getElapsedTime(order.createdAt)} dk</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig[order.status].bgColor} ${statusConfig[order.status].color}`}>
                      {statusConfig[order.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {order.status === 'pending' && (
                        <button onClick={() => updateOrderStatus(order.id, 'confirmed')} className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">Onayla</button>
                      )}
                      {order.status === 'confirmed' && (
                        <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200">Hazırla</button>
                      )}
                      {order.status === 'ready' && (
                        <button onClick={() => updateOrderStatus(order.id, 'served')} className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200">Servis</button>
                      )}
                      <button onClick={() => setSelectedOrder(order)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Eye className="w-4 h-4 text-gray-500" /></button>
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg"><Printer className="w-4 h-4 text-gray-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredOrders.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Sipariş bulunamadı</p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{selectedOrder.orderNumber}</h2>
                  {selectedOrder.priority === 'rush' && <Flame className="w-5 h-5 text-red-500" />}
                </div>
                <p className="text-gray-500">{typeLabels[selectedOrder.type].label}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {(selectedOrder.type === 'dine_in' || selectedOrder.type === 'qr_order') ? (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Users className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium">Masa {selectedOrder.tableNumber}</p>
                    {selectedOrder.waiter && <p className="text-sm text-gray-500">Garson: {selectedOrder.waiter}</p>}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-xl space-y-2">
                  <div className="flex items-center gap-2"><Users className="w-4 h-4 text-gray-400" /><span>{selectedOrder.customerName}</span></div>
                  <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /><span>{selectedOrder.customerPhone}</span></div>
                </div>
              )}
              
              {selectedOrder.notes && (
                <div className="p-3 bg-amber-50 rounded-xl">
                  <p className="text-sm text-amber-700">📝 {selectedOrder.notes}</p>
                </div>
              )}
              
              <div>
                <h3 className="font-medium mb-2">Ürünler</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded flex items-center justify-center text-sm font-bold">{item.quantity}</span>
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">₺{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex justify-between text-lg font-bold">
                  <span>Toplam</span>
                  <span className="text-orange-600">₺{selectedOrder.total}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                {selectedOrder.status === 'pending' && (
                  <button onClick={() => { updateOrderStatus(selectedOrder.id, 'confirmed'); setSelectedOrder(null); }} className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium">Onayla</button>
                )}
                {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'completed' && (
                  <button onClick={() => { updateOrderStatus(selectedOrder.id, 'cancelled'); setSelectedOrder(null); }} className="flex-1 py-3 border border-red-200 text-red-600 rounded-xl font-medium">İptal Et</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
