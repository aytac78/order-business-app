'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import { Users, Phone, Mail, RefreshCw, Plus, Building2, X, Trash2, Edit } from 'lucide-react';

const roleConfig: Record<string, { label: string; color: string }> = {
  owner: { label: 'Patron', color: 'bg-yellow-100 text-yellow-800' },
  manager: { label: 'Müdür', color: 'bg-purple-100 text-purple-800' },
  waiter: { label: 'Garson', color: 'bg-blue-100 text-blue-800' },
  chef: { label: 'Şef', color: 'bg-orange-100 text-orange-800' },
  kitchen: { label: 'Mutfak', color: 'bg-orange-100 text-orange-800' },
  cashier: { label: 'Kasiyer', color: 'bg-green-100 text-green-800' },
  host: { label: 'Resepsiyon', color: 'bg-pink-100 text-pink-800' },
  reception: { label: 'Resepsiyon', color: 'bg-pink-100 text-pink-800' },
};

const roleOptions = [
  { value: 'manager', label: 'Müdür' },
  { value: 'cashier', label: 'Kasiyer' },
  { value: 'waiter', label: 'Garson' },
  { value: 'kitchen', label: 'Mutfak' },
  { value: 'reception', label: 'Resepsiyon' },
];

export default function StaffPage() {
  const { currentVenue, venues } = useVenueStore();
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const isAllVenues = currentVenue === null;

  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    
    let query = supabase.from('staff').select('*').order('name');
    
    if (!isAllVenues && currentVenue?.id) {
      query = query.eq('venue_id', currentVenue.id);
    }
    
    const { data, error } = await query;
    if (!error) setStaff(data || []);
    setIsLoading(false);
  }, [currentVenue?.id, isAllVenues]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleAddStaff = async (staffData: any) => {
    try {
      const { error } = await supabase.from('staff').insert(staffData);
      if (error) throw error;
      await fetchStaff();
      setShowAddModal(false);
    } catch (err) {
      console.error('Personel eklenirken hata:', err);
      alert('Personel eklenirken hata oluştu');
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm('Bu personeli silmek istediğinize emin misiniz?')) return;
    
    try {
      const { error } = await supabase.from('staff').delete().eq('id', id);
      if (error) throw error;
      await fetchStaff();
    } catch (err) {
      console.error('Personel silinirken hata:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personel</h1>
          <p className="text-gray-500 mt-1">
            {isAllVenues ? `Tüm Mekanlar (${venues.length})` : currentVenue?.name} • {staff.length} personel
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchStaff} className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Yenile
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            <Plus className="w-4 h-4" /> Personel Ekle
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((member) => {
            const venueName = venues.find(v => v.id === member.venue_id)?.name;
            return (
              <div key={member.id} className="bg-white rounded-xl border p-4 relative group">
                {/* Delete button */}
                <button
                  onClick={() => handleDeleteStaff(member.id)}
                  className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xl font-bold">
                    {member.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{member.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${roleConfig[member.role]?.color || 'bg-gray-100'}`}>
                      {roleConfig[member.role]?.label || member.role}
                    </span>
                  </div>
                </div>

                {/* PIN göster */}
                {member.pin_code && (
                  <div className="mt-3 text-xs text-gray-500">
                    PIN: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{member.pin_code}</span>
                  </div>
                )}

                {isAllVenues && venueName && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-purple-600">
                    <Building2 className="w-3 h-3" />
                    {venueName}
                  </div>
                )}

                <div className="mt-3 space-y-1 text-sm text-gray-600">
                  {member.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {member.phone}</div>}
                  {member.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> {member.email}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && staff.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Personel bulunamadı</p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            İlk Personeli Ekle
          </button>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <AddStaffModal
          venueId={currentVenue?.id}
          venues={venues}
          isAllVenues={isAllVenues}
          onAdd={handleAddStaff}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

// Add Staff Modal
function AddStaffModal({
  venueId,
  venues,
  isAllVenues,
  onAdd,
  onClose
}: {
  venueId?: string;
  venues: any[];
  isAllVenues: boolean;
  onAdd: (data: any) => Promise<void>;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    role: 'waiter',
    phone: '',
    email: '',
    pin_code: '',
    venue_id: venueId || venues[0]?.id || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rastgele 4 haneli PIN oluştur
  const generatePIN = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setFormData({ ...formData, pin_code: pin });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.venue_id) return;

    setIsSubmitting(true);
    await onAdd({
      name: formData.name,
      role: formData.role,
      phone: formData.phone || null,
      email: formData.email || null,
      venue_id: formData.venue_id,
      is_active: true,
    });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Yeni Personel Ekle</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* İsim */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ad Soyad *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Örn: Ahmet Yılmaz"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
              required
            />
          </div>

          {/* Mekan Seçimi (Tüm Mekanlar modunda) */}
          {isAllVenues && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mekan *
              </label>
              <select
                value={formData.venue_id}
                onChange={(e) => setFormData({ ...formData, venue_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                required
              >
                <option value="">Mekan Seçin</option>
                {venues.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rol
            </label>
            <div className="grid grid-cols-3 gap-2">
              {roleOptions.map(role => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, role: role.value })}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    formData.role === role.value
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          {/* PIN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PIN Kodu (Giriş için)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.pin_code}
                onChange={(e) => setFormData({ ...formData, pin_code: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                placeholder="4 haneli PIN"
                maxLength={4}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 font-mono text-center text-lg tracking-widest"
              />
              <button
                type="button"
                onClick={generatePIN}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
              >
                Rastgele
              </button>
            </div>
          </div>

          {/* Telefon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefon
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="0532 123 45 67"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-posta
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="ornek@email.com"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 rounded-lg font-medium hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name.trim() || !formData.venue_id}
              className="flex-1 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50"
            >
              {isSubmitting ? 'Ekleniyor...' : 'Personel Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
