'use client';

import { useState, useEffect } from 'react';
import { useVenueStore, useTableStore } from '@/stores';
import { Users, CalendarCheck, Clock, Phone, Plus, Search, Check, X, AlertCircle, Star, ChevronRight, UserPlus, Bell } from 'lucide-react';

interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  partySize: number;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  specialRequests?: string;
  source: 'phone' | 'online' | 'walk_in' | 'app';
  isVip: boolean;
}

interface WaitlistEntry {
  id: string;
  customerName: string;
  customerPhone: string;
  partySize: number;
  estimatedWait: number;
  status: 'waiting' | 'notified' | 'seated' | 'cancelled';
}

const initialReservations: Reservation[] = [
  { id: '1', customerName: 'Ahmet Yılmaz', customerPhone: '0532 111 2233', date: new Date().toISOString().split('T')[0], time: '19:00', partySize: 4, status: 'confirmed', source: 'phone', isVip: true, specialRequests: 'Pencere kenarı' },
  { id: '2', customerName: 'Ayşe Kaya', customerPhone: '0533 222 3344', date: new Date().toISOString().split('T')[0], time: '19:30', partySize: 2, status: 'pending', source: 'online', isVip: false },
  { id: '3', customerName: 'Mehmet Demir', customerPhone: '0534 333 4455', date: new Date().toISOString().split('T')[0], time: '20:00', partySize: 6, status: 'confirmed', source: 'app', isVip: false },
  { id: '4', customerName: 'Fatma Şen', customerPhone: '0535 444 5566', date: new Date().toISOString().split('T')[0], time: '20:30', partySize: 8, status: 'pending', source: 'phone', isVip: true },
  { id: '5', customerName: 'Ali Öztürk', customerPhone: '0536 555 6677', date: new Date().toISOString().split('T')[0], time: '21:00', partySize: 3, status: 'confirmed', source: 'online', isVip: false },
];

const initialWaitlist: WaitlistEntry[] = [
  { id: 'w1', customerName: 'Can Yıldız', customerPhone: '0538 777 8899', partySize: 2, estimatedWait: 15, status: 'waiting' },
  { id: 'w2', customerName: 'Deniz Koç', customerPhone: '0539 888 9900', partySize: 4, estimatedWait: 25, status: 'notified' },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Bekliyor', color: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Onaylı', color: 'bg-green-100 text-green-700' },
  seated: { label: 'Oturdu', color: 'bg-blue-100 text-blue-700' },
  cancelled: { label: 'İptal', color: 'bg-red-100 text-red-700' },
  no_show: { label: 'Gelmedi', color: 'bg-red-100 text-red-700' },
};

export default function ReceptionPage() {
  const { currentVenue } = useVenueStore();
  const { tables } = useTableStore();
  const [mounted, setMounted] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(initialWaitlist);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewReservation, setShowNewReservation] = useState(false);
  const [showNewWaitlist, setShowNewWaitlist] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const filteredReservations = reservations.filter(r => {
    const matchesSearch = r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || r.customerPhone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const todayReservations = filteredReservations.filter(r => r.date === new Date().toISOString().split('T')[0]);
  const pendingCount = todayReservations.filter(r => r.status === 'pending').length;
  const confirmedCount = todayReservations.filter(r => r.status === 'confirmed').length;
  const totalGuests = todayReservations.reduce((sum, r) => sum + r.partySize, 0);
  const availableTables = tables.filter(t => t.status === 'available').length;

  const updateReservationStatus = (id: string, status: Reservation['status']) => {
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const updateWaitlistStatus = (id: string, status: WaitlistEntry['status']) => {
    setWaitlist(prev => prev.map(w => w.id === id ? { ...w, status } : w));
  };

  if (!mounted) return <div className="animate-pulse bg-gray-100 rounded-2xl h-96" />;

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Mekan Seçimi Gerekli</h2>
          <p className="text-gray-500">Resepsiyon paneli için lütfen bir mekan seçin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resepsiyon</h1>
          <p className="text-gray-500">{currentVenue?.name}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowNewWaitlist(true)} className="flex items-center gap-2 px-4 py-2 border rounded-xl hover:bg-gray-50"><UserPlus className="w-4 h-4" />Bekleme</button>
          <button onClick={() => setShowNewReservation(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl"><Plus className="w-4 h-4" />Rezervasyon</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><Clock className="w-5 h-5 text-amber-600" /></div>
          <div><p className="text-2xl font-bold">{pendingCount}</p><p className="text-xs text-gray-500">Bekleyen</p></div>
        </div>
        <div className="bg-white rounded-xl p-4 border flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><Check className="w-5 h-5 text-green-600" /></div>
          <div><p className="text-2xl font-bold">{confirmedCount}</p><p className="text-xs text-gray-500">Onaylı</p></div>
        </div>
        <div className="bg-white rounded-xl p-4 border flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><CalendarCheck className="w-5 h-5 text-purple-600" /></div>
          <div><p className="text-2xl font-bold">{totalGuests}</p><p className="text-xs text-gray-500">Misafir</p></div>
        </div>
        <div className="bg-white rounded-xl p-4 border flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center"><span className="text-teal-600 font-bold">{availableTables}</span></div>
          <div><p className="text-2xl font-bold">{availableTables}/{tables.length}</p><p className="text-xs text-gray-500">Boş Masa</p></div>
        </div>
        <div className="bg-white rounded-xl p-4 border flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center"><Users className="w-5 h-5 text-orange-600" /></div>
          <div><p className="text-2xl font-bold">{waitlist.filter(w => w.status === 'waiting').length}</p><p className="text-xs text-gray-500">Beklemede</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">Bugünkü Rezervasyonlar</h2>
              <span className="text-sm text-gray-500">{todayReservations.length} rezervasyon</span>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Ara..." className="w-full pl-10 pr-4 py-2 border rounded-lg" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-lg">
                <option value="all">Tümü</option>
                <option value="pending">Bekleyen</option>
                <option value="confirmed">Onaylı</option>
              </select>
            </div>
          </div>
          
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {todayReservations.map(res => (
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
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig[res.status]?.color}`}>{statusConfig[res.status]?.label}</span>
                </div>
                
                {(res.status === 'pending' || res.status === 'confirmed') && (
                  <div className="flex gap-2 mt-3 pl-15">
                    {res.status === 'pending' && <button onClick={() => updateReservationStatus(res.id, 'confirmed')} className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg">Onayla</button>}
                    {res.status === 'confirmed' && <button onClick={() => updateReservationStatus(res.id, 'seated')} className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg">Oturt</button>}
                    <a href={`tel:${res.customerPhone}`} className="px-3 py-1.5 text-xs bg-gray-100 rounded-lg">Ara</a>
                    <button onClick={() => updateReservationStatus(res.id, 'no_show')} className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg">Gelmedi</button>
                  </div>
                )}
              </div>
            ))}
            {todayReservations.length === 0 && (
              <div className="p-8 text-center text-gray-500"><CalendarCheck className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>Bugün rezervasyon yok</p></div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-bold">Bekleme Listesi</h2>
              <span className="text-sm text-gray-500">{waitlist.filter(w => w.status === 'waiting').length}</span>
            </div>
            <div className="divide-y">
              {waitlist.filter(w => w.status === 'waiting' || w.status === 'notified').map(entry => (
                <div key={entry.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{entry.customerName}</p>
                      <p className="text-sm text-gray-500">{entry.partySize} kişi • ~{entry.estimatedWait} dk</p>
                    </div>
                    <div className="flex gap-2">
                      {entry.status === 'waiting' && <button onClick={() => updateWaitlistStatus(entry.id, 'notified')} className="p-2 bg-amber-100 text-amber-700 rounded-lg"><Bell className="w-4 h-4" /></button>}
                      <button onClick={() => updateWaitlistStatus(entry.id, 'seated')} className="p-2 bg-green-100 text-green-700 rounded-lg"><Check className="w-4 h-4" /></button>
                      <button onClick={() => updateWaitlistStatus(entry.id, 'cancelled')} className="p-2 bg-red-100 text-red-700 rounded-lg"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
              {waitlist.filter(w => w.status === 'waiting').length === 0 && (
                <div className="p-8 text-center text-gray-500"><Users className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm">Bekleyen yok</p></div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border overflow-hidden">
            <div className="p-4 border-b"><h2 className="font-bold">Saat Dilimleri</h2></div>
            <div className="p-4 space-y-2">
              {['18:00', '19:00', '20:00', '21:00', '22:00'].map(time => {
                const count = todayReservations.filter(r => r.time.startsWith(time.slice(0, 2))).length;
                return (
                  <div key={time} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">{time}</span>
                    {count > 0 ? <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">{count} rez.</span> : <span className="text-sm text-green-600">Boş</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showNewReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between"><h2 className="text-xl font-bold">Yeni Rezervasyon</h2><button onClick={() => setShowNewReservation(false)}><X className="w-5 h-5" /></button></div>
            <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); setReservations(prev => [...prev, { id: `r-${Date.now()}`, customerName: f.get('name') as string, customerPhone: f.get('phone') as string, date: f.get('date') as string, time: f.get('time') as string, partySize: parseInt(f.get('size') as string), status: 'pending', source: 'phone', isVip: false }]); setShowNewReservation(false); }} className="p-6 space-y-4">
              <input name="name" required placeholder="Ad Soyad" className="w-full px-4 py-2 border rounded-xl" />
              <input name="phone" required placeholder="Telefon" className="w-full px-4 py-2 border rounded-xl" />
              <div className="grid grid-cols-2 gap-4">
                <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="px-4 py-2 border rounded-xl" />
                <select name="time" className="px-4 py-2 border rounded-xl">
                  {['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <input name="size" type="number" min="1" defaultValue="2" placeholder="Kişi sayısı" className="w-full px-4 py-2 border rounded-xl" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowNewReservation(false)} className="flex-1 py-3 border rounded-xl">İptal</button>
                <button type="submit" className="flex-1 py-3 bg-orange-500 text-white rounded-xl">Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewWaitlist && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="p-6 border-b flex justify-between"><h2 className="text-xl font-bold">Bekleme Listesi</h2><button onClick={() => setShowNewWaitlist(false)}><X className="w-5 h-5" /></button></div>
            <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); setWaitlist(prev => [...prev, { id: `w-${Date.now()}`, customerName: f.get('name') as string, customerPhone: f.get('phone') as string, partySize: parseInt(f.get('size') as string), estimatedWait: 15, status: 'waiting' }]); setShowNewWaitlist(false); }} className="p-6 space-y-4">
              <input name="name" required placeholder="Ad Soyad" className="w-full px-4 py-2 border rounded-xl" />
              <input name="phone" required placeholder="Telefon" className="w-full px-4 py-2 border rounded-xl" />
              <input name="size" type="number" min="1" defaultValue="2" placeholder="Kişi sayısı" className="w-full px-4 py-2 border rounded-xl" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowNewWaitlist(false)} className="flex-1 py-3 border rounded-xl">İptal</button>
                <button type="submit" className="flex-1 py-3 bg-orange-500 text-white rounded-xl">Ekle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
