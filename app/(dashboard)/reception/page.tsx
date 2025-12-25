'use client';

import { useState, useEffect } from 'react';
import { useVenueStore } from '@/stores';
import { PanelHeader } from '@/components/panels/PanelHeader';
import {
  Users,
  Clock,
  AlertCircle,
  CalendarCheck,
  Phone,
  Mail,
  UserPlus,
  Check,
  X,
  ChevronRight,
  Search,
  Filter,
  Calendar,
  Timer,
  Star,
  MessageSquare
} from 'lucide-react';

interface Reservation {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  date: string;
  time: string;
  partySize: number;
  tableNumbers?: string[];
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  isVip?: boolean;
  createdAt: string;
}

const demoReservations: Reservation[] = [
  {
    id: '1',
    customerName: 'Ahmet Yılmaz',
    phone: '+90 532 123 4567',
    email: 'ahmet@email.com',
    date: '2025-01-15',
    time: '19:00',
    partySize: 4,
    tableNumbers: ['5'],
    status: 'confirmed',
    notes: 'Doğum günü kutlaması',
    isVip: true,
    createdAt: '2025-01-14T10:00:00'
  },
  {
    id: '2',
    customerName: 'Mehmet Kaya',
    phone: '+90 533 234 5678',
    date: '2025-01-15',
    time: '19:30',
    partySize: 2,
    status: 'pending',
    createdAt: '2025-01-15T14:00:00'
  },
  {
    id: '3',
    customerName: 'Ayşe Demir',
    phone: '+90 534 345 6789',
    email: 'ayse@email.com',
    date: '2025-01-15',
    time: '20:00',
    partySize: 6,
    tableNumbers: ['8', '9'],
    status: 'confirmed',
    notes: 'Pencere kenarı tercih',
    createdAt: '2025-01-13T18:00:00'
  },
  {
    id: '4',
    customerName: 'Fatma Öz',
    phone: '+90 535 456 7890',
    date: '2025-01-15',
    time: '20:30',
    partySize: 8,
    status: 'seated',
    isVip: true,
    createdAt: '2025-01-12T12:00:00'
  },
  {
    id: '5',
    customerName: 'Can Şahin',
    phone: '+90 536 567 8901',
    date: '2025-01-15',
    time: '21:00',
    partySize: 3,
    status: 'pending',
    notes: 'Vejeteryan menü',
    createdAt: '2025-01-15T16:00:00'
  }
];

export default function ReceptionPage() {
  const { currentVenue } = useVenueStore();
  const [reservations, setReservations] = useState<Reservation[]>(demoReservations);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [displayTime, setDisplayTime] = useState<string>('--:--:--');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewReservation, setShowNewReservation] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      setDisplayTime(new Date().toLocaleTimeString('tr-TR'));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleStatusChange = (id: string, newStatus: Reservation['status']) => {
    setReservations(prev => prev.map(r => 
      r.id === id ? { ...r, status: newStatus } : r
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500';
      case 'confirmed': return 'bg-blue-500';
      case 'seated': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      case 'no_show': return 'bg-red-700';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Bekliyor';
      case 'confirmed': return 'Onaylı';
      case 'seated': return 'Oturdu';
      case 'completed': return 'Tamamlandı';
      case 'cancelled': return 'İptal';
      case 'no_show': return 'Gelmedi';
      default: return status;
    }
  };

  const filteredReservations = reservations.filter(r => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchesSearch = searchQuery === '' || 
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const upcomingCount = reservations.filter(r => r.status === 'confirmed' || r.status === 'pending').length;
  const seatedCount = reservations.filter(r => r.status === 'seated').length;
  const pendingCount = reservations.filter(r => r.status === 'pending').length;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Yükleniyor...</div>
      </div>
    );
  }

  if (!currentVenue) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Mekan Seçimi Gerekli</h2>
          <p className="text-gray-400">Resepsiyon paneli için lütfen bir mekan seçin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white -m-6 p-6">
      {/* Header */}
      <PanelHeader
        title="Resepsiyon Paneli"
        subtitle={displayTime}
        icon={<Users className="w-8 h-8" />}
        iconBgColor="text-purple-500"
        soundEnabled={soundEnabled}
        onSoundToggle={() => setSoundEnabled(!soundEnabled)}
        showSound={true}
      >
        {/* Stats */}
        <div className="flex items-center gap-6 bg-gray-800 rounded-xl px-6 py-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-500">{upcomingCount}</p>
            <p className="text-xs text-gray-400">Yaklaşan</p>
          </div>
          <div className="w-px h-8 bg-gray-700" />
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">{seatedCount}</p>
            <p className="text-xs text-gray-400">Oturan</p>
          </div>
          <div className="w-px h-8 bg-gray-700" />
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-500">{pendingCount}</p>
            <p className="text-xs text-gray-400">Onay Bekliyor</p>
          </div>
        </div>
      </PanelHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol: Rezervasyon Listesi */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="flex flex-wrap gap-4">
              {/* Search */}
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="İsim veya telefon ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Status Filter */}
              <div className="flex gap-2">
                {['all', 'pending', 'confirmed', 'seated'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filterStatus === status
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {status === 'all' ? 'Tümü' : getStatusText(status)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reservations List */}
          <div className="space-y-3">
            {filteredReservations.map(reservation => (
              <div
                key={reservation.id}
                className={`bg-gray-800/50 rounded-xl p-4 border-l-4 ${
                  reservation.isVip ? 'border-amber-500' : 'border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold">{reservation.customerName}</h3>
                      {reservation.isVip && (
                        <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                      )}
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(reservation.status)}`}>
                        {getStatusText(reservation.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{reservation.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>{reservation.partySize} Kişi</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Phone className="w-4 h-4" />
                        <span>{reservation.phone}</span>
                      </div>
                      {reservation.tableNumbers && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <span>Masa: {reservation.tableNumbers.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    {reservation.notes && (
                      <div className="flex items-center gap-2 mt-2 text-amber-400 text-sm">
                        <MessageSquare className="w-4 h-4" />
                        {reservation.notes}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    {reservation.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(reservation.id, 'confirmed')}
                          className="p-2 bg-green-600 hover:bg-green-500 rounded-lg"
                          title="Onayla"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(reservation.id, 'cancelled')}
                          className="p-2 bg-red-600 hover:bg-red-500 rounded-lg"
                          title="İptal"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    {reservation.status === 'confirmed' && (
                      <button
                        onClick={() => handleStatusChange(reservation.id, 'seated')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium"
                      >
                        Oturt
                      </button>
                    )}
                    {reservation.status === 'seated' && (
                      <button
                        onClick={() => handleStatusChange(reservation.id, 'completed')}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg font-medium"
                      >
                        Tamamla
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredReservations.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <CalendarCheck className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Rezervasyon bulunamadı</p>
              </div>
            )}
          </div>
        </div>

        {/* Sağ: Zaman Çizelgesi */}
        <div className="bg-gray-800/50 rounded-2xl p-4">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Timer className="w-5 h-5 text-purple-400" />
            Bugünkü Program
          </h2>

          <div className="space-y-2">
            {['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'].map(time => {
              const reservationsAtTime = reservations.filter(r => r.time === time);
              return (
                <div key={time} className="flex items-start gap-3">
                  <span className="text-sm text-gray-400 w-12 pt-2">{time}</span>
                  <div className="flex-1 min-h-[60px] border-l-2 border-gray-700 pl-3 pb-2">
                    {reservationsAtTime.length > 0 ? (
                      reservationsAtTime.map(r => (
                        <div
                          key={r.id}
                          className={`p-2 rounded-lg mb-1 ${
                            r.status === 'seated' ? 'bg-green-600/20 border border-green-600' :
                            r.status === 'confirmed' ? 'bg-blue-600/20 border border-blue-600' :
                            'bg-amber-600/20 border border-amber-600'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{r.customerName}</span>
                            {r.isVip && <Star className="w-4 h-4 text-amber-400" />}
                          </div>
                          <span className="text-xs text-gray-400">{r.partySize} kişi</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-600 text-sm pt-2">-</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* New Reservation Button */}
          <button
            onClick={() => setShowNewReservation(true)}
            className="w-full mt-4 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Yeni Rezervasyon
          </button>
        </div>
      </div>
    </div>
  );
}
