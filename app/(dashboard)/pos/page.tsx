'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import {
  CreditCard, Banknote, Wallet, Receipt, Percent, Split,
  Printer, X, Check, Calculator, Users, Clock, AlertCircle,
  QrCode, Smartphone, Gift, Minus, Plus, Loader2, RefreshCw
} from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

interface OpenCheck {
  id: string;
  type: 'dine_in' | 'takeaway' | 'delivery' | 'qr_order';
  tableNumber?: string;
  customerName?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  discountType: 'percent' | 'amount';
  tax: number;
  total: number;
  waiter?: string;
  createdAt: string;
}

type PaymentMethod = 'cash' | 'card' | 'titpay' | 'multinet' | 'sodexo' | 'ticket' | 'mobile';

export default function POSPage() {
  const { currentVenue } = useVenueStore();
  const t = useTranslations('pos');
  const tOrders = useTranslations('orders');
  const tCommon = useTranslations('common');

  const [checks, setChecks] = useState<OpenCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCheck, setSelectedCheck] = useState<OpenCheck | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  // Payment methods config
  const paymentMethods: { id: PaymentMethod; name: string; icon: any; color?: string }[] = [
    { id: 'cash', name: t('cash'), icon: Banknote },
    { id: 'card', name: t('card'), icon: CreditCard },
    { id: 'titpay', name: t('titPay'), icon: QrCode, color: 'from-purple-500 to-indigo-500' },
    { id: 'multinet', name: 'Multinet', icon: Wallet },
    { id: 'sodexo', name: 'Sodexo', icon: Wallet },
    { id: 'ticket', name: 'Ticket', icon: Gift },
    { id: 'mobile', name: 'Mobile', icon: Smartphone },
  ];

  const loadChecks = useCallback(async () => {
    if (!currentVenue?.id) return;

    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .in('status', ['pending', 'confirmed', 'preparing', 'ready', 'served'])
      .order('created_at', { ascending: false });

    if (data) {
      const openChecks: OpenCheck[] = data.map(order => ({
        id: order.id,
        type: order.type || 'dine_in',
        tableNumber: order.table_number,
        customerName: order.customer_name,
        items: (order.items || []).map((item: any, idx: number) => ({
          id: `${order.id}-${idx}`,
          name: item.name || item.product_name,
          quantity: item.quantity,
          price: item.price || item.unit_price || 0,
          notes: item.notes
        })),
        subtotal: order.subtotal || order.total || 0,
        discount: order.discount || 0,
        discountType: order.discount_type || 'percent',
        tax: order.tax || 0,
        total: order.total || 0,
        waiter: order.waiter_name,
        createdAt: order.created_at
      }));
      setChecks(openChecks);
    }
    setLoading(false);
  }, [currentVenue?.id]);

  useEffect(() => {
    loadChecks();
  }, [loadChecks]);

  // Real-time subscription
  useEffect(() => {
    if (!currentVenue?.id) return;

    const channel = supabase
      .channel('pos-orders')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders', filter: `venue_id=eq.${currentVenue.id}` },
        loadChecks
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [currentVenue?.id, loadChecks]);

  const handleApplyDiscount = async (type: 'percent' | 'amount', value: number) => {
    if (!selectedCheck) return;
    
    const discountAmount = type === 'percent' 
      ? (selectedCheck.subtotal * value / 100)
      : value;
    
    const newSubtotal = selectedCheck.subtotal - discountAmount;
    const newTax = newSubtotal * 0.08;
    const newTotal = newSubtotal + newTax;

    await supabase.from('orders').update({
      discount: value,
      discount_type: type,
      tax: Math.round(newTax),
      total: Math.round(newTotal)
    }).eq('id', selectedCheck.id);

    setSelectedCheck(prev => prev ? { 
      ...prev, 
      discount: value, 
      discountType: type, 
      tax: Math.round(newTax), 
      total: Math.round(newTotal) 
    } : null);
    
    setShowDiscountModal(false);
    loadChecks();
  };

  const handlePayment = async (method: PaymentMethod, amount: number) => {
    if (!selectedCheck) return;
    
    await supabase.from('orders').update({ 
      status: 'completed',
      payment_status: 'paid',
      payment_method: method
    }).eq('id', selectedCheck.id);

    if (selectedCheck.tableNumber) {
      await supabase.from('tables').update({ 
        status: 'cleaning' 
      }).eq('venue_id', currentVenue?.id).eq('number', selectedCheck.tableNumber);
    }
    
    setSelectedCheck(null);
    setShowPaymentModal(false);
    loadChecks();
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    return mins;
  };

  const totalRevenue = checks.reduce((sum, c) => sum + c.total, 0);
  const tableChecks = checks.filter(c => c.type === 'dine_in');
  const otherChecks = checks.filter(c => c.type !== 'dine_in');

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-gray-400">{tCommon('selectVenue')}</p>
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
    <div className="flex gap-6 h-[calc(100vh-180px)]">
      {/* Left: Open Checks */}
      <div className="w-80 flex-shrink-0 flex flex-col">
        <div className="bg-gray-800 rounded-2xl border border-gray-700 flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white">{t('openChecks')}</h2>
              <p className="text-sm text-gray-400">
                {checks.length} {tCommon('items')} • ₺{totalRevenue.toLocaleString()}
              </p>
            </div>
            <button onClick={loadChecks} className="p-2 hover:bg-gray-700 rounded-lg">
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {/* Table Checks */}
            {tableChecks.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 px-2 py-1">{tOrders('dineIn').toUpperCase()} ({tableChecks.length})</p>
                {tableChecks.map(check => (
                  <button
                    key={check.id}
                    onClick={() => setSelectedCheck(check)}
                    className={`w-full p-3 rounded-xl mb-1 text-left transition-all ${
                      selectedCheck?.id === check.id
                        ? 'bg-orange-500/20 border-2 border-orange-500'
                        : 'bg-gray-700/50 hover:bg-gray-700 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                          <span className="font-bold text-red-400">#{check.tableNumber}</span>
                        </div>
                        <div>
                          <p className="font-medium text-white">{tOrders('dineIn')} {check.tableNumber}</p>
                          <p className="text-xs text-gray-400">{check.waiter || '-'} • {getTimeAgo(check.createdAt)} dk</p>
                        </div>
                      </div>
                      <p className="font-bold text-white">₺{check.total.toFixed(0)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Other Checks */}
            {otherChecks.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 px-2 py-1">{tOrders('takeaway').toUpperCase()} / {tOrders('delivery').toUpperCase()} ({otherChecks.length})</p>
                {otherChecks.map(check => (
                  <button
                    key={check.id}
                    onClick={() => setSelectedCheck(check)}
                    className={`w-full p-3 rounded-xl mb-1 text-left transition-all ${
                      selectedCheck?.id === check.id
                        ? 'bg-orange-500/20 border-2 border-orange-500'
                        : 'bg-gray-700/50 hover:bg-gray-700 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{check.customerName || tOrders('takeaway')}</p>
                          <p className="text-xs text-gray-400">{check.type === 'takeaway' ? tOrders('takeaway') : tOrders('delivery')}</p>
                        </div>
                      </div>
                      <p className="font-bold text-white">₺{check.total.toFixed(0)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {checks.length === 0 && (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">{t('openChecks')} - {tCommon('noData')}</p>
              </div>
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
                <h2 className="text-xl font-bold text-white">
                  {selectedCheck.type === 'dine_in' 
                    ? `${tOrders('dineIn')} ${selectedCheck.tableNumber}` 
                    : selectedCheck.customerName || tOrders('takeaway')}
                </h2>
                <p className="text-sm text-gray-400">
                  {selectedCheck.waiter || '-'} • {selectedCheck.items.length} {tCommon('items')}
                </p>
              </div>
              <button className="p-2 hover:bg-gray-700 rounded-lg">
                <Printer className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b border-gray-700">
                    <th className="pb-2">{tCommon('name')}</th>
                    <th className="pb-2 text-center">{tCommon('quantity')}</th>
                    <th className="pb-2 text-right">{tCommon('price')}</th>
                    <th className="pb-2 text-right">{tCommon('total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCheck.items.map(item => (
                    <tr key={item.id} className="border-b border-gray-700/50">
                      <td className="py-3">
                        <p className="font-medium text-white">{item.name}</p>
                        {item.notes && <p className="text-xs text-amber-400">{item.notes}</p>}
                      </td>
                      <td className="py-3 text-center text-gray-400">{item.quantity}</td>
                      <td className="py-3 text-right text-gray-400">₺{item.price.toFixed(0)}</td>
                      <td className="py-3 text-right font-medium text-white">₺{(item.price * item.quantity).toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="p-4 bg-gray-700/50 border-t border-gray-700">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{tCommon('subtotal')}</span>
                  <span className="text-white">₺{selectedCheck.subtotal.toFixed(0)}</span>
                </div>
                {selectedCheck.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-400">
                    <span>{tCommon('discount')} ({selectedCheck.discountType === 'percent' ? `%${selectedCheck.discount}` : `₺${selectedCheck.discount}`})</span>
                    <span>-₺{selectedCheck.discountType === 'percent' 
                      ? Math.round(selectedCheck.subtotal * selectedCheck.discount / 100)
                      : selectedCheck.discount
                    }</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{tCommon('tax')} (8%)</span>
                  <span className="text-white">₺{selectedCheck.tax.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-600">
                  <span className="text-white">{tCommon('total')}</span>
                  <span className="text-orange-400">₺{selectedCheck.total.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-2xl border border-gray-700 flex-1 flex items-center justify-center">
            <div className="text-center">
              <Receipt className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">{t('openChecks')} - {tCommon('select')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="w-72 flex-shrink-0 space-y-4">
        {/* Quick Stats */}
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-4 text-white">
          <p className="text-orange-100 text-sm">{t('dailySummary')}</p>
          <p className="text-3xl font-bold">₺{totalRevenue.toLocaleString()}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-orange-100">
            <span>{checks.length} {t('openChecks').toLowerCase()}</span>
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
              {t('checkout')}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowDiscountModal(true)}
                className="py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium text-white flex items-center justify-center gap-1 transition-colors"
              >
                <Percent className="w-4 h-4" />
                {tCommon('discount')}
              </button>
              <button className="py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium text-white flex items-center justify-center gap-1 transition-colors">
                <Split className="w-4 h-4" />
                {t('splitBill')}
              </button>
            </div>

            <button className="w-full py-3 border border-gray-600 rounded-xl font-medium text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors">
              <Printer className="w-4 h-4" />
              {t('printPreBill')}
            </button>
          </div>
        )}

        {/* Payment Methods Quick Access */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4">
          <p className="text-sm font-medium text-gray-400 mb-3">{t('paymentMethod')}</p>
          <div className="grid grid-cols-3 gap-2">
            {paymentMethods.slice(0, 6).map(method => (
              <button
                key={method.id}
                onClick={() => selectedCheck && setShowPaymentModal(true)}
                disabled={!selectedCheck}
                className="p-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-center transition-colors disabled:opacity-50"
              >
                <method.icon className="w-5 h-5 mx-auto text-gray-400 mb-1" />
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
          paymentMethods={paymentMethods}
          t={t}
          tCommon={tCommon}
          onPay={handlePayment}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {/* Discount Modal */}
      {showDiscountModal && selectedCheck && (
        <DiscountModal
          currentDiscount={selectedCheck.discount}
          currentType={selectedCheck.discountType}
          t={t}
          tCommon={tCommon}
          onApply={handleApplyDiscount}
          onClose={() => setShowDiscountModal(false)}
        />
      )}
    </div>
  );
}

// Payment Modal
function PaymentModal({
  check, paymentMethods, t, tCommon, onPay, onClose
}: {
  check: OpenCheck;
  paymentMethods: any[];
  t: any;
  tCommon: any;
  onPay: (method: PaymentMethod, amount: number) => void;
  onClose: () => void;
}) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState<string>('');

  const cashAmount = parseFloat(cashReceived) || 0;
  const change = cashAmount - check.total;
  const quickAmounts = [50, 100, 200, 500, 1000, 2000];

  const canPay = () => {
    if (selectedMethod === 'cash') return cashAmount >= check.total;
    return true;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800">
          <div>
            <h2 className="text-xl font-bold text-white">{t('checkout')}</h2>
            <p className="text-gray-400">
              {check.type === 'dine_in' ? `${check.tableNumber}` : check.customerName}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Total */}
          <div className="text-center">
            <p className="text-gray-400">{tCommon('total')}</p>
            <p className="text-4xl font-bold text-white">₺{check.total.toLocaleString()}</p>
          </div>

          {/* Payment Methods */}
          <div>
            <p className="text-sm font-medium text-gray-400 mb-2">{t('paymentMethod')}</p>
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

          {/* TiT Pay QR */}
          {selectedMethod === 'titpay' && (
            <div className="p-6 bg-gradient-to-br from-purple-900/50 to-indigo-900/50 rounded-xl text-center">
              <div className="w-32 h-32 bg-white rounded-xl mx-auto mb-4 flex items-center justify-center">
                <QrCode className="w-24 h-24 text-purple-600" />
              </div>
              <p className="font-medium text-purple-200">{t('titPay')}</p>
              <p className="text-sm text-purple-300">QR</p>
            </div>
          )}

          {/* Cash Input */}
          {selectedMethod === 'cash' && (
            <div>
              <p className="text-sm font-medium text-gray-400 mb-2">{t('cashReceived')}</p>
              <input
                type="number"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder="0"
                className="w-full text-3xl font-bold text-center py-4 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
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
              {cashAmount >= check.total && (
                <div className="mt-4 p-4 bg-green-900/50 border border-green-700 rounded-xl text-center">
                  <p className="text-green-400">{t('change')}</p>
                  <p className="text-2xl font-bold text-green-300">₺{change.toFixed(2)}</p>
                </div>
              )}
            </div>
          )}

          {/* Pay Button */}
          <button
            onClick={() => onPay(selectedMethod, check.total)}
            disabled={!canPay()}
            className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Check className="w-5 h-5" />
            {t('checkout')}
          </button>
        </div>
      </div>
    </div>
  );
}

// Discount Modal
function DiscountModal({
  currentDiscount, currentType, t, tCommon, onApply, onClose
}: {
  currentDiscount: number;
  currentType: 'percent' | 'amount';
  t: any;
  tCommon: any;
  onApply: (type: 'percent' | 'amount', value: number) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<'percent' | 'amount'>(currentType);
  const [value, setValue] = useState(currentDiscount.toString());
  const quickPercents = [5, 10, 15, 20, 25, 50];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-sm">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{t('applyDiscount')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Type Toggle */}
          <div className="flex bg-gray-700 rounded-xl p-1">
            <button
              onClick={() => setType('percent')}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                type === 'percent' ? 'bg-gray-600 text-white' : 'text-gray-400'
              }`}
            >
              {t('discountPercent')}
            </button>
            <button
              onClick={() => setType('amount')}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                type === 'amount' ? 'bg-gray-600 text-white' : 'text-gray-400'
              }`}
            >
              {t('discountAmount')}
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
              {tCommon('delete')}
            </button>
            <button
              onClick={() => onApply(type, parseFloat(value) || 0)}
              className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600"
            >
              {tCommon('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
