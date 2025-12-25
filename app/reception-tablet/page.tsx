'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Home, Users, Calendar, Clock, Phone, Mail, Check, X, Search,
  Plus, ChevronLeft, ChevronRight, UserPlus, Edit, Trash2, Bell,
  RefreshCw, MapPin, MessageSquare, AlertCircle, CheckCircle, XCircle
} from 'lucide-react';

interface Reservation {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  date: string;
  time: string;
  party_size: number;
  table_ids?: string[];
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  special_requests?: string;
  created_at: string;
}

interface Table {
  id: string;
  number: string;
  section: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
}

interface WalkInGuest {
  name: string;
  phone: string;
  party_size: number;
  notes?: string;
}

const VENUE_ID = process.env.NEXT_PUBLIC_DEFAULT_VENUE_ID || '';

export default function ReceptionTabletPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showNewReservation, setShowNewReservation] = useState(false);
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const loadData = useCallback(async () => {
    try {
      const [resData, tablesData] = await Promise.all([
        supabase
          .from('reservations')
          .select('*')
          .eq('date', selectedDate)
          .order('time'),
        supabase
          .from('tables')
          .select('*')
          .eq('is_active', true)
          .order('section')
          .order('number')
      ]);

      setReservations(resData.data || []);
      setTables(tablesData.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    const channel = supabase
      .channel('reception-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, loadData)
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [loadData]);

  const updateReservationStatus = async (id: string, status: Reservation['status']) => {
    await supabase.from('reservations').update({ status }).eq('id', id);
    loadData();
    setSelectedReservation(null);
  };

  const seatReservation = async (reservation: Reservation, tableIds: string[]) => {
    await supabase.from('reservations').update({ status: 'seated', table_ids: tableIds }).eq('id', reservation.id);
    await supabase.from('tables').update({ status: 'reserved' }).in('id', tableIds);
    loadData();
    setSelectedReservation(null);
  };

  const handleWalkIn = async (guest: WalkInGuest, tableId: string) => {
    // Create walk-in reservation
    await supabase.from('reservations').insert({
      venue_id: VENUE_ID,
      customer_name: guest.name,
      customer_phone: guest.phone,
      date: selectedDate,
      time: currentTime.toTimeString().slice(0, 5),
      party_size: guest.party_size,
      status: 'seated',
      table_ids: [tableId],
      notes: guest.notes ? `Walk-in: ${guest.notes}` : 'Walk-in'
    });
    await supabase.from('tables').update({ status: 'occupied' }).eq('id', tableId);
    loadData();
    setShowWalkIn(false);
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const filteredReservations = reservations.filter(r =>
    r.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.customer_phone.includes(searchTerm)
  );

  const upcomingReservations = filteredReservations.filter(r => ['pending', 'confirmed'].includes(r.status));
  const seatedReservations = filteredReservations.filter(r => r.status === 'seated');
  const completedReservations = filteredReservations.filter(r => ['completed', 'cancelled', 'no_show'].includes(r.status));

  const availableTables = tables.filter(t => t.status === 'available');
  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const statusColors = {
    pending: 'bg-amber-500',
    confirmed: 'bg-blue-500',
    seated: 'bg-green-500',
    completed: 'bg-gray-500',
    cancelled: 'bg-red-500',
    no_show: 'bg-red-700'
  };

  const statusLabels = {
    pending: 'Bekliyor',
    confirmed: 'Onaylı',
    seated: 'Oturdu',
    completed: 'Tamamlandı',
    cancelled: 'İptal',
    no_show: 'Gelmedi'
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Left: Reservations */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl">
                <Home className="w-5 h-5 text-gray-600" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-gray-900">RESEPSİYON</h1>
                  <p className="text-sm text-gray-500">{currentTime.toLocaleTimeString('tr-TR')}</p>
                </div>
              </div>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
              <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white rounded-lg">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="px-4 py-2 min-w-[160px] text-center">
                <p className="font-bold text-gray-900">
                  {new Date(selectedDate).toLocaleDateString('tr-TR', { weekday: 'long' })}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(selectedDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                </p>
              </div>
              <button onClick={() => changeDate(1)} className="p-2 hover:bg-white rounded-lg">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowWalkIn(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl"
              >
                <UserPlus className="w-5 h-5" /> Walk-in
              </button>
              <button
                onClick={() => setShowNewReservation(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl"
              >
                <Plus className="w-5 h-5" /> Rezervasyon
              </button>
              <button onClick={loadData} className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl">
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Misafir adı veya telefon ara..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </header>

        {/* Stats */}
        <div className="bg-white border-b px-6 py-4">
          <div className="grid grid-cols-4 gap-4">
            <StatCard label="Toplam" value={reservations.length} color="gray" />
            <StatCard label="Bekleyen" value={upcomingReservations.length} color="amber" />
            <StatCard label="Oturan" value={seatedReservations.length} color="green" />
            <StatCard label="Boş Masa" value={availableTables.length} color="blue" />
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Upcoming */}
          {upcomingReservations.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" /> BEKLEYEN ({upcomingReservations.length})
              </h3>
              <div className="space-y-2">
                {upcomingReservations.map(res => (
                  <ReservationCard
                    key={res.id}
                    reservation={res}
                    statusColors={statusColors}
                    statusLabels={statusLabels}
                    onClick={() => setSelectedReservation(res)}
                    isSelected={selectedReservation?.id === res.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Seated */}
          {seatedReservations.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" /> OTURAN ({seatedReservations.length})
              </h3>
              <div className="space-y-2">
                {seatedReservations.map(res => (
                  <ReservationCard
                    key={res.id}
                    reservation={res}
                    statusColors={statusColors}
                    statusLabels={statusLabels}
                    onClick={() => setSelectedReservation(res)}
                    isSelected={selectedReservation?.id === res.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {completedReservations.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-gray-400" /> GEÇMİŞ ({completedReservations.length})
              </h3>
              <div className="space-y-2 opacity-60">
                {completedReservations.map(res => (
                  <ReservationCard
                    key={res.id}
                    reservation={res}
                    statusColors={statusColors}
                    statusLabels={statusLabels}
                    onClick={() => setSelectedReservation(res)}
                    isSelected={selectedReservation?.id === res.id}
                  />
                ))}
              </div>
            </div>
          )}

          {reservations.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Bu tarihte rezervasyon yok</p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Table Map & Actions */}
      <div className="w-96 bg-white border-l flex flex-col">
        {selectedReservation ? (
          <ReservationDetail
            reservation={selectedReservation}
            tables={tables}
            statusLabels={statusLabels}
            onClose={() => setSelectedReservation(null)}
            onConfirm={() => updateReservationStatus(selectedReservation.id, 'confirmed')}
            onSeat={(tableIds) => seatReservation(selectedReservation, tableIds)}
            onComplete={() => updateReservationStatus(selectedReservation.id, 'completed')}
            onCancel={() => updateReservationStatus(selectedReservation.id, 'cancelled')}
            onNoShow={() => updateReservationStatus(selectedReservation.id, 'no_show')}
          />
        ) : (
          <TableMap tables={tables} />
        )}
      </div>

      {/* Walk-in Modal */}
      {showWalkIn && (
        <WalkInModal
          tables={availableTables}
          onSubmit={handleWalkIn}
          onClose={() => setShowWalkIn(false)}
        />
      )}

      {/* New Reservation Modal */}
      {showNewReservation && (
        <NewReservationModal
          selectedDate={selectedDate}
          venueId={VENUE_ID}
          onClose={() => setShowNewReservation(false)}
          onSave={loadData}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-600',
    amber: 'bg-amber-100 text-amber-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600'
  };
  return (
    <div className={`${colors[color]} rounded-xl p-4 text-center`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm">{label}</p>
    </div>
  );
}

function ReservationCard({ reservation, statusColors, statusLabels, onClick, isSelected }: {
  reservation: Reservation;
  statusColors: Record<string, string>;
  statusLabels: Record<string, string>;
  onClick: () => void;
  isSelected: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl text-left transition-all ${
        isSelected ? 'bg-purple-50 ring-2 ring-purple-500' : 'bg-gray-50 hover:bg-gray-100'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-gray-900">{reservation.time}</span>
          <span className={`px-2 py-0.5 rounded text-xs text-white ${statusColors[reservation.status]}`}>
            {statusLabels[reservation.status]}
          </span>
        </div>
        <div className="flex items-center gap-1 text-gray-500">
          <Users className="w-4 h-4" />
          <span>{reservation.party_size}</span>
        </div>
      </div>
      <p className="font-medium text-gray-900">{reservation.customer_name}</p>
      <p className="text-sm text-gray-500">{reservation.customer_phone}</p>
      {reservation.special_requests && (
        <p className="text-xs text-amber-600 mt-1">⚠️ {reservation.special_requests}</p>
      )}
    </button>
  );
}

function TableMap({ tables }: { tables: Table[] }) {
  const sections = [...new Set(tables.map(t => t.section))];
  const statusColors = {
    available: 'bg-green-100 text-green-700 border-green-300',
    occupied: 'bg-red-100 text-red-700 border-red-300',
    reserved: 'bg-amber-100 text-amber-700 border-amber-300',
    cleaning: 'bg-blue-100 text-blue-700 border-blue-300'
  };

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <h3 className="font-bold text-gray-900 mb-4">Masa Durumu</h3>
      {sections.map(section => (
        <div key={section} className="mb-6">
          <p className="text-sm text-gray-500 mb-2">{section}</p>
          <div className="grid grid-cols-4 gap-2">
            {tables.filter(t => t.section === section).map(table => (
              <div
                key={table.id}
                className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center ${statusColors[table.status]}`}
              >
                <span className="font-bold">{table.number}</span>
                <span className="text-xs">{table.capacity}K</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
        <span className="flex items-center gap-1 text-xs"><span className="w-3 h-3 rounded bg-green-500" /> Boş</span>
        <span className="flex items-center gap-1 text-xs"><span className="w-3 h-3 rounded bg-red-500" /> Dolu</span>
        <span className="flex items-center gap-1 text-xs"><span className="w-3 h-3 rounded bg-amber-500" /> Rezerve</span>
        <span className="flex items-center gap-1 text-xs"><span className="w-3 h-3 rounded bg-blue-500" /> Temizlik</span>
      </div>
    </div>
  );
}

function ReservationDetail({ reservation, tables, statusLabels, onClose, onConfirm, onSeat, onComplete, onCancel, onNoShow }: {
  reservation: Reservation;
  tables: Table[];
  statusLabels: Record<string, string>;
  onClose: () => void;
  onConfirm: () => void;
  onSeat: (tableIds: string[]) => void;
  onComplete: () => void;
  onCancel: () => void;
  onNoShow: () => void;
}) {
  const [selectedTables, setSelectedTables] = useState<string[]>(reservation.table_ids || []);
  const availableTables = tables.filter(t => t.status === 'available' && t.capacity >= reservation.party_size);

  const toggleTable = (tableId: string) => {
    setSelectedTables(prev => 
      prev.includes(tableId) ? prev.filter(id => id !== tableId) : [...prev, tableId]
    );
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-bold">Rezervasyon Detay</h3>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {/* Guest Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xl font-bold text-gray-900">{reservation.customer_name}</p>
            <div className="flex items-center gap-4 mt-2 text-gray-600">
              <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{reservation.customer_phone}</span>
              <span className="flex items-center gap-1"><Users className="w-4 h-4" />{reservation.party_size} kişi</span>
            </div>
            {reservation.customer_email && (
              <p className="flex items-center gap-1 mt-1 text-gray-500 text-sm">
                <Mail className="w-4 h-4" />{reservation.customer_email}
              </p>
            )}
          </div>

          {/* Time */}
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-purple-600">{reservation.time}</p>
            <p className="text-purple-500">{statusLabels[reservation.status]}</p>
          </div>

          {/* Notes */}
          {reservation.special_requests && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-medium text-amber-800">Özel İstek</p>
              <p className="text-amber-700">{reservation.special_requests}</p>
            </div>
          )}

          {/* Table Selection (for pending/confirmed) */}
          {['pending', 'confirmed'].includes(reservation.status) && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Masa Seç ({reservation.party_size}+ kişilik)</p>
              <div className="grid grid-cols-4 gap-2">
                {availableTables.map(table => (
                  <button
                    key={table.id}
                    onClick={() => toggleTable(table.id)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      selectedTables.includes(table.id)
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-bold">{table.number}</span>
                    <span className="text-xs block">{table.capacity}K</span>
                  </button>
                ))}
              </div>
              {availableTables.length === 0 && (
                <p className="text-center text-gray-500 py-4">Uygun masa yok</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t space-y-2">
        {reservation.status === 'pending' && (
          <>
            <button onClick={onConfirm} className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium flex items-center justify-center gap-2">
              <Check className="w-5 h-5" /> Onayla
            </button>
            <button onClick={onCancel} className="w-full py-3 bg-red-100 text-red-600 rounded-xl font-medium">
              İptal Et
            </button>
          </>
        )}
        {reservation.status === 'confirmed' && (
          <>
            <button
              onClick={() => onSeat(selectedTables)}
              disabled={selectedTables.length === 0}
              className="w-full py-3 bg-green-500 disabled:bg-gray-300 text-white rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" /> Oturt
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={onNoShow} className="py-3 bg-gray-100 text-gray-600 rounded-xl font-medium">Gelmedi</button>
              <button onClick={onCancel} className="py-3 bg-red-100 text-red-600 rounded-xl font-medium">İptal</button>
            </div>
          </>
        )}
        {reservation.status === 'seated' && (
          <button onClick={onComplete} className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5" /> Tamamla
          </button>
        )}
      </div>
    </div>
  );
}

function WalkInModal({ tables, onSubmit, onClose }: {
  tables: Table[];
  onSubmit: (guest: { name: string; phone: string; party_size: number; notes?: string }, tableId: string) => void;
  onClose: () => void;
}) {
  const [guest, setGuest] = useState({ name: '', phone: '', party_size: 2, notes: '' });
  const [selectedTable, setSelectedTable] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guest.name || !selectedTable) return;
    onSubmit(guest, selectedTable);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">Walk-in Misafir</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Ad Soyad</label>
            <input
              type="text"
              value={guest.name}
              onChange={(e) => setGuest({ ...guest, name: e.target.value })}
              className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefon</label>
            <input
              type="tel"
              value={guest.phone}
              onChange={(e) => setGuest({ ...guest, phone: e.target.value })}
              className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Kişi Sayısı</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setGuest({ ...guest, party_size: Math.max(1, guest.party_size - 1) })}
                className="w-10 h-10 bg-gray-100 rounded-xl font-bold">-</button>
              <span className="text-2xl font-bold w-12 text-center">{guest.party_size}</span>
              <button type="button" onClick={() => setGuest({ ...guest, party_size: guest.party_size + 1 })}
                className="w-10 h-10 bg-gray-100 rounded-xl font-bold">+</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Masa Seç</label>
            <div className="grid grid-cols-5 gap-2">
              {tables.filter(t => t.capacity >= guest.party_size).map(table => (
                <button
                  key={table.id}
                  type="button"
                  onClick={() => setSelectedTable(table.id)}
                  className={`p-3 rounded-xl border-2 ${
                    selectedTable === table.id ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <span className="font-bold">{table.number}</span>
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={!guest.name || !selectedTable}
            className="w-full py-3 bg-green-500 disabled:bg-gray-300 text-white rounded-xl font-bold"
          >
            Oturt
          </button>
        </form>
      </div>
    </div>
  );
}

function NewReservationModal({ selectedDate, venueId, onClose, onSave }: {
  selectedDate: string;
  venueId: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    date: selectedDate,
    time: '19:00',
    party_size: 2,
    special_requests: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await supabase.from('reservations').insert({
        venue_id: venueId,
        ...form,
        status: 'pending'
      });
      onSave();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Rezervasyon eklenemedi!');
    } finally {
      setSaving(false);
    }
  };

  const timeSlots = [];
  for (let h = 10; h <= 23; h++) {
    timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">Yeni Rezervasyon</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Ad Soyad *</label>
            <input type="text" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              className="w-full px-4 py-2.5 border rounded-xl" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefon *</label>
            <input type="tel" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
              className="w-full px-4 py-2.5 border rounded-xl" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">E-posta</label>
            <input type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
              className="w-full px-4 py-2.5 border rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tarih</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Saat</label>
              <select value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-xl bg-white">
                {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Kişi Sayısı</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setForm({ ...form, party_size: Math.max(1, form.party_size - 1) })}
                className="w-10 h-10 bg-gray-100 rounded-xl font-bold">-</button>
              <span className="text-2xl font-bold w-12 text-center">{form.party_size}</span>
              <button type="button" onClick={() => setForm({ ...form, party_size: form.party_size + 1 })}
                className="w-10 h-10 bg-gray-100 rounded-xl font-bold">+</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Özel İstek</label>
            <textarea value={form.special_requests} onChange={(e) => setForm({ ...form, special_requests: e.target.value })}
              className="w-full px-4 py-2.5 border rounded-xl" rows={2} placeholder="Doğum günü, pencere kenarı vb." />
          </div>
          <button type="submit" disabled={saving} className="w-full py-3 bg-purple-500 text-white rounded-xl font-bold disabled:opacity-50">
            {saving ? 'Kaydediliyor...' : 'Rezervasyon Oluştur'}
          </button>
        </form>
      </div>
    </div>
  );
}
