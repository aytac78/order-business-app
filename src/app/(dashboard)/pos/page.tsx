'use client';

import { useState, useEffect } from 'react';
import { useVenueStore, useAuthStore } from '@/stores';
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { supabase } from '@/lib/supabase';
import { printReceipt, PrintData } from '@/lib/print';
import {
  CreditCard, Banknote, Receipt, Percent, Printer, X, Check,
  Building, QrCode, Zap, AlertCircle, Eye
} from 'lucide-react';
import Link from 'next/link';

interface OrderItem { id: string; name: string; quantity: number; price: number; notes?: string; }
interface OpenCheck {
  id: string;
  type: 'table' | 'takeaway' | 'delivery';
  tableNumber?: string;
  tableId?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  discountType: 'percent' | 'amount';
  tax: number;
  total: number;
  waiter: string;
  openedAt: string;
  duration: number;
  venueId: string;
  venueName: string;
}

type PaymentMethod = 'cash' | 'card' | 'titpay';

export default function POSPage() {
  
  const { currentVenue, venues } = useVenueStore();
  const [checks, setChecks] = useState<OpenCheck[]>([]);
  const [selectedCheck, setSelectedCheck] = useState<OpenCheck | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PrintData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { currentStaff } = useAuthStore();
  const canSeeAllVenues = currentStaff?.role === "owner" || currentStaff?.role === "manager";
  const isAllVenues = currentVenue === null && canSeeAllVenues;

  useEffect(() => {
    fetchOrders();
  }, [currentVenue?.id]);

  const fetchOrders = async () => {
    setIsLoading(true);
    let query = supabase
      .from('orders')
      .select('*')
      .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
      .order('created_at', { ascending: false });

    if (!isAllVenues && currentVenue?.id) {
      query = query.eq('venue_id', currentVenue.id);
    }

    const { data } = await query;
    
    if (data) {
      const mappedChecks: OpenCheck[] = data.map(order => {
        const items = order.items || [];
        const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.08;
        const venue = venues.find(v => v.id === order.venue_id);
        
        return {
          id: order.id,
          type: order.table_number?.startsWith('📦') ? 'takeaway' : 'table',
          tableNumber: order.table_number?.replace('📦 ', '') || 'Bilinmiyor',
          tableId: order.table_id,
          items: items.map((item: any) => ({
            id: item.product_id || item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes,
          })),
          subtotal,
          discount: 0,
          discountType: 'percent' as const,
          tax: Math.round(tax),
          total: Math.round(subtotal + tax),
          waiter: order.waiter_name || 'Garson',
          openedAt: new Date(order.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          duration: Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000),
          venueId: order.venue_id,
          venueName: venue?.name || 'Bilinmiyor',
        };
      });
      setChecks(mappedChecks);
    }
    setIsLoading(false);
  };

  const createPrintData = (check: OpenCheck, paymentMethod?: string): PrintData => ({
    type: 'receipt',
    venue: {
      name: check.venueName || currentVenue?.name || 'ORDER Business',
      address: currentVenue?.address,
      phone: currentVenue?.phone,
    },
    order: {
      id: check.id,
      number: `#${check.tableNumber}`,
      table: check.type === 'table' ? check.tableNumber : undefined,
      type: check.type === 'table' ? 'dine_in' : 'takeaway',
      items: check.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes,
      })),
      subtotal: check.subtotal,
      tax: check.tax,
      discount: check.discount > 0 ? (check.discountType === 'percent' ? check.subtotal * check.discount / 100 : check.discount) : undefined,
      total: check.total,
      paymentMethod,
    },
    date: new Date(),
  });

  const showPreBillPreview = (check: OpenCheck) => {
    setPreviewData(createPrintData(check));
    setShowPreview(true);
  };

  const handleApplyDiscount = (type: 'percent' | 'amount', value: number) => {
    if (!selectedCheck) return;
    const discountAmount = type === 'percent' ? (selectedCheck.subtotal * value / 100) : value;
    const newSubtotal = selectedCheck.subtotal - discountAmount;
    const newTax = newSubtotal * 0.08;
    const newTotal = newSubtotal + newTax;
    setChecks(prev => prev.map(c => c.id === selectedCheck.id ? { ...c, discount: value, discountType: type, tax: Math.round(newTax), total: Math.round(newTotal) } : c));
    setSelectedCheck(prev => prev ? { ...prev, discount: value, discountType: type, tax: Math.round(newTax), total: Math.round(newTotal) } : null);
    setShowDiscountModal(false);
  };

  const handlePayment = async (method: PaymentMethod) => {
    if (!selectedCheck) return;
    await supabase.from('orders').update({ status: 'completed', notes: `Ödeme: ${method.toUpperCase()}` }).eq('id', selectedCheck.id);
    const paymentLabels = { cash: 'Nakit', card: 'Kredi Kartı', titpay: 'TiT Pay' };
    printReceipt(createPrintData(selectedCheck, paymentLabels[method]));
    if (selectedCheck.tableId) updateTable(selectedCheck.tableId, { status: 'cleaning', currentOrder: undefined });
    setChecks(prev => prev.filter(c => c.id !== selectedCheck.id));
    setSelectedCheck(null);
    setShowPaymentModal(false);
  };

  const totalRevenue = checks.reduce((sum, c) => sum + c.total, 0);

  return (
    <ProtectedRoute title="Kasa Girişi" requiredRoles={["owner", "manager", "cashier"]}>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kasa / POS</h1>
          <p className="text-gray-500">{isAllVenues ? 'Tüm Mekanlar' : currentVenue?.name} • {checks.length} açık hesap</p>
        </div>
        <Link href="/quick-pos" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium">
          <Zap className="w-5 h-5" />Hızlı Kasa
        </Link>
      </div>

      {isAllVenues && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <p className="text-amber-800">Tüm mekanların açık hesapları görüntüleniyor.</p>
        </div>
      )}

      <div className="flex gap-6 h-[calc(100vh-220px)]">
        {/* Left: Open Checks */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 h-full flex flex-col overflow-hidden">
            <div className="p-4 border-b"><h2 className="font-semibold">Açık Hesaplar</h2><p className="text-sm text-gray-500">{checks.length} hesap • ₺{totalRevenue.toLocaleString()}</p></div>
            <div className="flex-1 overflow-y-auto p-2">
              {isLoading ? (
                <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : checks.length === 0 ? (
                <div className="text-center py-8 text-gray-500"><Receipt className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>Açık hesap yok</p></div>
              ) : checks.map(check => (
                <button key={check.id} onClick={() => setSelectedCheck(check)}
                  className={`w-full p-3 rounded-xl mb-2 text-left transition-all ${selectedCheck?.id === check.id ? 'bg-orange-50 border-2 border-orange-500' : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${check.type === 'table' ? 'bg-orange-100' : 'bg-purple-100'}`}>
                        {check.type === 'table' ? <span className="font-bold text-orange-600">#{check.tableNumber}</span> : <Building className="w-5 h-5 text-purple-600" />}
                      </div>
                      <div>
                        <p className="font-medium">{check.type === 'table' ? `Masa ${check.tableNumber}` : check.tableNumber}</p>
                        <p className="text-xs text-gray-500">{check.waiter} • {check.duration} dk</p>
                        {isAllVenues && <p className="text-xs text-purple-600">{check.venueName}</p>}
                      </div>
                    </div>
                    <p className="font-bold">₺{check.total}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Check Detail */}
        <div className="flex-1">
          {selectedCheck ? (
            <div className="bg-white rounded-2xl border border-gray-100 h-full flex flex-col overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">{selectedCheck.type === 'table' ? `Masa ${selectedCheck.tableNumber}` : selectedCheck.tableNumber}</h2>
                  <p className="text-sm text-gray-500">{selectedCheck.waiter} • {selectedCheck.openedAt} • {selectedCheck.items.length} kalem</p>
                </div>
                <button onClick={() => showPreBillPreview(selectedCheck)} className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
                  <Eye className="w-4 h-4" /><span className="text-sm font-medium">Önizle</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <table className="w-full">
                  <thead><tr className="text-left text-sm text-gray-500 border-b"><th className="pb-2">Ürün</th><th className="pb-2 text-center">Adet</th><th className="pb-2 text-right">Fiyat</th><th className="pb-2 text-right">Toplam</th></tr></thead>
                  <tbody>
                    {selectedCheck.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-50">
                        <td className="py-3"><p className="font-medium">{item.name}</p>{item.notes && <p className="text-xs text-gray-500">{item.notes}</p>}</td>
                        <td className="py-3 text-center">{item.quantity}</td>
                        <td className="py-3 text-right">₺{item.price}</td>
                        <td className="py-3 text-right font-medium">₺{item.price * item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-gray-50 border-t space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Ara Toplam</span><span>₺{selectedCheck.subtotal}</span></div>
                {selectedCheck.discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>İndirim</span><span>-₺{selectedCheck.discountType === 'percent' ? Math.round(selectedCheck.subtotal * selectedCheck.discount / 100) : selectedCheck.discount}</span></div>}
                <div className="flex justify-between text-sm"><span className="text-gray-500">KDV (%8)</span><span>₺{selectedCheck.tax}</span></div>
                <div className="flex justify-between text-xl font-bold pt-2 border-t"><span>Toplam</span><span className="text-orange-600">₺{selectedCheck.total}</span></div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border h-full flex items-center justify-center">
              <div className="text-center"><Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">Hesap seçin</p></div>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="w-72 space-y-4">
          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-4 text-white">
            <p className="text-orange-100 text-sm">Bugün Toplam</p>
            <p className="text-3xl font-bold">₺{totalRevenue.toLocaleString()}</p>
          </div>

          {selectedCheck && (
            <div className="bg-white rounded-2xl border p-4 space-y-3">
              <button onClick={() => setShowPaymentModal(true)} className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2">
                <CreditCard className="w-5 h-5" />Ödeme Al
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setShowDiscountModal(true)} className="py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium flex items-center justify-center gap-1"><Percent className="w-4 h-4" />İndirim</button>
                <button onClick={() => showPreBillPreview(selectedCheck)} className="py-3 bg-blue-100 hover:bg-blue-200 rounded-xl font-medium text-blue-700 flex items-center justify-center gap-1"><Eye className="w-4 h-4" />Ön Hesap</button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border p-4">
            <p className="text-sm font-medium text-gray-500 mb-3">Hızlı Ödeme</p>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => selectedCheck && handlePayment('cash')} disabled={!selectedCheck} className="p-3 bg-gray-50 hover:bg-green-50 rounded-xl text-center disabled:opacity-50"><Banknote className="w-5 h-5 mx-auto text-green-600 mb-1" /><p className="text-xs">Nakit</p></button>
              <button onClick={() => selectedCheck && handlePayment('card')} disabled={!selectedCheck} className="p-3 bg-gray-50 hover:bg-blue-50 rounded-xl text-center disabled:opacity-50"><CreditCard className="w-5 h-5 mx-auto text-blue-600 mb-1" /><p className="text-xs">Kart</p></button>
              <button onClick={() => selectedCheck && handlePayment('titpay')} disabled={!selectedCheck} className="p-3 bg-gray-50 hover:bg-purple-50 rounded-xl text-center disabled:opacity-50"><QrCode className="w-5 h-5 mx-auto text-purple-600 mb-1" /><p className="text-xs">TiT Pay</p></button>
            </div>
          </div>
        </div>
      </div>

      {/* Print Preview Modal */}
      {showPreview && previewData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2"><Eye className="w-5 h-5 text-orange-500" /><h2 className="text-lg font-bold">Fiş Önizleme</h2></div>
              <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-100">
              <div className="bg-white shadow-lg mx-auto rounded-lg overflow-hidden">
                <ReceiptPreviewComponent data={previewData} />
              </div>
            </div>
            <div className="p-4 border-t flex gap-3">
              <button onClick={() => setShowPreview(false)} className="flex-1 py-3 border rounded-xl font-medium hover:bg-gray-50">Kapat</button>
              <button onClick={() => { printReceipt(previewData); setShowPreview(false); }} className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"><Printer className="w-5 h-5" />Yazdır</button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && selectedCheck && <PaymentModal check={selectedCheck} onPay={handlePayment} onClose={() => setShowPaymentModal(false)} />}
      {showDiscountModal && selectedCheck && <DiscountModal currentDiscount={selectedCheck.discount} currentType={selectedCheck.discountType} onApply={handleApplyDiscount} onClose={() => setShowDiscountModal(false)} />}
    </div>
    </ProtectedRoute>
  );
}

function ReceiptPreviewComponent({ data }: { data: PrintData }) {
  const { venue, order, date } = data;
  const formatPrice = (p: number) => `₺${p.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  const typeLabels: Record<string, string> = { dine_in: 'MASA', takeaway: 'PAKET', delivery: 'TESLİMAT' };

  return (
    <div className="bg-white p-5 font-mono text-sm">
      <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
        <p className="text-xl font-bold">{venue.name}</p>
        {venue.address && <p className="text-xs text-gray-500">{venue.address}</p>}
        {venue.phone && <p className="text-xs text-gray-500">Tel: {venue.phone}</p>}
      </div>
      <div className="text-center py-2 mb-4 bg-gray-800 text-white font-bold rounded">{typeLabels[order.type] || 'SİPARİŞ'} {order.table ? `#${order.table}` : ''}</div>
      <div className="border-b border-dashed border-gray-300 pb-3 mb-3 space-y-1 text-sm">
        <div className="flex justify-between"><span className="text-gray-500">Fiş No:</span><span className="font-medium">{order.number}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Tarih:</span><span>{date.toLocaleDateString('tr-TR')}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Saat:</span><span>{date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span></div>
      </div>
      <div className="border-b border-dashed border-gray-300 pb-3 mb-3">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between py-1"><span>{item.quantity}x {item.name}</span><span className="font-medium">{formatPrice(item.price * item.quantity)}</span></div>
        ))}
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between"><span className="text-gray-500">Ara Toplam:</span><span>{formatPrice(order.subtotal)}</span></div>
        {order.discount && <div className="flex justify-between text-green-600"><span>İndirim:</span><span>-{formatPrice(order.discount)}</span></div>}
        <div className="flex justify-between"><span className="text-gray-500">KDV (%8):</span><span>{formatPrice(order.tax)}</span></div>
        <div className="flex justify-between font-bold text-lg pt-3 mt-2 border-t-2 border-gray-800"><span>TOPLAM:</span><span>{formatPrice(order.total)}</span></div>
      </div>
      <div className="text-center border-t border-dashed border-gray-300 pt-4 mt-4 text-xs text-gray-400"><p>Teşekkürler!</p><p>www.orderapp.com</p></div>
    </div>
  );
}

function PaymentModal({ check, onPay, onClose }: { check: OpenCheck; onPay: (method: PaymentMethod) => void; onClose: () => void }) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const cashAmount = parseFloat(cashReceived) || 0;
  const change = cashAmount - check.total;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-6 border-b flex items-center justify-between"><h2 className="text-xl font-bold">Ödeme Al</h2><button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button></div>
        <div className="p-6 space-y-6">
          <div className="text-center"><p className="text-gray-500">Toplam</p><p className="text-4xl font-bold">₺{check.total}</p></div>
          <div className="grid grid-cols-3 gap-3">
            {[{ id: 'cash' as const, name: 'Nakit', icon: Banknote, color: 'bg-green-500' }, { id: 'card' as const, name: 'Kart', icon: CreditCard, color: 'bg-blue-500' }, { id: 'titpay' as const, name: 'TiT Pay', icon: QrCode, color: 'bg-purple-500' }].map(m => (
              <button key={m.id} onClick={() => setSelectedMethod(m.id)} className={`p-4 rounded-xl text-center ${selectedMethod === m.id ? `${m.color} text-white` : 'bg-gray-100 hover:bg-gray-200'}`}><m.icon className="w-6 h-6 mx-auto mb-1" /><p className="text-sm font-medium">{m.name}</p></button>
            ))}
          </div>
          {selectedMethod === 'cash' && (
            <div>
              <input type="number" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} placeholder="Alınan tutar" className="w-full text-3xl font-bold text-center py-4 border rounded-xl" autoFocus />
              <div className="grid grid-cols-4 gap-2 mt-3">{[50, 100, 200, 500].map(a => (<button key={a} onClick={() => setCashReceived(a.toString())} className="py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">₺{a}</button>))}</div>
              {cashAmount >= check.total && <div className="mt-4 p-4 bg-green-50 rounded-xl text-center"><p className="text-green-600">Para Üstü</p><p className="text-2xl font-bold text-green-700">₺{change.toFixed(2)}</p></div>}
            </div>
          )}
          {selectedMethod === 'titpay' && <div className="p-6 bg-purple-50 rounded-xl text-center"><QrCode className="w-24 h-24 mx-auto text-purple-600 mb-2" /><p className="font-medium text-purple-800">TiT Pay QR Kodu</p></div>}
          <button onClick={() => onPay(selectedMethod)} disabled={selectedMethod === 'cash' && cashAmount < check.total} className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2"><Check className="w-5 h-5" />Ödemeyi Tamamla</button>
        </div>
      </div>
    </div>
  );
}

function DiscountModal({ currentDiscount, currentType, onApply, onClose }: { currentDiscount: number; currentType: 'percent' | 'amount'; onApply: (type: 'percent' | 'amount', value: number) => void; onClose: () => void }) {
  const [type, setType] = useState<'percent' | 'amount'>(currentType);
  const [value, setValue] = useState(currentDiscount.toString());
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm">
        <div className="p-6 border-b flex items-center justify-between"><h2 className="text-xl font-bold">İndirim</h2><button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button></div>
        <div className="p-6 space-y-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setType('percent')} className={`flex-1 py-2 rounded-md font-medium ${type === 'percent' ? 'bg-white shadow' : ''}`}>Yüzde (%)</button>
            <button onClick={() => setType('amount')} className={`flex-1 py-2 rounded-md font-medium ${type === 'amount' ? 'bg-white shadow' : ''}`}>Tutar (₺)</button>
          </div>
          <div className="relative">
            <input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0" className="w-full text-3xl font-bold text-center py-4 border rounded-xl" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">{type === 'percent' ? '%' : '₺'}</span>
          </div>
          {type === 'percent' && <div className="grid grid-cols-6 gap-2">{[5, 10, 15, 20, 25, 50].map(p => (<button key={p} onClick={() => setValue(p.toString())} className="py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">%{p}</button>))}</div>}
          <div className="flex gap-3">
            <button onClick={() => onApply(type, 0)} className="flex-1 py-3 border rounded-xl font-medium hover:bg-gray-50">Kaldır</button>
            <button onClick={() => onApply(type, parseFloat(value) || 0)} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-medium">Uygula</button>
          </div>
        </div>
      </div>
    </div>
  );
}
