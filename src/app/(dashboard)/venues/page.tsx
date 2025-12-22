'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVenueStore } from '@/stores';
import { Venue } from '@/types';
import {
  Building2,
  Plus,
  Search,
  MoreVertical,
  MapPin,
  Phone,
  Mail,
  Settings,
  Eye,
  Edit,
  Trash2,
  Power,
  ExternalLink,
  Utensils,
  Coffee,
  Wine,
  Umbrella,
  Moon,
  Hotel,
  CheckCircle,
  XCircle
} from 'lucide-react';

const venueTypeIcons: Record<string, any> = {
  restaurant: Utensils,
  cafe: Coffee,
  bar: Wine,
  beach_club: Umbrella,
  nightclub: Moon,
  hotel_restaurant: Hotel,
};

const venueTypeLabels: Record<string, string> = {
  restaurant: 'Restoran',
  cafe: 'Kafe',
  bar: 'Bar',
  beach_club: 'Beach Club',
  nightclub: 'Gece Kulübü',
  hotel_restaurant: 'Otel Restoranı',
};

export default function VenuesPage() {
  const { venues, setCurrentVenueById } = useVenueStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredVenues = venues.filter(venue =>
    venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    venue.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    venue.district.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mekanlarım</h1>
          <p className="text-gray-500 mt-1">
            Tüm mekanlarınızı yönetin • {venues.length} mekan
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all font-medium"
        >
          <Plus className="w-5 h-5" />
          Yeni Mekan Ekle
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Mekan ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Venue Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredVenues.map((venue) => (
          <VenueCard
            key={venue.id}
            venue={venue}
            onSelect={() => setCurrentVenueById(venue.id)}
            onEdit={() => setSelectedVenue(venue)}
          />
        ))}

        {/* Add New Card */}
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:border-orange-300 hover:bg-orange-50 transition-colors group min-h-[300px]"
        >
          <div className="w-16 h-16 rounded-2xl bg-gray-100 group-hover:bg-orange-100 flex items-center justify-center transition-colors">
            <Plus className="w-8 h-8 text-gray-400 group-hover:text-orange-500" />
          </div>
          <span className="font-medium text-gray-500 group-hover:text-orange-600">
            Yeni Mekan Ekle
          </span>
        </button>
      </div>

      {/* Add/Edit Modal would go here */}
      {showAddModal && (
        <AddVenueModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}

// Venue Card Component
interface VenueCardProps {
  venue: Venue;
  onSelect: () => void;
  onEdit: () => void;
}

function VenueCard({ venue, onSelect, onEdit }: VenueCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();
  const Icon = venueTypeIcons[venue.type] || Building2;

  const handleGoToVenue = () => {
    onSelect();
    router.push('/dashboard');
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all group">
      {/* Cover Image */}
      <div className="h-32 bg-gradient-to-br from-orange-400 to-red-500 relative">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {venue.is_active ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
              <CheckCircle className="w-3 h-3" />
              Aktif
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-500 text-white text-xs font-medium rounded-full">
              <XCircle className="w-3 h-3" />
              Pasif
            </span>
          )}
        </div>
        <div className="absolute -bottom-6 left-6">
          <div className="w-16 h-16 rounded-xl bg-white shadow-lg flex items-center justify-center border-4 border-white">
            <Icon className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-10 px-6 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{venue.name}</h3>
            <span className="text-sm text-gray-500">{venueTypeLabels[venue.type]}</span>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-10">
                <button
                  onClick={() => {
                    handleGoToVenue();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Eye className="w-4 h-4" />
                  Dashboard'a Git
                </button>
                <button
                  onClick={() => {
                    onEdit();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4" />
                  Düzenle
                </button>
                <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  <Settings className="w-4 h-4" />
                  Ayarlar
                </button>
                <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  <ExternalLink className="w-4 h-4" />
                  QR Menüyü Aç
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50">
                  <Power className="w-4 h-4" />
                  {venue.is_active ? 'Pasife Al' : 'Aktif Et'}
                </button>
                <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                  Sil
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="w-4 h-4" />
            <span>{venue.district}, {venue.city}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Phone className="w-4 h-4" />
            <span>{venue.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Mail className="w-4 h-4" />
            <span>{venue.email}</span>
          </div>
        </div>

        {/* Features */}
        <div className="mt-4 flex flex-wrap gap-2">
          {venue.settings?.reservation_enabled && (
            <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-lg">
              Rezervasyon
            </span>
          )}
          {venue.settings?.qr_menu_enabled && (
            <span className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-lg">
              QR Menü
            </span>
          )}
          {venue.settings?.online_ordering_enabled && (
            <span className="px-2 py-1 bg-green-50 text-green-600 text-xs rounded-lg">
              Online Sipariş
            </span>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleGoToVenue}
          className="w-full mt-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-medium transition-colors"
        >
          Mekana Git
        </button>
      </div>
    </div>
  );
}

// Add Venue Modal
function AddVenueModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    type: 'restaurant',
    address: '',
    city: '',
    district: '',
    phone: '',
    email: ''
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Yeni Mekan Ekle</h2>
          <p className="text-sm text-gray-500 mt-1">
            Adım {step}/3 - {step === 1 ? 'Temel Bilgiler' : step === 2 ? 'İletişim' : 'Özellikler'}
          </p>
        </div>

        <div className="p-6 space-y-4">
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mekan Adı
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Örn: ORDER Bodrum Marina"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mekan Tipi
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {Object.entries(venueTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={2}
                  placeholder="Sokak, bina no..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İl</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Muğla"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İlçe</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Bodrum"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="+90 252 ..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="mekan@order.com"
                  />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Mekanınız için aktif olacak özellikleri seçin:</p>
              {[
                { id: 'reservation', label: 'Rezervasyon Sistemi', desc: 'Online rezervasyon al' },
                { id: 'qr_menu', label: 'QR Menü', desc: 'Masadan QR ile sipariş' },
                { id: 'online_order', label: 'Online Sipariş', desc: 'Paket servis siparişleri' },
              ].map((feature) => (
                <label key={feature.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100">
                  <input type="checkbox" defaultChecked className="w-5 h-5 text-orange-500 rounded" />
                  <div>
                    <p className="font-medium text-gray-900">{feature.label}</p>
                    <p className="text-sm text-gray-500">{feature.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-between">
          <button
            onClick={step === 1 ? onClose : () => setStep(step - 1)}
            className="px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors"
          >
            {step === 1 ? 'İptal' : 'Geri'}
          </button>
          <button
            onClick={() => step === 3 ? onClose() : setStep(step + 1)}
            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors"
          >
            {step === 3 ? 'Mekan Oluştur' : 'Devam'}
          </button>
        </div>
      </div>
    </div>
  );
}
