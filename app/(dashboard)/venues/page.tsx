'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import {
  Plus, X, Edit2, Trash2, AlertCircle, Loader2, RefreshCw,
  Building2, MapPin, Phone, Mail, Clock, CheckCircle, XCircle,
  Settings, ExternalLink, Users, ShoppingCart
} from 'lucide-react';

interface Venue {
  id: string;
  name: string;
  slug: string;
  type: string;
  address: string;
  city: string;
  district: string;
  phone: string;
  email: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  // Stats (will be loaded separately)
  today_orders?: number;
  today_revenue?: number;
  active_staff?: number;
}

export default function VenuesPage() {
  const { venues, setVenues, currentVenue, setCurrentVenue } = useVenueStore();
  const t = useTranslations('venues');
  const tCommon = useTranslations('common');

  const [loading, setLoading] = useState(true);
  const [venueList, setVenueList] = useState<Venue[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);

  const venueTypeLabels: Record<string, string> = {
    restaurant: 'Restoran',
    cafe: 'Kafe',
    bar: 'Bar',
    beach_club: 'Beach Club',
    nightclub: 'Gece Kulübü',
    hotel_restaurant: 'Otel Restoranı'
  };

  const loadVenues = useCallback(async () => {
    const { data } = await supabase
      .from('venues')
      .select('*')
      .order('name');

    if (data) {
      // Load stats for each venue
      const venuesWithStats = await Promise.all(data.map(async (venue) => {
        const today = new Date().toISOString().split('T')[0];
        
        const { data: orders } = await supabase
          .from('orders')
          .select('total, status')
          .eq('venue_id', venue.id)
          .gte('created_at', today + 'T00:00:00');

        const { count: staffCount } = await supabase
          .from('staff')
          .select('id', { count: 'exact', head: true })
          .eq('venue_id', venue.id)
          .eq('is_active', true);

        const todayOrders = orders?.length || 0;
        const todayRevenue = orders?.filter(o => o.status === 'completed')
          .reduce((sum, o) => sum + (o.total || 0), 0) || 0;

        return {
          ...venue,
          today_orders: todayOrders,
          today_revenue: todayRevenue,
          active_staff: staffCount || 0
        };
      }));

      setVenueList(venuesWithStats);
      setVenues(venuesWithStats);
    }
    setLoading(false);
  }, [setVenues]);

  useEffect(() => {
    loadVenues();
  }, [loadVenues]);

  const handleSelectVenue = (venue: Venue) => {
    setCurrentVenue(venue as any);
  };

  const handleToggleActive = async (venue: Venue) => {
    await supabase.from('venues').update({ is_active: !venue.is_active }).eq('id', venue.id);
    loadVenues();
  };

  const handleSaveVenue = async (data: Partial<Venue>) => {
    if (editingVenue) {
      await supabase.from('venues').update(data).eq('id', editingVenue.id);
    } else {
      await supabase.from('venues').insert({
        ...data,
        is_active: true
      });
    }

    setShowModal(false);
    setEditingVenue(null);
    loadVenues();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(tCommon('confirmDelete'))) return;
    await supabase.from('venues').delete().eq('id', id);
    loadVenues();
  };

  // Stats
  const totalVenues = venueList.length;
  const activeVenues = venueList.filter(v => v.is_active).length;
  const totalRevenue = venueList.reduce((sum, v) => sum + (v.today_revenue || 0), 0);
  const totalOrders = venueList.reduce((sum, v) => sum + (v.today_orders || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mekanlarım</h1>
          <p className="text-gray-400">{totalVenues} mekan</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadVenues}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {tCommon('refresh')}
          </button>
          <button
            onClick={() => { setEditingVenue(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('addVenue')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <Building2 className="w-10 h-10 text-blue-400 bg-blue-400/20 rounded-xl p-2" />
            <div>
              <p className="text-2xl font-bold text-white">{totalVenues}</p>
              <p className="text-sm text-gray-400">Toplam Mekan</p>
            </div>
          </div>
        </div>
        <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-10 h-10 text-green-400 bg-green-400/20 rounded-xl p-2" />
            <div>
              <p className="text-2xl font-bold text-white">{activeVenues}</p>
              <p className="text-sm text-green-400">{tCommon('active')}</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-500/20 border border-purple-500/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-10 h-10 text-purple-400 bg-purple-400/20 rounded-xl p-2" />
            <div>
              <p className="text-2xl font-bold text-white">{totalOrders}</p>
              <p className="text-sm text-purple-400">Bugün Sipariş</p>
            </div>
          </div>
        </div>
        <div className="bg-orange-500/20 border border-orange-500/50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-10 h-10 text-orange-400 bg-orange-400/20 rounded-xl p-2" />
            <div>
              <p className="text-2xl font-bold text-white">₺{totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-orange-400">Bugün Gelir</p>
            </div>
          </div>
        </div>
      </div>

      {/* Venues Grid */}
      {venueList.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/50 rounded-xl">
          <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Henüz mekan eklenmemiş</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {venueList.map(venue => (
            <div
              key={venue.id}
              className={`bg-gray-800 rounded-xl overflow-hidden border transition-all ${
                currentVenue?.id === venue.id
                  ? 'border-orange-500 ring-2 ring-orange-500/20'
                  : venue.is_active
                    ? 'border-gray-700 hover:border-gray-600'
                    : 'border-gray-700 opacity-60'
              }`}
            >
              {/* Header */}
              <div className="relative h-32 bg-gradient-to-br from-orange-500 to-red-500">
                {venue.logo_url && (
                  <img src={venue.logo_url} alt={venue.name} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <h3 className="text-xl font-bold text-white">{venue.name}</h3>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded text-white">
                    {venueTypeLabels[venue.type] || venue.type}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    venue.is_active ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'
                  }`}>
                    {venue.is_active ? tCommon('active') : tCommon('inactive')}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="space-y-2 text-sm text-gray-400 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{venue.district}, {venue.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{venue.phone}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between py-3 border-t border-gray-700">
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{venue.today_orders || 0}</p>
                    <p className="text-xs text-gray-500">Sipariş</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-400">₺{(venue.today_revenue || 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Gelir</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{venue.active_staff || 0}</p>
                    <p className="text-xs text-gray-500">Personel</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-700">
                  <button
                    onClick={() => handleSelectVenue(venue)}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      currentVenue?.id === venue.id
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                  >
                    {currentVenue?.id === venue.id ? 'Seçili' : 'Seç'}
                  </button>
                  <button
                    onClick={() => { setEditingVenue(venue); setShowModal(true); }}
                    className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(venue)}
                    className={`p-2 rounded-lg ${
                      venue.is_active
                        ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                        : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                    }`}
                  >
                    {venue.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Venue Modal */}
      {showModal && (
        <VenueModal
          venue={editingVenue}
          t={t}
          tCommon={tCommon}
          venueTypeLabels={venueTypeLabels}
          onClose={() => { setShowModal(false); setEditingVenue(null); }}
          onSave={handleSaveVenue}
        />
      )}
    </div>
  );
}

// Venue Modal
function VenueModal({
  venue, t, tCommon, venueTypeLabels, onClose, onSave
}: {
  venue: Venue | null;
  t: any;
  tCommon: any;
  venueTypeLabels: Record<string, string>;
  onClose: () => void;
  onSave: (data: Partial<Venue>) => void;
}) {
  const [name, setName] = useState(venue?.name || '');
  const [type, setType] = useState(venue?.type || 'restaurant');
  const [address, setAddress] = useState(venue?.address || '');
  const [city, setCity] = useState(venue?.city || '');
  const [district, setDistrict] = useState(venue?.district || '');
  const [phone, setPhone] = useState(venue?.phone || '');
  const [email, setEmail] = useState(venue?.email || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      type,
      address,
      city,
      district,
      phone,
      email
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800">
          <h2 className="text-xl font-bold text-white">
            {venue ? t('editVenue') : t('addVenue')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Mekan Adı</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Mekan Tipi</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
            >
              {Object.entries(venueTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Şehir</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">İlçe</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Adres</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Telefon</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-600"
            >
              {tCommon('cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600"
            >
              {tCommon('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
