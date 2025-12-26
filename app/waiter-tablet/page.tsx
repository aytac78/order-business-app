'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, roleConfig } from '@/stores/authStore';
import {
  UtensilsCrossed, ShoppingCart, Package, Bike, RefreshCw,
  Plus, Minus, Search, LogOut, X, Check
} from 'lucide-react';

interface Table {
  id: string;
  number: string;
  status: 'available' | 'occupied' | 'reserved';
  guests?: number;
  orderTotal?: number;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const demoTables: Table[] = [
  { id: '1', number: '1', status: 'available' },
  { id: '2', number: '2', status: 'occupied', guests: 4, orderTotal: 450 },
  { id: '3', number: '3', status: 'available' },
  { id: '4', number: '4', status: 'reserved' },
  { id: '5', number: '5', status: 'occupied', guests: 2, orderTotal: 280 },
  { id: '6', number: '6', status: 'available' },
];

const menuItems = [
  { id: '1', name: 'Izgara Levrek', price: 320, category: 'Ana Yemek' },
  { id: '2', name: 'Adana Kebap', price: 200, category: 'Ana Yemek' },
  { id: '3', name: 'Caesar Salata', price: 120, category: 'Salata' },
  { id: '4', name: 'Mercimek Çorbası', price: 65, category: 'Çorba' },
  { id: '5', name: 'Künefe', price: 140, category: 'Tatlı' },
  { id: '6', name: 'Ayran', price: 25, category: 'İçecek' },
  { id: '7', name: 'Kola', price: 35, category: 'İçecek' },
];

export default function WaiterTabletPage() {
  const router = useRouter();
  const { currentStaff, isAuthenticated, logout } = useAuthStore();
  const [tables, setTables] = useState<Table[]>(demoTables);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState<'tables' | 'takeaway' | 'delivery'>('tables');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !currentStaff) {
      router.push('/');
      return;
    }
    
    if (currentStaff.role !== 'waiter' && currentStaff.role !== 'owner' && currentStaff.role !== 'manager') {
      const config = roleConfig[currentStaff.role];
      router.push(config.defaultRoute);
      return;
    }

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

  const addToCart = (item: typeof menuItems[0]) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(c => c.id === itemId ? { ...c, quantity: c.quantity - 1 } : c);
      }
      return prev.filter(c => c.id !== itemId);
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!currentStaff) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
            <UtensilsCrossed className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">GARSON</h1>
            <p className="text-gray-500 text-sm">{currentTime}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('tables')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'tables' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            Masa
          </button>
          <button
            onClick={() => setActiveTab('takeaway')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'takeaway' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}
          >
            <Package className="w-4 h-4" />
            Paket
          </button>
          <button
            onClick={() => setActiveTab('delivery')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'delivery' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}
          >
            <Bike className="w-4 h-4" />
            Kurye
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200">
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl"
          >
            <LogOut className="w-5 h-5" />
            Çıkış
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex">
        {/* Left - Tables or Order Type */}
        <div className="flex-1 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Masa Seç</h2>
          <div className="grid grid-cols-3 gap-4">
            {tables.map(table => (
              <button
                key={table.id}
                onClick={() => setSelectedTable(table)}
                className={`p-4 rounded-xl border-2 transition ${
                  selectedTable?.id === table.id 
                    ? 'border-green-500 bg-green-50' 
                    : table.status === 'available'
                      ? 'border-gray-200 bg-white hover:border-green-300'
                      : table.status === 'occupied'
                        ? 'border-orange-300 bg-orange-50'
                        : 'border-blue-300 bg-blue-50'
                }`}
              >
                <p className="text-2xl font-bold text-gray-900">{table.number}</p>
                <p className={`text-sm ${
                  table.status === 'available' ? 'text-green-600' :
                  table.status === 'occupied' ? 'text-orange-600' : 'text-blue-600'
                }`}>
                  {table.status === 'available' ? 'Boş' : 
                   table.status === 'occupied' ? `${table.guests} kişi` : 'Rezerve'}
                </p>
                {table.orderTotal && (
                  <p className="text-sm font-medium text-gray-900 mt-1">₺{table.orderTotal}</p>
                )}
              </button>
            ))}
          </div>

          {/* Menu */}
          {selectedTable && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Menü</h3>
              <div className="grid grid-cols-2 gap-3">
                {menuItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="p-3 bg-white rounded-xl border border-gray-200 hover:border-green-300 text-left transition"
                  >
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.category}</p>
                    <p className="text-green-600 font-bold mt-1">₺{item.price}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right - Cart */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Sipariş</h3>
              {selectedTable && (
                <span className="text-sm text-gray-500">Masa {selectedTable.number}</span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2" />
                <p>Sepet boş</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">₺{item.price}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => addToCart({ id: item.id, name: item.name, price: item.price, category: '' })}
                      className="w-8 h-8 bg-green-500 text-white rounded-lg flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-4 border-t border-gray-200 space-y-3">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Toplam</span>
                <span className="text-green-600">₺{cartTotal}</span>
              </div>
              <button className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold">
                Siparişi Gönder
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
