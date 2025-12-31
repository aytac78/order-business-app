'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useVenueStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import {
  Users, Utensils, AlertCircle, Loader2, RefreshCw,
  Plus, X, CreditCard, CheckCircle, Minus,
  Phone, Search, ShoppingCart
} from 'lucide-react';

interface TableData {
  id: string;
  number: string;
  capacity: number;
  section: string;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  current_guests?: number;
}

interface OrderData {
  id: string;
  table_number: string;
  table_id: string;
  status: string;
  total: number;
  items: any[];
  created_at: string;
  guest_count?: number;
}

interface ReservationData {
  id: string;
  customer_name: string;
  customer_phone: string;
  time: string;
  party_size: number;
  table_number: string;
  status: string;
}

interface CategoryData {
  id: string;
  name: string;
  sort_order: number;
}

interface ProductData {
  id: string;
  name: string;
  price: number;
  category_id: string;
  is_available: boolean;
  image_url?: string;
}

interface CartItem {
  product: ProductData;
  quantity: number;
  notes?: string;
}

export default function WaiterPage() {
  const { currentVenue } = useVenueStore();
  const router = useRouter();

  const [tables, setTables] = useState<TableData[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [activeSection, setActiveSection] = useState<string>('all');
  
  // Order Modal State
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestTable, setGuestTable] = useState<TableData | null>(null);
  const [orderTable, setOrderTable] = useState<TableData | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status config
  const statusConfig = {
    available: { label: 'Müsait', bg: 'bg-green-500', border: 'border-green-400' },
    occupied: { label: 'Dolu', bg: 'bg-red-500', border: 'border-red-400' },
    reserved: { label: 'Rezerveli', bg: 'bg-amber-500', border: 'border-amber-400' },
    cleaning: { label: 'Temizleniyor', bg: 'bg-blue-500', border: 'border-blue-400' },
  };

  const loadData = useCallback(async () => {
    if (!currentVenue?.id) return;

    const today = new Date().toISOString().split('T')[0];

    const [tablesRes, ordersRes, reservationsRes, categoriesRes, productsRes] = await Promise.all([
      supabase.from('tables').select('*').eq('venue_id', currentVenue.id).eq('is_active', true).order('number'),
      supabase.from('orders').select('*').eq('venue_id', currentVenue.id).in('status', ['pending', 'confirmed', 'preparing', 'ready', 'served']).not('table_number', 'is', null),
      supabase.from('reservations').select('*').eq('venue_id', currentVenue.id).eq('date', today).in('status', ['pending', 'confirmed']),
      supabase.from('categories').select('*').eq('venue_id', currentVenue.id).eq('is_active', true).order('sort_order'),
      supabase.from('products').select('*').eq('venue_id', currentVenue.id).eq('is_available', true).order('sort_order')
    ]);

    if (tablesRes.data) setTables(tablesRes.data);
    if (ordersRes.data) setOrders(ordersRes.data);
    if (reservationsRes.data) setReservations(reservationsRes.data);
    if (categoriesRes.data) setCategories(categoriesRes.data);
    if (productsRes.data) setProducts(productsRes.data);
    setLoading(false);
  }, [currentVenue?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time subscription
  useEffect(() => {
    if (!currentVenue?.id) return;

    const channel = supabase
      .channel('waiter-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables', filter: `venue_id=eq.${currentVenue.id}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `venue_id=eq.${currentVenue.id}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations', filter: `venue_id=eq.${currentVenue.id}` }, loadData)
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [currentVenue?.id, loadData]);

  const getTableOrder = (tableNumber: string) => orders.find(o => o.table_number === tableNumber);
  const getTableReservations = (tableNumber: string) => reservations.filter(r => r.table_number === tableNumber);

  const getRealStatus = (table: TableData): 'available' | 'occupied' | 'reserved' | 'cleaning' => {
    const order = getTableOrder(table.number);
    const tableReservations = getTableReservations(table.number);
    if (order) return 'occupied';
    if (tableReservations.length > 0) return 'reserved';
    return table.status;
  };

  const sections = ['all', ...Array.from(new Set(tables.map(t => t.section)))];
  const filteredTables = activeSection === 'all' ? tables : tables.filter(t => t.section === activeSection);

  // Stats
  const stats = {
    available: tables.filter(t => getRealStatus(t) === 'available').length,
    occupied: tables.filter(t => getRealStatus(t) === 'occupied').length,
    reserved: tables.filter(t => getRealStatus(t) === 'reserved').length,
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0),
  };

  const handleStatusChange = async (tableId: string, newStatus: TableData['status']) => {
    await supabase.from('tables').update({ status: newStatus }).eq('id', tableId);
    loadData();
    setSelectedTable(null);
  };

  // Order Functions
  const openOrderModal = (table: TableData) => {
    setOrderTable(table);
    setCart([]);
    setActiveCategory('all');
    setSearchQuery('');
    setShowOrderModal(true);
    setSelectedTable(null);
  };

  const handleGetBill = (table: TableData) => {
    // POS sayfasına yönlendir, masa bilgisiyle
    const order = getTableOrder(table.number);
    if (order) {
      // LocalStorage'a seçili hesap bilgisini kaydet
      localStorage.setItem('selectedPosTable', JSON.stringify({
        tableId: table.id,
        tableNumber: table.number,
        orderId: order.id,
        total: order.total
      }));
    }
    router.push('/pos');
  };

  const openGuestModal = (table: TableData) => {
    setGuestTable(table);
    setShowGuestModal(true);
    setSelectedTable(null);
  };

  const handleUpdateGuests = async (tableId: string, guestCount: number) => {
    // Masa kişi sayısını güncelle
    await supabase
      .from('tables')
      .update({ current_guests: guestCount })
      .eq('id', tableId);
    
    // Eğer sipariş varsa, siparişe de kaydet
    const table = tables.find(t => t.id === tableId);
    if (table) {
      const order = getTableOrder(table.number);
      if (order) {
        await supabase
          .from('orders')
          .update({ guest_count: guestCount })
          .eq('id', order.id);
      }
    }
    
    setShowGuestModal(false);
    loadData();
  };

  const addToCart = (product: ProductData) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(item =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter(item => item.product.id !== productId);
    });
  };

  const getCartTotal = () => cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const getCartCount = () => cart.reduce((sum, item) => sum + item.quantity, 0);

  const submitOrder = async () => {
    if (!orderTable || !currentVenue || cart.length === 0) return;

    setIsSubmitting(true);

    try {
      // Generate order number
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
      const subtotal = getCartTotal();
      const taxRate = currentVenue.settings?.tax_rate || 10;
      const tax = subtotal * (taxRate / 100);
      const total = subtotal + tax;

      // Create order
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          venue_id: currentVenue.id,
          table_id: orderTable.id,
          table_number: orderTable.number,
          order_number: orderNumber,
          type: 'dine_in',
          status: 'pending',
          subtotal,
          tax,
          service_charge: 0,
          discount: 0,
          total,
          payment_status: 'pending',
          items: cart.map(item => ({
            product_id: item.product.id,
            product_name: item.product.name,
            quantity: item.quantity,
            unit_price: item.product.price,
            total_price: item.product.price * item.quantity,
            notes: item.notes || '',
            status: 'pending'
          })),
          priority: 'normal'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Update table status
      await supabase
        .from('tables')
        .update({ status: 'occupied' })
        .eq('id', orderTable.id);

      // Close modal and refresh
      setShowOrderModal(false);
      setCart([]);
      loadData();
      
      alert(`Sipariş oluşturuldu: ${orderNumber}`);
    } catch (error) {
      console.error('Order error:', error);
      alert('Sipariş oluşturulurken hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addToExistingOrder = async (order: OrderData) => {
    if (cart.length === 0) return;

    setIsSubmitting(true);

    try {
      const newItems = cart.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
        notes: item.notes || '',
        status: 'pending'
      }));

      const updatedItems = [...(order.items || []), ...newItems];
      const subtotal = updatedItems.reduce((sum, item) => sum + item.total_price, 0);
      const taxRate = currentVenue?.settings?.tax_rate || 10;
      const tax = subtotal * (taxRate / 100);
      const total = subtotal + tax;

      const { error } = await supabase
        .from('orders')
        .update({
          items: updatedItems,
          subtotal,
          tax,
          total,
          status: 'pending'
        })
        .eq('id', order.id);

      if (error) throw error;

      setShowOrderModal(false);
      setCart([]);
      loadData();
      
      alert('Ürünler siparişe eklendi');
    } catch (error) {
      console.error('Add to order error:', error);
      alert('Ürün eklenirken hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'all' || p.category_id === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-gray-400">Lütfen bir mekan seçin</p>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Garson Paneli</h1>
          <p className="text-gray-400">{tables.length} Masa</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Yenile
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
          <p className="text-green-400 text-sm">Müsait</p>
          <p className="text-2xl font-bold text-white">{stats.available}</p>
        </div>
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
          <p className="text-red-400 text-sm">Dolu</p>
          <p className="text-2xl font-bold text-white">{stats.occupied}</p>
        </div>
        <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4">
          <p className="text-amber-400 text-sm">Rezerveli</p>
          <p className="text-2xl font-bold text-white">{stats.reserved}</p>
        </div>
        <div className="bg-purple-500/20 border border-purple-500/50 rounded-xl p-4">
          <p className="text-purple-400 text-sm">Aktif Sipariş</p>
          <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
        </div>
        <div className="bg-orange-500/20 border border-orange-500/50 rounded-xl p-4">
          <p className="text-orange-400 text-sm">Toplam</p>
          <p className="text-2xl font-bold text-white">₺{stats.totalRevenue.toFixed(0)}</p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {sections.map(section => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
              activeSection === section
                ? 'bg-orange-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {section === 'all' ? 'Tüm Bölümler' : section}
          </button>
        ))}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filteredTables.map(table => {
          const realStatus = getRealStatus(table);
          const config = statusConfig[realStatus];
          const order = getTableOrder(table.number);
          const tableReservations = getTableReservations(table.number);

          return (
            <div
              key={table.id}
              onClick={() => setSelectedTable(table)}
              className={`relative rounded-xl p-4 cursor-pointer hover:scale-105 transition-all border-2 ${config.border} ${
                realStatus === 'available' ? 'bg-green-900/30' :
                realStatus === 'occupied' ? 'bg-red-900/30' :
                realStatus === 'reserved' ? 'bg-amber-900/30' :
                'bg-blue-900/30'
              }`}
            >
              {tableReservations.length > 0 && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {tableReservations.length}
                </div>
              )}
              {order && (
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <Utensils className="w-3 h-3 text-white" />
                </div>
              )}

              <h3 className="text-2xl font-bold text-white">{table.number}</h3>
              <p className="text-gray-400 text-sm">{table.section}</p>
              <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
                <Users className="w-3 h-3" />
                <span>{table.capacity}</span>
              </div>

              {order && (
                <div className="mt-2 text-sm">
                  <p className="text-orange-400 font-medium">₺{order.total?.toFixed(0)}</p>
                  <p className="text-gray-500">{order.items?.length || 0} ürün</p>
                </div>
              )}

              {!order && tableReservations[0] && (
                <div className="mt-2 text-xs text-amber-400">
                  <p>{tableReservations[0].time} - {tableReservations[0].customer_name}</p>
                </div>
              )}

              <div className={`mt-2 inline-block px-2 py-1 ${config.bg} text-white text-xs rounded-full`}>
                {config.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Table Detail Modal */}
      {selectedTable && (
        <TableActionModal
          table={selectedTable}
          order={getTableOrder(selectedTable.number)}
          reservations={getTableReservations(selectedTable.number)}
          statusConfig={statusConfig}
          onClose={() => setSelectedTable(null)}
          onStatusChange={(status) => handleStatusChange(selectedTable.id, status)}
          onTakeOrder={() => openOrderModal(selectedTable)}
          onGetBill={() => handleGetBill(selectedTable)}
          onAddGuest={() => openGuestModal(selectedTable)}
        />
      )}

      {/* Guest Modal */}
      {showGuestModal && guestTable && (
        <GuestModal
          table={guestTable}
          currentGuests={guestTable.current_guests || 0}
          onUpdate={(count) => handleUpdateGuests(guestTable.id, count)}
          onClose={() => setShowGuestModal(false)}
        />
      )}

      {/* Order Modal */}
      {showOrderModal && orderTable && (
        <OrderModal
          table={orderTable}
          existingOrder={getTableOrder(orderTable.number)}
          categories={categories}
          products={filteredProducts}
          cart={cart}
          activeCategory={activeCategory}
          searchQuery={searchQuery}
          isSubmitting={isSubmitting}
          onCategoryChange={setActiveCategory}
          onSearchChange={setSearchQuery}
          onAddToCart={addToCart}
          onRemoveFromCart={removeFromCart}
          onSubmit={submitOrder}
          onAddToExisting={addToExistingOrder}
          onClose={() => setShowOrderModal(false)}
          getCartTotal={getCartTotal}
          getCartCount={getCartCount}
        />
      )}
    </div>
  );
}

// Table Action Modal
function TableActionModal({
  table, order, reservations, statusConfig, onClose, onStatusChange, onTakeOrder, onGetBill, onAddGuest
}: {
  table: TableData;
  order?: OrderData;
  reservations: ReservationData[];
  statusConfig: any;
  onClose: () => void;
  onStatusChange: (status: TableData['status']) => void;
  onTakeOrder: () => void;
  onGetBill: () => void;
  onAddGuest: () => void;
}) {
  const realStatus = order ? 'occupied' : reservations.length > 0 ? 'reserved' : table.status;
  const config = statusConfig[realStatus];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">Masa No {table.number}</h2>
              <span className={`px-3 py-1 ${config.bg} text-white text-sm rounded-full`}>
                {config.label}
              </span>
            </div>
            <p className="text-gray-400 mt-1">{table.section} • {table.capacity} kişi</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Hızlı İşlemler</h3>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={onTakeOrder}
                className="flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                {order ? 'Ürün Ekle' : 'Sipariş Al'}
              </button>
              <button 
                onClick={onAddGuest}
                className="flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
              >
                <Users className="w-4 h-4" />
                Kişi Ekle
              </button>
            </div>
            {order && (
              <button 
                onClick={onGetBill}
                className="w-full mt-2 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                Hesap Al
              </button>
            )}
          </div>

          {/* Active Order */}
          {order && (
            <div className="bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-white">Mevcut Sipariş</h3>
                <span className="text-orange-400 font-bold">₺{order.total?.toFixed(2)}</span>
              </div>
              <div className="space-y-2">
                {order.items?.slice(0, 5).map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">{item.quantity}x {item.product_name}</span>
                    <span className="text-gray-400">₺{item.total_price?.toFixed(0)}</span>
                  </div>
                ))}
                {(order.items?.length || 0) > 5 && (
                  <p className="text-xs text-gray-500">+{order.items!.length - 5} daha fazla ürün</p>
                )}
              </div>

            </div>
          )}

          {/* Reservations */}
          {reservations.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Rezervasyonlar</h3>
              <div className="space-y-2">
                {reservations.map(res => (
                  <div key={res.id} className="bg-amber-900/30 border border-amber-700 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{res.customer_name}</span>
                      <span className="text-amber-400">{res.time}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                      <span><Users className="w-3 h-3 inline mr-1" />{res.party_size}</span>
                      <span><Phone className="w-3 h-3 inline mr-1" />{res.customer_phone}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Change */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">Durum Değiştir</h3>
            <div className="grid grid-cols-2 gap-2">
              {(['available', 'occupied', 'reserved', 'cleaning'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => onStatusChange(status)}
                  className={`py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
                    table.status === status
                      ? `${statusConfig[status].bg} text-white`
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {statusConfig[status].label}
                </button>
              ))}
            </div>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

// Order Modal
function OrderModal({
  table, existingOrder, categories, products, cart, activeCategory, searchQuery, isSubmitting,
  onCategoryChange, onSearchChange, onAddToCart, onRemoveFromCart, onSubmit, onAddToExisting, onClose,
  getCartTotal, getCartCount
}: {
  table: TableData;
  existingOrder?: OrderData;
  categories: CategoryData[];
  products: ProductData[];
  cart: CartItem[];
  activeCategory: string;
  searchQuery: string;
  isSubmitting: boolean;
  onCategoryChange: (id: string) => void;
  onSearchChange: (q: string) => void;
  onAddToCart: (p: ProductData) => void;
  onRemoveFromCart: (id: string) => void;
  onSubmit: () => void;
  onAddToExisting: (order: OrderData) => void;
  onClose: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
}) {
  return (
    <div className="fixed inset-0 bg-black/80 flex z-50">
      {/* Left: Products */}
      <div className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              {existingOrder ? 'Siparişe Ekle' : 'Yeni Sipariş'} - Masa {table.number}
            </h2>
            <p className="text-gray-400 text-sm">{table.section}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Ürün ara..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="px-4 py-2 border-b border-gray-800 overflow-x-auto">
          <div className="flex gap-2">
            <button
              onClick={() => onCategoryChange('all')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeCategory === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-300'
              }`}
            >
              Tümü
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  activeCategory === cat.id ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-300'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {products.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Utensils className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Ürün bulunamadı</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map(product => {
                const cartItem = cart.find(item => item.product.id === product.id);
                return (
                  <div
                    key={product.id}
                    onClick={() => onAddToCart(product)}
                    className={`relative bg-gray-800 rounded-xl p-4 cursor-pointer hover:bg-gray-700 transition-colors ${
                      cartItem ? 'ring-2 ring-orange-500' : ''
                    }`}
                  >
                    {cartItem && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {cartItem.quantity}
                      </div>
                    )}
                    <h3 className="font-medium text-white mb-1">{product.name}</h3>
                    <p className="text-orange-400 font-bold">₺{product.price}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-96 bg-gray-800 flex flex-col border-l border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-white">Sepet ({getCartCount()})</h3>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Sepet boş</p>
                <p className="text-sm">Ürün eklemek için tıklayın</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.product.id} className="bg-gray-700/50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">{item.product.name}</h4>
                    <span className="text-orange-400 font-bold">
                      ₺{(item.product.price * item.quantity).toFixed(0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">₺{item.product.price} x {item.quantity}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); onRemoveFromCart(item.product.id); }}
                        className="w-8 h-8 bg-gray-600 hover:bg-red-600 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-4 h-4 text-white" />
                      </button>
                      <span className="text-white font-medium w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onAddToCart(item.product); }}
                        className="w-8 h-8 bg-gray-600 hover:bg-green-600 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Footer */}
        <div className="p-4 border-t border-gray-700 space-y-3">
          <div className="flex items-center justify-between text-lg">
            <span className="text-gray-400">Toplam</span>
            <span className="text-white font-bold">₺{getCartTotal().toFixed(2)}</span>
          </div>
          
          {existingOrder ? (
            <button
              onClick={() => onAddToExisting(existingOrder)}
              disabled={cart.length === 0 || isSubmitting}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Siparişe Ekle
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onSubmit}
              disabled={cart.length === 0 || isSubmitting}
              className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Sipariş Oluştur
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Guest Modal - Kişi Sayısı Güncelleme
function GuestModal({
  table, currentGuests, onUpdate, onClose
}: {
  table: TableData;
  currentGuests: number;
  onUpdate: (count: number) => void;
  onClose: () => void;
}) {
  const [guestCount, setGuestCount] = useState(currentGuests || 1);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-sm">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Kişi Sayısı</h2>
            <p className="text-gray-400 text-sm">Masa {table.number} • Kapasite: {table.capacity}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Counter */}
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
              className="w-14 h-14 bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center justify-center transition-colors"
            >
              <Minus className="w-6 h-6 text-white" />
            </button>
            <div className="text-center">
              <p className="text-5xl font-bold text-white">{guestCount}</p>
              <p className="text-gray-400 text-sm mt-1">kişi</p>
            </div>
            <button
              onClick={() => setGuestCount(Math.min(table.capacity, guestCount + 1))}
              className="w-14 h-14 bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center justify-center transition-colors"
            >
              <Plus className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Quick Select */}
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].filter(n => n <= table.capacity).map(num => (
              <button
                key={num}
                onClick={() => setGuestCount(num)}
                className={`py-3 rounded-xl font-medium transition-colors ${
                  guestCount === num 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          {/* Warning if over capacity */}
          {guestCount > table.capacity && (
            <div className="bg-amber-900/30 border border-amber-600 rounded-xl p-3 text-amber-400 text-sm">
              ⚠️ Masa kapasitesi aşıldı
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
            >
              İptal
            </button>
            <button
              onClick={() => onUpdate(guestCount)}
              className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
            >
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
