'use client';

import { useState, useEffect } from 'react';
import { useTableStore, useVenueStore } from '@/stores';
import { CreditCard, Banknote, Wallet, Receipt, Percent, Printer, X, Check, QrCode, Smartphone, Gift, Minus, Plus, Building, AlertCircle } from 'lucide-react';

interface OrderItem { id: string; name: string; quantity: number; price: number; }

interface OpenCheck {
  id: string;
  type: 'table' | 'takeaway' | 'delivery';
  tableNumber?: string;
  tableId?: string;
  customerName?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  discountType: 'percent' | 'amount';
  tax: number;
  total: number;
  waiter: string;
  openedAt: string;
  duration: number;
}

const demoChecks: OpenCheck[] = [
  { id: '1', type: 'table', tableNumber: '1', tableId: '1', items: [{ id: '1', name: 'Izgara Levrek', quantity: 2, price: 320 }, { id: '2', name: 'Karides Güveç', quantity: 1, price: 280 }, { id: '3', name: 'Rakı (70cl)', quantity: 1, price: 450 }], subtotal: 1370, discount: 0, discountType: 'percent', tax: 110, total: 1480, waiter: 'Ahmet', openedAt: '19:30', duration: 45 },
  { id: '2', type: 'table', tableNumber: '3', tableId: '3', items: [{ id: '1', name: 'Karışık Izgara', quantity: 2, price: 320 }, { id: '2', name: 'Pilav', quantity: 2, price: 45 }, { id: '3', name: 'Ayran', quantity: 4, price: 25 }], subtotal: 830, discount: 0, discountType: 'percent', tax: 66, total: 896, waiter: 'Mehmet', openedAt: '19:45', duration: 30 },
  { id: '3', type: 'table', tableNumber: '7', tableId: '7', items: [{ id: '1', name: 'Biftek', quantity: 2, price: 380 }, { id: '2', name: 'Şarap', quantity: 1, price: 650 }], subtotal: 1410, discount: 10, discountType: 'percent', tax: 102, total: 1371, waiter: 'Ayşe', openedAt: '19:00', duration: 60 },
  { id: '4', type: 'takeaway', customerName: 'Mehmet B.', items: [{ id: '1', name: 'Adana Kebap', quantity: 3, price: 200 }, { id: '2', name: 'Lahmacun', quantity: 5, price: 45 }], subtotal: 825, discount: 0, discountType: 'percent', tax: 66, total: 891, waiter: 'Ahmet', openedAt: '20:00', duration: 15 },
];

type PaymentMethod = 'cash' | 'card' | 'titpay' | 'multinet' | 'sodexo' | 'mobile';

const paymentMethods = [
  { id: 'cash' as const, name: 'Nakit', icon: Banknote },
  { id: 'card' as const, name: 'Kredi Kartı', icon: CreditCard },
  { id: 'titpay' as const, name: 'TiT Pay', icon: QrCode, color: 'from-purple-500 to-indigo-500' },
  { id: 'multinet' as const, name: 'Multinet', icon: Wallet },
  { id: 'sodexo' as const, name: 'Sodexo', icon: Wallet },
  { id: 'mobile' as const, name: 'Mobil', icon: Smartphone },
];

export default function POSPage() {
  const { tables, updateTable } = useTableStore();
  const { currentVenue } = useVenueStore();
  const [checks, setChecks] = useState<OpenCheck[]>(demoChecks);
  const [selectedCheck, setSelectedCheck] = useState<OpenCheck | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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

  const handlePayment = (method: PaymentMethod) => {
    if (!selectedCheck) return;
    setChecks(prev => prev.filter(c => c.id !== selectedCheck.id));
    if (selectedCheck.tableId) updateTable(selectedCheck.tableId, { status: 'cleaning', currentOrder: undefined });
    setSelectedCheck(null);
    setShowPaymentModal(false);
    alert(`Ödeme alındı!\n${paymentMethods.find(m => m.id === method)?.name}: ₺${selectedCheck.total}`);
  };

  const totalRevenue = checks.reduce((sum, c) => sum + c.total, 0);
  const tableChecks = checks.filter(c => c.type === 'table');
  const otherChecks = checks.filter(c => c.type !== 'table');

  if (!mounted) return <div className="animate-pulse bg-gray-100 rounded-2xl h-96" />;

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Mekan Seçimi Gerekli</h2>
          <p className="text-gray-500">POS için lütfen bir mekan seçin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)]">
      {/* Left: Open Checks */}
      <div className="w-80 flex-shrink-0 flex flex-col">
        <div className="bg-white rounded-2xl border flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Açık Hesaplar</h2>
            <p className="text-sm text-gray-500">{checks.length} hesap • ₺{totalRevenue.toLocaleString()}</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              <p className="text-xs font-medium text-gray-500 px-2 py-1">MASALAR ({tableChecks.length})</p>
              {tableChecks.map(check => (
                <button key={check.id} onClick={() => setSelectedCheck(check)} className={`w-full p-3 rounded-xl mb-1 text-left transition-all ${selectedCheck?.id === check.id ? 'bg-orange-50 border-2 border-orange-500' : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                        <span className="font-bold text-red-600">#{check.tableNumber}</span>
                      </div>
                      <div>
                        <p className="font-medium">Masa {check.tableNumber}</p>
                        <p className="text-xs text-gray-500">{check.waiter} • {check.duration} dk</p>
                      </div>
                    </div>
                    <p className="font-bold">₺{check.total}</p>
                  </div>
                </button>
              ))}
            </div>

            {otherChecks.length > 0 && (
              <div className="p-2 border-t">
                <p className="text-xs font-medium text-gray-500 px-2 py-1">PAKET ({otherChecks.length})</p>
                {otherChecks.map(check => (
                  <button key={check.id} onClick={() => setSelectedCheck(check)} className={`w-full p-3 rounded-xl mb-1 text-left ${selectedCheck?.id === check.id ? 'bg-orange-50 border-2 border-orange-500' : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><Building className="w-5 h-5 text-purple-600" /></div>
                        <div>
                          <p className="font-medium">{check.customerName}</p>
                          <p className="text-xs text-gray-500">{check.type === 'takeaway' ? 'Paket' : 'Teslimat'}</p>
                        </div>
                      </div>
                      <p className="font-bold">₺{check.total}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Center: Check Detail */}
      <div className="flex-1 flex flex-col">
        {selectedCheck ? (
          <div className="bg-white rounded-2xl border flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{selectedCheck.type === 'table' ? `Masa ${selectedCheck.tableNumber}` : selectedCheck.customerName}</h2>
                <p className="text-sm text-gray-500">{selectedCheck.waiter} • {selectedCheck.items.length} kalem</p>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg"><Printer className="w-5 h-5 text-gray-600" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-2">Ürün</th>
                    <th className="pb-2 text-center">Adet</th>
                    <th className="pb-2 text-right">Fiyat</th>
                    <th className="pb-2 text-right">Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCheck.items.map(item => (
                    <tr key={item.id} className="border-b border-gray-50">
                      <td className="py-3"><p className="font-medium">{item.name}</p></td>
                      <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                      <td className="py-3 text-right text-gray-600">₺{item.price}</td>
                      <td className="py-3 text-right font-medium">₺{item.price * item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-gray-50 border-t">
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Ara Toplam</span><span>₺{selectedCheck.subtotal}</span></div>
                {selectedCheck.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>İndirim ({selectedCheck.discountType === 'percent' ? `%${selectedCheck.discount}` : `₺${selectedCheck.discount}`})</span>
                    <span>-₺{selectedCheck.discountType === 'percent' ? Math.round(selectedCheck.subtotal * selectedCheck.discount / 100) : selectedCheck.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm"><span className="text-gray-500">KDV (%8)</span><span>₺{selectedCheck.tax}</span></div>
                <div className="flex justify-between text-xl font-bold pt-2 border-t"><span>Toplam</span><span className="text-orange-600">₺{selectedCheck.total}</span></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border flex-1 flex items-center justify-center">
            <div className="text-center"><Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">Hesap seçin</p></div>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="w-72 flex-shrink-0 space-y-4">
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-4 text-white">
          <p className="text-orange-100 text-sm">Bugün Toplam</p>
          <p className="text-3xl font-bold">₺{(totalRevenue + 12450).toLocaleString()}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-orange-100">
            <span>47 işlem</span><span>•</span><span>{checks.length} açık</span>
          </div>
        </div>

        {selectedCheck && (
          <div className="bg-white rounded-2xl border p-4 space-y-3">
            <button onClick={() => setShowPaymentModal(true)} className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2">
              <CreditCard className="w-5 h-5" />Ödeme Al
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setShowDiscountModal(true)} className="py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium flex items-center justify-center gap-1"><Percent className="w-4 h-4" />İndirim</button>
              <button className="py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium flex items-center justify-center gap-1"><Printer className="w-4 h-4" />Yazdır</button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border p-4">
          <p className="text-sm font-medium text-gray-500 mb-3">Hızlı Ödeme</p>
          <div className="grid grid-cols-3 gap-2">
            {paymentMethods.map(method => (
              <button key={method.id} onClick={() => selectedCheck && setShowPaymentModal(true)} disabled={!selectedCheck} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-center disabled:opacity-50">
                <method.icon className="w-5 h-5 mx-auto text-gray-600 mb-1" />
                <p className="text-xs text-gray-600">{method.name}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedCheck && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <div><h2 className="text-xl font-bold">Ödeme Al</h2><p className="text-gray-500">{selectedCheck.type === 'table' ? `Masa ${selectedCheck.tableNumber}` : selectedCheck.customerName}</p></div>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-center">
                <p className="text-gray-500">Ödenecek Tutar</p>
                <p className="text-4xl font-bold">₺{selectedCheck.total.toLocaleString()}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Ödeme Yöntemi</p>
                <div className="grid grid-cols-3 gap-2">
                  {paymentMethods.map(method => (
                    <button key={method.id} onClick={() => handlePayment(method.id)} className={`p-4 rounded-xl text-center transition-all ${method.color ? `bg-gradient-to-br ${method.color} text-white` : 'bg-gray-100 hover:bg-gray-200'}`}>
                      <method.icon className="w-6 h-6 mx-auto mb-1" />
                      <p className="text-sm font-medium">{method.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discount Modal */}
      {showDiscountModal && selectedCheck && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">İndirim Uygula</h2>
              <button onClick={() => setShowDiscountModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 15, 20, 25, 50].map(p => (
                  <button key={p} onClick={() => handleApplyDiscount('percent', p)} className="py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">%{p}</button>
                ))}
              </div>
              <button onClick={() => handleApplyDiscount('percent', 0)} className="w-full py-3 border rounded-xl font-medium">İndirimi Kaldır</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
