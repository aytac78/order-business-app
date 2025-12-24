'use client';

import { useState, useEffect } from 'react';
import { useVenueStore } from '@/stores';
import { Clock, Plus, Users, Calendar, ChevronLeft, ChevronRight, Check, X, AlertCircle, Play, Square } from 'lucide-react';

interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  date: string;
  startTime: string;
  endTime: string;
  actualStart?: string;
  actualEnd?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'missed';
}

const roles = ['Garson', 'Mutfak', 'Kasiyer', 'Resepsiyon', 'Yönetici'];
const staffList = [
  { id: 's1', name: 'Ahmet Yılmaz', role: 'Yönetici' },
  { id: 's2', name: 'Mehmet Demir', role: 'Garson' },
  { id: 's3', name: 'Ayşe Kaya', role: 'Kasiyer' },
  { id: 's4', name: 'Fatma Şen', role: 'Garson' },
  { id: 's5', name: 'Ali Öztürk', role: 'Mutfak' },
  { id: 's6', name: 'Zeynep Arslan', role: 'Resepsiyon' },
];

const generateShifts = (): Shift[] => {
  const shifts: Shift[] = [];
  const today = new Date();
  
  for (let d = -3; d <= 7; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().split('T')[0];
    
    staffList.forEach(staff => {
      if (Math.random() > 0.3) {
        const isAM = Math.random() > 0.5;
        shifts.push({
          id: `shift-${dateStr}-${staff.id}`,
          staffId: staff.id,
          staffName: staff.name,
          role: staff.role,
          date: dateStr,
          startTime: isAM ? '10:00' : '16:00',
          endTime: isAM ? '16:00' : '23:00',
          status: d < 0 ? 'completed' : d === 0 ? (Math.random() > 0.5 ? 'in_progress' : 'scheduled') : 'scheduled',
          actualStart: d <= 0 ? (isAM ? '10:05' : '15:58') : undefined,
          actualEnd: d < 0 ? (isAM ? '16:10' : '23:05') : undefined,
        });
      }
    });
  }
  return shifts;
};

const statusConfig = {
  scheduled: { label: 'Planlandı', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'Devam Ediyor', color: 'bg-green-100 text-green-700' },
  completed: { label: 'Tamamlandı', color: 'bg-gray-100 text-gray-700' },
  missed: { label: 'Gelmedi', color: 'bg-red-100 text-red-700' },
};

export default function ShiftsPage() {
  const { currentVenue } = useVenueStore();
  const [mounted, setMounted] = useState(false);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  useEffect(() => { 
    setMounted(true);
    setShifts(generateShifts());
  }, []);

  const todayShifts = shifts.filter(s => s.date === selectedDate);
  const navigateDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const startShift = (id: string) => {
    setShifts(prev => prev.map(s => s.id === id ? { ...s, status: 'in_progress', actualStart: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) } : s));
  };

  const endShift = (id: string) => {
    setShifts(prev => prev.map(s => s.id === id ? { ...s, status: 'completed', actualEnd: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) } : s));
  };

  // Week days for calendar
  const weekDays = [];
  const startOfWeek = new Date(selectedDate);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    weekDays.push(d);
  }

  if (!mounted) return <div className="animate-pulse bg-gray-100 rounded-2xl h-96" />;

  if (!currentVenue) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Mekan Seçimi Gerekli</h2>
          <p className="text-gray-500">Vardiya yönetimi için lütfen bir mekan seçin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vardiya Yönetimi</h1>
          <p className="text-gray-500">{currentVenue?.name}</p>
        </div>
        <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600">
          <Plus className="w-4 h-4" />Vardiya Ekle
        </button>
      </div>

      {/* Date Navigation */}
      <div className="bg-white rounded-xl p-4 border">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigateDate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
          <div className="text-center">
            <h2 className="font-bold">{new Date(selectedDate).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2>
            <p className="text-sm text-gray-500">{todayShifts.length} vardiya planlandı</p>
          </div>
          <button onClick={() => navigateDate(1)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight className="w-5 h-5" /></button>
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, i) => {
            const dateStr = day.toISOString().split('T')[0];
            const isSelected = dateStr === selectedDate;
            const shiftCount = shifts.filter(s => s.date === dateStr).length;
            return (
              <button key={i} onClick={() => setSelectedDate(dateStr)} className={`p-2 rounded-lg text-center ${isSelected ? 'bg-orange-500 text-white' : 'hover:bg-gray-100'}`}>
                <p className="text-xs">{day.toLocaleDateString('tr-TR', { weekday: 'short' })}</p>
                <p className="font-bold">{day.getDate()}</p>
                {shiftCount > 0 && <p className="text-xs">{shiftCount}</p>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><Calendar className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold">{todayShifts.length}</p><p className="text-xs text-gray-500">Planlı Vardiya</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><Play className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold">{todayShifts.filter(s => s.status === 'in_progress').length}</p><p className="text-xs text-gray-500">Aktif</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><Check className="w-5 h-5 text-gray-600" /></div>
            <div><p className="text-2xl font-bold">{todayShifts.filter(s => s.status === 'completed').length}</p><p className="text-xs text-gray-500">Tamamlanan</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><Clock className="w-5 h-5 text-purple-600" /></div>
            <div><p className="text-2xl font-bold">{todayShifts.reduce((sum, s) => sum + 6, 0)}</p><p className="text-xs text-gray-500">Toplam Saat</p></div>
          </div>
        </div>
      </div>

      {/* Shifts List */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {todayShifts.map(shift => (
            <div key={shift.id} className="border rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm">
                    {shift.staffName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium">{shift.staffName}</p>
                    <p className="text-xs text-gray-500">{shift.role}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${statusConfig[shift.status].color}`}>
                  {statusConfig[shift.status].label}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <Clock className="w-4 h-4" />
                <span>{shift.startTime} - {shift.endTime}</span>
              </div>
              
              {shift.actualStart && (
                <div className="text-xs text-gray-400 mb-3">
                  Giriş: {shift.actualStart} {shift.actualEnd && `• Çıkış: ${shift.actualEnd}`}
                </div>
              )}
              
              <div className="flex gap-2">
                {shift.status === 'scheduled' && (
                  <button onClick={() => startShift(shift.id)} className="flex-1 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200">
                    <Play className="w-4 h-4 inline mr-1" />Başlat
                  </button>
                )}
                {shift.status === 'in_progress' && (
                  <button onClick={() => endShift(shift.id)} className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200">
                    <Square className="w-4 h-4 inline mr-1" />Bitir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {todayShifts.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Bu tarihte vardiya planlanmamış</p>
          </div>
        )}
      </div>

      {/* New Shift Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between">
              <h2 className="text-xl font-bold">Yeni Vardiya</h2>
              <button onClick={() => setShowNewModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const staff = staffList.find(s => s.id === f.get('staff'));
              if (staff) {
                setShifts(prev => [...prev, {
                  id: `shift-${Date.now()}`,
                  staffId: staff.id,
                  staffName: staff.name,
                  role: staff.role,
                  date: f.get('date') as string,
                  startTime: f.get('start') as string,
                  endTime: f.get('end') as string,
                  status: 'scheduled',
                }]);
              }
              setShowNewModal(false);
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Personel</label>
                <select name="staff" required className="w-full px-4 py-2 border rounded-xl">
                  {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tarih</label>
                <input name="date" type="date" defaultValue={selectedDate} required className="w-full px-4 py-2 border rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Başlangıç</label>
                  <input name="start" type="time" defaultValue="10:00" required className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bitiş</label>
                  <input name="end" type="time" defaultValue="18:00" required className="w-full px-4 py-2 border rounded-xl" />
                </div>
              </div>
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
