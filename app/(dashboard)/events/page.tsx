'use client';

import { useState, useEffect } from 'react';
import { useVenueStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import {
  Calendar, Plus, Music, Percent, Utensils, PartyPopper, Mic2, Clock,
  Edit2, Trash2, Eye, EyeOff, Star, X, Save, Image as ImageIcon,
  RefreshCw, AlertCircle, ChevronRight
} from 'lucide-react';

interface Event {
  id: string;
  venue_id: string;
  title: string;
  description?: string;
  type: string;
  image_url?: string;
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  is_recurring: boolean;
  recurring_days?: string[];
  discount_percent?: number;
  discount_description?: string;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
}

const eventTypes = [
  { id: 'dj', name: 'DJ Performans', icon: Music, color: 'bg-purple-500' },
  { id: 'live_music', name: 'Canlı Müzik', icon: Mic2, color: 'bg-pink-500' },
  { id: 'happy_hour', name: 'Happy Hour', icon: Clock, color: 'bg-amber-500' },
  { id: 'discount', name: 'İndirim', icon: Percent, color: 'bg-green-500' },
  { id: 'special_menu', name: 'Özel Menü', icon: Utensils, color: 'bg-orange-500' },
  { id: 'party', name: 'Parti/Etkinlik', icon: PartyPopper, color: 'bg-blue-500' },
  { id: 'other', name: 'Diğer', icon: Calendar, color: 'bg-gray-500' },
];

const weekDays = [
  { id: 'monday', name: 'Pzt' },
  { id: 'tuesday', name: 'Sal' },
  { id: 'wednesday', name: 'Çar' },
  { id: 'thursday', name: 'Per' },
  { id: 'friday', name: 'Cum' },
  { id: 'saturday', name: 'Cmt' },
  { id: 'sunday', name: 'Paz' },
];

export default function EventsPage() {
  const { currentVenue, venues } = useVenueStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'past'>('all');

  const isAllVenues = currentVenue === null;

  useEffect(() => {
    fetchEvents();
  }, [currentVenue?.id]);

  const fetchEvents = async () => {
    setIsLoading(true);
    let query = supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: true });

    if (!isAllVenues && currentVenue?.id) {
      query = query.eq('venue_id', currentVenue.id);
    }

    const { data, error } = await query;
    if (!error) setEvents(data || []);
    setIsLoading(false);
  };

  const toggleEventStatus = async (event: Event) => {
    const { error } = await supabase
      .from('events')
      .update({ is_active: !event.is_active })
      .eq('id', event.id);
    
    if (!error) fetchEvents();
  };

  const toggleFeatured = async (event: Event) => {
    const { error } = await supabase
      .from('events')
      .update({ is_featured: !event.is_featured })
      .eq('id', event.id);
    
    if (!error) fetchEvents();
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Bu etkinliği silmek istediğinize emin misiniz?')) return;
    
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (!error) fetchEvents();
  };

  const getEventType = (typeId: string) => {
    return eventTypes.find(t => t.id === typeId) || eventTypes[eventTypes.length - 1];
  };

  const getVenueName = (venueId: string) => {
    return venues.find(v => v.id === venueId)?.name || 'Bilinmeyen';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const formatTime = (time?: string) => {
    if (!time) return '';
    return time.slice(0, 5);
  };

  const isUpcoming = (event: Event) => {
    const today = new Date().toISOString().split('T')[0];
    return event.start_date >= today;
  };

  const filteredEvents = events.filter(event => {
    if (filter === 'active') return event.is_active;
    if (filter === 'upcoming') return isUpcoming(event) && event.is_active;
    if (filter === 'past') return !isUpcoming(event);
    return true;
  });

  const activeCount = events.filter(e => e.is_active).length;
  const upcomingCount = events.filter(e => isUpcoming(e) && e.is_active).length;
  const featuredCount = events.filter(e => e.is_featured).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Etkinlikler</h1>
          <p className="text-gray-500 mt-1">
            {isAllVenues ? `Tüm Mekanlar (${venues.length})` : currentVenue?.name} • DJ, Happy Hour, İndirimler
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchEvents} className="p-2 border rounded-lg hover:bg-gray-50">
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {!isAllVenues && (
            <button
              onClick={() => { setEditingEvent(null); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              <Plus className="w-5 h-5" />
              Yeni Etkinlik
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{events.length}</p>
              <p className="text-sm text-gray-500">Toplam</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
              <p className="text-sm text-gray-500">Aktif</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{upcomingCount}</p>
              <p className="text-sm text-gray-500">Yaklaşan</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{featuredCount}</p>
              <p className="text-sm text-gray-500">Öne Çıkan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'all', name: 'Tümü' },
          { id: 'active', name: 'Aktif' },
          { id: 'upcoming', name: 'Yaklaşan' },
          { id: 'past', name: 'Geçmiş' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
              filter === f.id ? 'bg-orange-500 text-white' : 'bg-white border hover:bg-gray-50'
            }`}
          >
            {f.name}
          </button>
        ))}
      </div>

      {/* All Venues Warning */}
      {isAllVenues && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <p className="text-amber-800">Etkinlik eklemek için tek bir mekan seçin.</p>
        </div>
      )}

      {/* Events Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Etkinlik Bulunamadı</h3>
          <p className="text-gray-500">Henüz etkinlik eklenmemiş.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map(event => {
            const eventType = getEventType(event.type);
            const Icon = eventType.icon;
            const upcoming = isUpcoming(event);

            return (
              <div
                key={event.id}
                className={`bg-white rounded-xl border overflow-hidden ${
                  !event.is_active ? 'opacity-60' : ''
                }`}
              >
                <div className={`h-24 ${eventType.color} flex items-center justify-center`}>
                  <Icon className="w-12 h-12 text-white/80" />
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${eventType.color}`}>
                      {eventType.name}
                    </span>
                    {event.is_featured && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                        ⭐ Öne Çıkan
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-gray-900 mb-1">{event.title}</h3>
                  
                  {isAllVenues && (
                    <p className="text-xs text-purple-600 mb-2">📍 {getVenueName(event.venue_id)}</p>
                  )}

                  {event.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(event.start_date)}
                    </span>
                    {event.start_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(event.start_time)}
                      </span>
                    )}
                  </div>

                  {event.is_recurring && event.recurring_days && (
                    <div className="flex gap-1 mb-3">
                      {weekDays.map(day => (
                        <span
                          key={day.id}
                          className={`w-8 h-6 rounded text-xs flex items-center justify-center ${
                            event.recurring_days?.includes(day.id)
                              ? 'bg-orange-100 text-orange-700 font-medium'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {day.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {event.discount_percent && (
                    <div className="bg-green-50 rounded-lg p-2 mb-3">
                      <p className="text-green-700 font-bold">%{event.discount_percent} İndirim</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-3 border-t">
                    <button
                      onClick={() => toggleEventStatus(event)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 ${
                        event.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {event.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      {event.is_active ? 'Aktif' : 'Pasif'}
                    </button>
                    <button
                      onClick={() => toggleFeatured(event)}
                      className={`p-2 rounded-lg ${
                        event.is_featured ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      <Star className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setEditingEvent(event); setShowModal(true); }}
                      className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Event Modal */}
      {showModal && (
        <EventModal
          event={editingEvent}
          venueId={currentVenue?.id || ''}
          onClose={() => { setShowModal(false); setEditingEvent(null); }}
          onSave={() => { setShowModal(false); setEditingEvent(null); fetchEvents(); }}
        />
      )}
    </div>
  );
}

function EventModal({ event, venueId, onClose, onSave }: { event: Event | null; venueId: string; onClose: () => void; onSave: () => void; }) {
  const [form, setForm] = useState({
    title: event?.title || '',
    description: event?.description || '',
    type: event?.type || 'other',
    start_date: event?.start_date || new Date().toISOString().split('T')[0],
    end_date: event?.end_date || '',
    start_time: event?.start_time || '',
    end_time: event?.end_time || '',
    is_recurring: event?.is_recurring || false,
    recurring_days: event?.recurring_days || [] as string[],
    discount_percent: event?.discount_percent?.toString() || '',
    discount_description: event?.discount_description || '',
    is_featured: event?.is_featured || false,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.title || !form.start_date) {
      alert('Başlık ve tarih zorunludur.');
      return;
    }

    setIsSaving(true);

    const data = {
      venue_id: venueId,
      title: form.title,
      description: form.description || null,
      type: form.type,
      start_date: form.start_date,
      end_date: form.end_date || null,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      is_recurring: form.is_recurring,
      recurring_days: form.is_recurring ? form.recurring_days : null,
      discount_percent: form.discount_percent ? parseInt(form.discount_percent) : null,
      discount_description: form.discount_description || null,
      is_featured: form.is_featured,
    };

    let error;
    if (event) {
      const result = await supabase.from('events').update(data).eq('id', event.id);
      error = result.error;
    } else {
      const result = await supabase.from('events').insert(data);
      error = result.error;
    }

    if (error) {
      alert('Hata: ' + error.message);
    } else {
      onSave();
    }
    setIsSaving(false);
  };

  const toggleDay = (dayId: string) => {
    setForm(prev => ({
      ...prev,
      recurring_days: prev.recurring_days.includes(dayId)
        ? prev.recurring_days.filter(d => d !== dayId)
        : [...prev.recurring_days, dayId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-bold">{event ? 'Etkinliği Düzenle' : 'Yeni Etkinlik'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Etkinlik Türü</label>
            <div className="grid grid-cols-4 gap-2">
              {eventTypes.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, type: type.id }))}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                      form.type === type.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${form.type === type.id ? 'text-orange-600' : 'text-gray-500'}`} />
                    <span className="text-xs font-medium">{type.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Başlık *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Örn: DJ Night"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç *</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm(prev => ({ ...prev, start_date: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm(prev => ({ ...prev, end_date: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Saat</label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm(prev => ({ ...prev, start_time: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Saati</label>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm(prev => ({ ...prev, end_time: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Recurring */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_recurring}
                onChange={(e) => setForm(prev => ({ ...prev, is_recurring: e.target.checked }))}
                className="w-4 h-4 text-orange-500 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Tekrarlayan Etkinlik</span>
            </label>
            
            {form.is_recurring && (
              <div className="mt-3 flex gap-2">
                {weekDays.map(day => (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleDay(day.id)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium ${
                      form.recurring_days.includes(day.id)
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {day.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Discount */}
          {(form.type === 'discount' || form.type === 'happy_hour') && (
            <div className="bg-green-50 rounded-xl p-4 space-y-3">
              <h4 className="font-medium text-green-800">İndirim</h4>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.discount_percent}
                  onChange={(e) => setForm(prev => ({ ...prev, discount_percent: e.target.value }))}
                  placeholder="% İndirim"
                  className="px-3 py-2 border border-green-200 rounded-lg"
                />
                <input
                  type="text"
                  value={form.discount_description}
                  onChange={(e) => setForm(prev => ({ ...prev, discount_description: e.target.value }))}
                  placeholder="Açıklama"
                  className="px-3 py-2 border border-green-200 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Featured */}
          <label className="flex items-center gap-2 cursor-pointer p-3 bg-amber-50 rounded-xl">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm(prev => ({ ...prev, is_featured: e.target.checked }))}
              className="w-4 h-4 text-amber-500 rounded"
            />
            <Star className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-800">Öne Çıkan Etkinlik</span>
          </label>
        </div>

        <div className="p-6 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border rounded-xl font-medium hover:bg-gray-50">
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:bg-gray-300 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}
