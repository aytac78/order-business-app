'use client';

import { useState, useEffect, useCallback } from 'react';
import { useVenueStore } from '@/stores';
import { supabase } from '@/lib/supabase';
import {
  Users,
  Clock,
  Calendar,
  Phone,
  Mail,
  MessageSquare,
  Check,
  X,
  Plus,
  Search,
  ChevronRight,
  UserPlus,
  CalendarCheck,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface Reservation {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  party_size: number;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  table_ids?: string[];
  notes?: string;
  special_requests?: string;
}

interface ActiveOrder {
  id: string;
  table_number: string;
  status: string;
}

const statusConfig = {
  pending: { label: 'Bekliyor', color: 'bg-amber-100 text-amber-700', icon: Clock },
  confirmed: { label: 'Onaylandı', color: 'bg-blue-100 text-blue-700', icon: Check },
  seated: { label: 'Oturdu', color: 'bg-green-100 text-green-700', icon: Users },
  completed: { label: 'Tamamlandı', color: 'bg-gray-100 text-gray-700', icon: Check },
  cancelled: { label: 'İptal', color: 'bg-red-100 text-red-700', icon: X },
  no_show: { label: 'Gelmedi', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

const demoReservations: Reservation[] = [
  { id: '1', customer_name: 'Yılmaz Ailesi', customer_phone: '+90 532 111 2233', party_size: 4, date: new Date().toISOString().split('T')[0], time: '19:00', status: 'confirmed', notes: 'Doğum günü kutlaması' },
  { id: '2', customer_name: 'Kaya', customer_phone: '+90 533 222 3344', party_size: 7, date: new Date().toISOString().split('T')[0], time: '20:00', status: 'pending', special_requests: 'Pencere kenarı' },
  { id: '3', customer_name: 'Demir', customer_phone: '+90 534 333 4455', party_size: 6, date: new Date().toISOString().split('T')[0], time: '20:30', status: 'confirmed', notes: 'VIP müşteri' },
  { id: '4', customer_name: 'Öztürk', customer_phone: '+90 535 444 5566', party_size: 2, date: new Date().toISOString().split('T')[0], time: '19:30', status: 'pending' },
  { id: '5', customer_name: 'Şahin', customer_phone: '+90 536 555 6677', party_size: 5, date: new Date().toISOString().split('T')[0], time: '21:00', status: 'pending' },
];

export default function ReceptionPage() {
  const { currentVenue } = useVenueStore();
  const [tables, setTables] = useState<any[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>(demoReservations);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Masaları Supabase'den yükle
  const loadTables = useCallback(async () => {
    if (!currentVenue?.id) return;
    const { data } = await supabase
      .from('tables')
      .select('*')
      .eq('venue_id', currentVenue.id)
      .eq('is_available', true)
      .order('table_number');
    // Kolon adlarını uygulamanın beklediği formata dönüştür
    const formattedTables = (data || []).map(t => ({
      ...t,
      number: t.table_number,
      status: t.status || 'available'
    }));
    setTables(formattedTables);
  }, [currentVenue?.id]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  // Aktif siparişleri yükle
  const fetchActiveOrders = useCallback(async () => {
    if (!currentVenue?.id) return;
    setIsLoading(true);
    
    const { data } = await supabase
      .from('orders')
      .select('id, table_number, status')
      .eq('venue_id', currentVenue.id)
      .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
      .not('table_number', 'is', null);

    setActiveOrders(data || []);
    setIsLoading(false);
  }, [currentVenue?.id]);

  useEffect(() => {
    fetchActiveOrders();

    // Real-time subscription
    if (currentVenue?.id) {
      const channel = supabase
        .channel('reception-orders')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'orders', filter: `venue_id=eq.${currentVenue.id}` },
          () => fetchActiveOrders()
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [currentVenue?.id, fetchActiveOrders]);

  // Masa dolu mu kontrol et
  const isTableOccupied = (tableNumber: string) => {
    return activeOrders.some(o => o.table_number === tableNumber);
  };

  // Uygun masalar (aktif siparişi olmayan)
  const availableTables = tables.filter(t => 
    t.status === 'available' && !isTableOccupied(t.number)
  );

  // İstatistikler
  const todayReservations = reservations.filter(r => r.date === new Date().toISOString().split('T')[0]);
  const pendingCount = todayReservations.filter(r => r.status === 'pending').length;
  const confirmedCount = todayReservations.filter(r => r.status === 'confirmed').length;
  const seatedCount = todayReservations.filter(r => r.status === 'seated').length;

  // Arama
  const filteredReservations = reservations.filter(r =>
    r.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.customer_phone.includes(searchTerm)
  );

  // Rezervasyon durumu güncelle
  const updateReservationStatus = (id: string, status: Reservation['status']) => {
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    setSelectedReservation(null);
  };

  // Walk-in misafir oturt
  const handleWalkIn = async (tableNumber: string, partySize: number) => {
    if (!currentVenue) return;
    
    try {
      // Masayı bul
      const table = tables.find(t => t.number === tableNumber);
      if (!table) {
        alert('Masa bulunamadı!');
        return;
      }

      // Yeni sipariş oluştur
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          venue_id: currentVenue.id,
          table_number: table.number,
          order_number: orderNumber,
          type: 'dine_in',
          status: 'confirmed',
          items: [],
          subtotal: 0,
          tax: 0,
          total: 0,
          payment_status: 'pending',
          notes: `Walk-in: ${partySize} kişi`
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Masa durumunu güncelle
      const { error: tableError } = await supabase
        .from('tables')
        .update({ 
          status: 'occupied'
        })
        .eq('id', table.id);

      if (tableError) throw tableError;

      // Tabloları yeniden yükle
      loadTables();
      
      alert(`✅ Masa ${tableNumber} - ${partySize} kişi oturdu`);
      setShowWalkInModal(false);
    } catch (error) {
      console.error('Walk-in hatası:', error);
      alert('Bir hata oluştu!');
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Resepsiyon</h1>
          <p className="text-gray-500">Bugün {todayReservations.length} rezervasyon</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchActiveOrders}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
          <button
            onClick={() => setShowWalkInModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            <UserPlus className="w-4 h-4" />
            Walk-in Misafir
          </button>
        </div>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
              <p className="text-sm text-amber-600">Bekleyen</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{confirmedCount}</p>
              <p className="text-sm text-blue-600">Onaylı</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{seatedCount}</p>
              <p className="text-sm text-green-600">Oturan</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700">{availableTables.length}</p>
              <p className="text-sm text-purple-600">Boş Masa</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Rezervasyon Listesi */}
        <div className="col-span-2 bg-white rounded-2xl border">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="İsim veya telefon ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="divide-y max-h-[600px] overflow-y-auto">
            {filteredReservations.map(reservation => {
              const config = statusConfig[reservation.status];
              const StatusIcon = config.icon;
              
              return (
                <button
                  key={reservation.id}
                  onClick={() => setSelectedReservation(reservation)}
                  className="w-full p-4 hover:bg-gray-50 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full ${config.color} flex items-center justify-center`}>
                      <StatusIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{reservation.customer_name}</p>
                        {reservation.status === 'confirmed' && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Onaylı</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {reservation.party_size} kişi
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {reservation.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {reservation.customer_phone}
                        </span>
                      </div>
                      {reservation.notes && (
                        <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {reservation.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Boş Masalar */}
        <div className="bg-white rounded-2xl border p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Boş Masalar</h3>
          <div className="grid grid-cols-2 gap-2">
            {availableTables.map(table => (
              <div
                key={table.id}
                className="p-3 bg-green-50 border border-green-200 rounded-xl text-center"
              >
                <p className="font-bold text-green-700">#{table.number}</p>
                <p className="text-xs text-green-600">{table.capacity} kişilik</p>
                <p className="text-xs text-gray-500">{table.section}</p>
              </div>
            ))}
            {availableTables.length === 0 && (
              <div className="col-span-2 text-center py-8 text-gray-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Boş masa yok</p>
              </div>
            )}
          </div>

          {/* Dolu Masalar */}
          {activeOrders.length > 0 && (
            <>
              <h3 className="font-semibold text-gray-900 mt-6 mb-4">Dolu Masalar ({activeOrders.length})</h3>
              <div className="grid grid-cols-2 gap-2">
                {[...new Set(activeOrders.map(o => o.table_number))].map(tableNumber => (
                  <div
                    key={tableNumber}
                    className="p-3 bg-red-50 border border-red-200 rounded-xl text-center"
                  >
                    <p className="font-bold text-red-700">#{tableNumber}</p>
                    <p className="text-xs text-red-600">Dolu</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Rezervasyon Detay Modal */}
      {selectedReservation && (
        <ReservationDetailModal
          reservation={selectedReservation}
          availableTables={availableTables}
          onClose={() => setSelectedReservation(null)}
          onUpdateStatus={updateReservationStatus}
          isTableOccupied={isTableOccupied}
        />
      )}

      {/* Walk-in Modal */}
      {showWalkInModal && (
        <WalkInModal
          availableTables={availableTables}
          tables={tables}
          onClose={() => setShowWalkInModal(false)}
          onConfirm={handleWalkIn}
          isTableOccupied={isTableOccupied}
        />
      )}
    </div>
  );
}

// Rezervasyon Detay Modal
function ReservationDetailModal({
  reservation,
  availableTables,
  onClose,
  onUpdateStatus,
  isTableOccupied
}: {
  reservation: Reservation;
  availableTables: any[];
  onClose: () => void;
  onUpdateStatus: (id: string, status: Reservation['status']) => void;
  isTableOccupied: (tableNumber: string) => boolean;
}) {
  const { tables } = useTableStore();
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  // Kapasiteye uygun masalar
  const suitableTables = availableTables.filter(t => t.capacity >= reservation.party_size);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">Rezervasyon Detayı</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <p className="text-2xl font-bold text-gray-900">{reservation.customer_name}</p>
            <div className="flex items-center gap-4 mt-2 text-gray-600">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {reservation.party_size} kişi
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {reservation.time}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="flex items-center gap-2 text-gray-600">
              <Phone className="w-4 h-4" />
              {reservation.customer_phone}
            </p>
            {reservation.customer_email && (
              <p className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                {reservation.customer_email}
              </p>
            )}
          </div>

          {reservation.notes && (
            <div className="p-3 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-700">{reservation.notes}</p>
            </div>
          )}

          {reservation.special_requests && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">Özel İstek: {reservation.special_requests}</p>
            </div>
          )}

          {/* Masa Seçimi */}
          {reservation.status !== 'seated' && reservation.status !== 'completed' && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Uygun Masalar ({suitableTables.length})
              </p>
              <div className="grid grid-cols-4 gap-2">
                {tables.map(table => {
                  const isOccupied = isTableOccupied(table.number);
                  const isSuitable = table.capacity >= reservation.party_size;
                  const isAvailable = !isOccupied && table.status === 'available';
                  
                  return (
                    <button
                      key={table.id}
                      onClick={() => isAvailable && isSuitable && setSelectedTable(table.number)}
                      disabled={!isAvailable || !isSuitable}
                      className={`p-2 rounded-lg border-2 text-center transition-all ${
                        selectedTable === table.number
                          ? 'border-orange-500 bg-orange-50'
                          : isOccupied
                          ? 'border-red-200 bg-red-50 opacity-50 cursor-not-allowed'
                          : !isSuitable
                          ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'border-green-200 bg-green-50 hover:border-green-400'
                      }`}
                    >
                      <p className={`font-bold text-sm ${isOccupied ? 'text-red-600' : 'text-gray-900'}`}>
                        #{table.number}
                      </p>
                      <p className="text-xs text-gray-500">{table.capacity} kişi</p>
                      {isOccupied && <p className="text-xs text-red-500">Dolu</p>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t space-y-2">
          {reservation.status === 'pending' && (
            <button
              onClick={() => onUpdateStatus(reservation.id, 'confirmed')}
              className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600"
            >
              Onayla
            </button>
          )}
          
          {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
            <button
              onClick={() => selectedTable && onUpdateStatus(reservation.id, 'seated')}
              disabled={!selectedTable}
              className="w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 disabled:opacity-50"
            >
              {selectedTable ? `Masa ${selectedTable}'e Oturt` : 'Masa Seçin'}
            </button>
          )}

          {reservation.status !== 'cancelled' && reservation.status !== 'completed' && (
            <div className="flex gap-2">
              <button
                onClick={() => onUpdateStatus(reservation.id, 'no_show')}
                className="flex-1 py-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50"
              >
                Gelmedi
              </button>
              <button
                onClick={() => onUpdateStatus(reservation.id, 'cancelled')}
                className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50"
              >
                İptal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Walk-in Modal
function WalkInModal({
  availableTables,
  tables,
  onClose,
  onConfirm,
  isTableOccupied
}: {
  availableTables: any[];
  tables: any[];
  onClose: () => void;
  onConfirm: (tableNumber: string, partySize: number) => void;
  isTableOccupied: (tableNumber: string) => boolean;
}) {
  const [partySize, setPartySize] = useState(2);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  // Kapasiteye uygun boş masalar
  const suitableTables = tables.filter(t => 
    t.capacity >= partySize && 
    t.status === 'available' && 
    !isTableOccupied(t.number)
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">Walk-in Misafir</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Kişi Sayısı */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Kişi Sayısı</p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setPartySize(Math.max(1, partySize - 1))}
                className="w-10 h-10 bg-gray-100 rounded-lg font-bold text-xl hover:bg-gray-200"
              >
                -
              </button>
              <span className="text-3xl font-bold w-12 text-center">{partySize}</span>
              <button
                onClick={() => setPartySize(partySize + 1)}
                className="w-10 h-10 bg-gray-100 rounded-lg font-bold text-xl hover:bg-gray-200"
              >
                +
              </button>
            </div>
          </div>

          {/* Masa Seçimi */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Uygun Masalar ({suitableTables.length})
            </p>
            <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
              {tables.map(table => {
                const isOccupied = isTableOccupied(table.number);
                const isSuitable = table.capacity >= partySize && table.status === 'available' && !isOccupied;
                
                return (
                  <button
                    key={table.id}
                    onClick={() => isSuitable && setSelectedTable(table.number)}
                    disabled={!isSuitable}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      selectedTable === table.number
                        ? 'border-orange-500 bg-orange-50'
                        : isOccupied
                        ? 'border-red-200 bg-red-50 opacity-50 cursor-not-allowed'
                        : !isSuitable
                        ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                        : 'border-green-200 bg-green-50 hover:border-green-400'
                    }`}
                  >
                    <p className={`font-bold ${isOccupied ? 'text-red-600' : 'text-gray-900'}`}>
                      #{table.number}
                    </p>
                    <p className="text-xs text-gray-500">{table.capacity} kişi</p>
                    {isOccupied && <p className="text-xs text-red-500">Dolu</p>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border rounded-xl font-medium hover:bg-gray-50"
          >
            İptal
          </button>
          <button
            onClick={() => selectedTable && onConfirm(selectedTable, partySize)}
            disabled={!selectedTable}
            className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50"
          >
            Oturt
          </button>
        </div>
      </div>
    </div>
  );
}
