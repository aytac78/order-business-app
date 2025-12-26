'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, roleConfig } from '@/stores/authStore';
import {
  Calendar, Users, Clock, Search, Plus, RefreshCw,
  LogOut, Phone, Mail, Check, X, UserPlus
} from 'lucide-react';

interface Reservation {
  id: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled';
  notes?: string;
}

const today = new Date().toISOString().split('T')[0];

const demoReservations: Reservation[] = [
  { id: '1', name: 'Ahmet Yılmaz', phone: '555-1234', date: today, time: '19:00', guests: 4, status: 'confirmed' },
  { id: '2', name: 'Ayşe Kaya', phone: '555-5678', date: today, time: '20:00', guests: 2, status: 'pending' },
  { id: '3', name: 'Mehmet Demir', phone: '555-9012', date: today, time: '20:30', guests: 6, status: 'confirmed' },
  { id: '4', name: 'Fatma Çelik', phone: '555-3456', date: today, time: '21:00', guests: 3, status: 'pending' },
];

export default function ReceptionTabletPage() {
  const router = useRouter();
  const { currentStaff, isAuthenticated, logout } = useAuthStore();
  const [reservations, setReservations] = useState<Reservation[]>(demoReservations);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewReservation, setShowNewReservation] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !currentStaff) {
      router.push('/');
      return;
    }
    
    if (currentStaff.role !== 'reception' && currentStaff.role !== 'owner' && currentStaff.role !== 'manager') {
      const config = roleConfig[currentStaff.role];
      router.push(config.defaultRoute);
      return;
    }

    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('tr-TR'));
      setCurrentDate(now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }));
    }, 1000);
    
    const now = new Date();
    setCurrentTime(now.toLocaleTimeString('tr-TR'));
    setCurrentDate(now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }));
    
    return () => clearInterval(timer);
  }, [isAuthenticated, currentStaff, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const updateStatus = (id: string, status: Reservation['status']) => {
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const filteredReservations = reservations.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.phone.includes(searchQuery)
  );

  const stats = {
    total: reservations.length,
    pending: reservations.filter(r => r.status === 'pending').length,
    seated: reservations.filter(r => r.status === 'seated').length,
    totalGuests: reservations.reduce((sum, r) => sum + r.guests, 0),
  };

  if (!currentStaff) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex flex-col">
      {/* Header */}
      <header className="bg-white px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center">
            <Calendar className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">RESEPSİYON</h1>
            <p className="text-gray-500 text-sm">{currentDate}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">{currentTime}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewReservation(true)}
            className="flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl"
          >
            <Plus className="w-5 h-5" />
            Walk-in
          </button>
          <button
            onClick={() => setShowNewReservation(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl"
          >
            <Calendar className="w-5 h-5" />
            Rezervasyon
          </button>
          <button className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200">
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl"
          >
            <LogOut className="w-5 h-5" />
            Çıkış
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-gray-500 text-sm">Toplam</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 shadow-sm border border-yellow-200">
            <p className="text-yellow-600 text-sm">Bekleyen</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 shadow-sm border border-green-200">
            <p className="text-green-600 text-sm">Oturan</p>
            <p className="text-3xl font-bold text-green-600">{stats.seated}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 shadow-sm border border-purple-200">
            <p className="text-purple-600 text-sm">Boş Masa</p>
            <p className="text-3xl font-bold text-purple-600">8</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 pb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Misafir adı veya telefon ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
      </div>

      {/* Reservations List */}
      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        <div className="space-y-3">
          {filteredReservations.map(reservation => (
            <div
              key={reservation.id}
              className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${
                reservation.status === 'confirmed' ? 'border-green-500' :
                reservation.status === 'pending' ? 'border-yellow-500' :
                reservation.status === 'seated' ? 'border-blue-500' :
                'border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{reservation.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {reservation.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {reservation.guests} kişi
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {reservation.time}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {reservation.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateStatus(reservation.id, 'confirmed')}
                        className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => updateStatus(reservation.id, 'cancelled')}
                        className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  {reservation.status === 'confirmed' && (
                    <button
                      onClick={() => updateStatus(reservation.id, 'seated')}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
                    >
                      Oturdu
                    </button>
                  )}
                  {reservation.status === 'seated' && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                      Masada
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredReservations.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Bu tarihte rezervasyon yok</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
