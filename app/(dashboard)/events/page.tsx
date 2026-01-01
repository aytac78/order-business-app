'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useVenueStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Share2,
  Image as ImageIcon,
  Music,
  Mic,
  PartyPopper,
  Utensils,
  Wine,
  Star,
  AlertCircle,
  RefreshCw,
  X,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Event {
  id: string;
  venue_id: string;
  title: string;
  description?: string;
  type: string;
  date: string;
  start_time: string;
  end_time?: string;
  capacity?: number;
  current_attendees: number;
  ticket_price?: number;
  is_free: boolean;
  image_url?: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  featured: boolean;
  tags?: string[];
  created_at: string;
}

const eventTypes = [
  { id: 'live_music', label: 'types.live_music', icon: Music, color: 'bg-purple-500' },
  { id: 'dj_night', label: 'types.dj', icon: Music, color: 'bg-pink-500' },
  { id: 'special_menu', label: 'types.special_menu', icon: Utensils, color: 'bg-orange-500' },
  { id: 'wine_tasting', label: 'types.wine_tasting', icon: Wine, color: 'bg-red-500' },
  { id: 'party', label: 'types.party', icon: PartyPopper, color: 'bg-yellow-500' },
  { id: 'comedy', label: 'types.comedy', icon: Mic, color: 'bg-green-500' },
  { id: 'other', label: 'types.other', icon: Star, color: 'bg-gray-500' },
];

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'draft', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  published: { label: 'published', color: 'text-green-700', bgColor: 'bg-green-100' },
  cancelled: { label: 'cancelled', color: 'text-red-700', bgColor: 'bg-red-100' },
  completed: { label: 'completed', color: 'text-blue-700', bgColor: 'bg-blue-100' },
};

export default function EventsPage() {
  const { currentVenue } = useVenueStore();
  const t = useTranslations('events');
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Etkinlikleri yükle
  const loadEvents = useCallback(async () => {
    if (!currentVenue?.id) return;
    setIsLoading(true);

    try {
      let query = supabase
        .from('events')
        .select('*')
        .eq('venue_id', currentVenue.id)
        .order('date', { ascending: true });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      if (filterType !== 'all') {
        query = query.eq('type', filterType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Events fetch error:', error);
        return;
      }

      setEvents(data || []);
    } catch (err) {
      console.error('Events exception:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentVenue?.id, filterStatus, filterType]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Real-time subscription
  useEffect(() => {
    if (!currentVenue?.id) return;

    const channel = supabase
      .channel('events-list')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'events', filter: `venue_id=eq.${currentVenue.id}` },
        () => loadEvents()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentVenue?.id, loadEvents]);

  // Etkinlik durumunu güncelle
  const updateEventStatus = async (eventId: string, newStatus: string) => {
    const { error } = await supabase
      .from('events')
      .update({ status: newStatus })
      .eq('id', eventId);

    if (!error) loadEvents();
  };

  // Etkinlik sil
  const deleteEvent = async (eventId: string) => {
    if (!confirm('Bu etkinliği silmek istediğinize emin misiniz?')) return;

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (!error) loadEvents();
  };

  // Filtrelenmiş etkinlikler
  const filteredEvents = events.filter(e => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return e.title.toLowerCase().includes(query) ||
             e.description?.toLowerCase().includes(query);
    }
    return true;
  });

  // Yaklaşan etkinlikler
  const upcomingEvents = filteredEvents.filter(e => 
    new Date(e.date) >= new Date() && e.status === 'published'
  );

  // İstatistikler
  const stats = {
    total: events.length,
    published: events.filter(e => e.status === 'published').length,
    upcoming: upcomingEvents.length,
    totalAttendees: events.reduce((sum, e) => sum + (e.current_attendees || 0), 0)
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
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-500">{currentVenue.name} • Halkla İlişkiler</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadEvents}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            <Plus className="w-4 h-4" />
            {t('addEvent')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-gray-600" />
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              <p className="text-sm text-gray-600">{t('total')}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-700">{stats.published}</p>
              <p className="text-sm text-green-600">{t('published')}</p>
            </div>
          </div>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 border-2 border-orange-200">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-2xl font-bold text-orange-700">{stats.upcoming}</p>
              <p className="text-sm text-orange-600">{t('upcoming')}</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-purple-700">{stats.totalAttendees}</p>
              <p className="text-sm text-purple-600">{t('attendees')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">{t('allStatuses')}</option>
          <option value="draft">Taslak</option>
          <option value="published">{t('published')}</option>
          <option value="cancelled">{	('cancel')}</option>
          <option value="completed">Tamamlandı</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">{t('allTypes')}</option>
          {eventTypes.map(type => (
            <option key={type.id} value={type.id}>{t(type.label)}</option>
          ))}
        </select>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map(event => {
          const t = useTranslations('events');
  const typeInfo = eventTypes.find(et => et.id === event.type) || eventTypes[eventTypes.length - 1];
          const TypeIcon = typeInfo.icon;
          const config = statusConfig[event.status];
          const isPast = new Date(event.date) < new Date();

          return (
            <div key={event.id} className={`bg-white rounded-2xl border-2 overflow-hidden ${
              event.featured ? 'border-orange-400 ring-2 ring-orange-200' : 'border-gray-200'
            } ${isPast ? 'opacity-60' : ''}`}>
              {/* Image/Header */}
              <div className={`h-32 ${typeInfo.color} flex items-center justify-center relative`}>
                {event.image_url ? (
                  <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                ) : (
                  <TypeIcon className="w-16 h-16 text-white/50" />
                )}
                {event.featured && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-orange-500 text-white text-xs rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" /> Öne Çıkan
                  </div>
                )}
                <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                  {t(config.label)}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900 text-lg">{event.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.color} text-white`}>
                    {t(typeInfo.label)}
                  </span>
                </div>

                {event.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{event.description}</p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(event.date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{event.start_time}{event.end_time && ` - ${event.end_time}`}</span>
                  </div>
                  {event.capacity && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{event.current_attendees || 0} / {event.capacity} kişi</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div>
                    {event.is_free ? (
                      <span className="text-green-600 font-medium">Ücretsiz</span>
                    ) : (
                      <span className="font-bold text-gray-900">₺{event.ticket_price}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedEvent(event)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="Detay"
                    >
                      <Eye className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg" title="Paylaş">
                      <Share2 className="w-4 h-4 text-gray-600" />
                    </button>
                    {event.status === 'draft' && (
                      <button
                        onClick={() => updateEventStatus(event.id, 'published')}
                        className="p-2 hover:bg-green-100 rounded-lg"
                        title="Yayınla"
                      >
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="p-2 hover:bg-red-100 rounded-lg"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <PartyPopper className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Henüz etkinlik eklenmemiş</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg"
          >
            İlk Etkinliği Ekle
          </button>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <AddEventModal
          venueId={currentVenue.id}
          onClose={() => setShowAddModal(false)}
          onSave={() => { loadEvents(); setShowAddModal(false); }}
        />
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onStatusChange={(status) => {
            updateEventStatus(selectedEvent.id, status);
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
}

// Add Event Modal
function AddEventModal({
  venueId,
  onClose,
  onSave
}: {
  venueId: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const t = useTranslations('events');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'live_music',
    date: new Date().toISOString().split('T')[0],
    start_time: '20:00',
    end_time: '23:00',
    capacity: 100,
    ticket_price: 0,
    is_free: true,
    featured: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.title) {
      alert(t('eventNameRequired'));
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from('events')
      .insert({
        venue_id: venueId,
        ...formData,
        ticket_price: formData.is_free ? null : formData.ticket_price,
        status: 'draft',
        current_attendees: 0
      });

    setIsSubmitting(false);

    if (error) {
      console.error('Add event error:', error);
      alert(t('eventError'));
      return;
    }

    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-bold">{t('addEvent')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('eventName')} *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Örn: Canlı Caz Gecesi"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              rows={3}
              placeholder="Etkinlik hakkında detaylar..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('eventType')}</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              {eventTypes.map(type => (
                <option key={type.id} value={type.id}>{t(type.label)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('date')}</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('startTime')}</label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('endTime')}</label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('capacity')}</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('price')}</label>
              <input
                type="number"
                value={formData.ticket_price}
                onChange={(e) => setFormData({ ...formData, ticket_price: parseInt(e.target.value) || 0, is_free: false })}
                className="w-full px-4 py-2 border rounded-lg"
                disabled={formData.is_free}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_free}
                onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">{	('free')}</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">Öne Çıkan</span>
            </label>
          </div>
        </div>

        <div className="p-5 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 border rounded-lg font-medium hover:bg-gray-50"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50"
          >
            {isSubmitting ? t('saving') : t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}

// Event Detail Modal
function EventDetailModal({
  event,
  onClose,
  onStatusChange
}: {
  event: Event;
  onClose: () => void;
  onStatusChange: (status: string) => void;
}) {
  const t = useTranslations('events');
  const typeInfo = eventTypes.find(et => et.id === event.type) || eventTypes[eventTypes.length - 1];
  const config = statusConfig[event.status];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg">
        <div className={`h-40 ${typeInfo.color} flex items-center justify-center relative rounded-t-2xl`}>
          {event.image_url ? (
            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover rounded-t-2xl" />
          ) : (
            <typeInfo.icon className="w-20 h-20 text-white/50" />
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 rounded-full text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{event.title}</h2>
              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.color}`}>
                {t(config.label)}
              </span>
            </div>
            {event.is_free ? (
              <span className="text-green-600 font-bold text-xl">Ücretsiz</span>
            ) : (
              <span className="font-bold text-2xl text-gray-900">₺{event.ticket_price}</span>
            )}
          </div>

          {event.description && (
            <p className="text-gray-600 mb-4">{event.description}</p>
          )}

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-gray-700">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span>{new Date(event.date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Clock className="w-5 h-5 text-gray-400" />
              <span>{event.start_time}{event.end_time && ` - ${event.end_time}`}</span>
            </div>
            {event.capacity && (
              <div className="flex items-center gap-3 text-gray-700">
                <Users className="w-5 h-5 text-gray-400" />
                <span>{event.current_attendees || 0} / {event.capacity} kişi katıldı</span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {event.status === 'draft' && (
              <button
                onClick={() => onStatusChange('published')}
                className="flex-1 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600"
              >
                Yayınla
              </button>
            )}
            {event.status === 'published' && (
              <button
                onClick={() => onStatusChange('cancelled')}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600"
              >
                İptal Et
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 py-3 border-2 rounded-xl font-medium hover:bg-gray-50"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
