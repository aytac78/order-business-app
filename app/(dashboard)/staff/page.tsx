'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
  Key,
  Mail,
  Phone,
  User,
  AlertCircle,
  RefreshCw,
  X,
  Check,
  ChefHat,
  CreditCard,
  Calendar,
  Package,
  BarChart3,
  Settings,
  UtensilsCrossed,
  Grid3X3,
  ClipboardList,
  UserCircle,
  Ticket,
  QrCode,
  PartyPopper
} from 'lucide-react';

interface Staff {
  id: string;
  venue_id: string;
  user_id?: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  permissions: string[];
  pin_code?: string;
  hourly_rate?: number;
  is_active: boolean;
  created_at: string;
}

const roleConfig: Record<string, { label: string; color: string; icon: any }> = {
  owner: { label: 'İşletme Sahibi', color: 'bg-purple-100 text-purple-800', icon: Shield },
  manager: { label: 'Yönetici', color: 'bg-blue-100 text-blue-800', icon: UserCircle },
  cashier: { label: 'Kasiyer', color: 'bg-green-100 text-green-800', icon: CreditCard },
  waiter: { label: 'Garson', color: 'bg-orange-100 text-orange-800', icon: UtensilsCrossed },
  kitchen: { label: 'Mutfak', color: 'bg-red-100 text-red-800', icon: ChefHat },
  reception: { label: 'Resepsiyon', color: 'bg-pink-100 text-pink-800', icon: Calendar },
  pr: { label: 'Halkla İlişkiler', color: 'bg-indigo-100 text-indigo-800', icon: PartyPopper },
};

// Panel izinleri - hangi panel hangi izni gerektiriyor
const panelPermissions = [
  { id: 'view_dashboard', label: 'Dashboard', icon: Grid3X3, description: 'Ana panel erişimi' },
  { id: 'manage_tables', label: 'Masalar', icon: Grid3X3, description: 'Masa yönetimi' },
  { id: 'manage_orders', label: 'Siparişler', icon: ClipboardList, description: 'Sipariş yönetimi' },
  { id: 'access_waiter', label: 'Garson Paneli', icon: UtensilsCrossed, description: 'Garson tablet erişimi' },
  { id: 'access_kitchen', label: 'Mutfak Paneli', icon: ChefHat, description: 'Mutfak ekranı erişimi' },
  { id: 'access_reception', label: 'Resepsiyon', icon: Calendar, description: 'Resepsiyon erişimi' },
  { id: 'manage_pos', label: 'Kasa/POS', icon: CreditCard, description: 'Ödeme alma yetkisi' },
  { id: 'manage_menu', label: 'Menü Yönetimi', icon: UtensilsCrossed, description: 'Ürün ve kategori düzenleme' },
  { id: 'manage_reservations', label: 'Rezervasyonlar', icon: Calendar, description: 'Rezervasyon yönetimi' },
  { id: 'manage_stock', label: 'Stok Yönetimi', icon: Package, description: 'Envanter takibi' },
  { id: 'manage_staff', label: 'Personel Yönetimi', icon: Users, description: 'Personel ekleme/düzenleme' },
  { id: 'view_reports', label: 'Raporlar', icon: BarChart3, description: 'Analitik ve raporlar' },
  { id: 'manage_coupons', label: 'Kuponlar', icon: Ticket, description: 'İndirim kuponları' },
  { id: 'manage_events', label: 'Etkinlikler', icon: PartyPopper, description: 'Etkinlik yönetimi' },
  { id: 'manage_settings', label: 'Ayarlar', icon: Settings, description: 'Sistem ayarları' },
];

// Rol bazlı varsayılan izinler
const defaultPermissionsByRole: Record<string, string[]> = {
  owner: panelPermissions.map(p => p.id), // Tüm izinler
  manager: ['view_dashboard', 'manage_tables', 'manage_orders', 'access_waiter', 'access_kitchen', 
            'access_reception', 'manage_pos', 'manage_menu', 'manage_reservations', 'manage_stock', 
            'manage_staff', 'view_reports', 'manage_coupons', 'manage_events'],
  cashier: ['view_dashboard', 'manage_orders', 'manage_pos'],
  waiter: ['view_dashboard', 'access_waiter', 'manage_orders', 'manage_tables'],
  kitchen: ['access_kitchen'],
  reception: ['view_dashboard', 'access_reception', 'manage_reservations', 'manage_tables'],
  pr: ['view_dashboard', 'manage_events', 'manage_reservations'],
};

export default function StaffPage() {
  const { currentVenue } = useVenueStore();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  // Personelleri yükle
  const loadStaff = useCallback(async () => {
    if (!currentVenue?.id) return;
    setIsLoading(true);

    try {
      let query = supabase
        .from('staff')
        .select('*')
        .eq('venue_id', currentVenue.id)
        .order('created_at', { ascending: false });

      if (filterRole !== 'all') {
        query = query.eq('role', filterRole);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Staff fetch error:', error);
        return;
      }

      setStaff(data || []);
    } catch (err) {
      console.error('Staff exception:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentVenue?.id, filterRole]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  // Personel sil
  const deleteStaff = async (staffId: string) => {
    if (!confirm('Bu personeli silmek istediğinize emin misiniz?')) return;

    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', staffId);

    if (!error) loadStaff();
  };

  // Personel durumunu değiştir
  const toggleStaffStatus = async (staffId: string, isActive: boolean) => {
    const { error } = await supabase
      .from('staff')
      .update({ is_active: !isActive })
      .eq('id', staffId);

    if (!error) loadStaff();
  };

  // Filtrelenmiş personel
  const filteredStaff = staff.filter(s => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return s.name.toLowerCase().includes(query) ||
             s.email?.toLowerCase().includes(query) ||
             s.phone?.includes(query);
    }
    return true;
  });

  // İstatistikler
  const stats = {
    total: staff.length,
    active: staff.filter(s => s.is_active).length,
    byRole: Object.entries(roleConfig).map(([role, config]) => ({
      role,
      label: config.label,
      count: staff.filter(s => s.role === role).length
    }))
  };

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-gray-500">Lütfen bir mekan seçin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personel Yönetimi</h1>
          <p className="text-gray-500">{currentVenue.name} • {stats.total} personel</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadStaff}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            <Plus className="w-4 h-4" />
            Personel Ekle
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {stats.byRole.map(({ role, label, count }) => {
          const config = roleConfig[role];
          const Icon = config.icon;
          return (
            <div key={role} className={`rounded-xl p-3 ${config.color.replace('text-', 'bg-').replace('-800', '-50')} border-2 ${config.color.replace('text-', 'border-').replace('-800', '-200')}`}>
              <Icon className={`w-5 h-5 mb-1 ${config.color.split(' ')[1]}`} />
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs">{label}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="İsim, e-posta veya telefon ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">Tüm Roller</option>
          {Object.entries(roleConfig).map(([role, config]) => (
            <option key={role} value={role}>{config.label}</option>
          ))}
        </select>
      </div>

      {/* Staff List */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Personel</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">İletişim</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rol</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">İzinler</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Durum</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredStaff.map(person => {
              const config = roleConfig[person.role] || roleConfig.waiter;
              const Icon = config.icon;

              return (
                <tr key={person.id} className={`hover:bg-gray-50 ${!person.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${config.color.split(' ')[0]} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${config.color.split(' ')[1]}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{person.name}</p>
                        {person.pin_code && (
                          <p className="text-xs text-gray-500">PIN: ****</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {person.email && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {person.email}
                      </p>
                    )}
                    {person.phone && (
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {person.phone}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                      {config.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-sm text-gray-600">
                      {person.permissions?.length || 0} izin
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => toggleStaffStatus(person.id, person.is_active)}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        person.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {person.is_active ? 'Aktif' : 'Pasif'}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingStaff(person)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="Düzenle"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => deleteStaff(person.id)}
                        className="p-2 hover:bg-red-100 rounded-lg"
                        title="Sil"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredStaff.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Henüz personel eklenmemiş</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingStaff) && (
        <StaffModal
          staff={editingStaff}
          venueId={currentVenue.id}
          onClose={() => { setShowAddModal(false); setEditingStaff(null); }}
          onSave={() => { loadStaff(); setShowAddModal(false); setEditingStaff(null); }}
        />
      )}
    </div>
  );
}

// Staff Add/Edit Modal with Permissions
function StaffModal({
  staff,
  venueId,
  onClose,
  onSave
}: {
  staff: Staff | null;
  venueId: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    name: staff?.name || '',
    email: staff?.email || '',
    phone: staff?.phone || '',
    role: staff?.role || 'waiter',
    permissions: staff?.permissions || defaultPermissionsByRole['waiter'],
    pin_code: staff?.pin_code || '',
    hourly_rate: staff?.hourly_rate || 0,
    is_active: staff?.is_active ?? true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rol değiştiğinde varsayılan izinleri yükle
  const handleRoleChange = (newRole: string) => {
    setFormData({
      ...formData,
      role: newRole,
      permissions: defaultPermissionsByRole[newRole] || []
    });
  };

  // İzin toggle
  const togglePermission = (permissionId: string) => {
    const newPermissions = formData.permissions.includes(permissionId)
      ? formData.permissions.filter(p => p !== permissionId)
      : [...formData.permissions, permissionId];
    setFormData({ ...formData, permissions: newPermissions });
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      alert('Personel adı zorunludur');
      return;
    }

    setIsSubmitting(true);

    const staffData = {
      venue_id: venueId,
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone || null,
      role: formData.role,
      permissions: formData.permissions,
      pin_code: formData.pin_code || null,
      hourly_rate: formData.hourly_rate || null,
      is_active: formData.is_active
    };

    let error;
    if (staff) {
      const result = await supabase.from('staff').update(staffData).eq('id', staff.id);
      error = result.error;
    } else {
      const result = await supabase.from('staff').insert(staffData);
      error = result.error;
    }

    setIsSubmitting(false);

    if (error) {
      console.error('Staff save error:', error);
      alert('Personel kaydedilirken hata oluştu');
      return;
    }

    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">{staff ? 'Personel Düzenle' : 'Yeni Personel'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Temel Bilgiler */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad *</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                  placeholder="İsim Soyisim"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                  placeholder="ornek@email.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
              <div className="relative">
                <Phone className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                  placeholder="05XX XXX XX XX"
                />
              </div>
            </div>
          </div>

          {/* Rol ve PIN */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
              <select
                value={formData.role}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              >
                {Object.entries(roleConfig).map(([role, config]) => (
                  <option key={role} value={role}>{config.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PIN Kodu</label>
              <div className="relative">
                <Key className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={formData.pin_code}
                  onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                  placeholder="4 haneli PIN"
                  maxLength={4}
                />
              </div>
            </div>
          </div>

          {/* Panel İzinleri */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-800">Panel Erişim İzinleri</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Bu personelin hangi panellere erişebileceğini seçin. Rol değiştiğinde varsayılan izinler otomatik yüklenir.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {panelPermissions.map(permission => {
                const Icon = permission.icon;
                const isChecked = formData.permissions.includes(permission.id);
                
                return (
                  <label
                    key={permission.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      isChecked 
                        ? 'border-orange-500 bg-orange-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => togglePermission(permission.id)}
                      className="sr-only"
                    />
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isChecked ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isChecked ? 'text-orange-800' : 'text-gray-700'}`}>
                        {permission.label}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{permission.description}</p>
                    </div>
                    {isChecked && (
                      <Check className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Aktif/Pasif */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-5 h-5 rounded"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Personel aktif (sisteme giriş yapabilir)
            </label>
          </div>
        </div>

        <div className="p-5 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border rounded-xl font-medium hover:bg-gray-50"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50"
          >
            {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}
