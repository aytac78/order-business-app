'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, Plus, Search, Edit, Trash2, 
  ChefHat, CreditCard, Calendar, Crown,
  LayoutDashboard, ArrowLeft, Save, X
} from 'lucide-react';

type StaffRole = 'owner' | 'manager' | 'kitchen' | 'waiter' | 'cashier' | 'reception';

interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  phone?: string;
  email?: string;
  pin_code?: string;
  is_active: boolean;
}

const roleConfig: Record<StaffRole, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  owner: { label: 'Yönetici', icon: Crown, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  manager: { label: 'Müdür', icon: LayoutDashboard, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  kitchen: { label: 'Mutfak', icon: ChefHat, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  waiter: { label: 'Garson', icon: Users, color: 'text-green-600', bgColor: 'bg-green-100' },
  cashier: { label: 'Kasiyer', icon: CreditCard, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  reception: { label: 'Resepsiyon', icon: Calendar, color: 'text-pink-600', bgColor: 'bg-pink-100' },
};

const demoStaff: StaffMember[] = [
  { id: '1', name: 'Aytaç Gör', role: 'owner', phone: '555-0001', pin_code: '1234', is_active: true },
  { id: '2', name: 'Mehmet Şef', role: 'kitchen', phone: '555-0002', pin_code: '1111', is_active: true },
  { id: '3', name: 'Ayşe Garson', role: 'waiter', phone: '555-0003', pin_code: '2222', is_active: true },
  { id: '4', name: 'Fatma Kasa', role: 'cashier', phone: '555-0004', pin_code: '3333', is_active: true },
  { id: '5', name: 'Ali Resepsiyon', role: 'reception', phone: '555-0005', pin_code: '4444', is_active: true },
  { id: '6', name: 'Zeynep Müdür', role: 'manager', phone: '555-0006', pin_code: '5555', is_active: true },
];

export default function StaffPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember[]>(demoStaff);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<StaffRole | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || s.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleEdit = (s: StaffMember) => {
    setEditingStaff(s);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bu personeli silmek istediğinize emin misiniz?')) {
      setStaff(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleSave = (data: Partial<StaffMember>) => {
    if (editingStaff) {
      setStaff(prev => prev.map(s => s.id === editingStaff.id ? { ...s, ...data } : s));
    } else {
      const newStaff: StaffMember = {
        id: Date.now().toString(),
        name: data.name || '',
        role: data.role || 'waiter',
        phone: data.phone,
        email: data.email,
        pin_code: data.pin_code,
        is_active: true,
      };
      setStaff(prev => [...prev, newStaff]);
    }
    setShowModal(false);
    setEditingStaff(null);
  };

  if (!mounted) {
    return <div className="animate-pulse bg-gray-100 rounded-2xl h-96" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personel Yönetimi</h1>
          <p className="text-gray-500">{staff.length} personel</p>
        </div>
        <button
          onClick={() => { setEditingStaff(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors"
        >
          <Plus className="w-5 h-5" />
          Personel Ekle
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Personel ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedRole('all')}
            className={`px-4 py-2 rounded-xl transition-colors ${
              selectedRole === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tümü
          </button>
          {(Object.keys(roleConfig) as StaffRole[]).map(role => {
            const config = roleConfig[role];
            return (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-4 py-2 rounded-xl transition-colors ${
                  selectedRole === role ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Staff List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map(s => {
          const config = roleConfig[s.role];
          const Icon = config.icon;
          return (
            <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${config.bgColor} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${config.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{s.name}</h3>
                    <p className={`text-sm ${config.color}`}>{config.label}</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs ${s.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  {s.is_active ? 'Aktif' : 'Pasif'}
                </div>
              </div>
              
              <div className="mt-4 space-y-1 text-sm text-gray-500">
                {s.phone && <p>📱 {s.phone}</p>}
                {s.email && <p>✉️ {s.email}</p>}
                {s.pin_code && <p>🔐 PIN: ****</p>}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleEdit(s)}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors"
                >
                  <Edit className="w-4 h-4 inline mr-1" />
                  Düzenle
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="py-2 px-3 bg-red-50 hover:bg-red-100 rounded-xl text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredStaff.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Personel bulunamadı</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <StaffModal
          staff={editingStaff}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingStaff(null); }}
        />
      )}
    </div>
  );
}

function StaffModal({
  staff,
  onSave,
  onClose,
}: {
  staff: StaffMember | null;
  onSave: (data: Partial<StaffMember>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: staff?.name || '',
    role: staff?.role || 'waiter' as StaffRole,
    phone: staff?.phone || '',
    email: staff?.email || '',
    pin_code: staff?.pin_code || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {staff ? 'Personel Düzenle' : 'Yeni Personel'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as StaffRole }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {(Object.keys(roleConfig) as StaffRole[]).map(role => (
                <option key={role} value={role}>{roleConfig[role].label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PIN Kodu (4 haneli)</label>
            <input
              type="text"
              value={formData.pin_code}
              onChange={(e) => setFormData(prev => ({ ...prev, pin_code: e.target.value.slice(0, 4) }))}
              maxLength={4}
              pattern="[0-9]*"
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors"
            >
              <Save className="w-4 h-4 inline mr-1" />
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
