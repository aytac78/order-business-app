'use client';

import { useState, useEffect } from 'react';
import { useVenueStore } from '@/stores';
import { Ticket, Plus, Edit2, Trash2, X, Search, Copy, Check, AlertCircle, Calendar, Percent, Gift, Users } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  name: string;
  type: 'percentage' | 'fixed' | 'free_item';
  value: number;
  freeItemName?: string;
  minOrderAmount?: number;
  maxUses?: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

const demoCoupons: Coupon[] = [
  { id: '1', code: 'HOSGELDIN', name: 'Hoş Geldin İndirimi', type: 'percentage', value: 15, minOrderAmount: 200, maxUses: 100, usedCount: 45, validFrom: '2025-01-01', validUntil: '2025-03-31', isActive: true },
  { id: '2', code: 'TATLI50', name: 'Tatlı İndirimi', type: 'fixed', value: 50, minOrderAmount: 300, maxUses: 50, usedCount: 12, validFrom: '2025-01-01', validUntil: '2025-02-28', isActive: true },
  { id: '3', code: 'KAHVE', name: 'Ücretsiz Kahve', type: 'free_item', value: 0, freeItemName: 'Türk Kahvesi', minOrderAmount: 150, maxUses: 200, usedCount: 87, validFrom: '2025-01-01', validUntil: '2025-01-31', isActive: true },
  { id: '4', code: 'YAZ2025', name: 'Yaz Kampanyası', type: 'percentage', value: 20, minOrderAmount: 500, usedCount: 0, validFrom: '2025-06-01', validUntil: '2025-08-31', isActive: false },
];

const typeConfig = {
  percentage: { label: 'Yüzde İndirim', icon: Percent, color: 'bg-green-100 text-green-700' },
  fixed: { label: 'Sabit İndirim', icon: Ticket, color: 'bg-blue-100 text-blue-700' },
  free_item: { label: 'Ücretsiz Ürün', icon: Gift, color: 'bg-purple-100 text-purple-700' },
};

export default function CouponsPage() {
  const { currentVenue } = useVenueStore();
  const [mounted, setMounted] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>(demoCoupons);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const toggleActive = (id: string) => {
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
  };

  const deleteCoupon = (id: string) => {
    if (confirm('Bu kuponu silmek istediğinize emin misiniz?')) {
      setCoupons(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleSave = (data: Partial<Coupon>) => {
    if (editingCoupon) {
      setCoupons(prev => prev.map(c => c.id === editingCoupon.id ? { ...c, ...data } : c));
    } else {
      setCoupons(prev => [...prev, { ...data, id: `coupon-${Date.now()}`, usedCount: 0, isActive: true } as Coupon]);
    }
    setShowModal(false);
    setEditingCoupon(null);
  };

  const activeCoupons = coupons.filter(c => c.isActive);
  const totalUsed = coupons.reduce((sum, c) => sum + c.usedCount, 0);

  if (!mounted) return <div className="animate-pulse bg-gray-100 rounded-2xl h-96" />;

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Mekan Seçimi Gerekli</h2>
          <p className="text-gray-500">Kupon yönetimi için lütfen bir mekan seçin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kupon Yönetimi</h1>
          <p className="text-gray-500">{currentVenue?.name} • {coupons.length} kupon</p>
        </div>
        <button onClick={() => { setEditingCoupon(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600">
          <Plus className="w-4 h-4" />Yeni Kupon
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><Ticket className="w-5 h-5 text-purple-600" /></div>
            <div><p className="text-2xl font-bold">{coupons.length}</p><p className="text-xs text-gray-500">Toplam Kupon</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><Check className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold">{activeCoupons.length}</p><p className="text-xs text-gray-500">Aktif</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><Users className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{totalUsed}</p><p className="text-xs text-gray-500">Kullanım</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center"><Percent className="w-5 h-5 text-orange-600" /></div>
            <div><p className="text-2xl font-bold">₺2.4k</p><p className="text-xs text-gray-500">İndirim Tutarı</p></div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Kupon kodu veya isim ara..." className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCoupons.map(coupon => {
          const config = typeConfig[coupon.type];
          const Icon = config.icon;
          const isExpired = new Date(coupon.validUntil) < new Date();
          const usagePercent = coupon.maxUses ? (coupon.usedCount / coupon.maxUses) * 100 : 0;
          
          return (
            <div key={coupon.id} className={`bg-white rounded-xl border overflow-hidden ${!coupon.isActive || isExpired ? 'opacity-60' : ''}`}>
              <div className={`p-4 ${coupon.type === 'percentage' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : coupon.type === 'fixed' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'} text-white`}>
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-6 h-6" />
                  <span className={`px-2 py-0.5 rounded-full text-xs ${coupon.isActive && !isExpired ? 'bg-white/20' : 'bg-black/20'}`}>
                    {isExpired ? 'Süresi Doldu' : coupon.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-xl">{coupon.code}</span>
                  <button onClick={() => handleCopyCode(coupon.code)} className="p-1 hover:bg-white/20 rounded">
                    {copiedCode === coupon.code ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-sm opacity-90">{coupon.name}</p>
              </div>
              
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${config.color}`}>{config.label}</span>
                  <span className="font-bold text-lg">
                    {coupon.type === 'percentage' ? `%${coupon.value}` : coupon.type === 'fixed' ? `₺${coupon.value}` : coupon.freeItemName}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  {coupon.minOrderAmount && (
                    <p>Min. sipariş: ₺{coupon.minOrderAmount}</p>
                  )}
                  <p className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(coupon.validFrom).toLocaleDateString('tr-TR')} - {new Date(coupon.validUntil).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                
                {coupon.maxUses && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Kullanım</span>
                      <span>{coupon.usedCount}/{coupon.maxUses}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${usagePercent}%` }} />
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button onClick={() => toggleActive(coupon.id)} className={`flex-1 py-2 rounded-lg text-sm font-medium ${coupon.isActive ? 'bg-gray-100 hover:bg-gray-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                    {coupon.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                  </button>
                  <button onClick={() => { setEditingCoupon(coupon); setShowModal(true); }} className="p-2 hover:bg-gray-100 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteCoupon(coupon.id)} className="p-2 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCoupons.length === 0 && (
        <div className="bg-white rounded-xl p-12 border text-center">
          <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Kupon bulunamadı</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between">
              <h2 className="text-xl font-bold">{editingCoupon ? 'Kupon Düzenle' : 'Yeni Kupon'}</h2>
              <button onClick={() => { setShowModal(false); setEditingCoupon(null); }}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              handleSave({
                code: f.get('code') as string,
                name: f.get('name') as string,
                type: f.get('type') as any,
                value: parseFloat(f.get('value') as string) || 0,
                minOrderAmount: parseFloat(f.get('minOrder') as string) || undefined,
                maxUses: parseInt(f.get('maxUses') as string) || undefined,
                validFrom: f.get('validFrom') as string,
                validUntil: f.get('validUntil') as string,
              });
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Kupon Kodu</label>
                <input name="code" defaultValue={editingCoupon?.code} required className="w-full px-4 py-2 border rounded-xl uppercase" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kupon Adı</label>
                <input name="name" defaultValue={editingCoupon?.name} required className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tip</label>
                  <select name="type" defaultValue={editingCoupon?.type || 'percentage'} className="w-full px-4 py-2 border rounded-xl">
                    <option value="percentage">Yüzde (%)</option>
                    <option value="fixed">Sabit (₺)</option>
                    <option value="free_item">Ücretsiz Ürün</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Değer</label>
                  <input name="value" type="number" min="0" defaultValue={editingCoupon?.value} className="w-full px-4 py-2 border rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Min. Sipariş (₺)</label>
                  <input name="minOrder" type="number" min="0" defaultValue={editingCoupon?.minOrderAmount} className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Kullanım</label>
                  <input name="maxUses" type="number" min="0" defaultValue={editingCoupon?.maxUses} className="w-full px-4 py-2 border rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Başlangıç</label>
                  <input name="validFrom" type="date" defaultValue={editingCoupon?.validFrom || new Date().toISOString().split('T')[0]} className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bitiş</label>
                  <input name="validUntil" type="date" defaultValue={editingCoupon?.validUntil} className="w-full px-4 py-2 border rounded-xl" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowModal(false); setEditingCoupon(null); }} className="flex-1 py-3 border rounded-xl">İptal</button>
                <button type="submit" className="flex-1 py-3 bg-orange-500 text-white rounded-xl">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
