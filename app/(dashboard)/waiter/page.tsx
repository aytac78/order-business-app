'use client';

import { useState, useEffect } from 'react';
import { useVenueStore, useTableStore, Table } from '@/stores';
import { PanelHeader } from '@/components/panels/PanelHeader';
import {
  UtensilsCrossed,
  Users,
  Clock,
  AlertCircle,
  Bell,
  Plus,
  ChevronRight,
  Coffee,
  Utensils,
  ShoppingBag,
  Check,
  MessageSquare,
  Timer
} from 'lucide-react';

interface WaiterOrder {
  id: string;
  tableNumber: string;
  tableId: string;
  items: { name: string; quantity: number; status: 'pending' | 'preparing' | 'ready' }[];
  total: number;
  status: 'active' | 'ready' | 'waiting_payment';
  createdAt: string;
  notes?: string;
}

const demoOrders: WaiterOrder[] = [
  {
    id: '1',
    tableNumber: '5',
    tableId: '5',
    items: [
      { name: 'Izgara Levrek', quantity: 2, status: 'preparing' },
      { name: 'Karides Güveç', quantity: 1, status: 'pending' },
      { name: 'Humus', quantity: 2, status: 'ready' }
    ],
    total: 890,
    status: 'active',
    createdAt: '19:30'
  },
  {
    id: '2',
    tableNumber: '3',
    tableId: '3',
    items: [
      { name: 'Pizza Margherita', quantity: 1, status: 'ready' },
      { name: 'Caesar Salata', quantity: 1, status: 'ready' }
    ],
    total: 340,
    status: 'ready',
    createdAt: '19:45'
  },
  {
    id: '3',
    tableNumber: '8',
    tableId: '8',
    items: [
      { name: 'Biftek', quantity: 2, status: 'ready' },
      { name: 'Şarap', quantity: 1, status: 'ready' },
      { name: 'Patates Püresi', quantity: 2, status: 'ready' }
    ],
    total: 1250,
    status: 'waiting_payment',
    createdAt: '19:00',
    notes: 'Hesap istendi'
  }
];

export default function WaiterPage() {
  const { currentVenue } = useVenueStore();
  const { tables } = useTableStore();
  const [orders, setOrders] = useState<WaiterOrder[]>(demoOrders);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [displayTime, setDisplayTime] = useState<string>('--:--:--');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [showTableModal, setShowTableModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      setDisplayTime(new Date().toLocaleTimeString('tr-TR'));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const sections = ['all', ...new Set(tables.map(t => t.section))];
  const filteredTables = selectedSection === 'all' 
    ? tables 
    : tables.filter(t => t.section === selectedSection);

  const getTableStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'occupied': return 'bg-red-500';
      case 'reserved': return 'bg-amber-500';
      case 'cleaning': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getTableStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Boş';
      case 'occupied': return 'Dolu';
      case 'reserved': return 'Rezerve';
      case 'cleaning': return 'Temizlik';
      default: return status;
    }
  };

  const activeOrders = orders.filter(o => o.status === 'active');
  const readyOrders = orders.filter(o => o.status === 'ready');
  const paymentOrders = orders.filter(o => o.status === 'waiting_payment');

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
          <p className="text-gray-400">Garson paneli için lütfen bir mekan seçin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white -m-6 p-6">
      {/* Header */}
      <PanelHeader
        title="Garson Paneli"
        subtitle={displayTime}
        icon={<UtensilsCrossed className="w-8 h-8" />}
        iconBgColor="text-blue-500"
        soundEnabled={soundEnabled}
        onSoundToggle={() => setSoundEnabled(!soundEnabled)}
        showSound={true}
      >
        {/* Stats */}
        <div className="flex items-center gap-6 bg-gray-800 rounded-xl px-6 py-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-500">{activeOrders.length}</p>
            <p className="text-xs text-gray-400">Aktif</p>
          </div>
          <div className="w-px h-8 bg-gray-700" />
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">{readyOrders.length}</p>
            <p className="text-xs text-gray-400">Hazır</p>
          </div>
          <div className="w-px h-8 bg-gray-700" />
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-500">{paymentOrders.length}</p>
            <p className="text-xs text-gray-400">Ödeme</p>
          </div>
        </div>
      </PanelHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol: Masa Haritası */}
        <div className="lg:col-span-2 bg-gray-800/50 rounded-2xl p-4">
          {/* Section Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {sections.map(section => (
              <button
                key={section}
                onClick={() => setSelectedSection(section)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedSection === section
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {section === 'all' ? 'Tümü' : section}
              </button>
            ))}
          </div>

          {/* Tables Grid */}
          <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
            {filteredTables.map(table => (
              <button
                key={table.id}
                onClick={() => {
                  // Masa detay modal
                }}
                className={`aspect-square rounded-xl p-2 flex flex-col items-center justify-center transition-all hover:scale-105 ${
                  table.status === 'available' 
                    ? 'bg-green-600/20 border-2 border-green-500 hover:bg-green-600/30' 
                    : table.status === 'occupied'
                      ? 'bg-red-600/20 border-2 border-red-500 hover:bg-red-600/30'
                      : table.status === 'reserved'
                        ? 'bg-amber-600/20 border-2 border-amber-500 hover:bg-amber-600/30'
                        : 'bg-blue-600/20 border-2 border-blue-500 hover:bg-blue-600/30'
                }`}
              >
                <span className="text-lg font-bold">{table.number}</span>
                <span className="text-xs text-gray-400">{table.capacity} kişi</span>
                {table.currentOrder && (
                  <span className="text-xs mt-1 text-amber-400">₺{table.currentOrder.total}</span>
                )}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span className="text-sm text-gray-400">Boş</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500" />
              <span className="text-sm text-gray-400">Dolu</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-500" />
              <span className="text-sm text-gray-400">Rezerve</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500" />
              <span className="text-sm text-gray-400">Temizlik</span>
            </div>
          </div>
        </div>

        {/* Sağ: Aktif Siparişler */}
        <div className="bg-gray-800/50 rounded-2xl p-4">
          <h2 className="text-xl font-bold mb-4">Aktif Siparişler</h2>
          
          <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
            {orders.map(order => (
              <div
                key={order.id}
                className={`rounded-xl p-4 ${
                  order.status === 'ready' 
                    ? 'bg-green-600/20 border border-green-500' 
                    : order.status === 'waiting_payment'
                      ? 'bg-amber-600/20 border border-amber-500'
                      : 'bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">Masa {order.tableNumber}</span>
                    {order.status === 'ready' && (
                      <Bell className="w-5 h-5 text-green-400 animate-pulse" />
                    )}
                    {order.status === 'waiting_payment' && (
                      <Timer className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <span className="text-sm text-gray-400">{order.createdAt}</span>
                </div>

                <div className="space-y-1 mb-3">
                  {order.items.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <span className={`w-2 h-2 rounded-full ${
                        item.status === 'ready' ? 'bg-green-500' :
                        item.status === 'preparing' ? 'bg-purple-500' : 'bg-amber-500'
                      }`} />
                      <span className="text-gray-300">{item.quantity}x {item.name}</span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <span className="text-xs text-gray-500">+{order.items.length - 3} ürün daha</span>
                  )}
                </div>

                {order.notes && (
                  <div className="flex items-center gap-2 text-xs text-amber-400 mb-2">
                    <MessageSquare className="w-4 h-4" />
                    {order.notes}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-600">
                  <span className="font-bold text-lg">₺{order.total}</span>
                  <div className="flex gap-2">
                    {order.status === 'ready' && (
                      <button className="px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        Servis Et
                      </button>
                    )}
                    <button className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm font-medium flex items-center gap-1">
                      <Plus className="w-4 h-4" />
                      Ekle
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {orders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Utensils className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Aktif sipariş yok</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions - Bottom Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-3 bg-gray-800 rounded-2xl p-3 shadow-2xl">
        <button className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Yeni Sipariş
        </button>
        <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold flex items-center gap-2">
          <Coffee className="w-5 h-5" />
          Hızlı Sipariş
        </button>
        <button className="px-6 py-3 bg-amber-600 hover:bg-amber-500 rounded-xl font-bold flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Garson Çağrıları
        </button>
      </div>
    </div>
  );
}
