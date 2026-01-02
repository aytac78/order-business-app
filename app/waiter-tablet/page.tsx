'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import {
  ShoppingCart,
  Users,
  Clock,
  Bell,
  RefreshCw,
  Plus,
  CheckCircle,
  AlertCircle,
  LogOut,
  ChefHat,
  CreditCard,
  Volume2,
  VolumeX
} from 'lucide-react';

interface TableData {
  id: string;
  table_number: string;
  capacity: number;
  section: string;
  status: string;
  current_guests?: number;
  customer_name?: string;
  seated_at?: string;
}

interface Order {
  id: string;
  order_number: string;
  table_number: string;
  status: string;
  total: number;
  items: any[];
  created_at: string;
}

type TabType = 'masa' | 'paket' | 'kurye';

export default function WaiterTabletPage() {
  const { currentVenue } = useVenueStore();
  const [tables, setTables] = useState<TableData[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('masa');
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [displayTime, setDisplayTime] = useState('--:--:--');

  useEffect(() => {
    const updateTime = () => setDisplayTime(new Date().toLocaleTimeString('tr-TR'));
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Verileri yükle
  const loadData = useCallback(async () => {
    if (!currentVenue?.id) return;
    setIsLoading(true);

    // Masalar
    const { data: tableData } = await supabase
      .from('tables')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .order('table_number');

    // Siparişler
    const { data: orderData } = await supabase
      .from('orders')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .in('status', ['pending', 'confirmed', 'preparing', 'ready', 'served'])
      .order('created_at', { ascending: false });

    setTables(tableData || []);
    setOrders(orderData || []);
    setIsLoading(false);
  }, [currentVenue?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time
  useEffect(() => {
    if (!currentVenue?.id) return;

    const channel = supabase
      .channel('waiter-tablet')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables', filter: `venue_id=eq.${currentVenue.id}` }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `venue_id=eq.${currentVenue.id}` }, (payload) => {
        loadData();
        // Sipariş hazır olduğunda ses çal
        if (payload.new && (payload.new as any).status === 'ready' && soundEnabled) {
          playSound();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentVenue?.id, loadData, soundEnabled]);

  const playSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {});
    } catch (e) {}
  };

  // Masa siparişlerini getir
  const getTableOrders = (tableNumber: string) => orders.filter(o => o.table_number === tableNumber);

  // İstatistikler
  const occupiedTables = tables.filter(t => t.status === 'occupied');
  const readyOrders = orders.filter(o => o.status === 'ready');
  const reservedTables = tables.filter(t => t.status === 'reserved');

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
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-teal-900 to-cyan-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-green-500 flex items-center justify-center">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">GARSON</h1>
            <p className="text-green-300">{displayTime}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 bg-white/10 rounded-xl p-1">
          {[
            { id: 'masa' as TabType, label: 'Masa', icon: Users },
            { id: 'paket' as TabType, label: 'Paket', icon: ShoppingCart },
            { id: 'kurye' as TabType, label: 'Kurye', icon: Clock },
          ].map(tab => (
            <button type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id ? 'bg-white text-gray-900' : 'text-white/70 hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {readyOrders.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500 rounded-xl animate-pulse">
              <Bell className="w-5 h-5" />
              <span className="font-bold">{readyOrders.length} Hazır</span>
            </div>
          )}
          <button type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-3 rounded-xl ${soundEnabled ? 'bg-green-500' : 'bg-gray-700'}`}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button type="button"
            onClick={loadData}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-xl"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button type="button" onClick={() => { if(confirm("Çıkış yapmak istediğinize emin misiniz?")) { localStorage.removeItem("order-auth-storage"); window.location.href = "/"; } }} className="p-3 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-red-400" title="Çıkış">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sol: Masalar */}
        <div className="w-1/2 p-4 border-r border-white/10 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 text-green-300">Masa Seç ({tables.length} masa)</h2>
          
          <div className="grid grid-cols-3 gap-3">
            {tables.map(table => {
              const tableOrders = getTableOrders(table.table_number);
              const hasReadyOrder = tableOrders.some(o => o.status === 'ready');
              const totalAmount = tableOrders.reduce((sum, o) => sum + (o.total || 0), 0);
              const isOccupied = table.status === 'occupied';
              const isReserved = table.status === 'reserved';
              const isSelected = selectedTable?.id === table.id;

              return (
                <button type="button"
                  key={table.id}
                  onClick={() => setSelectedTable(table)}
                  className={`relative p-4 rounded-xl text-left transition-all ${
                    hasReadyOrder ? 'bg-green-500 ring-4 ring-green-300 animate-pulse' :
                    isSelected ? 'bg-white/30 ring-2 ring-white' :
                    isOccupied ? 'bg-orange-500/30 border-2 border-orange-500' :
                    isReserved ? 'bg-amber-500/30 border-2 border-amber-500' :
                    'bg-white/10 hover:bg-white/20 border-2 border-transparent'
                  }`}
                >
                  {hasReadyOrder && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-400 rounded-full flex items-center justify-center animate-bounce">
                      <Bell className="w-4 h-4 text-green-900" />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">{table.table_number}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      isOccupied ? 'bg-orange-500' :
                      isReserved ? 'bg-amber-500' :
                      'bg-green-500'
                    }`}>
                      {isOccupied ? 'Dolu' : isReserved ? 'Rezerve' : 'Boş'}
                    </span>
                  </div>
                  
                  {table.current_guests && (
                    <p className="text-sm text-white/70">{table.current_guests} kişi</p>
                  )}
                  
                  {tableOrders.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/20">
                      <p className="text-xs text-white/50">{tableOrders.length} sipariş</p>
                      <p className="font-bold">₺{totalAmount.toLocaleString()}</p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sağ: Sipariş Detay */}
        <div className="w-1/2 p-4 flex flex-col">
          <h2 className="text-lg font-semibold mb-4 text-green-300">Sipariş</h2>
          
          {selectedTable ? (
            <div className="flex-1 flex flex-col">
              {/* Masa Bilgisi */}
              <div className="bg-white/10 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">Masa {selectedTable.table_number}</h3>
                    <p className="text-white/70">{selectedTable.section} • {selectedTable.capacity} kişilik</p>
                  </div>
                  {selectedTable.current_guests && (
                    <div className="text-right">
                      <p className="text-sm text-white/50">Oturan</p>
                      <p className="text-xl font-bold">{selectedTable.current_guests} kişi</p>
                    </div>
                  )}
                </div>
                {selectedTable.customer_name && (
                  <p className="mt-2 text-white/70">👤 {selectedTable.customer_name}</p>
                )}
              </div>

              {/* Siparişler */}
              <div className="flex-1 overflow-y-auto space-y-3">
                {getTableOrders(selectedTable.table_number).map(order => (
                  <div 
                    key={order.id} 
                    className={`rounded-xl overflow-hidden ${
                      order.status === 'ready' ? 'bg-green-500/30 ring-2 ring-green-400' : 'bg-white/10'
                    }`}
                  >
                    <div className={`px-4 py-2 flex items-center justify-between ${
                      order.status === 'ready' ? 'bg-green-500' :
                      order.status === 'preparing' ? 'bg-purple-500' :
                      'bg-amber-500'
                    }`}>
                      <span className="font-bold">{order.order_number}</span>
                      <span className="text-sm">
                        {order.status === 'ready' ? '✅ HAZIR' :
                         order.status === 'preparing' ? '🔥 Hazırlanıyor' :
                         '⏳ Bekliyor'}
                      </span>
                    </div>
                    <div className="p-4">
                      {(order.items || []).map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-white/20 rounded flex items-center justify-center text-xs font-bold">
                              {item.quantity}
                            </span>
                            <span>{item.product_name}</span>
                          </div>
                          <span>₺{item.total_price}</span>
                        </div>
                      ))}
                      <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between">
                        <span className="text-white/50">Toplam</span>
                        <span className="text-xl font-bold">₺{order.total?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {getTableOrders(selectedTable.table_number).length === 0 && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-white/50">
                      <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Sepet boş</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Alt Butonlar */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button type="button" className="py-4 bg-orange-500 hover:bg-orange-600 rounded-xl font-bold flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" />
                  Sipariş Ekle
                </button>
                <button type="button" className="py-4 bg-green-500 hover:bg-green-600 rounded-xl font-bold flex items-center justify-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Hesap Al
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-white/50">
                <Users className="w-20 h-20 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Masa seçin</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}