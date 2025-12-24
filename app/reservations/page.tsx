'use client';

import { useState, useEffect } from 'react';
import { useVenueStore } from '@/stores';
import { CalendarCheck, Plus, Search, Clock, Users, Phone, Star, Check, X, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  partySize: number;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  specialRequests?: string;
  isVip: boolean;
}

const generateReservations = (): Reservation[] => {
  const today = new Date();
  const reservations: Reservation[] = [];
  const names = ['Ahmet Yılmaz', 'Ayşe Kaya', 'Mehmet Demir', 'Fatma Şen', 'Ali Öztürk', 'Zeynep Arslan', 'Can Yıldız', 'Deniz Koç'];
  const times = ['12:00', '12:30', '13:00', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'];
  
  for (let d = -3; d <= 7; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().split('T')[0];
    const count = Math.floor(Math.random() * 5) + 2;
    
    for (let i = 0; i < count; i++) {
      reservations.push({
        id: `res-${dateStr}-${i}`,
        customerName: names[Math.floor(Math.random() * names.length)],
        customerPhone: `053${Math.floor(Math.random() * 10)} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`,
        date: dateStr,
        time: times[Math.floor(Math.random() * times.length)],
        partySize: Math.floor(Math.random() * 8) + 2,
        status: d < 0 ? 'completed' : d === 0 ? ['pending', 'confirmed', 'seated'][Math.floor(Math.random() * 3)] as any : ['pending', 'confirmed'][Math.floor(Math.random() * 2)] as any,
        isVip: Math.random() > 0.8,
        specialRequests: Math.random() > 0.7 ? 'Pencere kenarı masa' : undefined,
      });
    }
  }
  return reservations;
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Bekliyor', color: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Onaylı', color: 'bg-green-100 text-green-700' },
  seated: { label: 'Oturdu', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Tamamlandı', color: 'bg-gray-100 text-gray-700' },
  cancelled: { label: 'İptal', color: 'bg-red-100 text-red-700' },
  no_show: { label: 'Gelmedi', color: 'bg-red-100 text-red-700' },
};

export default function ReservationsPage() {
  const { currentVenue } = useVenueStore();
  const [mounted, setMounted] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => { 
    setMounted(true);
    setReservations(generateReservations());
  }, []);

  const filteredReservations = reservations.filter(r => {
    const matchesDate = r.date === selectedDate;
    const matchesSearch = r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || r.customerPhone.includes(searchQuery);
    return matchesDate && matchesSearch;
  }).sort((a, b) => a.time.localeCompare(b.time));

  const updateStatus = (id: string, status: Reservation['status']) => {
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const navigateDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const getDayReservations = (dateStr: string) => reservations.filter(r => r.date === dateStr).length;

  // Generate calendar days
  const calendarDays = [];
  const startDate = new Date(selectedDate);
  startDate.setDate(startDate.getDate() - 3);
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    calendarDays.push(d);
  }

  if (!mounted) return <div className="animate-pulse bg-gray-100 rounded-2xl h-96" />;

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Mekan Seçimi Gerekli</h2>
          <p className="text-gray-500">Rezervasyonlar için lütfen bir mekan seçin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rezervasyonlar</h1>
          <p className="text-gray-500">{currentVenue?.name}</p>
        </div>
        <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600">
          <Plus className="w-4 h-4" />Yeni Rezervasyon
        </button>
      </div>

      {/* Calendar Strip */}
      <div className="bg-white rounded-xl p-4 border">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigateDate(-7)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
          <h2 className="font-bold">{new Date(selectedDate).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</h2>
          <button onClick={() => navigateDate(7)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, i) => {
            const dateStr = day.toISOString().split('T')[0];
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            const count = getDayReservations(dateStr);
            return (
              <button key={i} onClick={() => setSelectedDate(dateStr)} className={`p-3 rounded-xl text-center transition-all ${isSelected ? 'bg-orange-500 text-white' : isToday ? 'bg-orange-100' : 'hover:bg-gray-100'}`}>
                <p className="text-xs opacity-70">{day.toLocaleDateString('tr-TR', { weekday: 'short' })}</p>
                <p className="text-lg font-bold">{day.getDate()}</p>
                {count > 0 && <p className={`text-xs mt-1 ${isSelected ? 'text-white' : 'text-orange-600'}`}>{count} rez.</p>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="İsim veya telefon ara..." className="w-full pl-10 pr-4 py-2 border rounded-lg" />
        </div>
      </div>

      {/* Reservations List */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-bold">{new Date(selectedDate).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
          <p className="text-sm text-gray-500">{filteredReservations.length} rezervasyon</p>
        </div>
        
        <div className="divide-y">
          {filteredReservations.map(res => (
            <div key={res.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold">
                    {res.customerName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{res.customerName}</p>
                      {res.isVip && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                    </div>
                    <p className="text-sm text-gray-500">{res.customerPhone}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{res.time}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{res.partySize} kişi</span>
                    </div>
                    {res.specialRequests && <p className="text-xs text-orange-600 mt-1">📝 {res.specialRequests}</p>}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig[res.status].color}`}>
                  {statusConfig[res.status].label}
                </span>
              </div>
              
              {(res.status === 'pending' || res.status === 'confirmed') && (
                <div className="flex gap-2 mt-3 pl-15">
                  {res.status === 'pending' && <button onClick={() => updateStatus(res.id, 'confirmed')} className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg">Onayla</button>}
                  {res.status === 'confirmed' && <button onClick={() => updateStatus(res.id, 'seated')} className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg">Oturt</button>}
                  <a href={`tel:${res.customerPhone}`} className="px-3 py-1.5 text-xs bg-gray-100 rounded-lg">Ara</a>
                  <button onClick={() => updateStatus(res.id, 'cancelled')} className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg">İptal</button>
                </div>
              )}
            </div>
          ))}
          
          {filteredReservations.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <CalendarCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Bu tarihte rezervasyon yok</p>
            </div>
          )}
        </div>
      </div>

      {/* New Reservation Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between">
              <h2 className="text-xl font-bold">Yeni Rezervasyon</h2>
              <button onClick={() => setShowNewModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => { 
              e.preventDefault(); 
              const f = new FormData(e.currentTarget); 
              setReservations(prev => [...prev, {
                id: `res-${Date.now()}`,
                customerName: f.get('name') as string,
                customerPhone: f.get('phone') as string,
                date: f.get('date') as string,
                time: f.get('time') as string,
                partySize: parseInt(f.get('size') as string),
                status: 'pending',
                isVip: false,
              }]);
              setShowNewModal(false);
            }} className="p-6 space-y-4">
              <input name="name" required placeholder="Ad Soyad" className="w-full px-4 py-2 border rounded-xl" />
              <input name="phone" required placeholder="Telefon" className="w-full px-4 py-2 border rounded-xl" />
              <div className="grid grid-cols-2 gap-4">
                <input name="date" type="date" defaultValue={selectedDate} className="px-4 py-2 border rounded-xl" />
                <select name="time" className="px-4 py-2 border rounded-xl">
                  {['12:00', '12:30', '13:00', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <input name="size" type="number" min="1" defaultValue="2" placeholder="Kişi sayısı" className="w-full px-4 py-2 border rounded-xl" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowNewModal(false)} className="flex-1 py-3 border rounded-xl">İptal</button>
                <button type="submit" className="flex-1 py-3 bg-orange-500 text-white rounded-xl">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
