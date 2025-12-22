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
  Truck,
  UtensilsCrossed,
  Coffee,
  Wine
} from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
  status?: 'pending' | 'preparing' | 'ready';
  category?: string;
}

interface KitchenOrder {
  id: string;
  order_number: string;
  table_number?: string;
  type: 'dine_in' | 'takeaway' | 'delivery';
  status: string;
  items: OrderItem[];
  created_at: string;
}

// Kategori önceliği - düşük sayı önce çıkar
const categoryPriority: Record<string, number> = {
  'Soğuk Mezeler': 1,
  'Soğuk İçecekler': 1,
  'Biralar': 1,
  'Sıcak İçecekler': 2,
  'Salatalar': 2,
  'Çorbalar': 3,
  'Sıcak Mezeler': 4,
  'Ara Sıcaklar': 5,
  'Makarnalar': 6,
  'Pizzalar': 6,
  'Et Yemekleri': 7,
  'Deniz Ürünleri': 7,
  'Tavuk Yemekleri': 7,
  'Kebaplar': 7,
  'Tatlılar': 8,
};

const getCategoryPriority = (category?: string): number => {
  if (!category) return 5;
  for (const [key, value] of Object.entries(categoryPriority)) {
    if (category.toLowerCase().includes(key.toLowerCase())) return value;
  }
  return 5;
};

// Kategori tipini belirle
const getCategoryType = (category?: string): 'cold' | 'hot' | 'drink' | 'dessert' => {
  if (!category) return 'hot';
  const cat = category.toLowerCase();
  if (cat.includes('içecek') || cat.includes('bira') || cat.includes('şarap') || cat.includes('rakı') || cat.includes('votka') || cat.includes('viski')) return 'drink';
  if (cat.includes('soğuk') || cat.includes('salata')) return 'cold';
  if (cat.includes('tatlı') || cat.includes('dondurma')) return 'dessert';
  return 'hot';
};

export default function KitchenPage() {
  const { currentVenue } = useVenueStore();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [displayTime, setDisplayTime] = useState<string>('--:--:--');

  // Siparişleri yükle
  const fetchOrders = useCallback(async () => {
    if (!currentVenue?.id) return;
    
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
      .order('created_at', { ascending: true });

    if (!error && data) {
      setOrders(data.map(order => ({
        ...order,
        items: (order.items || []).map((item: OrderItem) => ({
          ...item,
          status: item.status || 'pending'
        }))
      })));
    }
    setIsLoading(false);
  }, [currentVenue?.id]);

  // Real-time subscription
  useEffect(() => {
    fetchOrders();

    if (currentVenue?.id) {
      const channel = supabase
        .channel('kitchen-orders')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'orders', filter: `venue_id=eq.${currentVenue.id}` },
          () => {
            fetchOrders();
            if (soundEnabled) {
              try { new Audio('/notification.mp3').play().catch(() => {}); } catch {}
            }
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [currentVenue?.id, fetchOrders, soundEnabled]);

  // Saat
  useEffect(() => {
    const updateTime = () => setDisplayTime(new Date().toLocaleTimeString('tr-TR'));
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Ürün durumunu güncelle
  const updateItemStatus = async (orderId: string, itemId: string, newStatus: 'pending' | 'preparing' | 'ready') => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const updatedItems = order.items.map(item => 
      item.id === itemId ? { ...item, status: newStatus } : item
    );

    // Tüm ürünler hazırsa sipariş hazır
    const allReady = updatedItems.every(item => item.status === 'ready');
    const anyPreparing = updatedItems.some(item => item.status === 'preparing');
    
    let orderStatus = order.status;
    if (allReady) orderStatus = 'ready';
    else if (anyPreparing) orderStatus = 'preparing';

    await supabase
      .from('orders')
      .update({ 
        items: updatedItems, 
        status: orderStatus,
        updated_at: new Date().toISOString() 
      })
      .eq('id', orderId);

    fetchOrders();
  };

  // Tüm ürünleri hazırla
  const startAllItems = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const updatedItems = order.items.map(item => ({ ...item, status: 'preparing' as const }));

    await supabase
      .from('orders')
      .update({ items: updatedItems, status: 'preparing', updated_at: new Date().toISOString() })
      .eq('id', orderId);

    fetchOrders();
  };

  // Siparişi tamamla
  const completeOrder = async (orderId: string) => {
    await supabase
      .from('orders')
      .update({ status: 'served', updated_at: new Date().toISOString() })
      .eq('id', orderId);

    fetchOrders();
  };

  // Geçen süre
  const getElapsedTime = (createdAt: string) => Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);

  // Siparişleri grupla
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing' || o.status === 'confirmed');
  const readyOrders = orders.filter(o => o.status === 'ready');

  if (!currentVenue) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center -m-6">
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <ChefHat className="w-8 h-8 text-orange-500" />
          <div>
            <h1 className="text-2xl font-bold">Mutfak Ekranı</h1>
            <p className="text-gray-400 text-sm">{currentVenue.name} • {displayTime}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
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

          <button onClick={fetchOrders} className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl">
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-3 rounded-xl ${soundEnabled ? 'bg-green-600' : 'bg-gray-700'}`}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-gray-400">Soğuk/İçecek (Önce)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span className="text-gray-400">Sıcak Yemek</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-pink-500"></div>
          <span className="text-gray-400">Tatlı (Son)</span>
        </div>
      </div>

      {/* Kanban */}
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
            {pendingOrders.map(order => {
              const elapsed = getElapsedTime(order.created_at);
              const sortedItems = [...order.items].sort((a, b) => 
                getCategoryPriority(a.category) - getCategoryPriority(b.category)
              );

              return (
                <div key={order.id} className={`rounded-xl overflow-hidden bg-gray-700 ${elapsed > 10 ? 'ring-2 ring-red-500' : ''}`}>
                  <div className="px-4 py-3 bg-amber-600 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{order.order_number}</span>
                      {elapsed > 10 && <Flame className="w-5 h-5 text-yellow-300 animate-pulse" />}
                    </div>
                    <div className="flex items-center gap-2">
                      {order.table_number && <span className="bg-white/20 px-2 py-1 rounded text-sm">Masa #{order.table_number}</span>}
                      <span className="text-sm">{elapsed} dk</span>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-2">
                    {sortedItems.map((item, idx) => {
                      const type = getCategoryType(item.category);
                      const bgColor = type === 'drink' || type === 'cold' ? 'bg-blue-600/30' : type === 'dessert' ? 'bg-pink-600/30' : 'bg-orange-600/30';
                      const dotColor = type === 'drink' || type === 'cold' ? 'bg-blue-500' : type === 'dessert' ? 'bg-pink-500' : 'bg-orange-500';
                      
                      return (
                        <div key={idx} className={`flex items-center gap-3 p-2 ${bgColor} rounded-lg`}>
                          <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>
                          <span className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center font-bold">
                            {item.quantity}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            {item.notes && <p className="text-xs text-amber-400">⚠️ {item.notes}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="p-4 pt-0">
                    <button
                      onClick={() => startAllItems(order.id)}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Hazırlamaya Başla
                    </button>
                  </div>
                </div>
              );
            })}
            
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
            {preparingOrders.map(order => {
              const sortedItems = [...order.items].sort((a, b) => 
                getCategoryPriority(a.category) - getCategoryPriority(b.category)
              );
              const readyCount = order.items.filter(i => i.status === 'ready').length;
              const totalCount = order.items.length;

              return (
                <div key={order.id} className="rounded-xl overflow-hidden bg-gray-700">
                  <div className="px-4 py-3 bg-purple-600 flex items-center justify-between">
                    <span className="font-bold text-lg">{order.order_number}</span>
                    <div className="flex items-center gap-2">
                      {order.table_number && <span className="bg-white/20 px-2 py-1 rounded text-sm">Masa #{order.table_number}</span>}
                      <span className="bg-white/20 px-2 py-1 rounded text-sm">{readyCount}/{totalCount}</span>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-2">
                    {sortedItems.map((item, idx) => {
                      const isReady = item.status === 'ready';
                      const type = getCategoryType(item.category);
                      
                      return (
                        <button
                          key={idx}
                          onClick={() => !isReady && updateItemStatus(order.id, item.id, 'ready')}
                          disabled={isReady}
                          className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${
                            isReady 
                              ? 'bg-green-600/30 opacity-60' 
                              : 'bg-purple-600/30 hover:bg-purple-600/50 cursor-pointer'
                          }`}
                        >
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                            isReady ? 'bg-green-600' : 'bg-purple-600'
                          }`}>
                            {isReady ? <CheckCircle className="w-5 h-5" /> : item.quantity}
                          </span>
                          <div className="flex-1 text-left">
                            <p className={`font-medium ${isReady ? 'line-through' : ''}`}>{item.name}</p>
                            {item.notes && <p className="text-xs text-amber-400">⚠️ {item.notes}</p>}
                          </div>
                          {!isReady && (
                            <span className="text-xs bg-white/10 px-2 py-1 rounded">Tıkla: Hazır</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  
                  {readyCount === totalCount && (
                    <div className="p-4 pt-0">
                      <div className="text-center text-green-400 font-medium animate-pulse">
                        ✅ Tüm ürünler hazır!
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
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
              <Bell className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Hazır - Garson Bekliyor</h2>
              <p className="text-sm text-gray-400">{readyOrders.length} sipariş</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {readyOrders.map(order => (
              <div key={order.id} className="rounded-xl overflow-hidden bg-green-900/50 border-2 border-green-500 animate-pulse">
                <div className="px-4 py-3 bg-green-600 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{order.order_number}</span>
                    <Bell className="w-5 h-5" />
                  </div>
                  {order.table_number && <span className="bg-white/20 px-2 py-1 rounded text-sm font-bold">MASA #{order.table_number}</span>}
                </div>
                
                <div className="p-4 space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 bg-green-600/30 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <p className="font-medium flex-1">{item.name}</p>
                      <span className="text-xs">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 pt-0">
                  <button
                    onClick={() => completeOrder(order.id)}
                    className="w-full py-3 bg-white text-green-700 hover:bg-green-100 rounded-xl font-bold flex items-center justify-center gap-2"
                  >
                    <Bell className="w-5 h-5" />
                    Garson Aldı
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
