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

// Parse items from JSONB - supports both formats (Customer App & Business App)
const parseItems = (items: any): OrderItem[] => {
  if (!items) return [];
  try {
    const parsed = typeof items === 'string' ? JSON.parse(items) : items;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: any) => {
      const quantity = item.quantity || 1;
      const price = item.unit_price || item.price || 0;
      return {
        id: item.id || crypto.randomUUID(),
        product_name: item.product_name || item.name || 'Ürün',
        quantity: quantity,
        unit_price: price,
        total_price: item.total_price || (quantity * price),
        notes: item.notes,
        status: item.status || 'pending'
      };
    });
  } catch {
    return [];
  }
};

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
      
      // Fetch orders with items JSONB
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('venue_id', currentVenue.id)
        .in('status', ['pending', 'confirmed', 'preparing', 'ready', 'served'])
        .neq('payment_status', 'paid')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Also try to fetch from order_items table as fallback
      const orderIds = (ordersData || []).map(o => o.id);
      let itemsData: any[] = [];
      
      if (orderIds.length > 0) {
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', orderIds);
        
        if (!itemsError && items) {
          itemsData = items;
        }
      }

      // Transform orders to checks format
      const openChecks: OpenCheck[] = (ordersData || []).map(order => {
        // First try order_items table, then fall back to JSONB
        const tableItems = itemsData.filter(item => item.order_id === order.id);
        const items = tableItems.length > 0 
          ? tableItems.map(item => ({
              id: item.id,
              product_name: item.product_name,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
              notes: item.notes,
              status: item.status
            }))
          : parseItems(order.items); // Fall back to JSONB
        
        const paidAmount = order.paid_amount || 0;
        const total = order.total || 0;
        
        return {
          id: order.id,
          order_number: order.order_number || `ORD-${order.id.slice(0, 6).toUpperCase()}`,
          type: order.type || 'dine_in',
          table_number: order.table_number,
          table_id: order.table_id,
          customer_name: order.customer_name,
          items: items,
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
      const { error } = await supabase
        .from('orders')
        .update({
          discount: discountAmount,
          tax: Math.round(newTax),
          total: Math.round(newTotal)
        })
        .eq('id', selectedCheck.id);

      if (error) throw error;
      
      setShowDiscountModal(false);
      fetchOpenOrders();
    } catch (err: any) {
      console.error('Discount error:', err);
      alert('İndirim uygulanırken hata oluştu');
    }
  };

  const handlePayment = async (method: PaymentMethod, amount: number) => {
    if (!selectedCheck) return;
    
    const newPaidAmount = selectedCheck.paid_amount + amount;
    const isFullyPaid = newPaidAmount >= selectedCheck.total;

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          paid_amount: newPaidAmount,
          payment_status: isFullyPaid ? 'paid' : 'partial',
          payment_method: method,
          status: isFullyPaid ? 'completed' : selectedCheck.status
        })
        .eq('id', selectedCheck.id);

      if (error) throw error;

      // If table order and fully paid, update table status
      if (isFullyPaid && selectedCheck.table_id) {
        await supabase
          .from('tables')
          .update({ status: 'cleaning' })
          .eq('id', selectedCheck.table_id);
      }
      
      setShowPaymentModal(false);
      setSelectedCheck(null);
      fetchOpenOrders();
    } catch (err: any) {
      console.error('Payment error:', err);
      alert('Ödeme işlenirken hata oluştu');
    }
  };

  const getTimeDiff = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} dk`;
    const hours = Math.floor(mins / 60);
    return `${hours} sa ${mins % 60} dk`;
  };

  const tableChecks = checks.filter(c => c.table_number);
  const otherChecks = checks.filter(c => !c.table_number);
  const totalRevenue = checks.reduce((sum, c) => sum + c.total, 0);

  if (!mounted) {
    return <div className="animate-pulse bg-gray-800 rounded-2xl h-96" />;
  }

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Mekan Seçimi Gerekli</h2>
          <p className="text-gray-400">POS için lütfen bir mekan seçin.</p>
        </div>
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
                {checks.length} hesap • ₺{totalRevenue.toLocaleString()}
              </p>
            </div>
            <button 
              onClick={fetchOpenOrders}
              className="p-2 hover:bg-gray-700 rounded-lg text-gray-400"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-400">Yükleniyor...</div>
            ) : error ? (
              <div className="p-4 text-center text-red-400">{error}</div>
            ) : checks.length === 0 ? (
              <div className="p-4 text-center text-gray-400">Açık hesap yok</div>
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
                            ? 'bg-orange-600/20 border-2 border-orange-500'
                            : 'bg-gray-700/50 hover:bg-gray-700 border-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                              <span className="font-bold text-red-400">#{check.table_number}</span>
                            </div>
                            <div>
                              <p className="font-medium text-white">{check.order_number}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                <span>{getTimeDiff(check.created_at)}</span>
                                <span className={`px-1.5 py-0.5 rounded text-xs ${
                                  check.status === 'preparing' ? 'bg-purple-500/20 text-purple-400' :
                                  check.status === 'ready' ? 'bg-green-500/20 text-green-400' :
                                  'bg-amber-500/20 text-amber-400'
                                }`}>
                                  {check.status === 'preparing' ? 'Hazırlanıyor' :
                                   check.status === 'ready' ? 'Hazır' :
                                   check.status === 'served' ? 'Servis Edildi' : 'Bekliyor'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="font-bold text-white">₺{check.total.toLocaleString()}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Other Checks */}
                {otherChecks.length > 0 && (
                  <div className="p-2 border-t border-gray-700">
                    <p className="text-xs font-medium text-gray-500 px-2 py-1">PAKET / TESLİMAT ({otherChecks.length})</p>
                    {otherChecks.map(check => (
                      <button
                        key={check.id}
                        onClick={() => setSelectedCheck(check)}
                        className={`w-full p-3 rounded-xl mb-1 text-left transition-all ${
                          selectedCheck?.id === check.id
                            ? 'bg-orange-600/20 border-2 border-orange-500'
                            : 'bg-gray-700/50 hover:bg-gray-700 border-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              check.type === 'takeaway' ? 'bg-purple-500/20' : 'bg-green-500/20'
                            }`}>
                              <span className="font-bold text-xs text-gray-300">
                                {check.type === 'takeaway' ? 'P' : 'T'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-white">{check.order_number}</p>
                              <p className="text-xs text-gray-400">{check.customer_name || 'Müşteri'}</p>
                            </div>
                          </div>
                          <p className="font-bold text-white">₺{check.total.toLocaleString()}</p>
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
          <div className="bg-gray-800 rounded-2xl border border-gray-700 flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">
                    {selectedCheck.table_number 
                      ? `Masa ${selectedCheck.table_number}` 
                      : selectedCheck.customer_name || 'Paket Sipariş'}
                  </h2>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    selectedCheck.status === 'preparing' ? 'bg-purple-500/20 text-purple-400' :
                    selectedCheck.status === 'ready' ? 'bg-green-500/20 text-green-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {selectedCheck.status === 'preparing' ? 'Hazırlanıyor' :
                     selectedCheck.status === 'ready' ? 'Hazır' :
                     selectedCheck.status === 'served' ? 'Servis Edildi' : 'Bekliyor'}
                  </span>
                </div>
                <p className="text-sm text-gray-400">
                  {selectedCheck.order_number} • Açılış: {new Date(selectedCheck.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} • {selectedCheck.items.length} kalem
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-700 rounded-lg text-gray-400">
                  <Printer className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {selectedCheck.items.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Sipariş detayı yok</p>
                  <p className="text-sm">Ürünler orders.items JSONB'de</p>
                </div>
              ) : (
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
                    {selectedCheck.items.map((item, idx) => (
                      <tr key={item.id || idx} className="border-b border-gray-700/50">
                        <td className="py-3">
                          <p className="font-medium text-white">{item.product_name}</p>
                          {item.notes && <p className="text-xs text-gray-500">{item.notes}</p>}
                        </td>
                        <td className="py-3 text-center text-gray-300">{item.quantity}</td>
                        <td className="py-3 text-right text-gray-300">₺{item.unit_price.toLocaleString()}</td>
                        <td className="py-3 text-right font-medium text-white">₺{item.total_price.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Totals */}
            <div className="p-4 bg-gray-900 border-t border-gray-700">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Ara Toplam</span>
                  <span className="text-white">₺{selectedCheck.subtotal.toLocaleString()}</span>
                </div>
                {selectedCheck.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-400">
                    <span>İndirim</span>
                    <span>-₺{selectedCheck.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">KDV (%8)</span>
                  <span className="text-white">₺{selectedCheck.tax.toLocaleString()}</span>
                </div>
                {selectedCheck.paid_amount > 0 && (
                  <div className="flex justify-between text-sm text-blue-400">
                    <span>Ödenen</span>
                    <span>₺{selectedCheck.paid_amount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-700">
                  <span className="text-white">
                    {selectedCheck.paid_amount > 0 ? 'Kalan' : 'Toplam'}
                  </span>
                  <span className="text-orange-500">
                    ₺{selectedCheck.remaining_amount.toLocaleString()}
                  </span>
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
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4 space-y-3">
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
                className="py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium text-white flex items-center justify-center gap-1 transition-colors"
              >
                <Percent className="w-4 h-4" />
                % İndirim
              </button>
              <button
                className="py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium text-white flex items-center justify-center gap-1 transition-colors"
              >
                <Split className="w-4 h-4" />
                Böl
              </button>
            </div>

            <button className="w-full py-3 border border-gray-600 rounded-xl font-medium text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors">
              <Printer className="w-4 h-4" />
              Ön Hesap Yazdır
            </button>
          </div>
        )}

        {/* Payment Methods Quick Access */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4">
          <p className="text-sm font-medium text-gray-400 mb-3">Hızlı Ödeme</p>
          <div className="grid grid-cols-3 gap-2">
            {paymentMethods.slice(0, 6).map(method => (
              <button
                key={method.id}
                onClick={() => selectedCheck && setShowPaymentModal(true)}
                disabled={!selectedCheck}
                className="p-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-center transition-colors disabled:opacity-50"
              >
                <method.icon className="w-5 h-5 mx-auto text-gray-300 mb-1" />
                <p className="text-xs text-gray-400">{method.name}</p>
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

// Payment Modal
function PaymentModal({
  check,
  onPay,
  onClose
}: {
  check: OpenCheck;
  onPay: (method: PaymentMethod, amount: number) => void;
  onClose: () => void;
}) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [manualAmount, setManualAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<'full' | 'partial'>('full');

  const cashAmount = parseFloat(cashReceived) || 0;
  const change = cashAmount - check.remaining_amount;
  const partialAmount = parseFloat(manualAmount) || 0;

  const quickAmounts = [50, 100, 200, 500, 1000, 2000];

  const getPayAmount = () => {
    if (paymentMode === 'partial') return partialAmount;
    return selectedMethod === 'cash' ? Math.min(cashAmount, check.remaining_amount) : check.remaining_amount;
  };

  const canPay = () => {
    if (paymentMode === 'partial') return partialAmount > 0 && partialAmount <= check.remaining_amount;
    if (selectedMethod === 'cash') return cashAmount >= check.remaining_amount;
    return true;
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800">
          <div>
            <h2 className="text-xl font-bold text-white">Ödeme Al</h2>
            <p className="text-gray-400">
              {check.table_number ? `Masa ${check.table_number}` : check.customer_name}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Total */}
          <div className="text-center">
            <p className="text-gray-400">Ödenecek Tutar</p>
            <p className="text-4xl font-bold text-white">₺{check.remaining_amount.toLocaleString()}</p>
            {check.paid_amount > 0 && (
              <p className="text-sm text-blue-400 mt-1">
                (₺{check.paid_amount.toLocaleString()} ödenmiş)
              </p>
            )}
          </div>

          {/* Payment Mode Tabs */}
          <div className="flex gap-2 p-1 bg-gray-900 rounded-xl">
            <button
              onClick={() => setPaymentMode('full')}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                paymentMode === 'full' ? 'bg-gray-700 text-white' : 'text-gray-400'
              }`}
            >
              Tam Ödeme
            </button>
            <button
              onClick={() => setPaymentMode('partial')}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                paymentMode === 'partial' ? 'bg-gray-700 text-white' : 'text-gray-400'
              }`}
            >
              Kısmi Ödeme
            </button>
          </div>

          {/* Partial Amount Input */}
          {paymentMode === 'partial' && (
            <div>
              <p className="text-sm font-medium text-gray-300 mb-2">Ödenecek Tutar (Manuel)</p>
              <input
                type="number"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                placeholder="Tutar girin..."
                max={check.remaining_amount}
                className="w-full text-2xl font-bold text-center py-4 bg-gray-900 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {partialAmount > 0 && (
                <p className="text-sm text-gray-400 mt-2 text-center">
                  Kalan: ₺{(check.remaining_amount - partialAmount).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Payment Methods */}
          <div>
            <p className="text-sm font-medium text-gray-300 mb-2">Ödeme Yöntemi</p>
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
          {selectedMethod === 'cash' && paymentMode === 'full' && (
            <div>
              <p className="text-sm font-medium text-gray-300 mb-2">Alınan Tutar</p>
              <input
                type="number"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder="0"
                className="w-full text-3xl font-bold text-center py-4 bg-gray-900 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <div className="grid grid-cols-6 gap-2 mt-3">
                {quickAmounts.map(amount => (
                  <button
                    key={amount}
                    onClick={() => setCashReceived(amount.toString())}
                    className="py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium text-white"
                  >
                    {amount}
                  </button>
                ))}
              </div>
              {cashAmount >= check.remaining_amount && (
                <div className="mt-4 p-4 bg-green-500/20 rounded-xl text-center">
                  <p className="text-green-400">Para Üstü</p>
                  <p className="text-2xl font-bold text-green-400">₺{change.toFixed(2)}</p>
                </div>
              )}
            </div>
          )}

          {/* TiT Pay QR Display */}
          {selectedMethod === 'titpay' && (
            <div className="p-6 bg-gradient-to-br from-purple-900/50 to-indigo-900/50 rounded-xl text-center border border-purple-500/30">
              <div className="w-32 h-32 bg-white rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                <QrCode className="w-24 h-24 text-purple-600" />
              </div>
              <p className="font-medium text-purple-200">TiT Pay ile Ödeme</p>
              <p className="text-sm text-purple-400">QR kodu müşteriye gösterin</p>
            </div>
          )}

          {/* Pay Button */}
          <button
            onClick={() => onPay(selectedMethod, getPayAmount())}
            disabled={!canPay()}
            className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Check className="w-5 h-5" />
            {paymentMode === 'partial' 
              ? `₺${partialAmount.toLocaleString()} Ödeme Al` 
              : 'Ödemeyi Tamamla'}
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
  const [value, setValue] = useState(currentDiscount.toString());

  const quickPercents = [5, 10, 15, 20, 25, 50];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-sm border border-gray-700">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">İndirim Uygula</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Type Toggle */}
          <div className="flex bg-gray-900 rounded-lg p-1">
            <button
              onClick={() => setType('percent')}
              className={`flex-1 py-2 rounded-md font-medium transition-colors ${
                type === 'percent' ? 'bg-gray-700 text-white' : 'text-gray-400'
              }`}
            >
              Yüzde (%)
            </button>
            <button
              onClick={() => setType('amount')}
              className={`flex-1 py-2 rounded-md font-medium transition-colors ${
                type === 'amount' ? 'bg-gray-700 text-white' : 'text-gray-400'
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
              className="w-full text-3xl font-bold text-center py-4 bg-gray-900 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl text-gray-500">
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
                  className="py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium text-white"
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
              className="flex-1 py-3 border border-gray-600 rounded-xl font-medium text-gray-300 hover:bg-gray-700"
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
