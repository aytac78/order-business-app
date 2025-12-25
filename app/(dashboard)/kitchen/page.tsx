'use client';

import { useState, useEffect } from 'react';
import { useVenueStore } from '@/stores';
import { PanelHeader } from '@/components/panels/PanelHeader';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Bell,
  ChefHat,
  Flame,
  Play
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
  type: 'dine_in' | 'takeaway' | 'delivery';
  items: KitchenOrderItem[];
  createdAt: string;
  priority: 'normal' | 'rush';
}

const initialOrders: KitchenOrder[] = [
  {
    id: '1',
    orderNumber: 'ORD-127',
    table: '5',
    type: 'dine_in',
    priority: 'normal',
    items: [
      { id: '1a', name: 'Izgara Levrek', quantity: 2, notes: 'Çok pişmiş olmasın', status: 'pending' },
      { id: '1b', name: 'Karides Güveç', quantity: 1, status: 'pending' },
    ],
    createdAt: '2025-01-15T19:30:00'
  },
  {
    id: '2',
    orderNumber: 'ORD-126',
    table: '12',
    type: 'dine_in',
    priority: 'normal',
    items: [
      { id: '2a', name: 'Pizza Margherita', quantity: 1, status: 'preparing' },
      { id: '2b', name: 'Caesar Salata', quantity: 1, status: 'pending' },
    ],
    createdAt: '2025-01-15T19:35:00'
  },
  {
    id: '3',
    orderNumber: 'ORD-125',
    type: 'delivery',
    priority: 'rush',
    items: [
      { id: '3a', name: 'Karışık Izgara', quantity: 2, status: 'preparing' },
      { id: '3b', name: 'Pilav', quantity: 2, status: 'ready' },
      { id: '3c', name: 'Mercimek Çorbası', quantity: 2, status: 'pending' },
    ],
    createdAt: '2025-01-15T19:20:00'
  },
  {
    id: '4',
    orderNumber: 'ORD-124',
    type: 'takeaway',
    priority: 'normal',
    items: [
      { id: '4a', name: 'Adana Kebap', quantity: 3, status: 'pending' },
      { id: '4b', name: 'Lahmacun', quantity: 5, status: 'pending' },
    ],
    createdAt: '2025-01-15T19:40:00'
  },
  {
    id: '5',
    orderNumber: 'ORD-123',
    table: '8',
    type: 'dine_in',
    priority: 'rush',
    items: [
      { id: '5a', name: 'Biftek (Medium)', quantity: 2, notes: 'Medium pişirme', status: 'ready' },
      { id: '5b', name: 'Patates Püresi', quantity: 2, status: 'ready' },
    ],
    createdAt: '2025-01-15T19:15:00'
  },
];

export default function KitchenPage() {
  const { currentVenue } = useVenueStore();
  const [orders, setOrders] = useState<KitchenOrder[]>(initialOrders);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [displayTime, setDisplayTime] = useState<string>('--:--:--');

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      setDisplayTime(new Date().toLocaleTimeString('tr-TR'));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleItemStatusChange = (orderId: string, itemId: string, newStatus: 'pending' | 'preparing' | 'ready') => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const updatedItems = order.items.map(item =>
          item.id === itemId ? { ...item, status: newStatus } : item
        );
        return { ...order, items: updatedItems };
      }
      return order;
    }));
  };

  const handleStartOrder = (orderId: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const updatedItems = order.items.map(item =>
          item.status === 'pending' ? { ...item, status: 'preparing' as const } : item
        );
        return { ...order, items: updatedItems };
      }
      return order;
    }));
  };

  const handleCompleteOrder = (orderId: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const updatedItems = order.items.map(item => ({ ...item, status: 'ready' as const }));
        return { ...order, items: updatedItems };
      }
      return order;
    }));
  };

  const handleServeOrder = (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  const getOrderStatus = (order: KitchenOrder): 'pending' | 'preparing' | 'ready' => {
    if (order.items.every(item => item.status === 'ready')) return 'ready';
    if (order.items.some(item => item.status === 'preparing')) return 'preparing';
    return 'pending';
  };

  const pendingOrders = orders.filter(o => getOrderStatus(o) === 'pending');
  const preparingOrders = orders.filter(o => getOrderStatus(o) === 'preparing');
  const readyOrders = orders.filter(o => getOrderStatus(o) === 'ready');

  const typeLabels = {
    dine_in: { text: 'Masada', color: 'bg-blue-600' },
    takeaway: { text: 'Paket', color: 'bg-purple-600' },
    delivery: { text: 'Teslimat', color: 'bg-green-600' }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Yükleniyor...</div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gray-900 text-white -m-6 p-6">
      {/* Header with PanelHeader */}
      <PanelHeader
        title="Mutfak Ekranı"
        subtitle={displayTime}
        icon={<ChefHat className="w-8 h-8" />}
        iconBgColor="text-orange-500"
        soundEnabled={soundEnabled}
        onSoundToggle={() => setSoundEnabled(!soundEnabled)}
        showSound={true}
      >
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
      </PanelHeader>

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
              <div key={order.id} className={`rounded-xl overflow-hidden ${
                order.priority === 'rush' ? 'bg-red-900/50 border-2 border-red-500' : 'bg-gray-700'
              }`}>
                <div className="px-4 py-3 bg-amber-600 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{order.orderNumber}</span>
                    {order.priority === 'rush' && <Flame className="w-5 h-5 text-yellow-300" />}
                  </div>
                  <div className="flex items-center gap-2">
                    {order.table && <span className="bg-white/20 px-2 py-1 rounded text-sm">Masa #{order.table}</span>}
                    <span className={`px-2 py-1 rounded text-sm ${typeLabels[order.type].color}`}>
                      {typeLabels[order.type].text}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 space-y-2">
                  {order.items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-600/50 rounded-lg">
                      <span className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center font-bold">
                        {item.quantity}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        {item.notes && <p className="text-xs text-amber-400">⚠️ {item.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 pt-0">
                  <button
                    onClick={() => handleStartOrder(order.id)}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Hazırlamaya Başla
                  </button>
                </div>
              </div>
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
              <div key={order.id} className={`rounded-xl overflow-hidden ${
                order.priority === 'rush' ? 'bg-red-900/50 border-2 border-red-500' : 'bg-gray-700'
              }`}>
                <div className="px-4 py-3 bg-purple-600 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{order.orderNumber}</span>
                    {order.priority === 'rush' && <Flame className="w-5 h-5 text-yellow-300" />}
                  </div>
                  <div className="flex items-center gap-2">
                    {order.table && <span className="bg-white/20 px-2 py-1 rounded text-sm">Masa #{order.table}</span>}
                    <span className={`px-2 py-1 rounded text-sm ${typeLabels[order.type].color}`}>
                      {typeLabels[order.type].text}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 space-y-2">
                  {order.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.status !== 'ready') {
                          handleItemStatusChange(order.id, item.id, 'ready');
                        }
                      }}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${
                        item.status === 'ready' 
                          ? 'bg-green-600/50 line-through opacity-60' 
                          : 'bg-purple-600/30 hover:bg-purple-600/50 cursor-pointer'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                        item.status === 'ready' ? 'bg-green-600' : 'bg-purple-600'
                      }`}>
                        {item.status === 'ready' ? <CheckCircle className="w-5 h-5" /> : item.quantity}
                      </span>
                      <div className="flex-1 text-left">
                        <p className="font-medium">{item.name}</p>
                        {item.notes && <p className="text-xs text-amber-400">⚠️ {item.notes}</p>}
                      </div>
                      {item.status !== 'ready' && (
                        <span className="text-xs bg-white/10 px-2 py-1 rounded">Tıkla: Hazır</span>
                      )}
                    </button>
                  ))}
                </div>
                
                <div className="p-4 pt-0">
                  <button
                    onClick={() => handleCompleteOrder(order.id)}
                    className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Tümü Hazır
                  </button>
                </div>
              </div>
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
            <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center animate-bounce">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Hazır</h2>
              <p className="text-sm text-gray-400">{readyOrders.length} sipariş</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {readyOrders.map(order => (
              <div key={order.id} className="rounded-xl overflow-hidden bg-green-900/50 border-2 border-green-500">
                <div className="px-4 py-3 bg-green-600 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{order.orderNumber}</span>
                    <Bell className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-2">
                    {order.table && <span className="bg-white/20 px-2 py-1 rounded text-sm">Masa #{order.table}</span>}
                    <span className={`px-2 py-1 rounded text-sm ${typeLabels[order.type].color}`}>
                      {typeLabels[order.type].text}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 space-y-2">
                  {order.items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-2 bg-green-600/30 rounded-lg">
                      <span className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5" />
                      </span>
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                      </div>
                      <span className="text-xs">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 pt-0">
                  <button
                    onClick={() => handleServeOrder(order.id)}
                    className="w-full py-3 bg-white text-green-700 hover:bg-green-100 rounded-xl font-bold flex items-center justify-center gap-2"
                  >
                    <Bell className="w-5 h-5" />
                    Servis Edildi
                  </button>
                </div>
              </div>
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
