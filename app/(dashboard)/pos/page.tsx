'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import {
  CreditCard,
  Banknote,
  Wallet,
  Receipt,
  Percent,
  Split,
  Printer,
  X,
  Check,
  AlertCircle,
  QrCode,
  Smartphone,
  Gift,
  Minus,
  Plus,
  RefreshCw,
  Clock,
  Users,
  ChefHat,
  UtensilsCrossed
} from 'lucide-react';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  status: string;
}

interface OpenCheck {
  id: string;
  order_number: string;
  type: 'dine_in' | 'takeaway' | 'delivery' | 'qr_order';
  table_number?: string;
  table_id?: string;
  customer_name?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid_amount: number;
  remaining_amount: number;
  waiter_name?: string;
  status: string;
  payment_status: string;
  created_at: string;
  notes?: string;
}

type PaymentMethod = 'cash' | 'card' | 'multinet' | 'sodexo' | 'ticket' | 'mobile' | 'titpay';

const paymentMethods: { id: PaymentMethod; name: string; icon: any; color?: string }[] = [
  { id: 'cash', name: 'Nakit', icon: Banknote },
  { id: 'card', name: 'Kredi Kartı', icon: CreditCard },
  { id: 'titpay', name: 'TiT Pay', icon: QrCode, color: 'from-purple-500 to-indigo-500' },
  { id: 'multinet', name: 'Multinet', icon: Wallet },
  { id: 'sodexo', name: 'Sodexo', icon: Wallet },
  { id: 'ticket', name: 'Ticket', icon: Gift },
  { id: 'mobile', name: 'Mobil Ödeme', icon: Smartphone },
];

export default function POSPage() {
  const { currentVenue } = useVenueStore();
  const [checks, setChecks] = useState<OpenCheck[]>([]);
  const [selectedCheck, setSelectedCheck] = useState<OpenCheck | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Fetch open orders with items from Supabase
  const fetchOpenOrders = useCallback(async () => {
    if (!currentVenue?.id) return;

    try {
      setError(null);
      
      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('venue_id', currentVenue.id)
        .in('status', ['pending', 'confirmed', 'preparing', 'ready', 'served'])
        .neq('payment_status', 'paid')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch items for all orders
      const orderIds = (ordersData || []).map(o => o.id);
      let itemsData: any[] = [];
      
      if (orderIds.length > 0) {
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', orderIds);
        
        if (itemsError) console.warn('Items fetch error:', itemsError);
        itemsData = items || [];
      }

      // Transform orders to checks format
      const openChecks: OpenCheck[] = (ordersData || []).map(order => {
        const orderItems = itemsData.filter(item => item.order_id === order.id);
        const paidAmount = order.paid_amount || 0;
        const total = order.total || 0;
        
        return {
          id: order.id,
          order_number: order.order_number || `ORD-${order.id.slice(0, 6).toUpperCase()}`,
          type: order.type || 'dine_in',
          table_number: order.table_number,
          table_id: order.table_id,
          customer_name: order.customer_name,
          items: orderItems.map(item => ({
            id: item.id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            notes: item.notes,
            status: item.status
          })),
          subtotal: order.subtotal || 0,
          discount: order.discount || 0,
          tax: order.tax || 0,
          total: total,
          paid_amount: paidAmount,
          remaining_amount: total - paidAmount,
          waiter_name: order.waiter_name,
          status: order.status,
          payment_status: order.payment_status || 'pending',
          created_at: order.created_at,
          notes: order.notes
        };
      });

      setChecks(openChecks);
      
      // Update selected check if it exists
      if (selectedCheck) {
        const updated = openChecks.find(c => c.id === selectedCheck.id);
        if (updated) {
          setSelectedCheck(updated);
        } else {
          setSelectedCheck(null);
        }
      }
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentVenue?.id, selectedCheck]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (currentVenue?.id) {
      fetchOpenOrders();

      // Real-time subscription
      const channel = supabase
        .channel('pos-orders-realtime')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'orders', filter: `venue_id=eq.${currentVenue.id}` },
          () => fetchOpenOrders()
        )
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'order_items' },
          () => fetchOpenOrders()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentVenue?.id, fetchOpenOrders]);

  const handleApplyDiscount = async (type: 'percent' | 'amount', value: number) => {
    if (!selectedCheck) return;
    
    const discountAmount = type === 'percent' 
      ? (selectedCheck.subtotal * value / 100)
      : value;
    
    const newSubtotal = selectedCheck.subtotal - discountAmount;
    const newTax = newSubtotal * 0.08;
    const newTotal = newSubtotal + newTax;

    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          discount: discountAmount,
          tax: Math.round(newTax * 100) / 100,
          total: Math.round(newTotal * 100) / 100
        })
        .eq('id', selectedCheck.id);

      if (updateError) throw updateError;
      
      await fetchOpenOrders();
    } catch (err: any) {
      console.error('Error applying discount:', err);
      setError(err.message);
    }
    
    setShowDiscountModal(false);
  };

  const handlePayment = async (method: PaymentMethod, amount: number, isPartial: boolean) => {
    if (!selectedCheck) return;
    
    try {
      const newPaidAmount = selectedCheck.paid_amount + amount;
      const isFullyPaid = newPaidAmount >= selectedCheck.total;
      
      // Update order
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          paid_amount: newPaidAmount,
          payment_status: isFullyPaid ? 'paid' : 'partial',
          payment_method: method,
          status: isFullyPaid ? 'completed' : selectedCheck.status
        })
        .eq('id', selectedCheck.id);

      if (updateError) throw updateError;

      // Update table status if fully paid and has table
      if (isFullyPaid && selectedCheck.table_id) {
        await supabase
          .from('tables')
          .update({ status: 'cleaning', current_order_id: null })
          .eq('id', selectedCheck.table_id);
      }

      setShowPaymentModal(false);
      
      const methodName = paymentMethods.find(m => m.id === method)?.name;
      if (isFullyPaid) {
        alert(`✓ Ödeme tamamlandı!\n${methodName}: ₺${amount.toLocaleString()}`);
        setSelectedCheck(null);
      } else {
        const remaining = selectedCheck.total - newPaidAmount;
        alert(`✓ Kısmi ödeme alındı!\n${methodName}: ₺${amount.toLocaleString()}\nKalan: ₺${remaining.toLocaleString()}`);
      }
      
      await fetchOpenOrders();
    } catch (err: any) {
      console.error('Error processing payment:', err);
      setError(err.message);
    }
  };

  // Calculate duration from created_at
  const getDuration = (createdAt: string) => {
    const start = new Date(createdAt);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 60000);
    return diff;
  };

  // Get time string from created_at
  const getOpenedAt = (createdAt: string) => {
    return new Date(createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const totalRevenue = checks.reduce((sum, c) => sum + c.remaining_amount, 0);
  const tableChecks = checks.filter(c => c.type === 'dine_in');
  const otherChecks = checks.filter(c => c.type !== 'dine_in');

  const typeLabels: Record<string, { text: string; color: string }> = {
    dine_in: { text: 'Masada', color: 'bg-blue-100 text-blue-700' },
    takeaway: { text: 'Paket', color: 'bg-purple-100 text-purple-700' },
    delivery: { text: 'Teslimat', color: 'bg-green-100 text-green-700' },
    qr_order: { text: 'QR Sipariş', color: 'bg-orange-100 text-orange-700' }
  };

  const statusLabels: Record<string, { text: string; color: string }> = {
    pending: { text: 'Bekliyor', color: 'bg-yellow-100 text-yellow-700' },
    confirmed: { text: 'Onaylandı', color: 'bg-blue-100 text-blue-700' },
    preparing: { text: 'Hazırlanıyor', color: 'bg-purple-100 text-purple-700' },
    ready: { text: 'Hazır', color: 'bg-green-100 text-green-700' },
    served: { text: 'Servis Edildi', color: 'bg-gray-100 text-gray-700' }
  };

  if (!mounted) {
    return <div className="animate-pulse bg-gray-100 rounded-2xl h-96" />;
  }

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Mekan Seçimi Gerekli</h2>
          <p className="text-gray-500">Kasa için lütfen bir mekan seçin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)]">
      {/* Left: Open Checks */}
      <div className="w-80 flex-shrink-0 flex flex-col">
        <div className="bg-white rounded-2xl border border-gray-100 flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Açık Hesaplar</h2>
              <p className="text-sm text-gray-500">
                {checks.length} hesap • ₺{totalRevenue.toLocaleString()}
              </p>
            </div>
            <button 
              onClick={fetchOpenOrders}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Yenile"
            >
              <RefreshCw className={`w-4 h-4 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border-b border-red-100">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                <p>Yükleniyor...</p>
              </div>
            ) : checks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Açık hesap yok</p>
                <p className="text-sm mt-1">Ödenmemiş sipariş bulunmuyor</p>
              </div>
            ) : (
              <>
                {/* Table Checks */}
                {tableChecks.length > 0 && (
                  <div className="p-2">
                    <p className="text-xs font-medium text-gray-500 px-2 py-1">MASALAR ({tableChecks.length})</p>
                    {tableChecks.map(check => (
                      <button
                        key={check.id}
                        onClick={() => setSelectedCheck(check)}
                        className={`w-full p-3 rounded-xl mb-1 text-left transition-all ${
                          selectedCheck?.id === check.id
                            ? 'bg-orange-50 border-2 border-orange-500'
                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                              <span className="font-bold text-red-600">#{check.table_number}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{check.order_number}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>{getDuration(check.created_at)} dk</span>
                                <span className={`px-1.5 py-0.5 rounded ${statusLabels[check.status]?.color || 'bg-gray-100'}`}>
                                  {statusLabels[check.status]?.text || check.status}
                                </span>
                              </div>
                              {check.paid_amount > 0 && (
                                <p className="text-xs text-green-600 mt-1">
                                  ₺{check.paid_amount.toLocaleString()} ödendi
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">₺{check.remaining_amount.toLocaleString()}</p>
                            {check.paid_amount > 0 && (
                              <p className="text-xs text-gray-400 line-through">₺{check.total.toLocaleString()}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Other Checks */}
                {otherChecks.length > 0 && (
                  <div className="p-2 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 px-2 py-1">PAKET / TESLİMAT ({otherChecks.length})</p>
                    {otherChecks.map(check => (
                      <button
                        key={check.id}
                        onClick={() => setSelectedCheck(check)}
                        className={`w-full p-3 rounded-xl mb-1 text-left transition-all ${
                          selectedCheck?.id === check.id
                            ? 'bg-orange-50 border-2 border-orange-500'
                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              check.type === 'takeaway' ? 'bg-purple-100' : 'bg-green-100'
                            }`}>
                              <span className={`text-sm font-bold ${
                                check.type === 'takeaway' ? 'text-purple-600' : 'text-green-600'
                              }`}>
                                {check.type === 'takeaway' ? 'P' : 'T'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{check.order_number}</p>
                              <p className="text-xs text-gray-500">
                                {check.customer_name || typeLabels[check.type]?.text}
                              </p>
                            </div>
                          </div>
                          <p className="font-bold text-gray-900">₺{check.remaining_amount.toLocaleString()}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Center: Check Detail */}
      <div className="flex-1 flex flex-col">
        {selectedCheck ? (
          <div className="bg-white rounded-2xl border border-gray-100 flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedCheck.type === 'dine_in' 
                      ? `Masa ${selectedCheck.table_number}` 
                      : selectedCheck.customer_name || selectedCheck.order_number}
                  </h2>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeLabels[selectedCheck.type]?.color}`}>
                    {typeLabels[selectedCheck.type]?.text}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusLabels[selectedCheck.status]?.color}`}>
                    {statusLabels[selectedCheck.status]?.text}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {selectedCheck.order_number} • Açılış: {getOpenedAt(selectedCheck.created_at)} • {selectedCheck.items.length} kalem
                  {selectedCheck.waiter_name && ` • ${selectedCheck.waiter_name}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg" title="Yazdır">
                  <Printer className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {selectedCheck.items.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                      <th className="pb-2">Ürün</th>
                      <th className="pb-2 text-center">Adet</th>
                      <th className="pb-2 text-right">Fiyat</th>
                      <th className="pb-2 text-right">Toplam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCheck.items.map((item, idx) => (
                      <tr key={item.id || idx} className="border-b border-gray-50">
                        <td className="py-3">
                          <p className="font-medium text-gray-900">{item.product_name}</p>
                          {item.notes && <p className="text-xs text-orange-500">{item.notes}</p>}
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            item.status === 'ready' ? 'bg-green-100 text-green-700' :
                            item.status === 'preparing' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {item.status === 'ready' ? 'Hazır' : 
                             item.status === 'preparing' ? 'Hazırlanıyor' : 
                             item.status === 'served' ? 'Servis Edildi' : 'Bekliyor'}
                          </span>
                        </td>
                        <td className="py-3 text-center text-gray-900 font-medium">{item.quantity}</td>
                        <td className="py-3 text-right text-gray-600">₺{item.unit_price.toLocaleString()}</td>
                        <td className="py-3 text-right font-medium text-gray-900">₺{item.total_price.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <UtensilsCrossed className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Sipariş detayı yok</p>
                  <p className="text-sm mt-1">Ürünler order_items tablosuna eklenmemiş</p>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Ara Toplam</span>
                  <span className="text-gray-900">₺{selectedCheck.subtotal.toLocaleString()}</span>
                </div>
                {selectedCheck.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>İndirim</span>
                    <span>-₺{selectedCheck.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">KDV (%8)</span>
                  <span className="text-gray-900">₺{selectedCheck.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                  <span className="text-gray-500">Toplam</span>
                  <span className="text-gray-900">₺{selectedCheck.total.toLocaleString()}</span>
                </div>
                {selectedCheck.paid_amount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Ödenen</span>
                    <span>-₺{selectedCheck.paid_amount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-300">
                  <span>Kalan</span>
                  <span className="text-orange-600">₺{selectedCheck.remaining_amount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 flex-1 flex items-center justify-center">
            <div className="text-center">
              <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Hesap seçin</p>
            </div>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="w-72 flex-shrink-0 space-y-4">
        {/* Quick Stats */}
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-4 text-white">
          <p className="text-orange-100 text-sm">Açık Hesaplar Toplamı</p>
          <p className="text-3xl font-bold">₺{totalRevenue.toLocaleString()}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-orange-100">
            <span>{checks.length} hesap</span>
            <span>•</span>
            <span>{tableChecks.length} masa</span>
          </div>
        </div>

        {/* Actions */}
        {selectedCheck && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors"
            >
              <CreditCard className="w-5 h-5" />
              Ödeme Al
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowDiscountModal(true)}
                className="py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700 flex items-center justify-center gap-1 transition-colors"
              >
                <Percent className="w-4 h-4" />
                İndirim
              </button>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700 flex items-center justify-center gap-1 transition-colors"
              >
                <Split className="w-4 h-4" />
                Böl
              </button>
            </div>

            <button className="w-full py-3 border border-gray-200 rounded-xl font-medium text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
              <Printer className="w-4 h-4" />
              Ön Hesap Yazdır
            </button>
          </div>
        )}

        {/* Payment Methods Quick Access */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-sm font-medium text-gray-500 mb-3">Hızlı Ödeme</p>
          <div className="grid grid-cols-3 gap-2">
            {paymentMethods.slice(0, 6).map(method => (
              <button
                key={method.id}
                onClick={() => selectedCheck && setShowPaymentModal(true)}
                disabled={!selectedCheck}
                className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-center transition-colors disabled:opacity-50"
              >
                <method.icon className="w-5 h-5 mx-auto text-gray-600 mb-1" />
                <p className="text-xs text-gray-600">{method.name}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedCheck && (
        <PaymentModal
          check={selectedCheck}
          onPay={handlePayment}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {/* Discount Modal */}
      {showDiscountModal && selectedCheck && (
        <DiscountModal
          currentDiscount={selectedCheck.discount}
          onApply={handleApplyDiscount}
          onClose={() => setShowDiscountModal(false)}
        />
      )}
    </div>
  );
}

// Payment Modal with full features
function PaymentModal({
  check,
  onPay,
  onClose
}: {
  check: OpenCheck;
  onPay: (method: PaymentMethod, amount: number, isPartial: boolean) => void;
  onClose: () => void;
}) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [manualAmount, setManualAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<'full' | 'partial' | 'split'>('full');
  const [splitCount, setSplitCount] = useState(2);

  const remainingAmount = check.remaining_amount;
  const cashAmount = parseFloat(cashReceived) || 0;
  const change = cashAmount - remainingAmount;
  const partialAmount = parseFloat(manualAmount) || 0;
  const splitAmount = Math.ceil(remainingAmount / splitCount);

  const quickAmounts = [50, 100, 200, 500, 1000, 2000];

  const getPayAmount = () => {
    if (paymentMode === 'partial') return partialAmount;
    if (paymentMode === 'split') return splitAmount;
    return remainingAmount;
  };

  const canPay = () => {
    if (paymentMode === 'partial') return partialAmount > 0 && partialAmount <= remainingAmount;
    if (paymentMode === 'split') return splitCount >= 2;
    if (selectedMethod === 'cash') return cashAmount >= remainingAmount;
    return true;
  };

  const handlePay = () => {
    const amount = getPayAmount();
    const isPartial = paymentMode === 'partial' || paymentMode === 'split';
    onPay(selectedMethod, amount, isPartial);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Ödeme Al</h2>
            <p className="text-gray-500">
              {check.type === 'dine_in' ? `Masa ${check.table_number}` : check.order_number}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Total */}
          <div className="text-center">
            <p className="text-gray-500">Ödenecek Tutar</p>
            <p className="text-4xl font-bold text-gray-900">₺{remainingAmount.toLocaleString()}</p>
            {check.paid_amount > 0 && (
              <p className="text-sm text-green-600 mt-1">₺{check.paid_amount.toLocaleString()} zaten ödendi</p>
            )}
          </div>

          {/* Payment Mode Tabs */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setPaymentMode('full')}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                paymentMode === 'full' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              Tam Ödeme
            </button>
            <button
              onClick={() => setPaymentMode('partial')}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                paymentMode === 'partial' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              Kısmi Ödeme
            </button>
            <button
              onClick={() => setPaymentMode('split')}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                paymentMode === 'split' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              Böl
            </button>
          </div>

          {/* Partial Amount Input */}
          {paymentMode === 'partial' && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Ödenecek Tutar</p>
              <input
                type="number"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                placeholder="Tutar girin..."
                max={remainingAmount}
                className="w-full text-2xl font-bold text-center py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 placeholder-gray-400"
              />
              <div className="grid grid-cols-4 gap-2 mt-3">
                {[remainingAmount * 0.25, remainingAmount * 0.5, remainingAmount * 0.75, remainingAmount].map((amount, i) => (
                  <button
                    key={i}
                    onClick={() => setManualAmount(Math.round(amount).toString())}
                    className="py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700"
                  >
                    {i === 3 ? 'Tamamı' : `%${(i + 1) * 25}`}
                  </button>
                ))}
              </div>
              {partialAmount > 0 && partialAmount < remainingAmount && (
                <p className="text-sm text-orange-600 mt-2 text-center font-medium">
                  Kalan: ₺{(remainingAmount - partialAmount).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Split Options */}
          {paymentMode === 'split' && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Kişi Sayısı</p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setSplitCount(Math.max(2, splitCount - 1))}
                  className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-xl flex items-center justify-center"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="text-4xl font-bold w-16 text-center text-gray-900">{splitCount}</span>
                <button
                  onClick={() => setSplitCount(Math.min(10, splitCount + 1))}
                  className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-xl flex items-center justify-center"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-xl text-center">
                <p className="text-blue-600">Kişi Başı</p>
                <p className="text-2xl font-bold text-blue-700">₺{splitAmount.toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Payment Methods */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Ödeme Yöntemi</p>
            <div className="grid grid-cols-4 gap-2">
              {paymentMethods.map(method => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    selectedMethod === method.id
                      ? method.color 
                        ? `bg-gradient-to-br ${method.color} text-white`
                        : 'bg-orange-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <method.icon className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-xs font-medium">{method.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* TiT Pay QR Display */}
          {selectedMethod === 'titpay' && (
            <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl text-center">
              <div className="w-32 h-32 bg-white rounded-xl mx-auto mb-4 flex items-center justify-center shadow-sm">
                <QrCode className="w-24 h-24 text-purple-600" />
              </div>
              <p className="font-medium text-purple-800">TiT Pay ile Ödeme</p>
              <p className="text-sm text-purple-600">QR kodu müşteriye gösterin</p>
            </div>
          )}

          {/* Cash Input */}
          {selectedMethod === 'cash' && paymentMode === 'full' && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Alınan Tutar</p>
              <input
                type="number"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder="0"
                className="w-full text-3xl font-bold text-center py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 placeholder-gray-400"
              />
              <div className="grid grid-cols-6 gap-2 mt-3">
                {quickAmounts.map(amount => (
                  <button
                    key={amount}
                    onClick={() => setCashReceived(amount.toString())}
                    className="py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700"
                  >
                    {amount}
                  </button>
                ))}
              </div>
              {cashAmount >= remainingAmount && (
                <div className="mt-4 p-4 bg-green-50 rounded-xl text-center">
                  <p className="text-green-600">Para Üstü</p>
                  <p className="text-2xl font-bold text-green-700">₺{change.toFixed(2)}</p>
                </div>
              )}
            </div>
          )}

          {/* Pay Button */}
          <button
            onClick={handlePay}
            disabled={!canPay()}
            className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Check className="w-5 h-5" />
            {paymentMode === 'partial' ? `₺${partialAmount.toLocaleString()} Ödeme Al` : 
             paymentMode === 'split' ? `₺${splitAmount.toLocaleString()} Ödeme Al (1/${splitCount})` :
             'Ödemeyi Tamamla'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Discount Modal
function DiscountModal({
  currentDiscount,
  onApply,
  onClose
}: {
  currentDiscount: number;
  onApply: (type: 'percent' | 'amount', value: number) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<'percent' | 'amount'>('percent');
  const [value, setValue] = useState(currentDiscount > 0 ? currentDiscount.toString() : '');

  const quickPercents = [5, 10, 15, 20, 25, 50];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">İndirim Uygula</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Type Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setType('percent')}
              className={`flex-1 py-2 rounded-md font-medium transition-colors ${
                type === 'percent' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              Yüzde (%)
            </button>
            <button
              onClick={() => setType('amount')}
              className={`flex-1 py-2 rounded-md font-medium transition-colors ${
                type === 'amount' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
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
              className="w-full text-3xl font-bold text-center py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 placeholder-gray-400"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">
              {type === 'percent' ? '%' : '₺'}
            </span>
          </div>

          {/* Quick Percents */}
          {type === 'percent' && (
            <div className="grid grid-cols-6 gap-2">
              {quickPercents.map(p => (
                <button
                  key={p}
                  onClick={() => setValue(p.toString())}
                  className="py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700"
                >
                  %{p}
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => onApply(type, 0)}
              className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
            >
              Kaldır
            </button>
            <button
              onClick={() => onApply(type, parseFloat(value) || 0)}
              className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600"
            >
              Uygula
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
