'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import {
  Users, Calendar, Clock, Phone, Mail, Plus, X,
  CheckCircle, AlertCircle, Loader2, RefreshCw, Search
} from 'lucide-react';

interface Reservation {
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
  wait_time?: number;
  status: 'waiting' | 'notified' | 'seated' | 'left';
  created_at: string;
}

const statusConfig = {
  pending: { label: 'Beklemede', bg: 'bg-amber-500', color: 'text-amber-500' },
  confirmed: { label: 'Onaylı', bg: 'bg-green-500', color: 'text-green-500' },
  seated: { label: 'Oturdu', bg: 'bg-blue-500', color: 'text-blue-500' },
  completed: { label: 'Tamamlandı', bg: 'bg-gray-500', color: 'text-gray-500' },
  cancelled: { label: 'İptal', bg: 'bg-red-500', color: 'text-red-500' },
  no_show: { label: 'Gelmedi', bg: 'bg-red-700', color: 'text-red-700' },
};

export default function ReceptionPage() {
  const { currentVenue } = useVenueStore();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [availableTablesCount, setAvailableTablesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reservations' | 'waitlist' | 'walkin'>('reservations');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const todayFormatted = new Date().toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long'
  });

  const loadData = useCallback(async () => {
    if (!currentVenue?.id) return;

    setLoading(true);

    // Load reservations
    const { data: resData } = await supabase
      .from('reservations')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .eq('date', today)
      .order('time', { ascending: true });

    // Load available tables count
    const { count: tablesCount } = await supabase
      .from('tables')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', currentVenue.id)
      .eq('status', 'available');

    if (resData) setReservations(resData);
    setAvailableTablesCount(tablesCount || 0);
    
    // Waitlist from reservations with pending status and walk-in note
    const waitlistFromReservations = resData?.filter(r => 
      r.status === 'pending' && r.notes?.includes('Bekleme')
    ) || [];
    setWaitlist(waitlistFromReservations.map(r => ({
      id: r.id,
      name: r.customer_name,
      phone: r.customer_phone,
      party_size: r.party_size,
      status: 'waiting' as const,
      created_at: r.created_at
    })));

    setLoading(false);
  }, [currentVenue?.id, today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time subscription
  useEffect(() => {
    if (!currentVenue?.id) return;

    const channel = supabase
      .channel('reception-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations', filter: `venue_id=eq.${currentVenue.id}` }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables', filter: `venue_id=eq.${currentVenue.id}` }, () => loadData())
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [currentVenue?.id, loadData]);

  const handleStatusChange = async (reservationId: string, newStatus: Reservation['status'], tableNumber?: string, partySize?: number) => {
    // Update reservation with status and optionally table_number
    const updateData: any = { status: newStatus };
    if (tableNumber) {
      updateData.table_number = tableNumber;
    }
    
    await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', reservationId);

    // If seating, update table and create order
    if (newStatus === 'seated' && tableNumber) {
      // Find table
      const { data: tableData } = await supabase
        .from('tables')
        .select('*')
        .eq('venue_id', currentVenue?.id)
        .eq('number', tableNumber)
        .single();

      if (tableData) {
        // Update table status
        await supabase
          .from('tables')
          .update({ status: 'occupied', current_guests: partySize || 1 })
          .eq('id', tableData.id);

        // Create order for the table
        const orderNumber = `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        await supabase
          .from('orders')
          .insert({
            venue_id: currentVenue?.id,
            table_id: tableData.id,
            table_number: tableNumber,
            order_number: orderNumber,
            type: 'dine_in',
            status: 'confirmed',
            items: [],
            subtotal: 0,
            tax: 0,
            service_charge: 0,
            discount: 0,
            total: 0,
            payment_status: 'pending',
            guest_count: partySize || 1
          });
      }
    }

    loadData();
  };

  // Filter reservations
  const filteredReservations = reservations.filter(res =>
    res.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    res.customer_phone.includes(searchQuery)
  );

  // Stats
  const stats = {
    available: availableTablesCount,
    upcoming: reservations.filter(r => r.status === 'confirmed' || r.status === 'pending').length,
    waitlist: waitlist.length,
    seated: reservations.filter(r => r.status === 'seated').length,
  };

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-gray-400">Lütfen bir mekan seçin</p>
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
    <div className="space-y-4 h-[calc(100vh-140px)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white">Resepsiyon</h1>
          <p className="text-gray-400">{todayFormatted}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Yenile
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-xl text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            Walk-in Misafir
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-shrink-0">
        <div className="bg-green-900/30 border border-green-500 rounded-xl p-4">
          <p className="text-green-400">Müsait Masa</p>
          <p className="text-3xl font-bold text-white">{stats.available}</p>
          <p className="text-sm text-green-400">masa boş</p>
        </div>
        <div className="bg-amber-900/30 border border-amber-500 rounded-xl p-4">
          <p className="text-amber-400">Yaklaşan Rezervasyon</p>
          <p className="text-3xl font-bold text-white">{stats.upcoming}</p>
        </div>
        <div className="bg-red-900/30 border border-red-500 rounded-xl p-4">
          <p className="text-red-400">Bekleme Listesi</p>
          <p className="text-3xl font-bold text-white">{stats.waitlist}</p>
        </div>
        <div className="bg-purple-900/30 border border-purple-500 rounded-xl p-4">
          <p className="text-purple-400">Oturdu</p>
          <p className="text-3xl font-bold text-white">{stats.seated}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('reservations')}
          className={`px-6 py-3 rounded-xl font-medium transition-colors ${
            activeTab === 'reservations'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Rezervasyonlar ({reservations.length})
        </button>
        <button
          onClick={() => setActiveTab('waitlist')}
          className={`px-6 py-3 rounded-xl font-medium transition-colors ${
            activeTab === 'waitlist'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Bekleme Listesi ({waitlist.length})
        </button>
        <button
          onClick={() => setActiveTab('walkin')}
          className={`px-6 py-3 rounded-xl font-medium transition-colors ${
            activeTab === 'walkin'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Walk-in Misafir
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="İsim veya telefon ile ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Content */}
      {activeTab === 'reservations' && (
        <div className="space-y-4">
          {filteredReservations.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Henüz rezervasyon yok</p>
            </div>
          ) : (
            filteredReservations.map(res => (
              <ReservationCard
                key={res.id}
                reservation={res}
                onStatusChange={handleStatusChange}
                venueId={currentVenue.id}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'waitlist' && (
        <div className="space-y-4">
          {waitlist.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-12 text-center">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Bekleme listesi boş</p>
            </div>
          ) : (
            waitlist.map((entry, idx) => (
              <WaitlistCard key={entry.id} entry={entry} position={idx + 1} />
            ))
          )}
        </div>
      )}

      {activeTab === 'walkin' && (
        <div className="bg-gray-800 rounded-xl p-8 text-center">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">Yeni misafir eklemek için butona tıklayın</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-medium transition-colors"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Walk-in Misafir Ekle
          </button>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddGuestModal
          venueId={currentVenue.id}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// Reservation Card
function ReservationCard({
  reservation,
  onStatusChange,
  venueId
}: {
  reservation: Reservation;
  onStatusChange: (id: string, status: Reservation['status'], tableNumber?: string, partySize?: number) => void;
  venueId: string;
}) {
  const status = statusConfig[reservation.status];
  const [showTableSelect, setShowTableSelect] = useState(false);
  const [availableTables, setAvailableTables] = useState<any[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);

  const loadTables = async () => {
    setLoadingTables(true);
    const { data } = await supabase
      .from('tables')
      .select('*')
      .eq('venue_id', venueId)
      .eq('status', 'available')
      .order('number');
    
    if (data) setAvailableTables(data);
    setShowTableSelect(true);
    setLoadingTables(false);
  };

  const handleSeat = (tableNumber: string) => {
    onStatusChange(reservation.id, 'seated', tableNumber, reservation.party_size);
    setShowTableSelect(false);
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
            <Users className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <h3 className="font-bold text-white">{reservation.customer_name}</h3>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {reservation.time}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {reservation.party_size} kişi
              </span>
              {reservation.table_number && (
                <span className="text-green-400 font-medium">Masa #{reservation.table_number}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 ${status.bg} text-white text-sm rounded-full`}>
            {status.label}
          </span>
          
          {/* Onaylı rezervasyon - Masa seç ve oturt */}
          {reservation.status === 'confirmed' && (
            <button
              onClick={loadTables}
              disabled={loadingTables}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {loadingTables ? 'Yükleniyor...' : 'Masaya Oturt'}
            </button>
          )}
          
          {/* Bekleyen rezervasyon - Onayla */}
          {reservation.status === 'pending' && (
            <div className="flex gap-2">
              <button
                onClick={() => onStatusChange(reservation.id, 'confirmed')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
              >
                Onayla
              </button>
              <button
                onClick={loadTables}
                disabled={loadingTables}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {loadingTables ? '...' : 'Direkt Oturt'}
              </button>
            </div>
          )}

          {/* Oturmuş - Tamamla */}
          {reservation.status === 'seated' && (
            <button
              onClick={() => onStatusChange(reservation.id, 'completed')}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm transition-colors"
            >
              Tamamlandı
            </button>
          )}
        </div>
      </div>

      {/* Table Selection */}
      {showTableSelect && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-sm font-medium text-white mb-3">
            {reservation.party_size} kişi için masa seç:
          </p>
          {availableTables.length === 0 ? (
            <div className="p-3 bg-red-900/30 border border-red-600 rounded-lg text-red-400 text-sm">
              Müsait masa bulunamadı. Lütfen önce bir masayı boşaltın.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableTables.map(table => (
                <button
                  key={table.id}
                  onClick={() => handleSeat(table.number)}
                  disabled={table.capacity < reservation.party_size}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    table.capacity >= reservation.party_size
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Masa {table.number} ({table.capacity} kişilik)
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowTableSelect(false)}
            className="mt-3 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
          >
            İptal
          </button>
        </div>
      )}

      {(reservation.notes || reservation.special_requests) && !showTableSelect && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-sm text-amber-400">
            📝 {reservation.notes || reservation.special_requests}
          </p>
        </div>
      )}

      {!showTableSelect && (
        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
          <a href={`tel:${reservation.customer_phone}`} className="flex items-center gap-1 hover:text-white">
            <Phone className="w-4 h-4" />
            {reservation.customer_phone}
          </a>
          {reservation.customer_email && (
            <a href={`mailto:${reservation.customer_email}`} className="flex items-center gap-1 hover:text-white">
              <Mail className="w-4 h-4" />
              {reservation.customer_email}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// Waitlist Card
function WaitlistCard({ entry, position }: { entry: WaitlistEntry; position: number }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center font-bold text-white">
            {position}
          </div>
          <div>
            <h3 className="font-bold text-white">{entry.name}</h3>
            <p className="text-sm text-gray-400">
              {entry.party_size} kişi • {entry.phone}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors">
            Masa Ver
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
            Bildir
          </button>
        </div>
      </div>
    </div>
  );
}

// Add Guest Modal
function AddGuestModal({
  venueId,
  onClose,
  onSuccess
}: {
  venueId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    party_size: 2,
    table_number: ''
  });
  const [saving, setSaving] = useState(false);
  const [availableTables, setAvailableTables] = useState<any[]>([]);
  const [mode, setMode] = useState<'seat' | 'waitlist'>('seat');

  // Load available tables
  useEffect(() => {
    const loadTables = async () => {
      const { data } = await supabase
        .from('tables')
        .select('*')
        .eq('venue_id', venueId)
        .eq('status', 'available')
        .order('number');
      
      if (data) setAvailableTables(data);
    };
    loadTables();
  }, [venueId]);

  const handleSubmit = async () => {
    if (!formData.name) return;

    setSaving(true);
    
    if (mode === 'seat' && formData.table_number) {
      // Direct seating - create order and update table
      const orderNumber = `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // Find table
      const table = availableTables.find(t => t.number === formData.table_number);
      
      // Create order
      await supabase
        .from('orders')
        .insert({
          venue_id: venueId,
          table_id: table?.id,
          table_number: formData.table_number,
          order_number: orderNumber,
          type: 'dine_in',
          status: 'confirmed',
          items: [],
          subtotal: 0,
          tax: 0,
          service_charge: 0,
          discount: 0,
          total: 0,
          payment_status: 'pending',
          guest_count: formData.party_size,
          notes: `Walk-in: ${formData.name}${formData.phone ? ` - ${formData.phone}` : ''}`
        });

      // Update table status
      if (table) {
        await supabase
          .from('tables')
          .update({ 
            status: 'occupied',
            current_guests: formData.party_size
          })
          .eq('id', table.id);
      }

      // Also create a reservation record for tracking
      await supabase
        .from('reservations')
        .insert({
          venue_id: venueId,
          customer_name: formData.name,
          customer_phone: formData.phone || '',
          party_size: formData.party_size,
          table_number: formData.table_number,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          status: 'seated',
          notes: 'Walk-in misafir'
        });

      onSuccess();
    } else if (mode === 'waitlist') {
      // Add to waitlist
      await supabase
        .from('reservations')
        .insert({
          venue_id: venueId,
          customer_name: formData.name,
          customer_phone: formData.phone || '',
          party_size: formData.party_size,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          status: 'pending',
          notes: 'Walk-in - Bekleme listesinde'
        });

      onSuccess();
    }
    
    setSaving(false);
  };

  const canSubmit = mode === 'seat' 
    ? formData.name && formData.table_number 
    : formData.name;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-md flex flex-col max-h-[85vh]">
        {/* Header - Fixed */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-white">Walk-in Misafir</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Mode Toggle */}
          <div className="flex bg-gray-700 rounded-xl p-1">
            <button
              onClick={() => setMode('seat')}
              className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                mode === 'seat' ? 'bg-green-600 text-white' : 'text-gray-400'
              }`}
            >
              Direkt Oturt
            </button>
            <button
              onClick={() => setMode('waitlist')}
              className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
                mode === 'waitlist' ? 'bg-amber-600 text-white' : 'text-gray-400'
              }`}
            >
              Bekleme Listesi
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">İsim *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Misafir adı"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Telefon (Opsiyonel)</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="05XX XXX XX XX"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Kişi Sayısı</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setFormData({ ...formData, party_size: Math.max(1, formData.party_size - 1) })}
                className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-white text-xl"
              >
                -
              </button>
              <span className="text-2xl font-bold text-white w-12 text-center">{formData.party_size}</span>
              <button
                onClick={() => setFormData({ ...formData, party_size: formData.party_size + 1 })}
                className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-white text-xl"
              >
                +
              </button>
            </div>
          </div>

          {/* Table Selection - Only for direct seating */}
          {mode === 'seat' && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Masa Seç *</label>
              {availableTables.length === 0 ? (
                <div className="p-4 bg-red-900/30 border border-red-600 rounded-xl text-red-400 text-center">
                  Müsait masa bulunamadı
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {availableTables.map(table => (
                    <button
                      key={table.id}
                      onClick={() => setFormData({ ...formData, table_number: table.number })}
                      className={`p-3 rounded-xl text-center transition-colors ${
                        formData.table_number === table.number
                          ? 'bg-green-600 text-white ring-2 ring-green-400'
                          : table.capacity >= formData.party_size
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-700/50 text-gray-500'
                      }`}
                    >
                      <p className="font-bold">{table.number}</p>
                      <p className="text-xs opacity-75">{table.capacity} kişi</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="p-6 border-t border-gray-700 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !canSubmit}
            className={`flex-1 py-3 ${
              mode === 'seat' ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'
            } disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2`}
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            {mode === 'seat' ? 'Masaya Oturt' : 'Listeye Ekle'}
          </button>
        </div>
      </div>
    </div>
  );
}
