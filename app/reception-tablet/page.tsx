'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import {
  Calendar,
  Clock,
  Users,
  Phone,
  Plus,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogOut,
  UserPlus,
  Grid3X3
} from 'lucide-react';

interface Reservation {
  id: string;
  customer_name: string;
  customer_phone: string;
  date: string;
  time: string;
  party_size: number;
  status: string;
  notes?: string;
}

interface TableData {
  id: string;
  table_number: string;
  capacity: number;
  section: string;
  status: string;
  current_guests?: number;
  customer_name?: string;
}

export default function ReceptionTabletPage() {
  const { currentVenue } = useVenueStore();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<TableData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [showSeatModal, setShowSeatModal] = useState<Reservation | null>(null);
  const [displayTime, setDisplayTime] = useState('--:--:--');

  useEffect(() => {
    const updateTime = () => setDisplayTime(new Date().toLocaleTimeString('tr-TR'));
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Verileri yükle
  const loadData = useCallback(async () => {
    if (!currentVenue?.id) return;
    setIsLoading(true);

    // Rezervasyonlar
    const { data: resData } = await supabase
      .from('reservations')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .eq('date', selectedDate)
      .in('status', ['pending', 'confirmed'])
      .order('time');

    // Masalar
    const { data: tableData } = await supabase
      .from('tables')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .order('table_number');

    setReservations(resData || []);
    setTables(tableData || []);
    setIsLoading(false);
  }, [currentVenue?.id, selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time
  useEffect(() => {
    if (!currentVenue?.id) return;

    const channel = supabase
      .channel('reception-tablet')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations', filter: `venue_id=eq.${currentVenue.id}` }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables', filter: `venue_id=eq.${currentVenue.id}` }, () => loadData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentVenue?.id, loadData]);

  // Müşteriyi oturt
  const seatCustomer = async (reservation: Reservation | null, tableId: string, guestCount: number, customerName: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    // Masayı güncelle
    await supabase
      .from('tables')
      .update({
        status: 'occupied',
        current_guests: guestCount,
        customer_name: customerName,
        seated_at: new Date().toISOString()
      })
      .eq('id', tableId);

    // Rezervasyonu güncelle
    if (reservation) {
      await supabase
        .from('reservations')
        .update({ status: 'seated' })
        .eq('id', reservation.id);
    }

    loadData();
    setShowSeatModal(null);
    setShowWalkInModal(false);
  };

  // Rezervasyonu onayla
  const confirmReservation = async (id: string) => {
    await supabase.from('reservations').update({ status: 'confirmed' }).eq('id', id);
  };

  // Rezervasyonu iptal et
  const cancelReservation = async (id: string) => {
    await supabase.from('reservations').update({ status: 'cancelled' }).eq('id', id);
  };

  // Filtrelenmiş rezervasyonlar
  const filteredReservations = reservations.filter(r => {
    if (searchQuery) {
      return r.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             r.customer_phone.includes(searchQuery);
    }
    return true;
  });

  // İstatistikler
  const availableTables = tables.filter(t => t.status === 'available');
  const occupiedTables = tables.filter(t => t.status === 'occupied');

  if (!currentVenue) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-amber-500" />
          <p>Mekan seçimi gerekli</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-900 via-purple-900 to-indigo-900 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-pink-500 flex items-center justify-center">
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">RESEPSİYON</h1>
            <p className="text-pink-300">{displayTime} • {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button type="button"
            onClick={() => setShowWalkInModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 rounded-xl font-bold transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            Walk-in
          </button>
          <button type="button"
            onClick={loadData}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button type="button" onClick={() => { if(confirm("Çıkış yapmak istediğinize emin misiniz?")) { localStorage.removeItem("order-auth-storage"); window.location.href = "/"; } }} className="p-3 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-red-400" title="Çıkış">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white/10 backdrop-blur rounded-xl p-4">
          <p className="text-pink-300 text-sm">Toplam</p>
          <p className="text-3xl font-bold">{reservations.length}</p>
        </div>
        <div className="bg-amber-500/20 rounded-xl p-4">
          <p className="text-amber-300 text-sm">Bekleyen</p>
          <p className="text-3xl font-bold">{reservations.filter(r => r.status === 'pending').length}</p>
        </div>
        <div className="bg-green-500/20 rounded-xl p-4">
          <p className="text-green-300 text-sm">Oturan</p>
          <p className="text-3xl font-bold">{occupiedTables.length}</p>
        </div>
        <div className="bg-blue-500/20 rounded-xl p-4">
          <p className="text-blue-300 text-sm">Boş Masa</p>
          <p className="text-3xl font-bold">{availableTables.length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Misafir adı veya telefon ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
      </div>

      {/* Reservations List */}
      <div className="space-y-3">
        {filteredReservations.map(reservation => (
          <div
            key={reservation.id}
            className="bg-white/10 backdrop-blur rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-pink-500/30 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-lg">{reservation.customer_name}</p>
                <div className="flex items-center gap-4 text-sm text-gray-300">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {reservation.customer_phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" /> {reservation.party_size} kişi
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {reservation.time}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {reservation.status === 'pending' && (
                <>
                  <button type="button"
                    onClick={() => confirmReservation(reservation.id)}
                    className="p-3 bg-green-500/20 hover:bg-green-500/30 rounded-xl text-green-400"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  <button type="button"
                    onClick={() => cancelReservation(reservation.id)}
                    className="p-3 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-red-400"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </>
              )}
              {reservation.status === 'confirmed' && (
                <button type="button"
                  onClick={() => setShowSeatModal(reservation)}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-xl font-bold transition-colors"
                >
                  Masada
                </button>
              )}
              {reservation.status === 'seated' && (
                <span className="px-4 py-2 bg-green-500/30 rounded-xl text-green-400 font-medium">
                  Oturdu
                </span>
              )}
            </div>
          </div>
        ))}

        {filteredReservations.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Bugün için rezervasyon yok</p>
          </div>
        )}
      </div>

      {/* Seat Modal - Masa Seçimi */}
      {showSeatModal && (
        <SeatModal
          reservation={showSeatModal}
          tables={tables}
          onSeat={(tableId) => seatCustomer(showSeatModal, tableId, showSeatModal.party_size, showSeatModal.customer_name)}
          onClose={() => setShowSeatModal(null)}
        />
      )}

      {/* Walk-in Modal */}
      {showWalkInModal && (
        <WalkInModal
          tables={tables}
          onSeat={(tableId, guestCount, customerName) => seatCustomer(null, tableId, guestCount, customerName)}
          onClose={() => setShowWalkInModal(false)}
        />
      )}
    </div>
  );
}

// Seat Modal - Masa Seçimi
function SeatModal({
  reservation,
  tables,
  onSeat,
  onClose
}: {
  reservation: Reservation;
  tables: TableData[];
  onSeat: (tableId: string) => void;
  onClose: () => void;
}) {
  const availableTables = tables.filter(t => t.status === 'available' && t.capacity >= reservation.party_size);
  const sections = [...new Set(availableTables.map(t => t.section))];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-5 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Masa Seç</h2>
            <p className="text-gray-400">{reservation.customer_name} • {reservation.party_size} kişi</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400">✕</button>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {sections.length > 0 ? (
            sections.map(section => (
              <div key={section} className="mb-6">
                <h3 className="text-sm font-medium text-gray-400 mb-3">{section}</h3>
                <div className="grid grid-cols-4 gap-3">
                  {availableTables.filter(t => t.section === section).map(table => (
                    <button type="button"
                      key={table.id}
                      onClick={() => onSeat(table.id)}
                      className="p-4 bg-green-500/20 hover:bg-green-500/40 border-2 border-green-500/50 rounded-xl text-center transition-colors"
                    >
                      <p className="text-2xl font-bold text-white">{table.table_number}</p>
                      <p className="text-sm text-green-400">{table.capacity} kişilik</p>
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-400">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Uygun masa bulunamadı</p>
              <p className="text-sm">En az {reservation.party_size} kişilik boş masa gerekli</p>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-700">
          <button type="button"
            onClick={onClose}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium text-white"
          >
            İptal
          </button>
        </div>
      </div>
    </div>
  );
}

// Walk-in Modal
function WalkInModal({
  tables,
  onSeat,
  onClose
}: {
  tables: TableData[];
  onSeat: (tableId: string, guestCount: number, customerName: string) => void;
  onClose: () => void;
}) {
  const [guestCount, setGuestCount] = useState(2);
  const [customerName, setCustomerName] = useState('');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const availableTables = tables.filter(t => t.status === 'available' && t.capacity >= guestCount);
  const sections = [...new Set(availableTables.map(t => t.section))];

  const handleSeat = () => {
    if (!selectedTable) {
      alert('Lütfen bir masa seçin');
      return;
    }
    onSeat(selectedTable, guestCount, customerName || 'Misafir');
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-5 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Walk-in Müşteri</h2>
            <p className="text-gray-400">Rezervasyonsuz misafir</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400">✕</button>
        </div>

        <div className="p-5 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Kişi Sayısı */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Kişi Sayısı</label>
            <div className="flex items-center gap-4">
              <button type="button"
                onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-xl text-xl font-bold"
              >
                -
              </button>
              <span className="text-4xl font-bold text-white w-20 text-center">{guestCount}</span>
              <button type="button"
                onClick={() => setGuestCount(guestCount + 1)}
                className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-xl text-xl font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Müşteri Adı */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Müşteri Adı (Opsiyonel)</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white"
              placeholder="İsim..."
            />
          </div>

          {/* Masa Seçimi */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              <Grid3X3 className="w-4 h-4 inline mr-1" />
              Masa Seç ({availableTables.length} uygun masa)
            </label>
            
            {sections.length > 0 ? (
              sections.map(section => (
                <div key={section} className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">{section}</p>
                  <div className="grid grid-cols-5 gap-2">
                    {availableTables.filter(t => t.section === section).map(table => (
                      <button type="button"
                        key={table.id}
                        onClick={() => setSelectedTable(table.id)}
                        className={`p-3 rounded-xl text-center transition-all ${
                          selectedTable === table.id
                            ? 'bg-green-500 text-white ring-2 ring-green-300'
                            : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                        }`}
                      >
                        <p className="font-bold">{table.table_number}</p>
                        <p className="text-xs opacity-70">{table.capacity}k</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Bu kişi sayısı için uygun masa yok</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-gray-700 flex gap-3">
          <button type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium"
          >
            İptal
          </button>
          <button type="button"
            onClick={handleSeat}
            disabled={!selectedTable}
            className="flex-1 py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold"
          >
            Oturt
          </button>
        </div>
      </div>
    </div>
  );
}