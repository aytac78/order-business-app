'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useVenueStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import {
  UtensilsCrossed,
  Wine,
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  X,
  Check,
  CheckCircle,
  ChevronLeft,
  Users,
  Send,
  StickyNote,
  Package,
  Bell,
  Clock,
  AlertCircle,
  Volume2,
  RotateCcw,
  XCircle
} from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  status?: string;
  refunded?: boolean;
  refund_reason?: string;
}

interface ActiveOrder {
  id: string;
  order_number: string;
  table_number?: string;
  status: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  created_at: string;
}

const foodCategories = [
  'Soğuk Mezeler', 'Sıcak Mezeler', 'Salatalar', 'Çorbalar', 'Ara Sıcaklar',
  'Deniz Ürünleri', 'Et Yemekleri', 'Tavuk Yemekleri', 'Makarnalar', 
  'Pizzalar', 'Burgerler', 'Kebaplar', 'Tatlılar',
];

const drinkCategories = [
  'Sıcak İçecekler', 'Soğuk İçecekler', 'Biralar', 'Şaraplar', 'Kokteyller',
  'Rakı (Kadeh)', 'Rakı (Şişe)', 'Votka (Kadeh)', 'Votka (Şişe)', 
  'Viski (Kadeh)', 'Viski (Şişe)', 'Cin (Kadeh)', 'Cin (Şişe)',
];

const refundReasons = [
  { id: 'quality', label: 'Kalite sorunu', icon: '👎' },
  { id: 'wrong_order', label: 'Yanlış sipariş', icon: '❌' },
  { id: 'customer_changed', label: 'Müşteri vazgeçti', icon: '🔄' },
  { id: 'late_delivery', label: 'Geç geldi', icon: '⏰' },
  { id: 'cold_food', label: 'Soğuk geldi', icon: '🥶' },
  { id: 'allergy', label: 'Alerji', icon: '⚠️' },
  { id: 'other', label: 'Diğer', icon: '📝' },
];

export default function WaiterPage() {
  const { currentVenue } = useVenueStore();
  const [tables, setTables] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Masaları Supabase'den yükle
  const loadTables = useCallback(async () => {
    if (!currentVenue?.id) return;
    const { data } = await supabase
      .from('tables')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .eq('is_available', true)
      .order('table_number');
    
    const formattedTables = (data || []).map(t => ({
      ...t,
      number: t.table_number,
      status: t.status || 'available',
      section: t.section || 'İç Mekan'
    }));
    setTables(formattedTables);
  }, [currentVenue?.id]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);
  
  // UI State
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway'>('dine_in');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [mainCategory, setMainCategory] = useState<'food' | 'drink'>('food');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');

  // Siparişler
  const [readyOrders, setReadyOrders] = useState<ActiveOrder[]>([]);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [showTableDetail, setShowTableDetail] = useState<string | null>(null);
  
  // Bildirim
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevReadyCountRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2LkZeWj4F0aGRqeImUm5iQgXNoY2h4iZSbmJCBc2hjZ3mJlJuYkIFzaGNneYmUm5iQgXNoY2d5iZSbmI+Bc2hjZ3mJlJuYj4FzaGNneYmUm5iPgXNoY2d5iZSbmI+Bc2hjZ3mJlJuYj4FzaGNneYmUm5iPgXNoY2d5iZSbmI+Bc2hjZ3mJlJuYj4FzaGNneYmUm5iPgXNoY2d5iZSbmI+Bc2hjZ3mJlJuYj4FzaGNneYmUm5iPgXNoY2d5iZSbmI+BcA==');
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const fetchMenu = useCallback(async () => {
    if (!currentVenue?.id) return;
    setIsLoading(true);
    const { data } = await supabase
      .from('menu_items')
      .select('id, name, price, category')
      .eq('venue_id', currentVenue.id)
      .eq('is_available', true)
      .order('name');
    setMenuItems(data || []);
    setIsLoading(false);
  }, [currentVenue?.id]);

  const fetchOrders = useCallback(async () => {
    if (!currentVenue?.id) return;
    
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .in('status', ['pending', 'preparing', 'ready', 'confirmed'])
      .order('created_at', { ascending: false });

    if (data) {
      const ready = data.filter(o => o.status === 'ready');
      if (ready.length > prevReadyCountRef.current && prevReadyCountRef.current !== 0) {
        playNotification(ready[0]);
      }
      prevReadyCountRef.current = ready.length;
      setReadyOrders(ready);
      setActiveOrders(data);
    }
  }, [currentVenue?.id]);

  const playNotification = (order: ActiveOrder) => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('🔔 SİPARİŞ HAZIR!', {
        body: `${order.order_number} - ${order.table_number ? `Masa ${order.table_number}` : 'Paket'} teslimata hazır!`,
        tag: order.id,
        requireInteraction: true
      });
    }
  };

  useEffect(() => {
    fetchMenu();
    fetchOrders();

    if (currentVenue?.id) {
      const channel = supabase
        .channel('waiter-realtime')
        .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'orders', filter: `venue_id=eq.${currentVenue.id}` },
          (payload) => {
            const newOrder = payload.new as ActiveOrder;
            if (newOrder.status === 'ready') {
              playNotification(newOrder);
            }
            fetchOrders();
          }
        )
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders', filter: `venue_id=eq.${currentVenue.id}` },
          () => fetchOrders()
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [currentVenue?.id, fetchMenu, fetchOrders, soundEnabled]);

  // İade işlemi
  const handleRefundItem = async (orderId: string, itemIndex: number, reason: string) => {
    const order = activeOrders.find(o => o.id === orderId);
    if (!order) return;

    const updatedItems = order.items.map((item, idx) => {
      if (idx === itemIndex) {
        return { ...item, refunded: true, refund_reason: reason, status: 'refunded' };
      }
      return item;
    });

    // Yeni toplam hesapla (iade edilmemiş ürünler)
    const activeItems = updatedItems.filter(item => !item.refunded);
    const newSubtotal = activeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const newTax = Math.round(newSubtotal * 0.08);
    const newTotal = newSubtotal + newTax;

    const { error } = await supabase
      .from('orders')
      .update({
        items: updatedItems,
        subtotal: newSubtotal,
        tax: newTax,
        total: newTotal,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) {
      alert('İade işlemi başarısız: ' + error.message);
      return;
    }

    // İade kaydı oluştur (raporlama için)
    const refundedItem = order.items[itemIndex];
    await supabase.from('refunds').insert({
      venue_id: currentVenue?.id,
      order_id: orderId,
      order_number: order.order_number,
      item_name: refundedItem.name,
      item_price: refundedItem.price,
      quantity: refundedItem.quantity,
      reason: reason,
      refunded_by: 'Garson', // TODO: Gerçek kullanıcı adı
      created_at: new Date().toISOString()
    }).catch(() => {}); // Tablo yoksa hata vermesin

    fetchOrders();
  };

  const categories = mainCategory === 'food' ? foodCategories : drinkCategories;
  
  const getFilteredItems = () => {
    let items = menuItems;
    const catList = mainCategory === 'food' ? foodCategories : drinkCategories;
    items = items.filter(item => 
      catList.some(cat => {
        const itemCat = (item.category || '').toLowerCase().replace('↳ ', '');
        const targetCat = cat.toLowerCase();
        return itemCat.includes(targetCat) || targetCat.includes(itemCat);
      })
    );

    if (selectedSubCategory) {
      items = items.filter(item => {
        const itemCat = (item.category || '').toLowerCase().replace('↳ ', '');
        const targetCat = selectedSubCategory.toLowerCase();
        return itemCat.includes(targetCat) || targetCat.includes(itemCat);
      });
    }

    if (searchTerm) {
      items = items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    return items;
  };

  const filteredItems = getFilteredItems();

  const getCategoryCount = (cat: string) => {
    return menuItems.filter(item => {
      const itemCat = (item.category || '').toLowerCase().replace('↳ ', '');
      return itemCat.includes(cat.toLowerCase()) || cat.toLowerCase().includes(itemCat);
    }).length;
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));

  const saveNotes = (id: string) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, notes: tempNotes } : item));
    setEditingNotes(null);
    setTempNotes('');
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const submitOrder = async () => {
    if (cart.length === 0 || !currentVenue?.id) return;
    
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    const orderData = {
      venue_id: currentVenue.id,
      order_number: orderNumber,
      table_number: selectedTable || null,
      type: orderType,
      status: 'pending',
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes || null,
        status: 'pending',
        refunded: false
      })),
      subtotal: cartTotal,
      tax: Math.round(cartTotal * 0.08),
      total: Math.round(cartTotal * 1.08),
      payment_status: 'pending',
    };

    const { error } = await supabase.from('orders').insert(orderData);
    
    if (error) {
      alert('Sipariş gönderilemedi: ' + error.message);
      return;
    }
    
    alert(`✅ Sipariş gönderildi!\n${orderNumber}\n${orderType === 'dine_in' ? `Masa ${selectedTable}` : 'Paket'}`);
    setCart([]);
    setSelectedTable(null);
    setShowMenu(false);
    fetchOrders();
  };

  const markAsServed = async (orderId: string) => {
    await supabase.from('orders').update({ status: 'served', updated_at: new Date().toISOString() }).eq('id', orderId);
    fetchOrders();
  };

  const goBack = () => {
    setShowMenu(false);
    setSelectedTable(null);
    setSearchTerm('');
    setSelectedSubCategory(null);
  };

  const getTableOrders = (tableNumber: string) => activeOrders.filter(o => o.table_number === tableNumber);

  const tablesBySection = tables.reduce((acc, table) => {
    if (!acc[table.section]) acc[table.section] = [];
    acc[table.section].push(table);
    return acc;
  }, {} as Record<string, typeof tables>);

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4 -m-6 p-6">
      {/* HAZIR SİPARİŞ BİLDİRİMLERİ */}
      {readyOrders.length > 0 && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 space-y-2">
          {readyOrders.map(order => (
            <div key={order.id} className="bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 animate-bounce">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-lg">{order.order_number} HAZIR!</p>
                <p className="text-green-100">{order.table_number ? `Masa ${order.table_number}` : 'Paket'} • {order.items?.length || 0} ürün</p>
              </div>
              <button onClick={() => markAsServed(order.id)} className="ml-4 px-4 py-2 bg-white text-green-600 rounded-lg font-bold hover:bg-green-50">
                ✓ Teslim Aldım
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Sol Panel */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showMenu && (
              <button onClick={goBack} className="p-2 hover:bg-gray-200 rounded-lg">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {!showMenu ? 'Yeni Sipariş' : (selectedTable ? `Masa ${selectedTable}` : 'Paket Sipariş')}
              </h1>
              {showMenu && <p className="text-sm text-gray-500">Ürün eklemek için tıklayın</p>}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg ${soundEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
            >
              <Volume2 className="w-5 h-5" />
            </button>
            
            {readyOrders.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg animate-pulse">
                <Bell className="w-4 h-4" />
                <span className="font-bold">{readyOrders.length} HAZIR</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {!showMenu ? (
            <div className="p-4 space-y-6 overflow-y-auto h-full">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Sipariş Türü</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setOrderType('dine_in')}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${
                      orderType === 'dine_in' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                    }`}
                  >
                    <UtensilsCrossed className={`w-8 h-8 ${orderType === 'dine_in' ? 'text-orange-500' : 'text-gray-400'}`} />
                    <span className={orderType === 'dine_in' ? 'text-orange-700 font-medium' : 'text-gray-600'}>Masada</span>
                  </button>
                  <button
                    onClick={() => setOrderType('takeaway')}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${
                      orderType === 'takeaway' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                    }`}
                  >
                    <Package className={`w-8 h-8 ${orderType === 'takeaway' ? 'text-purple-500' : 'text-gray-400'}`} />
                    <span className={orderType === 'takeaway' ? 'text-purple-700 font-medium' : 'text-gray-600'}>Paket</span>
                  </button>
                </div>
              </div>

              {orderType === 'dine_in' ? (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-gray-700">Masa Seç</p>
                  {Object.entries(tablesBySection).map(([section, sectionTables]) => (
                    <div key={section}>
                      <p className="text-xs font-medium text-gray-500 mb-2">{section}</p>
                      <div className="grid grid-cols-4 gap-2">
                        {sectionTables.map(table => {
                          const tableOrders = getTableOrders(table.number);
                          const hasActiveOrder = tableOrders.length > 0;
                          const hasReadyOrder = tableOrders.some(o => o.status === 'ready');

                          return (
                            <button
                              key={table.id}
                              onClick={() => {
                                if (hasActiveOrder) setShowTableDetail(table.number);
                                else { setSelectedTable(table.number); setShowMenu(true); }
                              }}
                              className={`p-3 rounded-xl border-2 text-center relative ${
                                hasReadyOrder ? 'border-green-500 bg-green-100 ring-2 ring-green-500 animate-pulse'
                                  : hasActiveOrder ? 'border-amber-400 bg-amber-50'
                                  : 'border-green-300 bg-green-50 hover:border-green-400'
                              }`}
                            >
                              {hasReadyOrder && <span className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center animate-bounce"><Bell className="w-3 h-3" /></span>}
                              {hasActiveOrder && !hasReadyOrder && <span className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold">{tableOrders.length}</span>}
                              <span className="font-bold text-gray-900">{table.number}</span>
                              <p className="text-xs text-gray-500 mt-1"><Users className="w-3 h-3 inline mr-1" />{table.capacity}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <button onClick={() => setShowMenu(true)} className="w-full py-4 bg-purple-500 text-white rounded-xl font-bold text-lg hover:bg-purple-600 flex items-center justify-center gap-2">
                  <Package className="w-5 h-5" />
                  Paket Siparişe Başla
                </button>
              )}
            </div>
          ) : (
            <div className="flex h-full">
              <div className="w-48 border-r bg-gray-50 flex flex-col">
                <div className="p-2 border-b">
                  <div className="flex bg-gray-200 rounded-lg p-1">
                    <button onClick={() => { setMainCategory('food'); setSelectedSubCategory(null); }} className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center gap-1 ${mainCategory === 'food' ? 'bg-white shadow text-orange-600' : 'text-gray-600'}`}>
                      <UtensilsCrossed className="w-4 h-4" />Yiyecek
                    </button>
                    <button onClick={() => { setMainCategory('drink'); setSelectedSubCategory(null); }} className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center gap-1 ${mainCategory === 'drink' ? 'bg-white shadow text-purple-600' : 'text-gray-600'}`}>
                      <Wine className="w-4 h-4" />İçecek
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <button onClick={() => setSelectedSubCategory(null)} className={`w-full px-3 py-2 text-left text-sm font-medium ${!selectedSubCategory ? 'bg-orange-100 text-orange-700 border-l-4 border-orange-500' : 'text-gray-600 hover:bg-gray-100'}`}>Tümü</button>
                  {categories.map(cat => {
                    const count = getCategoryCount(cat);
                    if (count === 0) return null;
                    return (
                      <button key={cat} onClick={() => setSelectedSubCategory(cat)} className={`w-full px-3 py-2 text-left text-sm flex justify-between ${selectedSubCategory === cat ? 'bg-orange-100 text-orange-700 border-l-4 border-orange-500' : 'text-gray-600 hover:bg-gray-100'}`}>
                        <span className="truncate">{cat}</span>
                        <span className="text-xs text-gray-400">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex-1 flex flex-col">
                <div className="p-3 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Ürün ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm" />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div></div>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                      {filteredItems.map(item => {
                        const inCart = cart.find(c => c.id === item.id);
                        return (
                          <button key={item.id} onClick={() => addToCart(item)} className={`p-3 rounded-xl border-2 text-left relative ${inCart ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-300'}`}>
                            {inCart && <span className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 text-white rounded-full text-xs font-bold flex items-center justify-center">{inCart.quantity}</span>}
                            <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                            <p className="text-orange-600 font-bold mt-1">₺{item.price}</p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sağ Panel - Sepet */}
      <div className="w-80 bg-white rounded-2xl border flex flex-col overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Sepet</h2>
            <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-sm font-medium">{cartItemCount} ürün</span>
          </div>
          {selectedTable && <p className="text-sm text-gray-500 mt-1">Masa {selectedTable}</p>}
          {orderType === 'takeaway' && showMenu && <p className="text-sm text-purple-600 mt-1">📦 Paket</p>}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Sepet boş</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">₺{item.price} x {item.quantity}</p>
                    </div>
                    <span className="font-bold text-orange-600">₺{item.price * item.quantity}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 bg-gray-200 rounded flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                      <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 bg-orange-500 text-white rounded flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="p-1 text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  {editingNotes === item.id ? (
                    <div className="mt-2 flex gap-1">
                      <input type="text" value={tempNotes} onChange={(e) => setTempNotes(e.target.value)} placeholder="Not..." className="flex-1 px-2 py-1 border rounded text-xs" autoFocus />
                      <button onClick={() => saveNotes(item.id)} className="px-2 py-1 bg-green-500 text-white rounded text-xs"><Check className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingNotes(item.id); setTempNotes(item.notes || ''); }} className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                      <StickyNote className="w-3 h-3" />{item.notes || 'Not ekle'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 space-y-3">
          <div className="flex justify-between text-lg font-bold">
            <span>Toplam</span>
            <span className="text-orange-600">₺{cartTotal.toLocaleString()}</span>
          </div>
          <button onClick={submitOrder} disabled={cart.length === 0} className="w-full py-3 bg-green-500 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">
            <Send className="w-4 h-4" />Sipariş Gönder
          </button>
        </div>
      </div>

      {/* Masa Detay Modal */}
      {showTableDetail && (
        <TableDetailModal
          tableNumber={showTableDetail}
          orders={getTableOrders(showTableDetail)}
          onClose={() => setShowTableDetail(null)}
          onAddOrder={() => { setSelectedTable(showTableDetail); setShowTableDetail(null); setShowMenu(true); }}
          onMarkServed={markAsServed}
          onRefundItem={handleRefundItem}
        />
      )}
    </div>
  );
}

// Masa Detay Modal - İade özellikli
function TableDetailModal({ 
  tableNumber, orders, onClose, onAddOrder, onMarkServed, onRefundItem 
}: { 
  tableNumber: string; 
  orders: ActiveOrder[]; 
  onClose: () => void;
  onAddOrder: () => void;
  onMarkServed: (id: string) => void;
  onRefundItem: (orderId: string, itemIndex: number, reason: string) => void;
}) {
  const [refundingItem, setRefundingItem] = useState<{ orderId: string; itemIndex: number } | null>(null);
  const [selectedReason, setSelectedReason] = useState('');

  const statusLabels: Record<string, { text: string; color: string }> = {
    pending: { text: 'Bekliyor', color: 'bg-amber-100 text-amber-700' },
    preparing: { text: 'Hazırlanıyor', color: 'bg-purple-100 text-purple-700' },
    ready: { text: '🔔 HAZIR!', color: 'bg-green-500 text-white' },
    confirmed: { text: 'Onaylandı', color: 'bg-blue-100 text-blue-700' },
  };

  const activeItems = orders.flatMap(o => o.items.filter(i => !i.refunded));
  const totalAmount = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  const handleRefund = () => {
    if (refundingItem && selectedReason) {
      onRefundItem(refundingItem.orderId, refundingItem.itemIndex, selectedReason);
      setRefundingItem(null);
      setSelectedReason('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Masa {tableNumber}</h2>
            <p className="text-sm text-gray-500">{orders.length} sipariş • Toplam: ₺{totalAmount}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {orders.map(order => (
            <div key={order.id} className={`rounded-xl border-2 overflow-hidden ${order.status === 'ready' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
              <div className={`px-4 py-2 flex items-center justify-between ${order.status === 'ready' ? 'bg-green-500 text-white' : 'bg-gray-100'}`}>
                <span className="font-bold">{order.order_number}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusLabels[order.status]?.color}`}>{statusLabels[order.status]?.text}</span>
              </div>
              
              <div className="p-4 space-y-2">
                {order.items?.map((item: OrderItem, idx: number) => (
                  <div key={idx} className={`flex items-center justify-between p-2 rounded-lg ${item.refunded ? 'bg-red-50 opacity-60' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 flex-1">
                      {item.refunded ? (
                        <XCircle className="w-4 h-4 text-red-500" />
                      ) : item.status === 'ready' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : item.status === 'preparing' ? (
                        <Clock className="w-4 h-4 text-purple-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                      )}
                      <div>
                        <span className={`text-sm ${item.refunded ? 'line-through text-red-500' : ''}`}>
                          {item.quantity}x {item.name}
                        </span>
                        {item.refunded && (
                          <p className="text-xs text-red-500">İade: {item.refund_reason}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${item.refunded ? 'line-through text-red-400' : 'text-gray-500'}`}>
                        ₺{item.price * item.quantity}
                      </span>
                      {!item.refunded && (
                        <button
                          onClick={() => setRefundingItem({ orderId: order.id, itemIndex: idx })}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded"
                          title="İade Et"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Sipariş Toplam */}
                <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between font-medium">
                  <span>Sipariş Toplamı</span>
                  <span className="text-orange-600">₺{order.total}</span>
                </div>
                
                {order.status === 'ready' && (
                  <button onClick={() => onMarkServed(order.id)} className="w-full py-3 mt-2 bg-green-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 animate-pulse">
                    <Bell className="w-5 h-5" />TESLİM ALDIM
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t space-y-3">
          <div className="flex justify-between text-lg font-bold">
            <span>Masa Toplamı</span>
            <span className="text-orange-600">₺{totalAmount}</span>
          </div>
          <button onClick={onAddOrder} className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />Yeni Sipariş Ekle
          </button>
        </div>
      </div>

      {/* İade Modal */}
      {refundingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <RotateCcw className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Ürün İadesi</h3>
                <p className="text-sm text-gray-500">İade nedenini seçin</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {refundReasons.map(reason => (
                <button
                  key={reason.id}
                  onClick={() => setSelectedReason(reason.label)}
                  className={`w-full p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${
                    selectedReason === reason.label ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{reason.icon}</span>
                  <span className="font-medium">{reason.label}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setRefundingItem(null); setSelectedReason(''); }} className="flex-1 py-3 border rounded-xl font-medium hover:bg-gray-50">
                İptal
              </button>
              <button onClick={handleRefund} disabled={!selectedReason} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold disabled:opacity-50">
                İade Et
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
