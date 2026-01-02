'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import {
  Plus, X, Edit2, Trash2, AlertCircle, Loader2, RefreshCw,
  Calendar, Clock, Users, Phone, Mail, MessageSquare,
  CheckCircle, XCircle, UserCheck, ChevronLeft, ChevronRight
} from 'lucide-react';

interface Reservation {
  id: string;
  venue_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  date: string;
  time: string;
  party_size: number;
  table_number?: string;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  special_requests?: string;
  deposit_amount?: number;
  deposit_paid: boolean;
  created_at: string;
}

export default function ReservationsPage() {
  const { currentVenue } = useVenueStore();
  const t = useTranslations('reservations');
  const tCommon = useTranslations('common');

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);

  // Status config
  const statusConfig = {
    pending: { label: t('pending'), color: 'bg-amber-500', icon: Clock },
    confirmed: { label: t('confirmed'), color: 'bg-blue-500', icon: CheckCircle },
    seated: { label: t('seated'), color: 'bg-green-500', icon: UserCheck },
    completed: { label: t('completed'), color: 'bg-gray-500', icon: CheckCircle },
    cancelled: { label: t('cancelled'), color: 'bg-red-500', icon: XCircle },
    no_show: { label: t('noShow'), color: 'bg-red-700', icon: XCircle },
  };

  const loadReservations = useCallback(async () => {
    if (!currentVenue?.id) return;

    let query = supabase
      .from('reservations')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .eq('date', selectedDate)
      .order('time');

    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }

    const { data } = await query;
    if (data) setReservations(data);
    setLoading(false);
  }, [currentVenue?.id, selectedDate, filterStatus]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  // Real-time subscription
  useEffect(() => {
    if (!currentVenue?.id) return;

    const channel = supabase
      .channel('reservations-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'reservations', filter: `venue_id=eq.${currentVenue.id}` },
        loadReservations
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [currentVenue?.id, loadReservations]);

  const handleSaveReservation = async (data: Partial<Reservation>) => {
    if (!currentVenue?.id) return;

    if (editingReservation) {
      await supabase.from('reservations').update(data).eq('id', editingReservation.id);
    } else {
      await supabase.from('reservations').insert({
        ...data,
        venue_id: currentVenue.id,
        status: 'pending',
        deposit_paid: false
      });
    }

    setShowModal(false);
    setEditingReservation(null);
    loadReservations();
  };

  const handleStatusChange = async (id: string, newStatus: Reservation['status']) => {
    await supabase.from('reservations').update({ status: newStatus }).eq('id', id);
    loadReservations();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(tCommon('confirmDelete'))) return;
    await supabase.from('reservations').delete().eq('id', id);
    loadReservations();
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  // Stats
  const stats = {
    total: reservations.length,
    pending: reservations.filter(r => r.status === 'pending').length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    seated: reservations.filter(r => r.status === 'seated').length,
    totalGuests: reservations.filter(r => ['pending', 'confirmed', 'seated'].includes(r.status))
      .reduce((sum, r) => sum + r.party_size, 0),
  };

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-gray-400">{tCommon('selectVenue')}</p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          <p className="text-gray-400">{currentVenue.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button"
            onClick={loadReservations}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {tCommon('refresh')}
          </button>
          <button type="button"
            onClick={() => { setEditingReservation(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('newReservation')}
          </button>
        </div>
      </div>

      {/* Date Selector */}
      <div className="flex items-center justify-between bg-gray-800 rounded-xl p-4">
        <button type="button"
          onClick={() => changeDate(-1)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-400" />
        </button>
        
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
          />
          {!isToday && (
            <button type="button"
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-lg text-sm"
            >
              {tCommon('today')}
            </button>
          )}
        </div>

        <button type="button"
          onClick={() => changeDate(1)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">{tCommon('total')}</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4">
          <p className="text-amber-400 text-sm">{t('pending')}</p>
          <p className="text-2xl font-bold text-white">{stats.pending}</p>
        </div>
        <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4">
          <p className="text-blue-400 text-sm">{t('confirmed')}</p>
          <p className="text-2xl font-bold text-white">{stats.confirmed}</p>
        </div>
        <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
          <p className="text-green-400 text-sm">{t('seated')}</p>
          <p className="text-2xl font-bold text-white">{stats.seated}</p>
        </div>
        <div className="bg-purple-500/20 border border-purple-500/50 rounded-xl p-4">
          <p className="text-purple-400 text-sm">{t('partySize')}</p>
          <p className="text-2xl font-bold text-white">{stats.totalGuests}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'].map(status => (
          <button type="button"
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
              filterStatus === status
                ? 'bg-orange-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {status === 'all' ? tCommon('all') : statusConfig[status as keyof typeof statusConfig]?.label}
          </button>
        ))}
      </div>

      {/* Reservations List */}
      <div className="space-y-4">
        {reservations.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/50 rounded-xl">
            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">{t('noReservations')}</p>
          </div>
        ) : (
          reservations.map(reservation => {
            const status = statusConfig[reservation.status];
            const StatusIcon = status.icon;

            return (
              <div
                key={reservation.id}
                className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Time */}
                    <div className="text-center bg-gray-700 rounded-xl px-4 py-2 min-w-[80px]">
                      <p className="text-2xl font-bold text-white">{reservation.time}</p>
                    </div>

                    {/* Info */}
                    <div>
                      <p className="text-lg font-medium text-white">{reservation.customer_name}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {reservation.party_size} {t('partySize')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {reservation.customer_phone}
                        </span>
                        {reservation.table_number && (
                          <span className="text-orange-400">
                            {t('assignedTable')}: {reservation.table_number}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Status */}
                    <span className={`flex items-center gap-2 px-3 py-1.5 ${status.color} text-white text-sm rounded-full`}>
                      <StatusIcon className="w-4 h-4" />
                      {status.label}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {reservation.status === 'pending' && (
                        <button type="button"
                          onClick={() => handleStatusChange(reservation.id, 'confirmed')}
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                          title={t('confirmReservation')}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {reservation.status === 'confirmed' && (
                        <button type="button"
                          onClick={() => handleStatusChange(reservation.id, 'seated')}
                          className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                          title={t('seatGuests')}
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                      <button type="button"
                        onClick={() => { setEditingReservation(reservation); setShowModal(true); }}
                        className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button type="button"
                        onClick={() => handleDelete(reservation.id)}
                        className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {(reservation.notes || reservation.special_requests) && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-sm text-amber-400 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      {reservation.notes || reservation.special_requests}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Reservation Modal */}
      {showModal && (
        <ReservationModal
          reservation={editingReservation}
          t={t}
          tCommon={tCommon}
          onClose={() => { setShowModal(false); setEditingReservation(null); }}
          onSave={handleSaveReservation}
        />
      )}
    </div>
  );
}

// Reservation Modal
function ReservationModal({
  reservation, t, tCommon, onClose, onSave
}: {
  reservation: Reservation | null;
  t: any;
  tCommon: any;
  onClose: () => void;
  onSave: (data: Partial<Reservation>) => void;
}) {
  const [customerName, setCustomerName] = useState(reservation?.customer_name || '');
  const [customerPhone, setCustomerPhone] = useState(reservation?.customer_phone || '');
  const [customerEmail, setCustomerEmail] = useState(reservation?.customer_email || '');
  const [date, setDate] = useState(reservation?.date || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(reservation?.time || '19:00');
  const [partySize, setPartySize] = useState(reservation?.party_size || 2);
  const [tableNumber, setTableNumber] = useState(reservation?.table_number || '');
  const [notes, setNotes] = useState(reservation?.notes || '');
  const [specialRequests, setSpecialRequests] = useState(reservation?.special_requests || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail || undefined,
      date,
      time,
      party_size: partySize,
      table_number: tableNumber || undefined,
      notes: notes || undefined,
      special_requests: specialRequests || undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800">
          <h2 className="text-xl font-bold text-white">
            {reservation ? t('editReservation') : t('newReservation')}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('guestName')}</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('guestPhone')}</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('guestEmail')}</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('reservationDate')}</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('reservationTime')}</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('partySize')}</label>
              <input
                type="number"
                value={partySize}
                onChange={(e) => setPartySize(parseInt(e.target.value))}
                min={1}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('assignedTable')}</label>
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Opsiyonel"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{tCommon('notes')}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{t('specialRequests')}</label>
            <textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button"
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-700 text-white rounded-xl hover:bg-gray-600"
            >
              {tCommon('cancel')}
            </button>
            <button type="button"
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