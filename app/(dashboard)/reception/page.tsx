'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import {
  Users, Clock, Calendar, AlertCircle, Loader2, RefreshCw,
  Plus, X, Phone, User, CheckCircle, UserPlus, Bell,
  ArrowRight, Search, Filter
} from 'lucide-react';

interface TableData {
  id: string;
  number: string;
  capacity: number;
  section: string;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
}

interface ReservationData {
  id: string;
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
  created_at: string;
}

interface WaitlistEntry {
  id: string;
  name: string;
  phone: string;
  party_size: number;
  added_at: string;
  estimated_wait: number;
  status: 'waiting' | 'notified' | 'seated' | 'left';
}

export default function ReceptionPage() {
  const { currentVenue } = useVenueStore();
  const t = useTranslations('reception');
  const tReservations = useTranslations('reservations');
  const tTables = useTranslations('tables');
  const tCommon = useTranslations('common');

  const [tables, setTables] = useState<TableData[]>([]);
  const [reservations, setReservations] = useState<ReservationData[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reservations' | 'waitlist' | 'walkin'>('reservations');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationData | null>(null);

  // Status config
  const reservationStatusConfig = {
    pending: { label: tReservations('pending'), color: 'bg-amber-500' },
    confirmed: { label: tReservations('confirmed'), color: 'bg-blue-500' },
    seated: { label: tReservations('seated'), color: 'bg-green-500' },
    completed: { label: tReservations('completed'), color: 'bg-gray-500' },
    cancelled: { label: tReservations('cancelled'), color: 'bg-red-500' },
    no_show: { label: tReservations('noShow'), color: 'bg-red-700' },
  };

  // Section translations
  const sectionTranslations: Record<string, string> = {
    'Bahçe': tTables('garden'),
    'İç Mekan': tTables('indoor'),
    'Dış Mekan': tTables('outdoor'),
    'Teras': tTables('terrace'),
    'VIP': tTables('vip'),
  };

  const translateSection = (section: string) => sectionTranslations[section] || section;

  const loadData = useCallback(async () => {
    if (!currentVenue?.id) return;

    const today = new Date().toISOString().split('T')[0];

    const [tablesRes, reservationsRes] = await Promise.all([
      supabase.from('tables').select('*').eq('venue_id', currentVenue.id).eq('is_active', true).order('number'),
      supabase.from('reservations').select('*').eq('venue_id', currentVenue.id).eq('date', today).order('time')
    ]);

    if (tablesRes.data) setTables(tablesRes.data);
    if (reservationsRes.data) setReservations(reservationsRes.data);
    setLoading(false);
  }, [currentVenue?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time subscription
  useEffect(() => {
    if (!currentVenue?.id) return;

    const channel = supabase
      .channel('reception-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables', filter: `venue_id=eq.${currentVenue.id}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations', filter: `venue_id=eq.${currentVenue.id}` }, loadData)
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [currentVenue?.id, loadData]);

  const availableTables = tables.filter(t => t.status === 'available');
  const upcomingReservations = reservations.filter(r => ['pending', 'confirmed'].includes(r.status));
  const seatedReservations = reservations.filter(r => r.status === 'seated');

  // Stats
  const stats = {
    availableTables: availableTables.length,
    totalCapacity: availableTables.reduce((sum, t) => sum + t.capacity, 0),
    upcomingReservations: upcomingReservations.length,
    waitlistCount: waitlist.filter(w => w.status === 'waiting').length,
  };

  const handleSeatReservation = async (reservation: ReservationData, tableNumber: string) => {
    await supabase.from('reservations').update({ 
      status: 'seated', 
      table_number: tableNumber 
    }).eq('id', reservation.id);
    
    await supabase.from('tables').update({ 
      status: 'occupied' 
    }).eq('venue_id', currentVenue?.id).eq('number', tableNumber);
    
    loadData();
    setSelectedReservation(null);
  };

  const handleConfirmReservation = async (id: string) => {
    await supabase.from('reservations').update({ status: 'confirmed' }).eq('id', id);
    loadData();
  };

  const handleCancelReservation = async (id: string) => {
    await supabase.from('reservations').update({ status: 'cancelled' }).eq('id', id);
    loadData();
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
          <p className="text-gray-400">{new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {tCommon('refresh')}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('walkIn')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
          <p className="text-green-400 text-sm">{tTables('available')}</p>
          <p className="text-2xl font-bold text-white">{stats.availableTables}</p>
          <p className="text-xs text-gray-400">{stats.totalCapacity} {tTables('person')}</p>
        </div>
        <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4">
          <p className="text-amber-400 text-sm">{tReservations('upcomingReservations')}</p>
          <p className="text-2xl font-bold text-white">{stats.upcomingReservations}</p>
        </div>
        <div className="bg-purple-500/20 border border-purple-500/50 rounded-xl p-4">
          <p className="text-purple-400 text-sm">{t('waitlist')}</p>
          <p className="text-2xl font-bold text-white">{stats.waitlistCount}</p>
        </div>
        <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4">
          <p className="text-blue-400 text-sm">{tReservations('seated')}</p>
          <p className="text-2xl font-bold text-white">{seatedReservations.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        <button
          onClick={() => setActiveTab('reservations')}
          className={`px-4 py-2 rounded-t-xl font-medium transition-colors ${
            activeTab === 'reservations' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {tReservations('title')} ({upcomingReservations.length})
        </button>
        <button
          onClick={() => setActiveTab('waitlist')}
          className={`px-4 py-2 rounded-t-xl font-medium transition-colors ${
            activeTab === 'waitlist' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('waitlist')} ({stats.waitlistCount})
        </button>
        <button
          onClick={() => setActiveTab('walkin')}
          className={`px-4 py-2 rounded-t-xl font-medium transition-colors ${
            activeTab === 'walkin' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('walkIn')}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'reservations' && (
        <div className="space-y-4">
          {upcomingReservations.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/50 rounded-xl">
              <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">{tReservations('noReservations')}</p>
            </div>
          ) : (
            upcomingReservations.map(reservation => {
              const status = reservationStatusConfig[reservation.status];
              return (
                <div
                  key={reservation.id}
                  onClick={() => setSelectedReservation(reservation)}
                  className="bg-gray-800 rounded-xl p-4 cursor-pointer hover:bg-gray-750 transition-colors border border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Time */}
                      <div className="text-center bg-gray-700 rounded-xl px-4 py-2">
                        <p className="text-2xl font-bold text-white">{reservation.time}</p>
                      </div>

                      {/* Info */}
                      <div>
                        <p className="text-lg font-medium text-white">{reservation.customer_name}</p>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                          <span><Users className="w-3 h-3 inline mr-1" />{reservation.party_size} {tTables('person')}</span>
                          <span><Phone className="w-3 h-3 inline mr-1" />{reservation.customer_phone}</span>
                          {reservation.table_number && (
                            <span className="text-orange-400">{tTables('tableNumber')} {reservation.table_number}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Status */}
                      <span className={`px-3 py-1 ${status.color} text-white text-sm rounded-full`}>
                        {status.label}
                      </span>

                      {/* Quick Actions */}
                      {reservation.status === 'pending' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleConfirmReservation(reservation.id); }}
                          className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {reservation.status === 'confirmed' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedReservation(reservation); }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                        >
                          {t('seatNow')}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {(reservation.notes || reservation.special_requests) && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <p className="text-sm text-amber-400">
                        ⚠️ {reservation.notes || reservation.special_requests}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'waitlist' && (
        <div className="space-y-4">
          {waitlist.filter(w => w.status === 'waiting').length === 0 ? (
            <div className="text-center py-12 bg-gray-800/50 rounded-xl">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">{t('waitlist')} - {tCommon('noData')}</p>
            </div>
          ) : (
            waitlist.filter(w => w.status === 'waiting').map(entry => (
              <div key={entry.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-400">{t('estimatedWait')}</p>
                      <p className="text-xl font-bold text-white">{entry.estimated_wait} dk</p>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-white">{entry.name}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        <span><Users className="w-3 h-3 inline mr-1" />{entry.party_size}</span>
                        <span><Phone className="w-3 h-3 inline mr-1" />{entry.phone}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg">
                      <Bell className="w-4 h-4" />
                    </button>
                    <button className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm">
                      {t('seatNow')}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Add to Waitlist */}
          <button className="w-full py-4 border-2 border-dashed border-gray-600 rounded-xl text-gray-400 hover:text-white hover:border-gray-500 transition-colors flex items-center justify-center gap-2">
            <UserPlus className="w-5 h-5" />
            {t('addToWaitlist')}
          </button>
        </div>
      )}

      {activeTab === 'walkin' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="col-span-full mb-4">
            <h3 className="text-lg font-medium text-white mb-2">{tTables('available')} ({availableTables.length})</h3>
          </div>
          {availableTables.map(table => (
            <div
              key={table.id}
              className="bg-green-900/30 border-2 border-green-500 rounded-xl p-4 cursor-pointer hover:bg-green-900/50 transition-colors"
            >
              <h3 className="text-2xl font-bold text-white">{table.number}</h3>
              <p className="text-gray-400 text-sm">{translateSection(table.section)}</p>
              <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
                <Users className="w-3 h-3" />
                <span>{table.capacity} {tTables('person')}</span>
              </div>
              <button className="w-full mt-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">
                {t('seatNow')}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Seat Reservation Modal */}
      {selectedReservation && selectedReservation.status === 'confirmed' && (
        <SeatReservationModal
          reservation={selectedReservation}
          availableTables={availableTables}
          t={t}
          tTables={tTables}
          tReservations={tReservations}
          tCommon={tCommon}
          translateSection={translateSection}
          onClose={() => setSelectedReservation(null)}
          onSeat={handleSeatReservation}
        />
      )}
    </div>
  );
}

// Seat Reservation Modal
function SeatReservationModal({
  reservation, availableTables, t, tTables, tReservations, tCommon, translateSection, onClose, onSeat
}: {
  reservation: ReservationData;
  availableTables: TableData[];
  t: any;
  tTables: any;
  tReservations: any;
  tCommon: any;
  translateSection: (s: string) => string;
  onClose: () => void;
  onSeat: (reservation: ReservationData, tableNumber: string) => void;
}) {
  const suitableTables = availableTables.filter(t => t.capacity >= reservation.party_size);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{t('assignTable')}</h2>
            <p className="text-gray-400">{reservation.customer_name} • {reservation.party_size} {tTables('person')}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {suitableTables.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <p className="text-gray-400">{tTables('available')} - {tCommon('noData')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {suitableTables.map(table => (
                <button
                  key={table.id}
                  onClick={() => onSeat(reservation, table.number)}
                  className="bg-green-900/30 border-2 border-green-500 rounded-xl p-4 text-left hover:bg-green-900/50 transition-colors"
                >
                  <h3 className="text-xl font-bold text-white">{tTables('tableNumber')} {table.number}</h3>
                  <p className="text-gray-400 text-sm">{translateSection(table.section)}</p>
                  <p className="text-green-400 text-sm mt-1">{table.capacity} {tTables('person')}</p>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium"
          >
            {tCommon('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
