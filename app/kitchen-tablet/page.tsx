'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, roleConfig } from '@/stores/authStore';
import {
  ChefHat, Clock, CheckCircle, AlertCircle, Bell,
  Volume2, VolumeX, RefreshCw, Flame, LogOut
} from 'lucide-react';

interface KitchenOrder {
  id: string;
  orderNumber: string;
  table?: string;
  type: 'dine_in' | 'takeaway' | 'delivery';
  items: { id: string; name: string; quantity: number; notes?: string; status: string }[];
  createdAt: string;
  priority: 'normal' | 'rush';
}

// Demo data
const demoOrders: KitchenOrder[] = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    table: '5',
    type: 'dine_in',
    priority: 'rush',
    items: [
      { id: '1a', name: 'Izgara Levrek', quantity: 2, notes: 'Az pişmiş', status: 'pending' },
      { id: '1b', name: 'Karides Güveç', quantity: 1, status: 'pending' },
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    orderNumber: 'ORD-002',
    table: '3',
    type: 'dine_in',
    priority: 'normal',
    items: [
      { id: '2a', name: 'Adana Kebap', quantity: 3, status: 'preparing' },
      { id: '2b', name: 'Pilav', quantity: 3, status: 'ready' },
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    orderNumber: 'ORD-003',
    type: 'takeaway',
    priority: 'normal',
    items: [
      { id: '3a', name: 'Lahmacun', quantity: 5, status: 'ready' },
    ],
    createdAt: new Date().toISOString()
  },
];

export default function KitchenTabletPage() {
  const router = useRouter();
  const { currentStaff, isAuthenticated, logout } = useAuthStore();
  const [orders, setOrders] = useState<KitchenOrder[]>(demoOrders);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    // Auth check
    if (!isAuthenticated || !currentStaff) {
      router.push('/');
      return;
    }
    
    // Role check - only kitchen allowed
    if (currentStaff.role !== 'kitchen' && currentStaff.role !== 'owner' && currentStaff.role !== 'manager') {
      const config = roleConfig[currentStaff.role];
      router.push(config.defaultRoute);
      return;
    }

    // Time update
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('tr-TR'));
    }, 1000);
    setCurrentTime(new Date().toLocaleTimeString('tr-TR'));
    
    return () => clearInterval(timer);
  }, [isAuthenticated, currentStaff, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getOrdersByStatus = (status: string) => {
    return orders.filter(order => {
      if (status === 'pending') return order.items.every(i => i.status === 'pending');
      if (status === 'preparing') return order.items.some(i => i.status === 'preparing');
      if (status === 'ready') return order.items.every(i => i.status === 'ready');
      return false;
    });
  };

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          items: order.items.map(item => ({ ...item, status: newStatus }))
        };
      }
      return order;
    }));
  };

  const pendingOrders = getOrdersByStatus('pending');
  const preparingOrders = getOrdersByStatus('preparing');
  const readyOrders = getOrdersByStatus('ready');

  if (!currentStaff) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
            <ChefHat className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold">MUTFAK</h1>
            <p className="text-gray-400 text-sm">{currentTime}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Stats */}
          <div className="flex items-center gap-4 bg-gray-700 rounded-xl px-4 py-2">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-500">{pendingOrders.length}</p>
              <p className="text-xs text-gray-400">Bekliyor</p>
            </div>
            <div className="w-px h-8 bg-gray-600" />
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-500">{preparingOrders.length}</p>
              <p className="text-xs text-gray-400">Hazırlanıyor</p>
            </div>
            <div className="w-px h-8 bg-gray-600" />
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{readyOrders.length}</p>
              <p className="text-xs text-gray-400">Hazır</p>
            </div>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-3 rounded-xl ${soundEnabled ? 'bg-green-600' : 'bg-gray-700'}`}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Refresh */}
          <button className="p-3 bg-gray-700 rounded-xl hover:bg-gray-600">
            <RefreshCw className="w-5 h-5" />
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl"
          >
            <LogOut className="w-5 h-5" />
            <span>Çıkış</span>
          </button>
        </div>
      </header>

      {/* Kanban Board */}
      <div className="p-6 grid grid-cols-3 gap-6 h-[calc(100vh-100px)]">
        {/* Pending Column */}
        <div className="bg-gray-800 rounded-2xl p-4 flex flex-col">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold">Bekleyen</h2>
              <p className="text-sm text-gray-400">{pendingOrders.length} sipariş</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3">
            {pendingOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onStart={() => updateOrderStatus(order.id, 'preparing')}
                color="amber"
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

        {/* Preparing Column */}
        <div className="bg-gray-800 rounded-2xl p-4 flex flex-col">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
            <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center animate-pulse">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold">Hazırlanıyor</h2>
              <p className="text-sm text-gray-400">{preparingOrders.length} sipariş</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3">
            {preparingOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onComplete={() => updateOrderStatus(order.id, 'ready')}
                color="purple"
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

        {/* Ready Column */}
        <div className="bg-gray-800 rounded-2xl p-4 flex flex-col">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-700">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold">Hazır</h2>
              <p className="text-sm text-gray-400">{readyOrders.length} sipariş</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3">
            {readyOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onServe={() => setOrders(prev => prev.filter(o => o.id !== order.id))}
                color="green"
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

function OrderCard({ 
  order, 
  onStart, 
  onComplete, 
  onServe,
  color 
}: { 
  order: KitchenOrder; 
  onStart?: () => void;
  onComplete?: () => void;
  onServe?: () => void;
  color: 'amber' | 'purple' | 'green';
}) {
  const colorClasses = {
    amber: 'bg-amber-600',
    purple: 'bg-purple-600',
    green: 'bg-green-600'
  };

  return (
    <div className={`rounded-xl overflow-hidden ${order.priority === 'rush' ? 'ring-2 ring-red-500' : ''}`}>
      <div className={`${colorClasses[color]} px-4 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="font-bold">{order.orderNumber}</span>
          {order.priority === 'rush' && <Flame className="w-4 h-4 text-yellow-300" />}
        </div>
        {order.table && (
          <span className="bg-white/20 px-2 py-0.5 rounded text-sm">Masa {order.table}</span>
        )}
      </div>
      <div className="bg-gray-700 p-3 space-y-2">
        {order.items.map(item => (
          <div key={item.id} className="flex items-center gap-2">
            <span className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center text-sm font-bold">
              {item.quantity}
            </span>
            <div className="flex-1">
              <p className="text-sm">{item.name}</p>
              {item.notes && <p className="text-xs text-amber-400">⚠️ {item.notes}</p>}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-gray-700 px-3 pb-3">
        {onStart && (
          <button onClick={onStart} className="w-full py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium">
            Hazırlamaya Başla
          </button>
        )}
        {onComplete && (
          <button onClick={onComplete} className="w-full py-2 bg-green-600 hover:bg-green-500 rounded-lg font-medium">
            Tümü Hazır
          </button>
        )}
        {onServe && (
          <button onClick={onServe} className="w-full py-2 bg-white text-green-700 hover:bg-green-100 rounded-lg font-medium">
            Servis Edildi
          </button>
        )}
      </div>
    </div>
  );
}
