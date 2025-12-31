'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import {
  CreditCard, Banknote, Wallet, Receipt, Percent, Printer, X, Check,
  Loader2, RefreshCw, QrCode, Smartphone, Gift, AlertCircle, Users
} from 'lucide-react';

interface OrderData {
  id: string;
  order_number: string;
  table_number: string;
  table_id: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  items: any[];
  created_at: string;
  guest_count?: number;
  payment_status: string;
}

type PaymentMethod = 'cash' | 'card' | 'tit_pay' | 'multinet' | 'sodexo' | 'ticket' | 'mobile';

const paymentMethods: { id: PaymentMethod; name: string; icon: any; color?: string }[] = [
  { id: 'cash', name: 'Nakit', icon: Banknote },
  { id: 'card', name: 'Kredi Kartı', icon: CreditCard },
  { id: 'tit_pay', name: 'TiT Pay', icon: QrCode, color: 'from-purple-500 to-indigo-500' },
  { id: 'multinet', name: 'Multinet', icon: Wallet },
  { id: 'sodexo', name: 'Sodexo', icon: Wallet },
  { id: 'ticket', name: 'Ticket', icon: Gift },
  { id: 'mobile', name: 'Mobil Ödeme', icon: Smartphone },
];

export default function POSPage() {
  const { currentVenue } = useVenueStore();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Check for pre-selected table from waiter panel
  useEffect(() => {
    const savedTable = localStorage.getItem('selectedPosTable');
    if (savedTable) {
      try {
        const tableData = JSON.parse(savedTable);
        // Find the order and select it
        const order = orders.find(o => o.id === tableData.orderId);
        if (order) {
          setSelectedOrder(order);
          if (tableData.isPartial || tableData.splitCount > 1) {
            setShowPaymentModal(true);
          }
        }
        // Clear after use
        localStorage.removeItem('selectedPosTable');
      } catch (e) {
        console.error('Error parsing saved table:', e);
      }
    }
  }, [orders]);

  const loadOrders = useCallback(async () => {
    if (!currentVenue?.id) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .in('status', ['pending', 'confirmed', 'preparing', 'ready', 'served'])
      .in('payment_status', ['pending', 'partial'])
      .not('table_number', 'is', null)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  }, [currentVenue?.id]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Real-time subscription
  useEffect(() => {
    if (!currentVenue?.id) return;

    const channel = supabase
      .channel('pos-orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `venue_id=eq.${currentVenue.id}`
      }, () => {
        loadOrders();
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [currentVenue?.id, loadOrders]);

  const handlePayment = async (method: PaymentMethod, amount: number, isPartial: boolean = false) => {
    if (!selectedOrder || !currentVenue) return;

    setProcessingPayment(true);

    try {
      // Calculate remaining amount
      const remainingAmount = selectedOrder.total - amount;

      if (remainingAmount <= 0.01 || !isPartial) {
        // Full payment - update order and table
        await supabase
          .from('orders')
          .update({
            status: 'completed',
            payment_status: 'paid',
            payment_method: method
          })
          .eq('id', selectedOrder.id);

        // Update table status to cleaning
        if (selectedOrder.table_id) {
          await supabase
            .from('tables')
            .update({ status: 'cleaning', current_guests: 0 })
            .eq('id', selectedOrder.table_id);
        }

        alert(`Ödeme tamamlandı: ₺${amount.toFixed(2)} (${paymentMethods.find(m => m.id === method)?.name})`);
      } else {
        // Partial payment - only update remaining total, keep order open
        await supabase
          .from('orders')
          .update({
            total: remainingAmount,
            payment_status: 'partial'
          })
          .eq('id', selectedOrder.id);

        alert(`Kısmi ödeme alındı: ₺${amount.toFixed(2)}\nKalan: ₺${remainingAmount.toFixed(2)}`);
      }

      setShowPaymentModal(false);
      setSelectedOrder(null);
      loadOrders();
    } catch (error) {
      console.error('Payment error:', error);
      alert('Ödeme işlemi sırasında hata oluştu');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleApplyDiscount = async (type: 'percent' | 'amount', value: number) => {
    if (!selectedOrder) return;

    const discountAmount = type === 'percent'
      ? (selectedOrder.subtotal * value / 100)
      : value;

    const newSubtotal = selectedOrder.subtotal - discountAmount;
    const taxRate = currentVenue?.settings?.tax_rate || 10;
    const newTax = newSubtotal * (taxRate / 100);
    const newTotal = newSubtotal + newTax;

    await supabase
      .from('orders')
      .update({
        discount: discountAmount,
        discount_type: type === 'percent' ? `%${value}` : `₺${value}`,
        subtotal: newSubtotal,
        tax: newTax,
        total: newTotal
      })
      .eq('id', selectedOrder.id);

    setShowDiscountModal(false);
    loadOrders();
  };

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  const getOrderDuration = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    return Math.floor(diffMs / 60000); // minutes
  };

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
    <div className="flex gap-6 h-[calc(100vh-120px)]">
      {/* Left: Open Checks */}
      <div className="w-80 flex-shrink-0 flex flex-col">
        <div className="bg-gray-800 rounded-2xl border border-gray-700 flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">Açık Hesaplar</h2>
              <p className="text-sm text-gray-400">
                {orders.length} hesap • ₺{totalRevenue.toFixed(0)}
              </p>
            </div>
            <button
              onClick={loadOrders}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Receipt className="w-12 h-12 mb-2 opacity-50" />
                <p>Açık hesap yok</p>
              </div>
            ) : (
              orders.map(order => (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`w-full p-3 rounded-xl mb-2 text-left transition-all ${
                    selectedOrder?.id === order.id
                      ? 'bg-orange-500/20 border-2 border-orange-500'
                      : 'bg-gray-700/50 hover:bg-gray-700 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <span className="font-bold text-red-400">#{order.table_number}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">Masa {order.table_number}</p>
                          {order.payment_status === 'partial' && (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                              Kısmi Ödeme
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          {order.items?.length || 0} ürün • {getOrderDuration(order.created_at)} dk
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-orange-400">₺{order.total?.toFixed(0)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Center: Order Detail */}
      <div className="flex-1 flex flex-col">
        {selectedOrder ? (
          <div className="bg-gray-800 rounded-2xl border border-gray-700 flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white">
                    Masa {selectedOrder.table_number}
                  </h2>
                  {selectedOrder.payment_status === 'partial' && (
                    <span className="px-3 py-1 bg-amber-500 text-white text-sm rounded-full">
                      Kısmi Ödeme Yapıldı
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400">
                  {selectedOrder.order_number} • {selectedOrder.items?.length || 0} kalem
                  {selectedOrder.guest_count && ` • ${selectedOrder.guest_count} kişi`}
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="p-2 hover:bg-gray-700 rounded-lg"
              >
                <Printer className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
                    <th className="pb-2">Ürün</th>
                    <th className="pb-2 text-center">Adet</th>
                    <th className="pb-2 text-right">Fiyat</th>
                    <th className="pb-2 text-right">Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-700/50">
                      <td className="py-3">
                        <p className="font-medium text-white">{item.product_name}</p>
                        {item.notes && <p className="text-xs text-gray-500">{item.notes}</p>}
                      </td>
                      <td className="py-3 text-center text-gray-300">{item.quantity}</td>
                      <td className="py-3 text-right text-gray-300">₺{item.unit_price}</td>
                      <td className="py-3 text-right font-medium text-white">₺{item.total_price?.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="p-4 bg-gray-900/50 border-t border-gray-700">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Ara Toplam</span>
                  <span className="text-white">₺{selectedOrder.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">KDV</span>
                  <span className="text-white">₺{selectedOrder.tax?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-700">
                  <span className="text-white">Toplam</span>
                  <span className="text-orange-500">₺{selectedOrder.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-2xl border border-gray-700 flex-1 flex items-center justify-center">
            <div className="text-center">
              <Receipt className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Hesap seçin</p>
            </div>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="w-72 flex-shrink-0 space-y-4">
        {/* Daily Summary */}
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-4 text-white">
          <p className="text-orange-100 text-sm">Günlük Özet</p>
          <p className="text-3xl font-bold">₺{totalRevenue.toFixed(0)}</p>
          <p className="text-orange-100 text-sm mt-1">{orders.length} açık hesap</p>
        </div>

        {/* Actions */}
        {selectedOrder && (
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4 space-y-3">
            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors"
            >
              <CreditCard className="w-5 h-5" />
              Ödeme Al
            </button>

            <button
              onClick={() => setShowDiscountModal(true)}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-colors"
            >
              <Percent className="w-4 h-4" />
              İndirim Uygula
            </button>

            <button
              onClick={() => window.print()}
              className="w-full py-3 border border-gray-600 rounded-xl font-medium text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Ön Hesap Yazdır
            </button>
          </div>
        )}

        {/* Payment Methods */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4">
          <p className="text-sm font-medium text-gray-400 mb-3">Ödeme Yöntemleri</p>
          <div className="grid grid-cols-3 gap-2">
            {paymentMethods.slice(0, 6).map(method => (
              <button
                key={method.id}
                onClick={() => selectedOrder && setShowPaymentModal(true)}
                disabled={!selectedOrder}
                className="p-3 bg-gray-700/50 hover:bg-gray-700 rounded-xl text-center transition-colors disabled:opacity-50"
              >
                <method.icon className="w-5 h-5 mx-auto text-gray-400 mb-1" />
                <p className="text-xs text-gray-400">{method.name}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedOrder && (
        <PaymentModal
          order={selectedOrder}
          onPay={handlePayment}
          onClose={() => setShowPaymentModal(false)}
          processing={processingPayment}
        />
      )}

      {/* Discount Modal */}
      {showDiscountModal && selectedOrder && (
        <DiscountModal
          onApply={handleApplyDiscount}
          onClose={() => setShowDiscountModal(false)}
        />
      )}
    </div>
  );
}

// Payment Modal
function PaymentModal({
  order, onPay, onClose, processing
}: {
  order: OrderData;
  onPay: (method: PaymentMethod, amount: number, isPartial: boolean) => void;
  onClose: () => void;
  processing: boolean;
}) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [mode, setMode] = useState<'full' | 'partial' | 'split'>('full');
  const [cashReceived, setCashReceived] = useState('');
  const [partialAmount, setPartialAmount] = useState('');
  const [splitCount, setSplitCount] = useState(2);

  const cashValue = parseFloat(cashReceived) || 0;
  const change = cashValue - order.total;
  const partialValue = parseFloat(partialAmount) || 0;
  const splitAmount = Math.ceil(order.total / splitCount);

  const getPayAmount = () => {
    if (mode === 'partial') return partialValue;
    if (mode === 'split') return splitAmount;
    return order.total;
  };

  const canPay = () => {
    if (processing) return false;
    if (mode === 'partial') return partialValue > 0 && partialValue <= order.total;
    if (mode === 'split') return splitCount >= 2;
    if (selectedMethod === 'cash') return cashValue >= order.total;
    return true;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Ödeme Al</h2>
            <p className="text-gray-400">Masa {order.table_number}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Total */}
          <div className="text-center">
            <p className="text-gray-400">Ödenecek Tutar</p>
            <p className="text-4xl font-bold text-white">₺{order.total.toFixed(2)}</p>
          </div>

          {/* Payment Mode */}
          <div className="flex gap-2 p-1 bg-gray-700 rounded-xl">
            {[
              { id: 'full', label: 'Tam Ödeme' },
              { id: 'partial', label: 'Kısmi Ödeme' },
              { id: 'split', label: 'Böl' },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id as any)}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  mode === m.id ? 'bg-orange-500 text-white' : 'text-gray-400'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Partial Amount */}
          {mode === 'partial' && (
            <div>
              <p className="text-sm font-medium text-gray-400 mb-2">Ödenecek Tutar</p>
              <input
                type="number"
                value={partialAmount}
                onChange={(e) => setPartialAmount(e.target.value)}
                placeholder="0.00"
                max={order.total}
                className="w-full text-2xl font-bold text-center py-4 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <div className="grid grid-cols-4 gap-2 mt-3">
                {[25, 50, 75, 100].map(pct => (
                  <button
                    key={pct}
                    onClick={() => setPartialAmount((order.total * pct / 100).toFixed(2))}
                    className="py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-300"
                  >
                    %{pct}
                  </button>
                ))}
              </div>
              {partialValue > 0 && partialValue < order.total && (
                <p className="text-sm text-blue-400 mt-2 text-center">
                  Kalan: ₺{(order.total - partialValue).toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* Split Options */}
          {mode === 'split' && (
            <div>
              <p className="text-sm font-medium text-gray-400 mb-2 text-center">Kaç Kişiye?</p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setSplitCount(Math.max(2, splitCount - 1))}
                  className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-xl text-white"
                >
                  -
                </button>
                <span className="text-4xl font-bold text-white w-16 text-center">{splitCount}</span>
                <button
                  onClick={() => setSplitCount(Math.min(10, splitCount + 1))}
                  className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-xl text-white"
                >
                  +
                </button>
              </div>
              <div className="mt-4 p-4 bg-amber-900/30 border border-amber-600 rounded-xl text-center">
                <p className="text-amber-400">Kişi Başı</p>
                <p className="text-2xl font-bold text-white">₺{splitAmount}</p>
              </div>
            </div>
          )}

          {/* Payment Methods */}
          <div>
            <p className="text-sm font-medium text-gray-400 mb-2">Ödeme Yöntemi</p>
            <div className="grid grid-cols-4 gap-2">
              {paymentMethods.map(method => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    selectedMethod === method.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  <method.icon className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-xs font-medium">{method.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Cash Input */}
          {selectedMethod === 'cash' && mode === 'full' && (
            <div>
              <p className="text-sm font-medium text-gray-400 mb-2">Alınan Tutar</p>
              <input
                type="number"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder="0"
                className="w-full text-3xl font-bold text-center py-4 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <div className="grid grid-cols-6 gap-2 mt-3">
                {[50, 100, 200, 500, 1000, 2000].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setCashReceived(amount.toString())}
                    className="py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-300"
                  >
                    {amount}
                  </button>
                ))}
              </div>
              {cashValue >= order.total && (
                <div className="mt-4 p-4 bg-green-900/30 border border-green-600 rounded-xl text-center">
                  <p className="text-green-400">Para Üstü</p>
                  <p className="text-2xl font-bold text-white">₺{change.toFixed(2)}</p>
                </div>
              )}
            </div>
          )}

          {/* Pay Button */}
          <button
            onClick={() => onPay(selectedMethod, getPayAmount(), mode === 'partial')}
            disabled={!canPay()}
            className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors"
          >
            {processing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5" />
                {mode === 'partial' ? `₺${partialValue.toFixed(0)} Ödeme Al` :
                 mode === 'split' ? `₺${splitAmount} Ödeme Al (1/${splitCount})` :
                 'Ödemeyi Tamamla'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Discount Modal
function DiscountModal({
  onApply, onClose
}: {
  onApply: (type: 'percent' | 'amount', value: number) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<'percent' | 'amount'>('percent');
  const [value, setValue] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-sm">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">İndirim Uygula</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Type Toggle */}
          <div className="flex bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setType('percent')}
              className={`flex-1 py-2 rounded-md font-medium transition-colors ${
                type === 'percent' ? 'bg-orange-500 text-white' : 'text-gray-400'
              }`}
            >
              Yüzde (%)
            </button>
            <button
              onClick={() => setType('amount')}
              className={`flex-1 py-2 rounded-md font-medium transition-colors ${
                type === 'amount' ? 'bg-orange-500 text-white' : 'text-gray-400'
              }`}
            >
              Tutar (₺)
            </button>
          </div>

          {/* Input */}
          <div className="relative">
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0"
              className="w-full text-3xl font-bold text-center py-4 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">
              {type === 'percent' ? '%' : '₺'}
            </span>
          </div>

          {/* Quick Percents */}
          {type === 'percent' && (
            <div className="grid grid-cols-6 gap-2">
              {[5, 10, 15, 20, 25, 50].map(p => (
                <button
                  key={p}
                  onClick={() => setValue(p.toString())}
                  className="py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-300"
                >
                  %{p}
                </button>
              ))}
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
              onClick={() => onApply(type, parseFloat(value) || 0)}
              className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors"
            >
              Uygula
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
