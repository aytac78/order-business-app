'use client';

import { useState, useEffect } from 'react';
import { useTableStore, useVenueStore } from '@/stores';
import { PanelHeader } from '@/components/panels/PanelHeader';
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
  Building,
  Gift,
  Minus,
  Plus
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
  venueId: string;
  venueName: string;
}

const demoChecks: OpenCheck[] = [
  {
    id: '1',
    type: 'table',
    tableNumber: '1',
    tableId: '1',
    items: [
      { id: '1', name: 'Izgara Levrek', quantity: 2, price: 320 },
      { id: '2', name: 'Karides Güveç', quantity: 1, price: 280 },
      { id: '3', name: 'Humus', quantity: 2, price: 85 },
      { id: '4', name: 'Rakı (70cl)', quantity: 1, price: 450 },
    ],
    subtotal: 1540,
    discount: 0,
    discountType: 'percent',
    tax: 123,
    total: 1663,
    waiter: 'Ahmet',
    openedAt: '19:30',
    duration: 45,
    venueId: '1',
    venueName: 'Nihal\'s Break Point'
  },
  {
    id: '2',
    type: 'table',
    tableNumber: '3',
    tableId: '3',
    items: [
      { id: '1', name: 'Karışık Izgara', quantity: 2, price: 320 },
      { id: '2', name: 'Pilav', quantity: 2, price: 45 },
      { id: '3', name: 'Ayran', quantity: 4, price: 25 },
      { id: '4', name: 'Künefe', quantity: 2, price: 140 },
    ],
    subtotal: 1110,
    discount: 0,
    discountType: 'percent',
    tax: 89,
    total: 1199,
    waiter: 'Mehmet',
    openedAt: '19:45',
    duration: 30,
    venueId: '1',
    venueName: 'Nihal\'s Break Point'
  },
  {
    id: '3',
    type: 'table',
    tableNumber: '7',
    tableId: '7',
    items: [
      { id: '1', name: 'Biftek', quantity: 2, price: 380 },
      { id: '2', name: 'Şarap (Şişe)', quantity: 1, price: 650 },
      { id: '3', name: 'Caesar Salata', quantity: 2, price: 120 },
    ],
    subtotal: 1650,
    discount: 10,
    discountType: 'percent',
    tax: 119,
    total: 1604,
    waiter: 'Ayşe',
    openedAt: '19:00',
    duration: 60,
    venueId: '1',
    venueName: 'Nihal\'s Break Point'
  },
  {
    id: '4',
    type: 'takeaway',
    customerName: 'Mehmet B.',
    items: [
      { id: '1', name: 'Adana Kebap', quantity: 3, price: 200 },
      { id: '2', name: 'Lahmacun', quantity: 5, price: 45 },
    ],
    subtotal: 825,
    discount: 0,
    discountType: 'percent',
    tax: 66,
    total: 891,
    waiter: 'Ahmet',
    openedAt: '20:00',
    duration: 15,
    venueId: '1',
    venueName: 'Nihal\'s Break Point'
  }
];

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
  const { tables, updateTable } = useTableStore();
  const { currentVenue } = useVenueStore();
  const [checks, setChecks] = useState<OpenCheck[]>(demoChecks);
  const [selectedCheck, setSelectedCheck] = useState<OpenCheck | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [displayTime, setDisplayTime] = useState<string>('--:--:--');

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      setDisplayTime(new Date().toLocaleTimeString('tr-TR'));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredChecks = currentVenue 
    ? checks.filter(c => c.venueId === currentVenue.id)
    : checks;

  const handleApplyDiscount = (type: 'percent' | 'amount', value: number) => {
    if (!selectedCheck) return;
    
    const discountAmount = type === 'percent' 
      ? (selectedCheck.subtotal * value / 100)
      : value;
    
    const newSubtotal = selectedCheck.subtotal - discountAmount;
    const newTax = newSubtotal * 0.08;
    const newTotal = newSubtotal + newTax;

    setChecks(prev => prev.map(c => 
      c.id === selectedCheck.id 
        ? { ...c, discount: value, discountType: type, tax: Math.round(newTax), total: Math.round(newTotal) }
        : c
    ));
    setSelectedCheck(prev => prev ? { ...prev, discount: value, discountType: type, tax: Math.round(newTax), total: Math.round(newTotal) } : null);
    setShowDiscountModal(false);
  };

  const handlePayment = (method: PaymentMethod, amount: number) => {
    if (!selectedCheck) return;
    
    setChecks(prev => prev.filter(c => c.id !== selectedCheck.id));
    
    if (selectedCheck.tableId) {
      updateTable(selectedCheck.tableId, { 
        status: 'cleaning',
        currentOrder: undefined 
      });
    }
    
    setSelectedCheck(null);
    setShowPaymentModal(false);
  };

  const totalRevenue = filteredChecks.reduce((sum, c) => sum + c.total, 0);
  const tableChecks = filteredChecks.filter(c => c.type === 'table');
  const otherChecks = filteredChecks.filter(c => c.type !== 'table');
  const isAllVenues = !currentVenue;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600 text-xl">Yükleniyor...</div>
      </div>
    );
  }

  if (!currentVenue) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Mekan Seçimi Gerekli</h2>
          <p className="text-gray-500">Kasa/POS için lütfen bir mekan seçin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white -m-6 p-6">
      {/* Header */}
      <PanelHeader
        title="Kasa / POS"
        subtitle={displayTime}
        icon={<CreditCard className="w-8 h-8" />}
        iconBgColor="text-green-500"
        soundEnabled={soundEnabled}
        onSoundToggle={() => setSoundEnabled(!soundEnabled)}
        showSound={true}
      >
        {/* Stats */}
        <div className="flex items-center gap-6 bg-gray-800 rounded-xl px-6 py-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">₺{totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-gray-400">Açık Hesap</p>
          </div>
          <div className="w-px h-8 bg-gray-700" />
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-500">{filteredChecks.length}</p>
            <p className="text-xs text-gray-400">Hesap</p>
          </div>
        </div>
      </PanelHeader>

      <div className="flex gap-6 h-[calc(100vh-180px)]">
        {/* Left: Open Checks */}
        <div className="w-80 flex-shrink-0 flex flex-col">
          <div className="bg-gray-800 rounded-2xl flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h2 className="font-semibold text-white">Açık Hesaplar</h2>
              <p className="text-sm text-gray-400">
                {filteredChecks.length} hesap • ₺{totalRevenue.toLocaleString()}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {/* Table Checks */}
              <p className="text-xs font-medium text-gray-500 px-2 py-1">MASALAR ({tableChecks.length})</p>
              {tableChecks.map(check => (
                <button
                  key={check.id}
                  onClick={() => setSelectedCheck(check)}
                  className={`w-full p-3 rounded-xl mb-1 text-left transition-all ${
                    selectedCheck?.id === check.id
                      ? 'bg-orange-600/20 border-2 border-orange-500'
                      : 'bg-gray-700 hover:bg-gray-600 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center">
                        <span className="font-bold text-red-400">#{check.tableNumber}</span>
                      </div>
                      <div>
                        <p className="font-medium text-white">Masa {check.tableNumber}</p>
                        <p className="text-xs text-gray-400">{check.waiter} • {check.duration} dk</p>
                      </div>
                    </div>
                    <p className="font-bold text-white">₺{check.total}</p>
                  </div>
                </button>
              ))}

              {/* Other Checks */}
              {otherChecks.length > 0 && (
                <>
                  <p className="text-xs font-medium text-gray-500 px-2 py-1 mt-4">PAKET / TESLİMAT ({otherChecks.length})</p>
                  {otherChecks.map(check => (
                    <button
                      key={check.id}
                      onClick={() => setSelectedCheck(check)}
                      className={`w-full p-3 rounded-xl mb-1 text-left transition-all ${
                        selectedCheck?.id === check.id
                          ? 'bg-orange-600/20 border-2 border-orange-500'
                          : 'bg-gray-700 hover:bg-gray-600 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                            <Building className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{check.customerName}</p>
                            <p className="text-xs text-gray-400">{check.type === 'takeaway' ? 'Paket' : 'Teslimat'}</p>
                          </div>
                        </div>
                        <p className="font-bold text-white">₺{check.total}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center: Check Detail */}
        <div className="flex-1 flex flex-col">
          {selectedCheck ? (
            <div className="bg-gray-800 rounded-2xl flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {selectedCheck.type === 'table' 
                      ? `Masa ${selectedCheck.tableNumber}` 
                      : selectedCheck.customerName}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {selectedCheck.waiter} • Açılış: {selectedCheck.openedAt} • {selectedCheck.items.length} kalem
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
                    <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
                      <th className="pb-2">Ürün</th>
                      <th className="pb-2 text-center">Adet</th>
                      <th className="pb-2 text-right">Fiyat</th>
                      <th className="pb-2 text-right">Toplam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCheck.items.map(item => (
                      <tr key={item.id} className="border-b border-gray-700/50">
                        <td className="py-3">
                          <p className="font-medium text-white">{item.name}</p>
                        </td>
                        <td className="py-3 text-center text-gray-400">{item.quantity}</td>
                        <td className="py-3 text-right text-gray-400">₺{item.price}</td>
                        <td className="py-3 text-right font-medium text-white">₺{item.price * item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="p-4 bg-gray-700/50 border-t border-gray-700">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Ara Toplam</span>
                    <span className="text-white">₺{selectedCheck.subtotal}</span>
                  </div>
                  {selectedCheck.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-400">
                      <span>İndirim ({selectedCheck.discountType === 'percent' ? `%${selectedCheck.discount}` : `₺${selectedCheck.discount}`})</span>
                      <span>-₺{selectedCheck.discountType === 'percent' 
                        ? Math.round(selectedCheck.subtotal * selectedCheck.discount / 100)
                        : selectedCheck.discount
                      }</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">KDV (%8)</span>
                    <span className="text-white">₺{selectedCheck.tax}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-600">
                    <span className="text-white">Toplam</span>
                    <span className="text-orange-500">₺{selectedCheck.total}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-2xl flex-1 flex items-center justify-center">
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
            <p className="text-orange-100 text-sm">Bugün Toplam</p>
            <p className="text-3xl font-bold">₺{(totalRevenue + 12450).toLocaleString()}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-orange-100">
              <span>47 işlem</span>
              <span>•</span>
              <span>{filteredChecks.length} açık</span>
            </div>
          </div>

          {/* Actions */}
          {selectedCheck && (
            <div className="bg-gray-800 rounded-2xl p-4 space-y-3">
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
                  İndirim
                </button>
                <button
                  onClick={() => setShowSplitModal(true)}
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
          <div className="bg-gray-800 rounded-2xl p-4">
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
          currentType={selectedCheck.discountType}
          onApply={handleApplyDiscount}
          onClose={() => setShowDiscountModal(false)}
        />
      )}

      {/* Split Modal */}
      {showSplitModal && selectedCheck && (
        <SplitModal
          check={selectedCheck}
          onClose={() => setShowSplitModal(false)}
        />
      )}
    </div>
  );
}

// Payment Modal Component
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

  const cashAmount = parseFloat(cashReceived) || 0;
  const change = cashAmount - check.total;

  const quickAmounts = [50, 100, 200, 500, 1000, 2000];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800">
          <div>
            <h2 className="text-xl font-bold text-white">Ödeme Al</h2>
            <p className="text-gray-400">
              {check.type === 'table' ? `Masa ${check.tableNumber}` : check.customerName}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Total */}
          <div className="text-center">
            <p className="text-gray-400">Ödenecek Tutar</p>
            <p className="text-4xl font-bold text-white">₺{check.total.toLocaleString()}</p>
          </div>

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
          {selectedMethod === 'cash' && (
            <div>
              <p className="text-sm font-medium text-gray-300 mb-2">Alınan Tutar</p>
              <input
                type="number"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder="0"
                className="w-full text-3xl font-bold text-center py-4 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
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
                <div className="mt-4 p-4 bg-green-600/20 rounded-xl text-center">
                  <p className="text-green-400">Para Üstü</p>
                  <p className="text-2xl font-bold text-green-400">₺{change.toFixed(2)}</p>
                </div>
              )}
            </div>
          )}

          {/* TiT Pay QR */}
          {selectedMethod === 'titpay' && (
            <div className="p-6 bg-gradient-to-br from-purple-900/50 to-indigo-900/50 rounded-xl text-center">
              <div className="w-32 h-32 bg-white rounded-xl mx-auto mb-4 flex items-center justify-center shadow-sm">
                <QrCode className="w-24 h-24 text-purple-600" />
              </div>
              <p className="font-medium text-purple-300">TiT Pay ile Ödeme</p>
              <p className="text-sm text-purple-400">QR kodu müşteriye gösterin</p>
            </div>
          )}

          {/* Pay Button */}
          <button
            onClick={() => onPay(selectedMethod, selectedMethod === 'cash' ? cashAmount : check.total)}
            disabled={selectedMethod === 'cash' && cashAmount < check.total}
            className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Check className="w-5 h-5" />
            Ödemeyi Tamamla
          </button>
        </div>
      </div>
    </div>
  );
}

// Discount Modal Component
function DiscountModal({
  currentDiscount,
  currentType,
  onApply,
  onClose
}: {
  currentDiscount: number;
  currentType: 'percent' | 'amount';
  onApply: (type: 'percent' | 'amount', value: number) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<'percent' | 'amount'>(currentType);
  const [value, setValue] = useState(currentDiscount.toString());

  const quickPercents = [5, 10, 15, 20, 25, 50];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
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
                type === 'percent' ? 'bg-gray-600 text-white' : 'text-gray-400'
              }`}
            >
              Yüzde (%)
            </button>
            <button
              onClick={() => setType('amount')}
              className={`flex-1 py-2 rounded-md font-medium transition-colors ${
                type === 'amount' ? 'bg-gray-600 text-white' : 'text-gray-400'
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
              className="w-full text-3xl font-bold text-center py-4 bg-gray-700 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
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
              className="flex-1 py-3 bg-gray-700 rounded-xl font-medium text-gray-300 hover:bg-gray-600"
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

// Split Modal Component
function SplitModal({
  check,
  onClose
}: {
  check: OpenCheck;
  onClose: () => void;
}) {
  const [splitCount, setSplitCount] = useState(2);
  const perPerson = Math.ceil(check.total / splitCount);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-sm">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Hesabı Böl</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-gray-400">Toplam</p>
            <p className="text-3xl font-bold text-white">₺{check.total}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-300 mb-2">Kişi Sayısı</p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setSplitCount(Math.max(2, splitCount - 1))}
                className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center justify-center"
              >
                <Minus className="w-5 h-5 text-white" />
              </button>
              <span className="text-4xl font-bold text-white w-16 text-center">{splitCount}</span>
              <button
                onClick={() => setSplitCount(splitCount + 1)}
                className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center justify-center"
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          <div className="bg-orange-600/20 rounded-xl p-4 text-center">
            <p className="text-orange-400">Kişi Başı</p>
            <p className="text-3xl font-bold text-orange-400">₺{perPerson}</p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
}
