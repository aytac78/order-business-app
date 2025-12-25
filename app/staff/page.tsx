'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Users, Plus, Search, Edit, Trash2, Key, Shield,
  ChefHat, UtensilsCrossed, CreditCard, Calendar,
  Home, Eye, EyeOff, RefreshCw, Check, X, Phone,
  Mail, Clock, Star, MoreVertical, UserPlus
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

type StaffRole = 'admin' | 'manager' | 'chef' | 'waiter' | 'cashier' | 'host';

interface Staff {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: StaffRole;
  pin: string;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
  avatar?: string;
  performance?: {
    rating: number;
    ordersHandled: number;
  };
}

// ============================================
// ROLE CONFIG
// ============================================

const roleConfig: Record<StaffRole, { label: string; icon: React.ElementType; color: string; bgColor: string; permissions: string[] }> = {
  admin: {
    label: 'Yönetici',
    icon: Shield,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    permissions: ['Tüm yetkiler', 'Personel yönetimi', 'Raporlar', 'Ayarlar']
  },
  manager: {
    label: 'Müdür',
    icon: Shield,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/20',
    permissions: ['Personel görüntüleme', 'Raporlar', 'Stok yönetimi', 'Menü düzenleme']
  },
  chef: {
    label: 'Mutfak',
    icon: ChefHat,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    permissions: ['Mutfak paneli', 'Sipariş hazırlama', 'Stok görüntüleme']
  },
  waiter: {
    label: 'Garson',
    icon: UtensilsCrossed,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    permissions: ['Garson paneli', 'Sipariş alma', 'Masa yönetimi']
  },
  cashier: {
    label: 'Kasiyer',
    icon: CreditCard,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    permissions: ['Kasa paneli', 'Ödeme alma', 'Z raporu']
  },
  host: {
    label: 'Resepsiyon',
    icon: Calendar,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/20',
    permissions: ['Resepsiyon paneli', 'Rezervasyon yönetimi', 'Misafir karşılama']
  },
};

// ============================================
// MOCK DATA
// ============================================

const mockStaff: Staff[] = [
  {
    id: '1',
    name: 'Ahmet Yılmaz',
    phone: '+90 532 123 4567',
    email: 'ahmet@demo.com',
    role: 'admin',
    pin: '1234',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    lastLogin: new Date(),
    performance: { rating: 4.9, ordersHandled: 0 }
  },
  {
    id: '2',
    name: 'Mehmet Aşçı',
    phone: '+90 533 234 5678',
    role: 'chef',
    pin: '1111',
    isActive: true,
    createdAt: new Date('2024-02-01'),
    lastLogin: new Date(Date.now() - 3600000),
    performance: { rating: 4.8, ordersHandled: 1250 }
  },
  {
    id: '3',
    name: 'Ayşe Garson',
    phone: '+90 534 345 6789',
    role: 'waiter',
    pin: '3333',
    isActive: true,
    createdAt: new Date('2024-03-10'),
    lastLogin: new Date(Date.now() - 7200000),
    performance: { rating: 4.7, ordersHandled: 890 }
  },
  {
    id: '4',
    name: 'Fatma Kaya',
    phone: '+90 535 456 7890',
    role: 'cashier',
    pin: '5555',
    isActive: true,
    createdAt: new Date('2024-04-05'),
    lastLogin: new Date(Date.now() - 86400000),
    performance: { rating: 4.6, ordersHandled: 2100 }
  },
  {
    id: '5',
    name: 'Zeynep Aksoy',
    phone: '+90 536 567 8901',
    role: 'host',
    pin: '7777',
    isActive: true,
    createdAt: new Date('2024-05-20'),
    lastLogin: new Date(Date.now() - 172800000),
    performance: { rating: 4.9, ordersHandled: 450 }
  },
  {
    id: '6',
    name: 'Ali Demir',
    phone: '+90 537 678 9012',
    role: 'waiter',
    pin: '4444',
    isActive: false,
    createdAt: new Date('2024-06-01'),
    performance: { rating: 4.2, ordersHandled: 320 }
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

const generatePin = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatLastLogin = (date?: Date): string => {
  if (!date) return 'Hiç giriş yapmadı';
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
};

// ============================================
// STAFF CARD
// ============================================

function StaffCard({ 
  staff, 
  onEdit, 
  onDelete, 
  onToggleActive,
  onResetPin 
}: { 
  staff: Staff;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onResetPin: () => void;
}) {
  const [showPin, setShowPin] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const role = roleConfig[staff.role];
  const Icon = role.icon;

  return (
    <div className={`bg-zinc-800/50 rounded-xl border ${staff.isActive ? 'border-zinc-700/50' : 'border-red-500/30 opacity-60'} p-4 transition-all hover:bg-zinc-800`}>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className={`w-12 h-12 rounded-xl ${role.bgColor} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-6 h-6 ${role.color}`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-white truncate">{staff.name}</h3>
            {!staff.isActive && (
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded">Pasif</span>
            )}
          </div>
          <p className={`text-sm ${role.color}`}>{role.label}</p>
          <p className="text-xs text-zinc-500 mt-1">{staff.phone}</p>
        </div>

        {/* Actions Menu */}
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-zinc-400" />
          </button>
          
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl z-20 py-1">
                <button onClick={() => { onEdit(); setShowMenu(false); }} className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 flex items-center gap-2">
                  <Edit className="w-4 h-4" /> Düzenle
                </button>
                <button onClick={() => { onResetPin(); setShowMenu(false); }} className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 flex items-center gap-2">
                  <Key className="w-4 h-4" /> PIN Sıfırla
                </button>
                <button onClick={() => { onToggleActive(); setShowMenu(false); }} className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 flex items-center gap-2">
                  {staff.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  {staff.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                </button>
                <hr className="my-1 border-zinc-700" />
                <button onClick={() => { onDelete(); setShowMenu(false); }} className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-zinc-700 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Sil
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* PIN & Stats */}
      <div className="mt-4 pt-4 border-t border-zinc-700/50 grid grid-cols-3 gap-4">
        {/* PIN */}
        <div>
          <p className="text-[10px] text-zinc-500 mb-1">PIN Kodu</p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-white">
              {showPin ? staff.pin : '••••'}
            </span>
            <button onClick={() => setShowPin(!showPin)} className="text-zinc-500 hover:text-zinc-300">
              {showPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Performance */}
        {staff.performance && (
          <div>
            <p className="text-[10px] text-zinc-500 mb-1">Performans</p>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-white text-sm">{staff.performance.rating}</span>
            </div>
          </div>
        )}

        {/* Last Login */}
        <div>
          <p className="text-[10px] text-zinc-500 mb-1">Son Giriş</p>
          <p className="text-xs text-zinc-400">{formatLastLogin(staff.lastLogin)}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ADD/EDIT MODAL
// ============================================

function StaffModal({
  staff,
  onClose,
  onSave
}: {
  staff?: Staff;
  onClose: () => void;
  onSave: (data: Partial<Staff>) => void;
}) {
  const [name, setName] = useState(staff?.name || '');
  const [phone, setPhone] = useState(staff?.phone || '');
  const [email, setEmail] = useState(staff?.email || '');
  const [role, setRole] = useState<StaffRole>(staff?.role || 'waiter');
  const [pin, setPin] = useState(staff?.pin || generatePin());
  const [showPin, setShowPin] = useState(false);

  const handleSubmit = () => {
    if (!name || !phone) return;
    onSave({ name, phone, email, role, pin, isActive: true });
  };

  const handleGeneratePin = () => {
    setPin(generatePin());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-zinc-900 rounded-2xl border border-zinc-700 p-6">
        <h2 className="text-xl font-bold text-white mb-6">
          {staff ? 'Personel Düzenle' : 'Yeni Personel Ekle'}
        </h2>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Ad Soyad *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Personel adı"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Telefon *</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+90 5XX XXX XXXX"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">E-posta (Opsiyonel)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@email.com"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Rol *</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(roleConfig).map(([key, config]) => {
                const RoleIcon = config.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setRole(key as StaffRole)}
                    className={`p-3 rounded-xl border transition-all ${
                      role === key
                        ? `${config.bgColor} border-${config.color.replace('text-', '')}`
                        : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700'
                    }`}
                  >
                    <RoleIcon className={`w-5 h-5 mx-auto mb-1 ${role === key ? config.color : 'text-zinc-400'}`} />
                    <p className={`text-xs ${role === key ? 'text-white' : 'text-zinc-400'}`}>{config.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PIN */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">PIN Kodu</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white font-mono text-center text-xl tracking-widest focus:outline-none focus:border-blue-500"
                />
                <button 
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <button
                onClick={handleGeneratePin}
                className="px-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl transition-colors"
                title="Yeni PIN Oluştur"
              >
                <RefreshCw className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-1">4 haneli sayısal kod</p>
          </div>

          {/* Role Permissions Preview */}
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <p className="text-xs text-zinc-500 mb-2">Bu rol için yetkiler:</p>
            <div className="flex flex-wrap gap-1">
              {roleConfig[role].permissions.map((perm, i) => (
                <span key={i} className="px-2 py-1 bg-zinc-700 text-zinc-300 text-xs rounded">
                  {perm}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name || !phone || pin.length !== 4}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-xl transition-colors"
          >
            {staff ? 'Güncelle' : 'Ekle'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>(mockStaff);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<StaffRole | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | undefined>();

  // Filtered staff
  const filteredStaff = staffList.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.phone.includes(searchTerm);
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Stats
  const activeCount = staffList.filter(s => s.isActive).length;
  const roleStats = Object.keys(roleConfig).map(role => ({
    role,
    count: staffList.filter(s => s.role === role && s.isActive).length
  }));

  // Handlers
  const handleAdd = () => {
    setEditingStaff(undefined);
    setShowModal(true);
  };

  const handleEdit = (staff: Staff) => {
    setEditingStaff(staff);
    setShowModal(true);
  };

  const handleSave = (data: Partial<Staff>) => {
    if (editingStaff) {
      setStaffList(prev => prev.map(s => 
        s.id === editingStaff.id ? { ...s, ...data } : s
      ));
    } else {
      const newStaff: Staff = {
        id: `staff-${Date.now()}`,
        name: data.name || '',
        phone: data.phone || '',
        email: data.email,
        role: data.role || 'waiter',
        pin: data.pin || generatePin(),
        isActive: true,
        createdAt: new Date(),
      };
      setStaffList(prev => [...prev, newStaff]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bu personeli silmek istediğinize emin misiniz?')) {
      setStaffList(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    setStaffList(prev => prev.map(s => 
      s.id === id ? { ...s, isActive: !s.isActive } : s
    ));
  };

  const handleResetPin = (id: string) => {
    const newPin = generatePin();
    setStaffList(prev => prev.map(s => 
      s.id === id ? { ...s, pin: newPin } : s
    ));
    alert(`Yeni PIN: ${newPin}`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur border-b border-zinc-800">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Personel Yönetimi</h1>
              <p className="text-sm text-zinc-400">{activeCount} aktif personel</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-all">
              <Home className="w-5 h-5" />
            </Link>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              Personel Ekle
            </button>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {roleStats.map(({ role, count }) => {
            const config = roleConfig[role as StaffRole];
            const Icon = config.icon;
            return (
              <div key={role} className={`${config.bgColor} rounded-xl p-4 text-center`}>
                <Icon className={`w-6 h-6 mx-auto mb-2 ${config.color}`} />
                <p className="text-2xl font-bold text-white">{count}</p>
                <p className="text-xs text-zinc-400">{config.label}</p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                placeholder="İsim veya telefon ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                roleFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              Tümü
            </button>
            {Object.entries(roleConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setRoleFilter(key as StaffRole)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  roleFilter === key ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map(staff => (
            <StaffCard
              key={staff.id}
              staff={staff}
              onEdit={() => handleEdit(staff)}
              onDelete={() => handleDelete(staff.id)}
              onToggleActive={() => handleToggleActive(staff.id)}
              onResetPin={() => handleResetPin(staff.id)}
            />
          ))}
        </div>

        {filteredStaff.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
            <h3 className="text-xl font-bold text-zinc-400 mb-2">Personel bulunamadı</h3>
            <p className="text-zinc-500">Arama kriterlerinizi değiştirin veya yeni personel ekleyin.</p>
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      {showModal && (
        <StaffModal
          staff={editingStaff}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
