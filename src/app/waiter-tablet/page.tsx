'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Home, Search, Plus, Minus, ShoppingCart, X, Check, Send, Users,
  UtensilsCrossed, Coffee, Truck, Clock, AlertCircle, Trash2, Bell,
  ChevronLeft, StickyNote, CreditCard, RefreshCw
} from 'lucide-react';

interface Table {
  id: string;
  number: string;
  section: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  current_order_id?: string;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  image_url?: string;
  is_available: boolean;
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

const VENUE_ID = process.env.NEXT_PUBLIC_DEFAULT_VENUE_ID || '';

export default function WaiterTabletPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery'>('dine_in');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const loadData = useCallback(async () => {
    try {
      const [tablesRes, menuRes, categoriesRes] = await Promise.all([
        supabase.from('tables').select('*').eq('is_active', true).order('section').order('number'),
        supabase.from('menu_items').select('*').eq('is_available', true).order('category').order('name'),
        supabase.from('menu_categories').select('*').order('sort_order')
      ]);

      setTables(tablesRes.data || []);
      setMenuItems(menuRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('waiter-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, loadData)
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [loadData]);

  const addToCart = (item: MenuItem) => {
    const existing = cart.find(c => c.menuItem.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { menuItem: item, quantity: 1 }]);
    }
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.menuItem.id === itemId) {
        const newQty = c.quantity + delta;
        return newQty > 0 ? { ...c, quantity: newQty } : c;
      }
      return c;
    }).filter(c => c.quantity > 0));
  };

  const updateNotes = (itemId: string, notes: string) => {
    setCart(cart.map(c => c.menuItem.id === itemId ? { ...c, notes } : c));
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(c => c.menuItem.id !== itemId));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.menuItem.price * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const sendOrder = async () => {
    if (cart.length === 0) return;
    if (orderType === 'dine_in' && !selectedTable) {
      alert('Lütfen masa seçin');
      return;
    }

    setIsSending(true);
    try {
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
      const items = cart.map(c => ({
        id: crypto.randomUUID(),
        product_id: c.menuItem.id,
        product_name: c.menuItem.name,
        quantity: c.quantity,
        unit_price: c.menuItem.price,
        total_price: c.menuItem.price * c.quantity,
        notes: c.notes,
        status: 'pending'
      }));

      const { error } = await supabase.from('orders').insert({
        venue_id: VENUE_ID,
        table_id: selectedTable?.id,
        order_number: orderNumber,
        type: orderType,
        status: 'pending',
        items,
        subtotal: cartTotal,
        tax: cartTotal * 0.08,
        service_charge: 0,
        discount: 0,
        total: cartTotal * 1.08,
        payment_status: 'pending'
      });

      if (error) throw error;

      // Update table status
      if (selectedTable) {
        await supabase.from('tables').update({ status: 'occupied' }).eq('id', selectedTable.id);
      }

      setCart([]);
      setShowCart(false);
      setSelectedTable(null);
      alert('Sipariş gönderildi! ' + orderNumber);
      loadData();
    } catch (error) {
      console.error('Error sending order:', error);
      alert('Sipariş gönderilemedi!');
    } finally {
      setIsSending(false);
    }
  };

  const filteredMenu = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sections = [...new Set(tables.map(t => t.section))];
  const uniqueCategories = [...new Set(menuItems.map(m => m.category))];

  const statusColors = {
    available: 'bg-green-500',
    occupied: 'bg-red-500',
    reserved: 'bg-amber-500',
    cleaning: 'bg-blue-500'
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Left: Tables or Menu */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl">
              <Home className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">GARSON</h1>
                <p className="text-sm text-gray-500">{currentTime.toLocaleTimeString('tr-TR')}</p>
              </div>
            </div>
          </div>

          {/* Order Type */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setOrderType('dine_in')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${orderType === 'dine_in' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
            >
              <UtensilsCrossed className="w-4 h-4" /> Masa
            </button>
            <button
              onClick={() => setOrderType('takeaway')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${orderType === 'takeaway' ? 'bg-white shadow text-purple-600' : 'text-gray-600'}`}
            >
              <Coffee className="w-4 h-4" /> Paket
            </button>
            <button
              onClick={() => setOrderType('delivery')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${orderType === 'delivery' ? 'bg-white shadow text-green-600' : 'text-gray-600'}`}
            >
              <Truck className="w-4 h-4" /> Kurye
            </button>
          </div>

          <button onClick={loadData} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl">
            <RefreshCw className={`w-5 h-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Table Selection (for dine_in) */}
          {orderType === 'dine_in' && !selectedTable && (
            <div className="flex-1 p-6 overflow-y-auto">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Masa Seç</h2>
              {sections.map(section => (
                <div key={section} className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">{section}</h3>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                    {tables.filter(t => t.section === section).map(table => (
                      <button
                        key={table.id}
                        onClick={() => table.status === 'available' && setSelectedTable(table)}
                        disabled={table.status !== 'available'}
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all ${
                          table.status === 'available' 
                            ? 'bg-green-100 hover:bg-green-200 text-green-700 cursor-pointer' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <span className="text-lg font-bold">{table.number}</span>
                        <span className="text-xs">{table.capacity}K</span>
                        <div className={`w-2 h-2 rounded-full mt-1 ${statusColors[table.status]}`} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Menu */}
          {(orderType !== 'dine_in' || selectedTable) && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Selected Table Info */}
              {selectedTable && (
                <div className="bg-blue-50 px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold">
                      {selectedTable.number}
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">Masa {selectedTable.number}</p>
                      <p className="text-sm text-blue-600">{selectedTable.section} • {selectedTable.capacity} Kişilik</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedTable(null)} className="text-blue-600 hover:text-blue-800">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Search */}
              <div className="px-6 py-4 border-b bg-white">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Ürün ara..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="px-6 py-3 bg-white border-b flex gap-2 overflow-x-auto">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
                    selectedCategory === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Tümü
                </button>
                {uniqueCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
                      selectedCategory === cat ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredMenu.map(item => {
                    const inCart = cart.find(c => c.menuItem.id === item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => addToCart(item)}
                        className={`bg-white rounded-xl p-4 text-left hover:shadow-lg transition-all border-2 ${
                          inCart ? 'border-blue-500' : 'border-transparent'
                        }`}
                      >
                        {item.image_url && (
                          <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-500 mb-2">{item.category}</p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-600">₺{item.price}</span>
                          {inCart && (
                            <span className="w-6 h-6 bg-blue-500 text-white rounded-full text-sm flex items-center justify-center">
                              {inCart.quantity}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div className={`w-96 bg-white border-l flex flex-col transition-all ${showCart || cart.length > 0 ? '' : 'hidden lg:flex'}`}>
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-gray-600" />
            <span className="font-bold text-gray-900">Sipariş</span>
            {cartCount > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">{cartCount}</span>
            )}
          </div>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="text-red-500 text-sm hover:text-red-600">
              Temizle
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Sepet boş</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.menuItem.id} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.menuItem.name}</h4>
                      <p className="text-sm text-gray-500">₺{item.menuItem.price} x {item.quantity}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.menuItem.id)} className="text-red-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.menuItem.id, -1)}
                        className="w-8 h-8 bg-white border rounded-lg flex items-center justify-center hover:bg-gray-100"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.menuItem.id, 1)}
                        className="w-8 h-8 bg-white border rounded-lg flex items-center justify-center hover:bg-gray-100"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="font-bold text-gray-900">₺{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                  </div>

                  <input
                    type="text"
                    value={item.notes || ''}
                    onChange={(e) => updateNotes(item.menuItem.id, e.target.value)}
                    placeholder="Not ekle..."
                    className="mt-2 w-full px-3 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600">Ara Toplam</span>
            <span className="font-bold text-gray-900">₺{cartTotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600">KDV (%8)</span>
            <span className="text-gray-600">₺{(cartTotal * 0.08).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between mb-4 text-lg">
            <span className="font-bold text-gray-900">Toplam</span>
            <span className="font-bold text-blue-600">₺{(cartTotal * 1.08).toFixed(2)}</span>
          </div>

          <button
            onClick={sendOrder}
            disabled={cart.length === 0 || isSending || (orderType === 'dine_in' && !selectedTable)}
            className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
          >
            {isSending ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                Siparişi Gönder
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Cart Button */}
      <button
        onClick={() => setShowCart(!showCart)}
        className="lg:hidden fixed bottom-6 right-6 w-16 h-16 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center"
      >
        <ShoppingCart className="w-6 h-6" />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full text-xs flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </button>
    </div>
  );
}
