'use client';

import { useState, useEffect } from 'react';
import { useVenueStore, useStaffStore, Staff } from '@/stores';
import { Users, Plus, Edit2, Trash2, X, Search, Shield, Clock, Phone, Mail, Key, Eye, EyeOff, AlertCircle } from 'lucide-react';

const roleConfig: Record<string, { label: string; color: string; permissions: string[] }> = {
  owner: { label: 'İşletme Sahibi', color: 'bg-purple-100 text-purple-700', permissions: ['Tüm yetkiler'] },
  manager: { label: 'Müdür', color: 'bg-blue-100 text-blue-700', permissions: ['Dashboard', 'Siparişler', 'Stok', 'Personel', 'Raporlar'] },
  cashier: { label: 'Kasiyer', color: 'bg-green-100 text-green-700', permissions: ['Kasa/POS', 'Siparişler'] },
  waiter: { label: 'Garson', color: 'bg-orange-100 text-orange-700', permissions: ['Garson Paneli', 'Siparişler'] },
  kitchen: { label: 'Mutfak', color: 'bg-red-100 text-red-700', permissions: ['Mutfak Paneli'] },
  reception: { label: 'Resepsiyon', color: 'bg-teal-100 text-teal-700', permissions: ['Resepsiyon', 'Rezervasyonlar'] },
};

export default function StaffPage() {
  const { currentVenue } = useVenueStore();
  const { staff, addStaff, updateStaff, deleteStaff } = useStaffStore();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [showPin, setShowPin] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const activeStaff = staff.filter(s => s.isActive).length;

  const generatePin = () => Math.floor(1000 + Math.random() * 9000).toString();

  const handleSave = (data: Partial<Staff>) => {
    if (editingStaff) {
      updateStaff(editingStaff.id, data);
    } else {
      addStaff({
        id: `staff-${Date.now()}`,
        name: data.name || '',
        role: data.role || 'waiter',
        phone: data.phone,
        email: data.email,
        pinCode: data.pinCode || generatePin(),
        isActive: true,
      });
    }
    setShowModal(false);
    setEditingStaff(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Bu personeli silmek istediğinize emin misiniz?')) return;
    deleteStaff(id);
  };

  if (!mounted) return <div className="animate-pulse bg-gray-100 rounded-2xl h-96" />;

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Mekan Seçimi Gerekli</h2>
          <p className="text-gray-500">Personel yönetimi için lütfen bir mekan seçin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Personel Yönetimi</h1>
          <p className="text-gray-500">{currentVenue?.name} • {staff.length} personel</p>
        </div>
        <button onClick={() => { setEditingStaff(null); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600">
          <Plus className="w-4 h-4" />Personel Ekle
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><Users className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{staff.length}</p><p className="text-xs text-gray-500">Toplam</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><Clock className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold text-green-600">{activeStaff}</p><p className="text-xs text-gray-500">Aktif</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center"><span className="text-orange-600 font-bold">{staff.filter(s => s.role === 'waiter').length}</span></div>
            <div><p className="text-2xl font-bold">{staff.filter(s => s.role === 'waiter').length}</p><p className="text-xs text-gray-500">Garson</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center"><span className="text-red-600 font-bold">{staff.filter(s => s.role === 'kitchen').length}</span></div>
            <div><p className="text-2xl font-bold">{staff.filter(s => s.role === 'kitchen').length}</p><p className="text-xs text-gray-500">Mutfak</p></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="İsim ara..." className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-4 py-2 border rounded-lg">
          <option value="all">Tüm Roller</option>
          {Object.entries(roleConfig).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map(member => (
          <div key={member.id} className={`bg-white rounded-xl border overflow-hidden ${!member.isActive ? 'opacity-60' : ''}`}>
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{member.name}</h3>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${roleConfig[member.role]?.color}`}>
                    {roleConfig[member.role]?.label}
                  </span>
                </div>
                <div className={`w-2 h-2 rounded-full ${member.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
              </div>

              <div className="mt-4 space-y-2 text-sm">
                {member.phone && <div className="flex items-center gap-2 text-gray-500"><Phone className="w-4 h-4" />{member.phone}</div>}
                {member.email && <div className="flex items-center gap-2 text-gray-500"><Mail className="w-4 h-4" />{member.email}</div>}
                <div className="flex items-center gap-2 text-gray-500">
                  <Key className="w-4 h-4" />
                  <span>PIN: </span>
                  {showPin === member.id ? (
                    <span className="font-mono font-bold">{member.pinCode}</span>
                  ) : (
                    <span className="font-mono">••••</span>
                  )}
                  <button onClick={() => setShowPin(showPin === member.id ? null : member.id)} className="p-1 hover:bg-gray-100 rounded">
                    {showPin === member.id ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-400 mb-2">Yetkiler:</p>
                <div className="flex flex-wrap gap-1">
                  {roleConfig[member.role]?.permissions.map(perm => (
                    <span key={perm} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{perm}</span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button onClick={() => updateStaff(member.id, { isActive: !member.isActive })} className={`flex-1 py-2 rounded-lg text-sm font-medium ${member.isActive ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                  {member.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                </button>
                <button onClick={() => { setEditingStaff(member); setShowModal(true); }} className="p-2 hover:bg-gray-100 rounded-lg"><Edit2 className="w-4 h-4 text-gray-500" /></button>
                <button onClick={() => handleDelete(member.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <div className="bg-white rounded-xl p-8 text-center text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Personel bulunamadı</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingStaff ? 'Personel Düzenle' : 'Yeni Personel'}</h2>
              <button onClick={() => { setShowModal(false); setEditingStaff(null); }}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); handleSave({ name: f.get('name') as string, role: f.get('role') as any, phone: f.get('phone') as string, email: f.get('email') as string, pinCode: f.get('pinCode') as string || generatePin() }); }} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Ad Soyad</label><input name="name" required defaultValue={editingStaff?.name} className="w-full px-4 py-2 border rounded-xl" /></div>
              <div><label className="block text-sm font-medium mb-1">Rol</label>
                <select name="role" defaultValue={editingStaff?.role || 'waiter'} className="w-full px-4 py-2 border rounded-xl">
                  {Object.entries(roleConfig).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>
              <div><label className="block text-sm font-medium mb-1">Telefon</label><input name="phone" type="tel" defaultValue={editingStaff?.phone} className="w-full px-4 py-2 border rounded-xl" /></div>
              <div><label className="block text-sm font-medium mb-1">E-posta</label><input name="email" type="email" defaultValue={editingStaff?.email} className="w-full px-4 py-2 border rounded-xl" /></div>
              <div>
                <label className="block text-sm font-medium mb-1">PIN Kodu</label>
                <div className="flex gap-2">
                  <input name="pinCode" defaultValue={editingStaff?.pinCode} placeholder="4 haneli" maxLength={4} className="flex-1 px-4 py-2 border rounded-xl font-mono" />
                  <button type="button" onClick={(e) => { const input = (e.target as HTMLElement).parentElement?.querySelector('input'); if (input) input.value = generatePin(); }} className="px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200">Oluştur</button>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowModal(false); setEditingStaff(null); }} className="flex-1 py-3 border rounded-xl">İptal</button>
                <button type="submit" className="flex-1 py-3 bg-orange-500 text-white rounded-xl">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
