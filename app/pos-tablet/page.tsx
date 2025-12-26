'use client';

import { useState, useEffect, useCallback } from 'react';
// import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  CreditCard, Banknote, Wallet, QrCode, Smartphone, Gift,
  Receipt, Percent, Split, Printer, X, Check, Calculator, Clock,
  Users, RefreshCw, ChevronRight, Minus, Plus, Search
} from 'lucide-react';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
}

interface Order {
  id: string;
  order_number: string;
  table_id?: string;
  table_number?: string;
  type: 'dine_in' | 'takeaway' | 'delivery';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
  waiter_name?: string;
}

type PaymentMethod = 'cash' | 'card' | 'titpay' | 'multinet' | 'sodexo' | 'mobile';

const paymentMethods: { id: PaymentMethod; name: string; icon: any; color: string }[] = [
  { id: 'cash', name: 'Nakit', icon: Banknote, color: 'bg-green-500' },
  { id: 'card', name: 'Kredi Kartı', icon: CreditCard, color: 'bg-blue-500' },
  { id: 'titpay', name: 'TiT Pay', icon: QrCode, color: 'bg-purple-500' },
  { id: 'multinet', name: 'Multinet', icon: Wallet, color: 'bg-orange-500' },
  { id: 'sodexo', name: 'Sodexo', icon: Gift, color: 'bg-red-500' },
  { id: 'mobile', name: 'Mobil', icon: Smartphone, color: 'bg-cyan-500' },
];

const VENUE_ID = process.env.NEXT_PUBLIC_DEFAULT_VENUE_ID || '';

export default function POSTabletPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showSplit, setShowSplit] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [todayStats, setTodayStats] = useState({ total: 0, count: 0, cash: 0, card: 0 });

  const loadOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, table:tables(number)')
        .in('status', ['ready', 'served', 'completed'])
        .eq('payment_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedOrders: Order[] = (data || []).map(order => ({
        ...order,
        table_number: order.table?.number
      }));

      setOrders(formattedOrders);

      // Load today stats
      const today = new Date().toISOString().split('T')[0];
      const { data: statsData } = await supabase
        .from('orders')
        .select('total, payment_method')
        .eq('payment_status', 'paid')
        .gte('created_at', today);

      if (statsData) {
        const total = statsData.reduce((sum, o) => sum + (o.total || 0), 0);
        const cash = statsData.filter(o => o.payment_method === 'cash').reduce((sum, o) => sum + (o.total || 0), 0);
        const card = statsData.filter(o => o.payment_method === 'card').reduce((sum, o) => sum + (o.total || 0), 0);
        setTodayStats({ total, count: statsData.length, cash, card });
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  useEffect(() => {
    const channel = supabase
      .channel('pos-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, loadOrders)
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [loadOrders]);

  const processPayment = async (method: PaymentMethod, amount: number) => {
    if (!selectedOrder) return;

    try {
      await supabase.from('orders').update({
        payment_status: 'paid',
        payment_method: method,
        status: 'completed',
        updated_at: new Date().toISOString()
      }).eq('id', selectedOrder.id);

      // Update table status
      if (selectedOrder.table_id) {
        await supabase.from('tables').update({ status: 'cleaning' }).eq('id', selectedOrder.table_id);
      }

      setSelectedOrder(null);
      setShowPayment(false);
      loadOrders();
    } catch (error) {
      console.error('Payment error:', error);
      alert('Ödeme işlemi başarısız!');
    }
  };

  const applyDiscount = async (type: 'percent' | 'amount', value: number) => {
    if (!selectedOrder) return;

    const discountAmount = type === 'percent' ? (selectedOrder.subtotal * value / 100) : value;
    const newTotal = selectedOrder.subtotal - discountAmount + selectedOrder.tax;

    try {
      await supabase.from('orders').update({
        discount: discountAmount,
        total: newTotal
      }).eq('id', selectedOrder.id);

      setSelectedOrder({ ...selectedOrder, discount: discountAmount, total: newTotal });
      setShowDiscount(false);
      loadOrders();
    } catch (error) {
      console.error('Discount error:', error);
    }
  };

  const filteredOrders = orders.filter(o => 
    o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.table_number?.includes(searchTerm)
  );

  const getElapsedTime = (createdAt: string) => Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Left: Orders List */}
      <div className="w-96 bg-gray-800 flex flex-col border-r border-gray-700">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => { localStorage.removeItem('order-auth-storage'); window.location.href = '/' }} className="p-2 bg-red-600 hover:bg-red-700 rounded-xl">
                Çıkış
              </button>
              <div>
                <h1 className="font-bold text-lg">KASA</h1>
                <p className="text-xs text-gray-400">{currentTime.toLocaleTimeString('tr-TR')}</p>
              </div>
            </div>
            <button onClick={loadOrders} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-xl">
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Sipariş veya masa ara..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Today Stats */}
        <div className="p-4 border-b border-gray-700">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4">
            <p className="text-orange-100 text-sm">Bugün</p>
            <p className="text-2xl font-bold">₺{todayStats.total.toLocaleString('tr-TR')}</p>
            <div className="flex gap-4 mt-2 text-sm text-orange-100">
              <span>{todayStats.count} işlem</span>
              <span>•</span>
              <span>{orders.length} bekliyor</span>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredOrders.map(order => (
            <button
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className={`w-full p-4 rounded-xl text-left transition-all ${
                selectedOrder?.id === order.id
                  ? 'bg-orange-500 ring-2 ring-orange-400'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">{order.order_number}</span>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  order.type === 'dine_in' ? 'bg-blue-500' :
                  order.type === 'takeaway' ? 'bg-purple-500' : 'bg-green-500'
                }`}>
                  {order.type === 'dine_in' ? `Masa ${order.table_number}` :
                   order.type === 'takeaway' ? 'Paket' : 'Kurye'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">{order.items.length} kalem</span>
                <span className="font-bold text-lg">₺{order.total.toLocaleString('tr-TR')}</span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                <span>{getElapsedTime(order.created_at)} dk</span>
              </div>
            </button>
          ))}

          {filteredOrders.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Receipt className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Bekleyen hesap yok</p>
            </div>
          )}
        </div>
      </div>

      {/* Center: Order Detail */}
      <div className="flex-1 flex flex-col">
        {selectedOrder ? (
          <>
            {/* Order Header */}
            <div className="bg-gray-800 border-b border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedOrder.order_number}</h2>
                  <p className="text-gray-400">
                    {selectedOrder.type === 'dine_in' ? `Masa ${selectedOrder.table_number}` :
                     selectedOrder.type === 'takeaway' ? 'Paket Sipariş' : 'Kurye Sipariş'}
                    {' • '}{selectedOrder.items.length} kalem
                  </p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-700 rounded-xl">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="pb-3">Ürün</th>
                    <th className="pb-3 text-center">Adet</th>
                    <th className="pb-3 text-right">Fiyat</th>
                    <th className="pb-3 text-right">Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-800">
                      <td className="py-4">
                        <p className="font-medium">{item.product_name}</p>
                        {item.notes && <p className="text-sm text-amber-400">⚠️ {item.notes}</p>}
                      </td>
                      <td className="py-4 text-center">{item.quantity}</td>
                      <td className="py-4 text-right text-gray-400">₺{item.unit_price}</td>
                      <td className="py-4 text-right font-medium">₺{item.total_price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="bg-gray-800 border-t border-gray-700 p-6">
              <div className="space-y-2 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">Ara Toplam</span>
                  <span>₺{selectedOrder.subtotal.toLocaleString('tr-TR')}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>İndirim</span>
                    <span>-₺{selectedOrder.discount.toLocaleString('tr-TR')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">KDV</span>
                  <span>₺{selectedOrder.tax.toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex justify-between text-2xl font-bold pt-2 border-t border-gray-700">
                  <span>TOPLAM</span>
                  <span className="text-orange-500">₺{selectedOrder.total.toLocaleString('tr-TR')}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setShowDiscount(true)}
                  className="py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  <Percent className="w-5 h-5" /> İndirim
                </button>
                <button
                  onClick={() => setShowSplit(true)}
                  className="py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  <Split className="w-5 h-5" /> Böl
                </button>
                <button className="py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium flex items-center justify-center gap-2">
                  <Printer className="w-5 h-5" /> Yazdır
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Receipt className="w-20 h-20 mx-auto mb-4 opacity-30" />
              <p className="text-xl">Hesap seçin</p>
            </div>
          </div>
        )}
      </div>

      {/* Right: Payment Methods */}
      <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h3 className="font-bold text-lg">Ödeme Al</h3>
        </div>

        <div className="flex-1 p-4">
          {selectedOrder ? (
            <div className="space-y-3">
              {paymentMethods.map(method => (
                <button
                  key={method.id}
                  onClick={() => setShowPayment(true)}
                  className={`w-full p-4 ${method.color} hover:opacity-90 rounded-xl font-medium flex items-center gap-3 transition-all`}
                >
                  <method.icon className="w-6 h-6" />
                  <span className="flex-1 text-left">{method.name}</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Hesap seçin</p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="p-4 border-t border-gray-700 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Nakit</span>
            <span className="text-green-400">₺{todayStats.cash.toLocaleString('tr-TR')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Kart</span>
            <span className="text-blue-400">₺{todayStats.card.toLocaleString('tr-TR')}</span>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && selectedOrder && (
        <PaymentModal
          order={selectedOrder}
          onPay={processPayment}
          onClose={() => setShowPayment(false)}
        />
      )}

      {/* Discount Modal */}
      {showDiscount && selectedOrder && (
        <DiscountModal
          subtotal={selectedOrder.subtotal}
          currentDiscount={selectedOrder.discount}
          onApply={applyDiscount}
          onClose={() => setShowDiscount(false)}
        />
      )}

      {/* Split Modal */}
      {showSplit && selectedOrder && (
        <SplitModal
          total={selectedOrder.total}
          onClose={() => setShowSplit(false)}
        />
      )}
    </div>
  );
}

function PaymentModal({ order, onPay, onClose }: { order: Order; onPay: (method: PaymentMethod, amount: number) => void; onClose: () => void }) {
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const cashAmount = parseFloat(cashReceived) || 0;
  const change = cashAmount - order.total;
  const quickAmounts = [50, 100, 200, 500, 1000, 2000];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-lg">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Ödeme Al</h2>
            <p className="text-gray-400">{order.order_number}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Total */}
          <div className="text-center">
            <p className="text-gray-400">Ödenecek Tutar</p>
            <p className="text-4xl font-bold text-orange-500">₺{order.total.toLocaleString('tr-TR')}</p>
          </div>

          {/* Method Selection */}
          <div className="grid grid-cols-3 gap-2">
            {paymentMethods.map(m => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`p-3 rounded-xl text-center transition-all ${
                  method === m.id ? `${m.color} ring-2 ring-white` : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <m.icon className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs">{m.name}</span>
              </button>
            ))}
          </div>

          {/* Cash Input */}
          {method === 'cash' && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Alınan Tutar</p>
              <input
                type="number"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                className="w-full text-3xl font-bold text-center py-4 bg-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="0"
              />
              <div className="grid grid-cols-6 gap-2 mt-3">
                {quickAmounts.map(amount => (
                  <button
                    key={amount}
                    onClick={() => setCashReceived(amount.toString())}
                    className="py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
                  >
                    {amount}
                  </button>
                ))}
              </div>
              {cashAmount >= order.total && (
                <div className="mt-4 p-4 bg-green-500/20 rounded-xl text-center">
                  <p className="text-green-400">Para Üstü</p>
                  <p className="text-2xl font-bold text-green-400">₺{change.toFixed(2)}</p>
                </div>
              )}
            </div>
          )}

          {/* TiT Pay QR */}
          {method === 'titpay' && (
            <div className="bg-purple-500/20 rounded-xl p-6 text-center">
              <div className="w-32 h-32 bg-white rounded-xl mx-auto mb-4 flex items-center justify-center">
                <QrCode className="w-24 h-24 text-purple-600" />
              </div>
              <p className="text-purple-400">QR kodu müşteriye gösterin</p>
            </div>
          )}

          {/* Pay Button */}
          <button
            onClick={() => onPay(method, method === 'cash' ? cashAmount : order.total)}
            disabled={method === 'cash' && cashAmount < order.total}
            className="w-full py-4 bg-green-500 hover:bg-green-400 disabled:bg-gray-600 rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" /> Ödemeyi Tamamla
          </button>
        </div>
      </div>
    </div>
  );
}

function DiscountModal({ subtotal, currentDiscount, onApply, onClose }: { subtotal: number; currentDiscount: number; onApply: (type: 'percent' | 'amount', value: number) => void; onClose: () => void }) {
  const [type, setType] = useState<'percent' | 'amount'>('percent');
  const [value, setValue] = useState(currentDiscount.toString());
  const quickPercents = [5, 10, 15, 20, 25, 50];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-sm">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold">İndirim Uygula</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex bg-gray-700 rounded-xl p-1">
            <button onClick={() => setType('percent')} className={`flex-1 py-2 rounded-lg ${type === 'percent' ? 'bg-orange-500' : ''}`}>
              Yüzde (%)
            </button>
            <button onClick={() => setType('amount')} className={`flex-1 py-2 rounded-lg ${type === 'amount' ? 'bg-orange-500' : ''}`}>
              Tutar (₺)
            </button>
          </div>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full text-3xl font-bold text-center py-4 bg-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          {type === 'percent' && (
            <div className="grid grid-cols-6 gap-2">
              {quickPercents.map(p => (
                <button key={p} onClick={() => setValue(p.toString())} className="py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">
                  %{p}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => onApply(type, 0)} className="flex-1 py-3 bg-gray-700 rounded-xl">Kaldır</button>
            <button onClick={() => onApply(type, parseFloat(value) || 0)} className="flex-1 py-3 bg-orange-500 rounded-xl">Uygula</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SplitModal({ total, onClose }: { total: number; onClose: () => void }) {
  const [splitCount, setSplitCount] = useState(2);
  const perPerson = Math.ceil(total / splitCount);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-sm">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold">Hesabı Böl</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-gray-400">Toplam</p>
            <p className="text-3xl font-bold">₺{total.toLocaleString('tr-TR')}</p>
          </div>
          <div className="flex items-center justify-center gap-4">
            <button onClick={() => setSplitCount(Math.max(2, splitCount - 1))} className="w-12 h-12 bg-gray-700 rounded-xl text-xl">-</button>
            <span className="text-4xl font-bold w-16 text-center">{splitCount}</span>
            <button onClick={() => setSplitCount(splitCount + 1)} className="w-12 h-12 bg-gray-700 rounded-xl text-xl">+</button>
          </div>
          <div className="bg-orange-500/20 rounded-xl p-4 text-center">
            <p className="text-orange-400">Kişi Başı</p>
            <p className="text-3xl font-bold text-orange-500">₺{perPerson.toLocaleString('tr-TR')}</p>
          </div>
          <button onClick={onClose} className="w-full py-3 bg-orange-500 rounded-xl font-bold">Tamam</button>
        </div>
      </div>
    </div>
  );
}
