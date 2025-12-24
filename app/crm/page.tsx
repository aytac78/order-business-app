'use client';

import { useState, useEffect } from 'react';
import { useVenueStore } from '@/stores';
import { UserCircle, Search, Star, Phone, Mail, Plus, Edit2, X, TrendingUp, Calendar, CreditCard, AlertCircle } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  totalVisits: number;
  totalSpent: number;
  lastVisit?: string;
  tags?: string[];
  notes?: string;
  isVip: boolean;
  loyaltyPoints: number;
}

const initialCustomers: Customer[] = [
  { id: '1', name: 'Ahmet Yılmaz', phone: '0532 111 2233', email: 'ahmet@email.com', totalVisits: 45, totalSpent: 18500, lastVisit: '2025-01-15', tags: ['VIP', 'İş Yemeği'], isVip: true, loyaltyPoints: 1850 },
  { id: '2', name: 'Ayşe Kaya', phone: '0533 222 3344', email: 'ayse@email.com', totalVisits: 28, totalSpent: 12300, lastVisit: '2025-01-14', tags: ['Aile'], isVip: false, loyaltyPoints: 1230 },
  { id: '3', name: 'Mehmet Demir', phone: '0534 333 4455', totalVisits: 52, totalSpent: 24800, lastVisit: '2025-01-15', tags: ['VIP', 'Düzenli'], isVip: true, loyaltyPoints: 2480 },
  { id: '4', name: 'Fatma Şen', phone: '0535 444 5566', email: 'fatma@email.com', totalVisits: 15, totalSpent: 6200, lastVisit: '2025-01-10', tags: ['Öğle Yemeği'], isVip: false, loyaltyPoints: 620 },
  { id: '5', name: 'Ali Öztürk', phone: '0536 555 6677', totalVisits: 8, totalSpent: 3400, lastVisit: '2025-01-08', isVip: false, loyaltyPoints: 340 },
  { id: '6', name: 'Zeynep Arslan', phone: '0537 666 7788', email: 'zeynep@email.com', totalVisits: 35, totalSpent: 15600, lastVisit: '2025-01-13', tags: ['VIP', 'Doğum Günü'], isVip: true, loyaltyPoints: 1560 },
  { id: '7', name: 'Can Yıldız', phone: '0538 777 8899', totalVisits: 12, totalSpent: 5100, lastVisit: '2025-01-11', isVip: false, loyaltyPoints: 510 },
  { id: '8', name: 'Deniz Koç', phone: '0539 888 9900', email: 'deniz@email.com', totalVisits: 22, totalSpent: 9800, lastVisit: '2025-01-12', tags: ['Romantik Akşam'], isVip: false, loyaltyPoints: 980 },
];

export default function CRMPage() {
  const { currentVenue } = useVenueStore();
  const [mounted, setMounted] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVip, setFilterVip] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery);
    const matchesVip = !filterVip || c.isVip;
    return matchesSearch && matchesVip;
  });

  const stats = {
    total: customers.length,
    vip: customers.filter(c => c.isVip).length,
    totalSpent: customers.reduce((sum, c) => sum + c.totalSpent, 0),
    avgSpent: Math.round(customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length),
  };

  const toggleVip = (id: string) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, isVip: !c.isVip } : c));
  };

  const handleSave = (data: Partial<Customer>) => {
    if (editingCustomer) {
      setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? { ...c, ...data } : c));
    } else {
      setCustomers(prev => [...prev, { ...data, id: `cust-${Date.now()}`, totalVisits: 0, totalSpent: 0, isVip: false, loyaltyPoints: 0 } as Customer]);
    }
    setShowModal(false);
    setEditingCustomer(null);
  };

  if (!mounted) return <div className="animate-pulse bg-gray-100 rounded-2xl h-96" />;

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Mekan Seçimi Gerekli</h2>
          <p className="text-gray-500">CRM için lütfen bir mekan seçin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Müşteri CRM</h1>
          <p className="text-gray-500">{currentVenue?.name} • {customers.length} müşteri</p>
        </div>
        <button onClick={() => { setEditingCustomer(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600">
          <Plus className="w-4 h-4" />Müşteri Ekle
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><UserCircle className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-gray-500">Toplam Müşteri</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><Star className="w-5 h-5 text-amber-600" /></div>
            <div><p className="text-2xl font-bold text-amber-600">{stats.vip}</p><p className="text-xs text-gray-500">VIP Müşteri</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><CreditCard className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold text-green-600">₺{stats.totalSpent.toLocaleString()}</p><p className="text-xs text-gray-500">Toplam Harcama</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-purple-600" /></div>
            <div><p className="text-2xl font-bold">₺{stats.avgSpent}</p><p className="text-xs text-gray-500">Ort. Harcama</p></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="İsim veya telefon ara..." className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={filterVip} onChange={(e) => setFilterVip(e.target.checked)} className="w-4 h-4 rounded" />
          <span className="text-sm">Sadece VIP</span>
        </label>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left text-sm text-gray-500">
              <th className="px-4 py-3 font-medium">Müşteri</th>
              <th className="px-4 py-3 font-medium">İletişim</th>
              <th className="px-4 py-3 font-medium">Ziyaret</th>
              <th className="px-4 py-3 font-medium">Harcama</th>
              <th className="px-4 py-3 font-medium">Puan</th>
              <th className="px-4 py-3 font-medium">Etiketler</th>
              <th className="px-4 py-3 font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredCustomers.map(customer => (
              <tr key={customer.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedCustomer(customer)}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm">
                      {customer.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{customer.name}</p>
                        {customer.isVip && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                      </div>
                      <p className="text-xs text-gray-500">Son: {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString('tr-TR') : '-'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm">{customer.phone}</p>
                  {customer.email && <p className="text-xs text-gray-500">{customer.email}</p>}
                </td>
                <td className="px-4 py-3 font-medium">{customer.totalVisits}</td>
                <td className="px-4 py-3 font-bold text-orange-600">₺{customer.totalSpent.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">{customer.loyaltyPoints} puan</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {customer.tags?.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{tag}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); toggleVip(customer.id); }} className={`p-2 rounded-lg ${customer.isVip ? 'bg-amber-100 text-amber-600' : 'hover:bg-gray-100 text-gray-400'}`}>
                      <Star className={`w-4 h-4 ${customer.isVip ? 'fill-current' : ''}`} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setEditingCustomer(customer); setShowModal(true); }} className="p-2 hover:bg-gray-100 rounded-lg">
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </button>
                    <a href={`tel:${customer.phone}`} onClick={(e) => e.stopPropagation()} className="p-2 hover:bg-gray-100 rounded-lg">
                      <Phone className="w-4 h-4 text-gray-500" />
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold">
                  {selectedCustomer.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">{selectedCustomer.name}</h2>
                    {selectedCustomer.isVip && <Star className="w-5 h-5 text-amber-500 fill-amber-500" />}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)}><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">Toplam Ziyaret</p>
                  <p className="text-xl font-bold">{selectedCustomer.totalVisits}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">Toplam Harcama</p>
                  <p className="text-xl font-bold text-orange-600">₺{selectedCustomer.totalSpent.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">Sadakat Puanı</p>
                  <p className="text-xl font-bold text-purple-600">{selectedCustomer.loyaltyPoints}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">Son Ziyaret</p>
                  <p className="text-xl font-bold">{selectedCustomer.lastVisit ? new Date(selectedCustomer.lastVisit).toLocaleDateString('tr-TR') : '-'}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4" />{selectedCustomer.phone}</div>
                {selectedCustomer.email && <div className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4" />{selectedCustomer.email}</div>}
              </div>
              
              {selectedCustomer.tags && selectedCustomer.tags.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Etiketler</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCustomer.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <a href={`tel:${selectedCustomer.phone}`} className="flex-1 py-3 bg-green-500 text-white rounded-xl font-medium flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" />Ara
                </a>
                <button onClick={() => { setEditingCustomer(selectedCustomer); setShowModal(true); setSelectedCustomer(null); }} className="flex-1 py-3 border rounded-xl font-medium flex items-center justify-center gap-2">
                  <Edit2 className="w-4 h-4" />Düzenle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingCustomer ? 'Müşteri Düzenle' : 'Yeni Müşteri'}</h2>
              <button onClick={() => { setShowModal(false); setEditingCustomer(null); }}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); handleSave({ name: f.get('name') as string, phone: f.get('phone') as string, email: f.get('email') as string || undefined, notes: f.get('notes') as string || undefined }); }} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Ad Soyad</label><input name="name" required defaultValue={editingCustomer?.name} className="w-full px-4 py-2 border rounded-xl" /></div>
              <div><label className="block text-sm font-medium mb-1">Telefon</label><input name="phone" required defaultValue={editingCustomer?.phone} className="w-full px-4 py-2 border rounded-xl" /></div>
              <div><label className="block text-sm font-medium mb-1">E-posta</label><input name="email" type="email" defaultValue={editingCustomer?.email} className="w-full px-4 py-2 border rounded-xl" /></div>
              <div><label className="block text-sm font-medium mb-1">Notlar</label><textarea name="notes" defaultValue={editingCustomer?.notes} className="w-full px-4 py-2 border rounded-xl resize-none h-20" /></div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowModal(false); setEditingCustomer(null); }} className="flex-1 py-3 border rounded-xl">İptal</button>
                <button type="submit" className="flex-1 py-3 bg-orange-500 text-white rounded-xl">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
