'use client';

import { useState, useEffect } from 'react';
import { useVenueStore, useTableStore, useOrderStore, useStaffStore, useNotificationStore } from '@/stores';
import Link from 'next/link';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Users,
  UtensilsCrossed,
  ChefHat,
  CreditCard,
  CalendarCheck,
  Package,
  Clock,
  AlertTriangle,
  Bell,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  Eye,
  EyeOff,
  Shield,
  Building2
} from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  pin_code?: string;
  is_active: boolean;
  last_active?: string;
}

const rolePermissions: Record<string, string[]> = {
  owner: ['Tüm yetkiler'],
  manager: ['Dashboard', 'Siparişler', 'Personel', 'Raporlar', 'Stok'],
  cashier: ['POS/Kasa', 'Siparişler'],
  waiter: ['Garson Paneli', 'Siparişler'],
  kitchen: ['Mutfak Paneli'],
  reception: ['Resepsiyon', 'Rezervasyonlar']
};

const roleLabels: Record<string, { label: string; color: string }> = {
  owner: { label: 'İşletme Sahibi', color: 'bg-purple-100 text-purple-700' },
  manager: { label: 'Müdür', color: 'bg-blue-100 text-blue-700' },
  cashier: { label: 'Kasiyer', color: 'bg-green-100 text-green-700' },
  waiter: { label: 'Garson', color: 'bg-orange-100 text-orange-700' },
  kitchen: { label: 'Mutfak', color: 'bg-red-100 text-red-700' },
  reception: { label: 'Resepsiyon', color: 'bg-teal-100 text-teal-700' }
};

export default function DashboardPage() {
  const { currentVenue } = useVenueStore();
  const { tables } = useTableStore();
  const { activeOrders } = useOrderStore();
  const { staff, addStaff, updateStaff, deleteStaff } = useStaffStore();
  const { unreadCount } = useNotificationStore();
  
  const [mounted, setMounted] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [showPinFor, setShowPinFor] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Stats
  const todayRevenue = 18450;
  const yesterdayRevenue = 15680;
  const revenueChange = ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1);
  const todayOrders = 47;
  const yesterdayOrders = 42;
  const orderChange = ((todayOrders - yesterdayOrders) / yesterdayOrders * 100).toFixed(1);
  
  const occupiedTables = tables.filter(t => t.status === 'occupied').length;
  const totalTables = tables.length;
  const occupancyRate = Math.round((occupiedTables / totalTables) * 100);

  const quickActions = [
    { name: 'Mutfak', href: '/kitchen', icon: ChefHat, color: 'from-orange-500 to-red-500', desc: 'Sipariş takibi' },
    { name: 'Garson', href: '/waiter', icon: UtensilsCrossed, color: 'from-blue-500 to-indigo-500', desc: 'Sipariş alma' },
    { name: 'Resepsiyon', href: '/reception', icon: Users, color: 'from-teal-500 to-green-500', desc: 'Rezervasyonlar' },
    { name: 'Kasa', href: '/pos', icon: CreditCard, color: 'from-purple-500 to-pink-500', desc: 'Ödeme işlemleri' },
  ];

  const handleSaveStaff = (data: Partial<StaffMember>) => {
    if (editingStaff) {
      updateStaff(editingStaff.id, data);
    } else {
      addStaff({
        id: `staff-${Date.now()}`,
        venue_id: currentVenue?.id || '1',
        name: data.name || '',
        role: data.role as any || 'waiter',
        phone: data.phone,
        email: data.email,
        pin_code: data.pin_code,
        is_active: true,
      });
    }
    setShowStaffModal(false);
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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">
            {currentVenue?.name || 'Tüm Mekanlar'} • {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 bg-white rounded-xl border border-gray-200 hover:bg-gray-50">
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
              parseFloat(revenueChange) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {parseFloat(revenueChange) >= 0 ? '+' : ''}{revenueChange}%
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">₺{todayRevenue.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">Bugünkü Gelir</p>
        </div>

        {/* Orders */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <UtensilsCrossed className="w-6 h-6 text-blue-600" />
            </div>
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
              parseFloat(orderChange) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {parseFloat(orderChange) >= 0 ? '+' : ''}{orderChange}%
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{todayOrders}</p>
          <p className="text-sm text-gray-500 mt-1">Bugünkü Sipariş</p>
        </div>

        {/* Table Occupancy */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm font-medium px-2 py-1 rounded-full bg-orange-100 text-orange-700">
              {occupiedTables}/{totalTables}
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">%{occupancyRate}</p>
          <p className="text-sm text-gray-500 mt-1">Doluluk Oranı</p>
        </div>

        {/* Active Orders */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700">
              Aktif
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{activeOrders?.length ?? 8}</p>
          <p className="text-sm text-gray-500 mt-1">Aktif Sipariş</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`bg-gradient-to-br ${action.color} rounded-2xl p-6 text-white hover:shadow-lg transition-all hover:scale-[1.02]`}
          >
            <action.icon className="w-8 h-8 mb-3" />
            <h3 className="font-bold text-lg">{action.name}</h3>
            <p className="text-white/80 text-sm">{action.desc}</p>
          </Link>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
            <CalendarCheck className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">5</p>
            <p className="text-xs text-gray-500">Bekleyen Rezervasyon</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">3</p>
            <p className="text-xs text-gray-500">Düşük Stok Uyarısı</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{staff.filter(s => s.is_active).length}</p>
            <p className="text-xs text-gray-500">Aktif Personel</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
            <Package className="w-5 h-5 text-pink-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">₺392</p>
            <p className="text-xs text-gray-500">Ortalama Adisyon</p>
          </div>
        </div>
      </div>

      {/* Staff Management */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-orange-500" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Personel Yönetimi</h2>
              <p className="text-sm text-gray-500">Yetkilendirme ve erişim kontrolü</p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingStaff(null);
              setShowStaffModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Personel Ekle
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-sm text-gray-500">
                <th className="px-6 py-3 font-medium">Personel</th>
                <th className="px-6 py-3 font-medium">Rol</th>
                <th className="px-6 py-3 font-medium">Yetkiler</th>
                <th className="px-6 py-3 font-medium">PIN Kodu</th>
                <th className="px-6 py-3 font-medium">Durum</th>
                <th className="px-6 py-3 font-medium">Son Aktif</th>
                <th className="px-6 py-3 font-medium text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.phone || member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${roleLabels[member.role]?.color}`}>
                      {roleLabels[member.role]?.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600">
                      {rolePermissions[member.role]?.join(', ')}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-gray-900">
                        {showPinFor === member.id ? member.pin_code : '••••'}
                      </span>
                      <button
                        onClick={() => setShowPinFor(showPinFor === member.id ? null : member.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        {showPinFor === member.id ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      member.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${member.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {member.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {member.last_active 
                      ? new Date(member.last_active).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                      : '-'
                    }
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingStaff(member);
                          setShowStaffModal(true);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => updateStaff(member.id, { is_active: !member.is_active })}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        {member.is_active ? (
                          <EyeOff className="w-4 h-4 text-gray-500" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                      {member.role !== 'owner' && (
                        <button
                          onClick={() => {
                            if (confirm('Bu personeli silmek istediğinize emin misiniz?')) {
                              deleteStaff(member.id);
                            }
                          }}
                          className="p-2 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Modal */}
      {showStaffModal && (
        <StaffModal
          staff={editingStaff}
          onSave={handleSaveStaff}
          onClose={() => {
            setShowStaffModal(false);
            setEditingStaff(null);
          }}
        />
      )}
    </div>
  );
}

function StaffModal({
  staff,
  onSave,
  onClose
}: {
  staff: StaffMember | null;
  onSave: (data: Partial<StaffMember>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(staff?.name || '');
  const [role, setRole] = useState(staff?.role || 'waiter');
  const [phone, setPhone] = useState(staff?.phone || '');
  const [email, setEmail] = useState(staff?.email || '');
  const [pinCode, setPinCode] = useState(staff?.pin_code || '');

  const generatePin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setPinCode(pin);
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
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Personel adı"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="manager">Müdür</option>
              <option value="cashier">Kasiyer</option>
              <option value="waiter">Garson</option>
              <option value="kitchen">Mutfak</option>
              <option value="reception">Resepsiyon</option>
            </select>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Bu rol ile erişim:</p>
            <p className="text-sm text-gray-700">{rolePermissions[role]?.join(', ')}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="0532 123 4567"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="email@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PIN Kodu (4 haneli)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.slice(0, 4))}
                maxLength={4}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-center text-lg tracking-widest"
                placeholder="••••"
              />
              <button
                type="button"
                onClick={generatePin}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium"
              >
                Oluştur
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
          >
            İptal
          </button>
          <button
            onClick={() => onSave({ name, role, phone, email, pin_code: pinCode })}
            disabled={!name || !pinCode || pinCode.length !== 4}
            className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
